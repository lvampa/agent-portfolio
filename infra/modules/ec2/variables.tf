variable "project_name" {
  type = string
}

variable "subnet_ids" {
  description = "Subnet IDs for ECS capacity"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group (SSH from home IP, 80 from Cloudflare)"
  type        = string
}

variable "ec2_keypair_name" {
  description = "Key pair for SSH"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t4g.micro"
}

variable "ami_id" {
  description = <<-EOT
    AL2023 arm64 ECS-optimized AMI in us-east-2. Changing it replaces the instance and its root volume,
    so back up /opt/n8n-data first. Current ID:
    aws ssm get-parameter --region us-east-2 --name /aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id --query Parameter.Value --output text
  EOT
  type        = string
  default     = "ami-0faaeefa35efebe19"
}

variable "ecs_cluster_name" {
  description = "ECS cluster name to register instances with"
  type        = string
}


