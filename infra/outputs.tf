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
