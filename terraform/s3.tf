resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket" "book_covers" {
  bucket = "libops-covers-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "LibOps Book Covers"
    Environment = "Production"
  }
}

resource "aws_s3_bucket_cors_configuration" "book_covers_cors" {
  bucket = aws_s3_bucket.book_covers.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Optional: Disable public access block if the images need to be publicly readable
resource "aws_s3_bucket_public_access_block" "book_covers_public" {
  bucket = aws_s3_bucket.book_covers.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "book_covers_policy" {
  bucket = aws_s3_bucket.book_covers.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.book_covers.arn}/*"
      }
    ]
  })
  
  depends_on = [aws_s3_bucket_public_access_block.book_covers_public]
}
