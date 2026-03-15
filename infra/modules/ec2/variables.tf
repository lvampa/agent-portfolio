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
  default     = "t3.micro"
}

variable "ecs_cluster_name" {
  description = "ECS cluster name to register instances with"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID (for EFS security group)"
  type        = string
}

