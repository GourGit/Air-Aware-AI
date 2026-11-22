# AirAware AI

**Agentic Urban Air Quality & Lifestyle Intelligence Platform**

> Understand Your Air. Improve Your Everyday.

AirAware AI is an intelligent urban air quality assistant that helps individuals, families, students, commuters, and communities understand air pollution and make informed daily decisions.

---

## ⚡ Super Easy 1-Click Launch (Windows)

We've provided one-click scripts so you don't have to fiddle with complex terminal setups:

| Script | What it does |
|---|---|
| **`run_all.bat`** | Double-click to launch **both** the Backend and Frontend in separate windows! |
| **`run_backend.bat`** | Launches FastAPI Backend on `http://localhost:8000` (Docs: `http://localhost:8000/docs`) |
| **`run_frontend.bat`** | Launches Vite React Frontend on `http://localhost:5173` |

---

## 🛠️ PostgreSQL 18 & Database Setup

AirAware AI supports **PostgreSQL 18** (as well as 16, 17, and local fallbacks):

### Option A: You have PostgreSQL 18 installed locally on Windows (Recommended if not using Docker)
1. Open `backend/.env`
2. Set your PostgreSQL 18 credentials:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/airaware_db
   ```
3. Run `run_backend.bat`. The backend will automatically connect to your local PostgreSQL 18 server.

> **Note on Local Resilient Mode**: Even if PostgreSQL or Redis is not yet started, the backend will **never crash**. It boots smoothly into resilient mode with verified CAAQMS stations and calculations available immediately!

### Option B: Running with Docker Desktop
If you saw `failed to connect to the docker API at npipe:////./pipe/docker_engine`:
1. Start the **Docker Desktop** application on Windows.
2. Ensure Docker Desktop shows "Engine running" (green icon).
3. In `docker-compose.yml`, PostgreSQL is pre-configured with `postgres:18-alpine`:
   ```bash
   docker-compose up -d postgres redis
   ```

---

## 🚀 Running Manually (Terminal Commands)

### 1. Run the Backend (FastAPI)

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* **API Home**: http://localhost:8000
* **Interactive Swagger UI**: http://localhost:8000/docs
* **Health Check**: http://localhost:8000/api/v1/health

### 2. Run the Frontend (React + Vite)

```bash
cd frontend
npm run dev
```
* **Frontend Web App**: http://localhost:5173

---

## 🧪 Running Automated Tests

All tests run completely offline and verify CPCB algorithms, emissions, and agent nodes:

```bash
cd backend
python -m pytest tests/ -v
```

---

## 🏗️ Architecture Overview

```
Frontend (React 18 + Vite)  ←→  Backend (FastAPI)  ←→  PostgreSQL 18 + Redis
                                        ↕
                             LangGraph Multi-Agent
                             ┌───────────────────┐
                             │   Orchestrator    │
                             ├─────┬─────┬───────┤
                             │ AQI │Route│Indoor │
                             │Mobil│Impct│Safety │
                             └─────┴─────┴───────┘
                                        ↕
                    Indian CAAQMS Stations & ARAI Factors
```

## 📋 Features

- 🌍 **Real-time Air Quality** — Live CPCB AQI data from official Indian monitoring stations
- 📊 **Environmental Dashboard** — Recharts hourly trends and NAAQS standards comparison
- 🗺️ **Interactive Pollution Map** — Station markers across Delhi, Kolkata, Mumbai, Bengaluru, Chennai, Lucknow
- 🤖 **AI Assistant** — Context-aware environmental chatbot powered by LangGraph multi-agent flow
- 📅 **Daily Routine Generator** — Pollution-aware schedule recommendations based on thermal inversion
- 🏠 **Indoor Air Advisor** — Filtration guidance, ventilation windows, and hygiene score
- 🚗 **Mobility Advisor** — Sustainable transit comparisons based on official ARAI & CEA emissions
- 📈 **Personal Impact Tracker** — Deterministic CO2e avoided and clean travel tracking
- 👥 **Community Reports** — Citizen pollution observations with geoprivacy protection
- 🔔 **Smart Notifications** — Configurable air quality alerts and morning briefing schedule

## 🎨 Color Palette & CPCB NAQI Standard

| Category | Range | Color |
|---|---|---|
| **Good** | 0–50 | `#009966` |
| **Satisfactory** | 51–100 | `#99CC33` |
| **Moderate** | 101–200 | `#FFCC00` |
| **Poor** | 201–300 | `#FF9933` |
| **Very Poor** | 301–400 | `#CC0033` |
| **Severe** | 401–500 | `#7E0023` |
