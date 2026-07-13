# LibOps

**LibOps** is a comprehensive library management system featuring a robust backend and a modern frontend.

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** React, Vite, TypeScript
- **Infrastructure & CI/CD:** Docker, Jenkins, SonarQube, Terraform

## Quick Start (Docker - Recommended)

The easiest way to run the entire stack locally is using Docker Compose.

```bash
# Start the entire stack in the background
docker-compose up -d --build
```

### Accessing the Services
- **Frontend:** [http://localhost:5174](http://localhost:5174)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **API Documentation (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs) (or `/api/v1/docs`)
- **Jenkins:** [http://localhost:8081](http://localhost:8081)
- **SonarQube:** [http://localhost:9000](http://localhost:9000)

```bash
# Stop the stack
docker-compose down
```
*(Add `-v` to the down command to wipe the database clean).*

## Local Development (Manual)

If you are actively editing code and want hot-reloading without rebuilding containers, you can run the services natively. You will still need a database running.

1. **Start the Database:**
   ```bash
   docker-compose up -d db
   ```

2. **Run the Backend:**
   ```bash
   cd backend
   uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

3. **Run the Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## Production Deployment

Production relies on `docker-compose.prod.yml` and requires a `.env` file with secure credentials.

1. Create a `.env` file in the root directory:
   ```env
   DB_USER=appuser
   DB_PASSWORD=your_super_secret_password
   DB_NAME=libops
   SECRET_KEY=generate_a_random_32_char_string
   DOCKER_IMAGE_BACKEND=your-repo/libops-backend
   DOCKER_IMAGE_FRONTEND=your-repo/libops-frontend
   ```

2. Start the production stack:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```
> **Warning:** Do not use default or easily guessable passwords and keys in production!

## Quality Assurance & CI/CD

Run the automated quality script (formatting, testing, and security checks) locally:
```bash
bash scripts/quality.sh
```

For Jenkins CI automation, start the customized Jenkins server:
```bash
bash scripts/start-jenkins.sh
```

---

*For additional context and detailed execution steps, please refer to the [Run Guide](run_guide.md).*
