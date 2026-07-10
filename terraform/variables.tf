variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Name of the SSH key pair to access the EC2 instance"
  type        = string
  default     = "libops-key"
}

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed to connect via SSH"
  type        = list(string)
  default     = ["10.0.0.0/8"] # Default to internal network, override in tfvars for office/vpn
}
