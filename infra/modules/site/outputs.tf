output "project_name" {
  description = "Pages project name"
  value       = cloudflare_pages_project.site.name
}

output "site_url" {
  description = "Public URL of the site"
  value       = "https://${var.hostname}"
}
