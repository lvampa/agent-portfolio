# Root-only: shared and deployment config (no module-specific vars)
variable "region" {
  description = "AWS region to deploy resources in"
  type        = string
  default     = "us-east-2"
}

variable "aws_profile" {
  description = "AWS named profile from credentials file"
  type        = string
  default     = "portfolio"
}

variable "project_name" {
  default = "ai-agent-portfolio"
}

variable "ec2_keypair_name" {
  description = "The name of the EC2 key pair for SSH access"
  type        = string
}

variable "home_ip_cidr" {
  description = "Your private IP as CIDR for SSH access"
  type        = string
}

# n8n container env – set secrets in tfvars (gitignored)
variable "n8n_encryption_key" {
  description = "n8n encryption key (long random string for credentials encryption)"
  type        = string
  sensitive   = true
  ephemeral   = true
}

variable "n8n_timezone" {
  description = "n8n timezone"
  type        = string
  default     = "America/New_York"
}

variable "api_hostname" {
  description = "Public hostname for n8n webhooks, e.g. api.example.com"
  type        = string
}

variable "admin_hostname" {
  description = "Public hostname for the n8n editor, e.g. admin.example.com"
  type        = string
}

# Cloudflare DNS – A record for EC2 (n8n) origin
variable "cloudflare_api_token" {
  description = "Cloudflare API token (DNS edit permission for the zone)"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID (found in zone Overview in dashboard)"
  type        = string
}

