output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.ecs.id
}

output "public_ip" {
  description = "Elastic IP attached to the instance (for DNS A record)"
  value       = aws_eip.this.public_ip
}

output "public_dns" {
  description = "Public DNS name of the Elastic IP"
  value       = aws_eip.this.public_dns
}

output "data_volume_id" {
  description = "EBS volume ID of the n8n data volume"
  value       = aws_ebs_volume.n8n_data.id
}
