variable "account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "zone_id" {
  description = "Cloudflare zone ID of the site's domain"
  type        = string
}

variable "project_name" {
  description = "Pages project name. Changing it replaces the project."
  type        = string
}

variable "hostname" {
  description = "Apex hostname the site is served on, e.g. example.com"
  type        = string
}

variable "worker_name" {
  description = "Name of the client-info Worker. Changing it replaces the Worker."
  type        = string
}

variable "worker_content" {
  description = "Source of the client-info Worker, as an ES module"
  type        = string
}
