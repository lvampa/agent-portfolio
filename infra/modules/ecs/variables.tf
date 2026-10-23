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

