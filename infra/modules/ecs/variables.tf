variable "project_name" {
  type = string
}

variable "aws_region" {
  description = "AWS region for CloudWatch logs"
  type        = string
}

# n8n env – passed from root (set in tfvars)
variable "n8n_encryption_key" {
  description = "n8n encryption key for credentials"
  type        = string
  sensitive   = true
  ephemeral   = true
}

variable "tunnel_token" {
  description = "Cloudflare Tunnel token for the cloudflared sidecar"
  type        = string
  sensitive   = true
  ephemeral   = true
}

variable "n8n_timezone" {
  description = "n8n timezone"
  type        = string
}

variable "api_hostname" {
  description = "Public hostname for webhooks, e.g. api.example.com"
  type        = string
}

variable "admin_hostname" {
  description = "Public hostname for the n8n editor, e.g. admin.example.com"
  type        = string
}

variable "home_ip_cidr" {
  description = "Home IP as CIDR. Caddy proxies the admin host to n8n only for this client IP."
  type        = string
}
