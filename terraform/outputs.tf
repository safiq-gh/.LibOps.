output "instance_public_ip" {
  description = "The public IP address of the LibOps server"
  value       = aws_instance.libops_server.public_ip
}

output "instance_public_dns" {
  description = "The public DNS of the LibOps server"
  value       = aws_instance.libops_server.public_dns
}
