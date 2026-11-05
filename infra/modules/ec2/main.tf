# Single EC2 instance for ECS capacity. Nothing listens on the host; the task's cloudflared sidecar dials out.

locals {
  snapshot_tag = { Snapshot = "n8n-data" }
  data_device  = "/dev/sdf"
}

data "aws_subnet" "instance" {
  id = var.subnet_ids[0]
}

# Holds all n8n state, so it outlives the instance. The AZ must match the instance's.
resource "aws_ebs_volume" "n8n_data" {
  availability_zone = data.aws_subnet.instance.availability_zone
  size              = var.data_volume_size_gib
  type              = "gp3"
  encrypted         = true

  tags = merge(local.snapshot_tag, {
    Name = "${var.project_name}-n8n-data"
  })

  lifecycle {
    prevent_destroy = true
  }
}

# Stopping first lets the OS flush and unmount, so a replacement never detaches a busy filesystem.
resource "aws_volume_attachment" "n8n_data" {
  device_name                    = local.data_device
  volume_id                      = aws_ebs_volume.n8n_data.id
  instance_id                    = aws_instance.ecs.id
  stop_instance_before_detaching = true
}

# IAM role for ECS container instance
resource "aws_iam_role" "ecs_instance" {
  name = "${var.project_name}-ecs-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_instance" {
  role       = aws_iam_role.ecs_instance.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "ecs" {
  name = "${var.project_name}-ecs-instance-profile"
  role = aws_iam_role.ecs_instance.name
}

# Elastic IP – static public IP for the instance (for SSH)
resource "aws_eip" "this" {
  domain = "vpc"
  tags = {
    Name = "${var.project_name}-ecs-eip"
  }
}

# Single EC2 instance (no ASG)
resource "aws_instance" "ecs" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  key_name                    = var.ec2_keypair_name
  subnet_id                   = var.subnet_ids[0]
  vpc_security_group_ids      = [var.security_group_id]
  iam_instance_profile        = aws_iam_instance_profile.ecs.name
  associate_public_ip_address = true

  user_data_base64 = base64encode(templatefile("${path.module}/user_data.sh", {
    ecs_cluster_name = var.ecs_cluster_name
    data_volume_id   = replace(aws_ebs_volume.n8n_data.id, "-", "")
  }))

  # Safe now that n8n data is on its own volume. Without it, script edits never reach the host.
  user_data_replace_on_change = true

  # Hop limit 1 keeps bridge-mode containers from reaching the instance role's credentials.
  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tags = {
    Name = "${var.project_name}-ecs-instance"
  }
}

# Attach Elastic IP to the instance
resource "aws_eip_association" "this" {
  instance_id   = aws_instance.ecs.id
  allocation_id = aws_eip.this.id
}

resource "aws_iam_role" "dlm" {
  name = "${var.project_name}-dlm"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "dlm.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "dlm" {
  role       = aws_iam_role.dlm.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole"
}

resource "aws_dlm_lifecycle_policy" "n8n_data" {
  description        = "${var.project_name} n8n data daily snapshots"
  execution_role_arn = aws_iam_role.dlm.arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]
    target_tags    = local.snapshot_tag

    schedule {
      name      = "daily"
      copy_tags = true

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["05:00"]
      }

      retain_rule {
        count = var.snapshot_retention_count
      }
    }
  }
}

