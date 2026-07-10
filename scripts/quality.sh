#!/bin/bash
set -e

# Anchor to project root regardless of where the script is invoked from
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "====================================="
echo "   LibOps Quality Assurance Checks   "
echo "====================================="

echo "[1/4] Running Ruff Linter (Backend)..."
cd backend
uv run ruff check .
echo "Ruff Linter passed!"

echo ""
echo "[2/4] Running Pytest (Backend)..."
uv run pytest
echo "Pytest passed!"
cd ..

echo ""
echo "[3/4] Running Trivy Vulnerability Scanner (Backend Image)..."
# Assuming Docker images are built as libops-backend / libops-frontend
# You must install Trivy locally or run via docker
if command -v trivy &> /dev/null; then
    trivy image libops-backend
    echo ""
    echo "[4/4] Running Trivy Vulnerability Scanner (Frontend Image)..."
    trivy image libops-frontend
else
    echo "Trivy is not installed locally. Skipping image scan."
    echo "To scan, run: docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image libops-backend"
fi

echo ""
echo "====================================="
echo "   All Quality Checks Passed!        "
echo "====================================="
