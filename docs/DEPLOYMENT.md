# Deployment & Operations Guide

## 1. Local Development (Docker Compose)

### Services Included
1. **`postgres`**: PostgreSQL 16 container exposed on port `5432`.
2. **`redis`**: Redis 7 container exposed on port `6379`.
3. **`backend`**: FastAPI hot-reloading development server on port `8000`.
4. **`frontend`**: Vite React dev server on port `5173`.

### Quick Start
```bash
# 1. Copy env templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Boot database and cache
docker-compose up -d postgres redis

# 3. Launch backend locally
cd backend
python -m venv .venv
# Activate venv (.venv\Scripts\activate on Windows)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 4. Launch frontend locally
cd ../frontend
npm install
npm run dev
```

---

## 2. Low-Cost Production Architecture

```
[Users / Browsers]
        │
   HTTPS (TLS 1.3)
        │
   ┌────┴───────────────────────────┐
   │                                │
   ▼                                ▼
[Vercel / Cloudflare Pages]   [Render / Railway]
Frontend Static App (React)   FastAPI Backend (Docker)
                                    │
                       ┌────────────┴────────────┐
                       ▼                         ▼
                [Neon Tech]              [Upstash Redis]
             Serverless Postgres       Serverless Managed Cache
```

### Component Details
- **Frontend Hosting**: Vercel. Automatic branch previews, global CDN edge caching for static assets.
- **Backend Hosting**: Render Web Service (Starter tier). Automated deployments triggered by commits to `main`.
- **Database**: Neon Serverless PostgreSQL with automatic scale-to-zero during non-usage to preserve free quota.
- **Cache**: Upstash Serverless Redis. Pay-per-request pricing, ideal for low-budget production deployments.

---

## 3. Production Health & Readiness Probes
- `GET /api/v1/health`: Checks application process health.
- `GET /api/v1/health/ready`: Deep inspection probing:
  - Database query execution (`SELECT 1`).
  - Redis ping / latency check.
  - External API egress readiness.
