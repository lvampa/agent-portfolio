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

variable "gemini_api_key" {
  description = "Gemini API key for the agent service"
  type        = string
  sensitive   = true
  ephemeral   = true
}

variable "pinecone_api_key" {
  description = "Pinecone API key for the agent service"
  type        = string
  sensitive   = true
  ephemeral   = true
}

variable "langsmith_api_key" {
  description = "LangSmith API key for the agent service"
  type        = string
  sensitive   = true
  ephemeral   = true
}

variable "agent_system_prompt" {
  description = "System prompt for the agent service, with a {context} placeholder"
  type        = string
  sensitive   = true
  ephemeral   = true
}

variable "agent_service_image" {
  description = "Agent service image, pinned by tag, e.g. ghcr.io/owner/agent-service:<git sha>"
  type        = string

  validation {
    condition     = startswith(var.agent_service_image, "ghcr.io/") && !endswith(var.agent_service_image, ":latest")
    error_message = "The agent service image must come from ghcr.io and be pinned to a tag, not :latest."
  }
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
