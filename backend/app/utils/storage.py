import os
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from fastapi import UploadFile
from app.core.config import settings

import logging

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.bucket = settings.s3_bucket
        # Initialize boto3 client.
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            self.s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region
            )
        else:
            try:
                # Try to load credentials from default sources (AWS CLI profile, environment variables, IAM Role)
                self.s3 = boto3.client("s3", region_name=settings.aws_region)
            except Exception as e:
                logger.warning(f"Failed to initialize S3 client: {e}. Falling back to local storage.")
                self.s3 = None

    async def upload_cover(self, file: UploadFile, book_id: str) -> str:
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        filename = f"covers/{book_id}{file_ext}"

        # Attempt to upload to S3 if initialized
        if self.s3:
            try:
                file_content = await file.read()
                self.s3.put_object(
                    Bucket=self.bucket,
                    Key=filename,
                    Body=file_content,
                    ContentType=file.content_type or "image/jpeg"
                )
                await file.seek(0)
                return f"https://{self.bucket}.s3.{settings.aws_region}.amazonaws.com/{filename}"
            except (NoCredentialsError, ClientError, Exception) as e:
                logger.warning(f"S3 upload failed: {e}. Falling back to local storage.")
                await file.seek(0)

        # Fallback to local static storage
        local_dir = "static/covers"
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join(local_dir, f"{book_id}{file_ext}")
        
        file_content = await file.read()
        with open(local_path, "wb") as f:
            f.write(file_content)
        await file.seek(0)
        
        return f"{settings.backend_url.rstrip('/')}/static/covers/{book_id}{file_ext}"

storage_service = StorageService()
