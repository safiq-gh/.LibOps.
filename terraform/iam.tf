resource "aws_iam_role" "libops_ec2_role" {
  name = "libops-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "libops_s3_access" {
  name = "libops-s3-access-policy"
  role = aws_iam_role.libops_ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Effect = "Allow"
        Resource = "${aws_s3_bucket.book_covers.arn}/*"
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "libops_ec2_profile" {
  name = "libops-ec2-profile"
  role = aws_iam_role.libops_ec2_role.name
}
