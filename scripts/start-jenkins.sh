#!/bin/bash
set -e

echo "====================================="
echo "   Starting Custom Jenkins Server    "
echo "====================================="

echo "1. Building custom Jenkins image..."
docker build -t libops-jenkins ./jenkins

echo "2. Stopping any existing Jenkins container..."
docker rm -f jenkins || true

echo "3. Starting Jenkins container..."
docker run -d \
    -p 8081:8080 \
    -p 50000:50000 \
    -v jenkins_home:/var/jenkins_home \
    -v //var/run/docker.sock:/var/run/docker.sock \
    --name jenkins \
    libops-jenkins

echo "====================================="
echo " Jenkins started successfully!       "
echo " Access it at: http://localhost:8081 "
echo "====================================="
