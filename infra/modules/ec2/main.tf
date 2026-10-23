# Single EC2 instance for ECS capacity (n8n task); Caddy on host proxies HTTP -> host:5678

data "cloudflare_ip_ranges" "web" {}

# HTTP on EC2 only from Cloudflare IPs
resource "aws_security_group_rule" "cloudflare_http" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = data.cloudflare_ip_ranges.web.ipv4_cidrs
  security_group_id = var.security_group_id
  description       = "HTTP from Cloudflare IPs"
}

locals {
  snapshot_tag = { Snapshot = "n8n-data" }
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

# Elastic IP – static public IP for the instance (for DNS A record)
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
  }))

  # Hop limit 1 keeps bridge-mode containers from reaching the instance role's credentials.
  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  root_block_device {
    tags = local.snapshot_tag
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
        count = 7
      }
    }
  }
}

