import logging
import watchtower
import boto3
from app.core.config import settings

def setup_logging():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("libops")

    # If AWS credentials are set, attach CloudWatch handler
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        try:
            boto3_client = boto3.client(
                "logs",
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region
            )
            cw_handler = watchtower.CloudWatchLogHandler(
                log_group="LibOps-Backend-Logs",
                stream_name="api-stream",
                boto3_client=boto3_client
            )
            logger.addHandler(cw_handler)
            logger.info("CloudWatch logging initialized.")
        except Exception as e:
            logger.warning(f"Failed to initialize CloudWatch logging: {e}")
    else:
        logger.info("AWS credentials not provided. CloudWatch logging disabled, using local console only.")
        
    return logger

logger = setup_logging()
