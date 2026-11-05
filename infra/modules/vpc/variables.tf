variable "project_name" {
  description = "Prefix for resource names"
  type        = string
}

variable "home_ip_cidr" {
  description = "Your IP in CIDR form, allowed to SSH in"
  type        = string
}

variable "cidr_block" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}
