output "instance_public_ip" {
  description = "The public IP address of the LibOps server"
  value       = aws_instance.libops_server.public_ip
}

output "instance_public_dns" {
  description = "The public DNS of the LibOps server"
  value       = aws_instance.libops_server.public_dns
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket created for book covers"
  value       = aws_s3_bucket.book_covers.bucket
}
