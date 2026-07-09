resource "aws_vpc" "libops_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "libops-vpc"
  }
}

resource "aws_internet_gateway" "libops_igw" {
  vpc_id = aws_vpc.libops_vpc.id

  tags = {
    Name = "libops-igw"
  }
}

resource "aws_subnet" "libops_public_subnet" {
  vpc_id                  = aws_vpc.libops_vpc.id
  cidr_block              = var.subnet_cidr
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}a"

  tags = {
    Name = "libops-public-subnet"
  }
}

resource "aws_route_table" "libops_public_rt" {
  vpc_id = aws_vpc.libops_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.libops_igw.id
  }

  tags = {
    Name = "libops-public-rt"
  }
}

resource "aws_route_table_association" "libops_public_rta" {
  subnet_id      = aws_subnet.libops_public_subnet.id
  route_table_id = aws_route_table.libops_public_rt.id
}
