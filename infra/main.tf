module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  home_ip_cidr = var.home_ip_cidr
}

module "ec2" {
  source            = "./modules/ec2"
  project_name      = var.project_name
  subnet_ids        = module.vpc.public_subnet_ids
  security_group_id = module.vpc.security_group_id
  ec2_keypair_name  = var.ec2_keypair_name
  ecs_cluster_name  = "${var.project_name}-cluster"
}

# ECS cluster, task (Caddy + n8n), and service. No load balancer; Caddy in the task routes by host.
module "ecs" {
  source             = "./modules/ecs"
  project_name       = var.project_name
  aws_region         = var.region
  n8n_encryption_key = var.n8n_encryption_key
  n8n_timezone       = var.n8n_timezone
  api_hostname       = var.api_hostname
  admin_hostname     = var.admin_hostname
}
