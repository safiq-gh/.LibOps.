#!/bin/bash
set -e

# Configuration
PROJECT_DIR="/home/ec2-user/LibOps"
ENV_FILE="$PROJECT_DIR/.env"

echo "========================================="
echo "   Deploying LibOps to Production EC2    "
echo "========================================="

# 1. Pull latest changes if repository exists, otherwise clone
if [ -d "$PROJECT_DIR" ]; then
    echo "Updating codebase..."
    cd "$PROJECT_DIR"
    git pull origin main
else
    echo "Cloning codebase..."
    git clone https://github.com/safiq-gh/.LibOps..git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# 2. Check for .env file
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating production .env template..."
    cat <<EOT >> "$ENV_FILE"
DB_USER=appuser
DB_PASSWORD=$(openssl rand -hex 12)
DB_NAME=libops
SECRET_KEY=$(openssl rand -hex 32)
DOCKER_IMAGE_BACKEND=safiq-gh/libops-backend
DOCKER_IMAGE_FRONTEND=safiq-gh/libops-frontend
EOT
    echo ".env file generated. Please review credentials inside: $ENV_FILE"
fi

# 3. Pull latest images and restart the stack
echo "Pulling production Docker images..."
docker-compose -f docker-compose.prod.yml pull

echo "Starting application stack..."
docker-compose -f docker-compose.prod.yml up -d

echo "Running migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

echo "========================================="
echo "   Deployment completed successfully!    "
echo "   Frontend is live on port 80           "
echo "   Backend is live on port 8000          "
echo "========================================="
