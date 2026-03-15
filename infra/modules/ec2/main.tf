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

data "aws_ami" "ecs" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*-x86_64-ebs"]
  }
}

# IAM role for ECS container instance
resource "aws_iam_role" "ecs_instance" {
  name = "${var.project_name}-ecs-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action   = "sts:AssumeRole"
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
  ami                    = data.aws_ami.ecs.id
  instance_type          = var.instance_type
  key_name               = var.ec2_keypair_name
  subnet_id              = var.subnet_ids[0]
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = aws_iam_instance_profile.ecs.name
  associate_public_ip_address = true

  user_data_base64 = base64encode(templatefile("${path.module}/user_data.sh", {
    ecs_cluster_name = var.ecs_cluster_name
  }))

  tags = {
    Name = "${var.project_name}-ecs-instance"
  }
}

# Attach Elastic IP to the instance
resource "aws_eip_association" "this" {
  instance_id   = aws_instance.ecs.id
  allocation_id = aws_eip.this.id
}

# EFS file system for n8n persistent data
resource "aws_efs_file_system" "n8n" {
  creation_token = "${var.project_name}-n8n"
  encrypted      = true
  tags = {
    Name = "${var.project_name}-n8n-efs"
  }
}

# Security group allowing NFS inbound from the EC2 security group
resource "aws_security_group" "efs" {
  name        = "${var.project_name}-efs-sg"
  description = "EFS: NFS (2049) from EC2 instances"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [var.security_group_id]
    description     = "NFS from EC2 SG"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Mount target in the same subnet as the EC2 instance
resource "aws_efs_mount_target" "n8n" {
  file_system_id  = aws_efs_file_system.n8n.id
  subnet_id       = var.subnet_ids[0]
  security_groups = [aws_security_group.efs.id]
}
