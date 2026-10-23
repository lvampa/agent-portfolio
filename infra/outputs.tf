output "ec2_instance_id" {
  description = "EC2 instance ID (for SSH: ssh -i key.pem ec2-user@<elastic_ip>)"
  value       = module.ec2.instance_id
}

output "ec2_elastic_ip" {
  description = "Elastic IP attached to the EC2 instance (static; used for the DNS records)"
  value       = module.ec2.public_ip
}

output "ec2_public_dns" {
  description = "EC2 public DNS name (from Elastic IP)"
  value       = module.ec2.public_dns
}
