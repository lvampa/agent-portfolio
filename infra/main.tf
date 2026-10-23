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

# Both hostnames point at the Elastic IP; Caddy routes by host.
resource "cloudflare_dns_record" "n8n" {
  for_each = toset([var.api_hostname, var.admin_hostname])

  zone_id = var.cloudflare_zone_id
  name    = each.value
  type    = "A"
  content = module.ec2.public_ip
  ttl     = 1
  proxied = true
}

# Cloudflare allows one custom-rules ruleset per zone, so rules added in the dashboard would be overwritten here.
resource "cloudflare_ruleset" "zone_custom_rules" {
  zone_id = var.cloudflare_zone_id
  name    = "Custom rules"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [{
    description = "Admin host only from home IP"
    expression  = "(http.host eq \"${var.admin_hostname}\" and not ip.src in {${var.home_ip_cidr}})"
    action      = "block"
    enabled     = true
  }]
}
