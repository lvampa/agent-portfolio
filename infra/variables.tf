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

# Cloudflare zone and API access
variable "cloudflare_api_token" {
  description = "Cloudflare API token (permissions listed in the README)"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID, for the tunnel and Access (dashboard account Overview page)"
  type        = string
}

# Free plan: one rule, 10 second period, block for the same 10 seconds.
variable "rate_limit_requests" {
  description = "Webhook requests allowed per IP in each rate-limit period"
  type        = number
  default     = 10
}

variable "rate_limit_period_seconds" {
  description = "Rate-limit counting period, also used as the block duration. The free plan only allows 10."
  type        = number
  default     = 10
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID (found in zone Overview in dashboard)"
  type        = string
}

