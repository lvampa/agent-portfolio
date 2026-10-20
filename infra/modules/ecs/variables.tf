variable "project_name" {
  type = string
}

variable "aws_region" {
  description = "AWS region for CloudWatch logs"
  type        = string
}

# n8n env – passed from root (set in tfvars)
variable "n8n_basic_auth_active" {
  description = "Enable n8n basic auth"
  type        = bool
}

variable "n8n_basic_auth_user" {
  description = "n8n basic auth username"
  type        = string
}

variable "n8n_basic_auth_password" {
  description = "n8n basic auth password"
  type        = string
  sensitive   = true
}

variable "n8n_encryption_key" {
  description = "n8n encryption key for credentials"
  type        = string
  sensitive   = true
}

variable "n8n_timezone" {
  description = "n8n timezone"
  type        = string
}

variable "n8n_webhook_url" {
  description = "n8n webhook url"
  type        = string
}

