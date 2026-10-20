module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  home_ip_cidr = var.home_ip_cidr
}

# ECS cluster, task (Caddy + n8n), and service – no ALB; Caddy in task proxies HTTP (bridge network mode)
module "ec2" {
  source            = "./modules/ec2"
  project_name      = var.project_name
  subnet_ids        = module.vpc.public_subnet_ids
  security_group_id = module.vpc.security_group_id
  ec2_keypair_name  = var.ec2_keypair_name
  ecs_cluster_name  = "${var.project_name}-cluster"
}

module "ecs" {
  source                  = "./modules/ecs"
  project_name            = var.project_name
  aws_region              = var.region
  n8n_basic_auth_active   = var.n8n_basic_auth_active
  n8n_basic_auth_user     = var.n8n_basic_auth_user
  n8n_basic_auth_password = var.n8n_basic_auth_password
  n8n_encryption_key      = var.n8n_encryption_key
  n8n_webhook_url         = var.n8n_webhook_url
  n8n_timezone            = var.n8n_timezone
}

# A record pointing at the EC2 instance (Elastic IP)
resource "cloudflare_dns_record" "agent_subdomain_record" {
  zone_id = var.cloudflare_zone_id
  name    = var.cloudflare_a_record_name
  type    = "A"
  content = module.ec2.public_ip
  ttl     = 1
  proxied = true
}
