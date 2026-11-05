output "ec2_instance_id" {
  description = "EC2 instance ID (for SSH: ssh -i key.pem ec2-user@<elastic_ip>)"
  value       = module.ec2.instance_id
}

output "ec2_elastic_ip" {
  description = "Elastic IP attached to the EC2 instance (static; SSH target)"
  value       = module.ec2.public_ip
}

output "ec2_public_dns" {
  description = "EC2 public DNS name (from Elastic IP)"
  value       = module.ec2.public_dns
}

output "n8n_data_volume_id" {
  description = "EBS volume holding /opt/n8n-data (snapshots are tagged Snapshot=n8n-data)"
  value       = module.ec2.data_volume_id
}

output "cloudflare_account_id" {
  description = "GitHub variable CLOUDFLARE_ACCOUNT_ID"
  value       = var.cloudflare_account_id
}

output "pages_project_name" {
  description = "GitHub variable CF_PAGES_PROJECT"
  value       = module.site.project_name
}

output "site_url" {
  description = "GitHub variable SITE_URL"
  value       = module.site.site_url
}
