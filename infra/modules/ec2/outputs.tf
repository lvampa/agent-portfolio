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

output "elastic_ip" {
  description = "Elastic IP address (same as public_ip)"
  value       = aws_eip.this.public_ip
}

output "efs_id" {
  description = "EFS file system ID for n8n persistent data"
  value       = aws_efs_file_system.n8n.id
}
