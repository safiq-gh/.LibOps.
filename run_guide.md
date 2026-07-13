# LibOps Run Guide

This guide covers how to run LibOps in different environments: Local Development, Production, and how to interact with your automated CI pipeline.

---

## 1. Local Development (Docker — Recommended)

The easiest way to run the entire stack (PostgreSQL, FastAPI Backend, and React Frontend) locally is using Docker Compose.

### Start the Stack
From the root of your project (`e:\LibOps`), run:
```bash
docker-compose up -d --build
```

### Access the Application
- **Frontend:** http://localhost:5174
- **Backend API:** http://localhost:8000
- **API Documentation (Swagger):** http://localhost:8000/api/v1/docs

### Stop the Stack
```bash
docker-compose down
```
*(If you want to wipe the database clean, add `-v` to the down command).*

---

## 2. Local Development (Manual / Without Docker)

If you are actively editing code and want hot-reloading without rebuilding containers, you can run the services natively. You will still need a database running.

**Step 1: Start just the database**
```bash
docker-compose up -d db
```

**Step 2: Run the Backend**
Open a terminal in the `backend/` directory:
```bash
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Step 3: Run the Frontend**
Open a separate terminal in the `frontend/` directory:
```bash
npm run dev
```

---

## 3. Production Deployment

Production uses `docker-compose.prod.yml` which requires strict security configurations. 

> [!WARNING]
> Do not use `common passwords` or default keys in production!

**Step 1: Generate a `.env` file**
Create a `.env` file in the root of the project with secure credentials:
```env
DB_USER=appuser
DB_PASSWORD=your_super_secret_password
DB_NAME=libops
SECRET_KEY=generate_a_random_32_char_string
DOCKER_IMAGE_BACKEND=isshin693/libops-backend
DOCKER_IMAGE_FRONTEND=isshin693/libops-frontend
```

**Step 2: Run the Production Stack**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 4. Quality Assurance & Testing

You have an automated script to format code, run tests, and check for security vulnerabilities.

### Run Local Checks
From any directory, you can run the quality script:
```bash
bash scripts/quality.sh
```

### Jenkins CI Automation
If you need to start your customized Jenkins server to run automated pipelines:
```bash
bash scripts/start-jenkins.sh
```
- Access Jenkins at: http://localhost:8080
- It automatically has Python, `uv`, Docker, and Trivy pre-configured to run your `Jenkinsfile`.
