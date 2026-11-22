# AirAware AI

**Agentic Urban Air Quality & Lifestyle Intelligence Platform**

> Understand Your Air. Improve Your Everyday.

AirAware AI is an intelligent urban air quality assistant that helps individuals, families, students, commuters, and communities understand air pollution and make informed daily decisions.

## Features

- 🌍 **Real-time Air Quality** — Live AQI data from Indian monitoring stations using CPCB standard
- 📊 **Environmental Dashboard** — Comprehensive pollutant visualization and trends
- 🗺️ **Interactive Pollution Map** — Google Maps with monitoring station markers
- 🤖 **AI Assistant** — Context-aware environmental chatbot powered by LangGraph multi-agent system
- 📅 **Daily Routine Generator** — Pollution-aware schedule recommendations
- 🏠 **Indoor Air Advisor** — Practical indoor air quality guidance
- 🚗 **Mobility Advisor** — Sustainable transportation comparison with emissions calculation
- 📈 **Impact Tracker** — Personal environmental impact dashboard
- 👥 **Community Reports** — Crowdsourced pollution observations
- 🔔 **Smart Notifications** — Configurable air quality alerts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Charts | Recharts |
| Maps | @vis.gl/react-google-maps |
| State | Zustand, TanStack Query |
| Backend | Python 3.11+, FastAPI, Pydantic v2 |
| Database | PostgreSQL 16, SQLAlchemy 2, Alembic |
| Cache | Redis 7 |
| AI | LangGraph, LangChain, OpenRouter |
| Auth | JWT (access + refresh tokens) |

## Architecture

```
Frontend (React)  ←→  Backend (FastAPI)  ←→  PostgreSQL + Redis
                           ↕
                   LangGraph Multi-Agent
                   ┌───────────────────┐
                   │   Orchestrator    │
                   ├─────┬─────┬──────┤
                   │ AQI │Route│Indoor│
                   │Mobil│Impct│Safety│
                   └─────┴─────┴──────┘
                           ↕
              External APIs (OpenAQ, Open-Meteo, CPCB)
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Git

### 1. Clone the repository

```bash
git clone https://github.com/your-username/airaware-ai.git
cd airaware-ai
```

### 2. Start infrastructure

```bash
docker-compose up -d postgres redis
```

### 3. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
alembic upgrade head
uvicorn app.main:app --reload
```

### 4. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

### 5. Access the application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for required configuration.

**Never commit `.env` files with real credentials.**

## Project Structure

```
airaware-ai/
├── frontend/          # React application
│   ├── src/
│   │   ├── app/       # App setup, routing, providers
│   │   ├── components/# Reusable UI components
│   │   ├── pages/     # Page components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── services/  # API client services
│   │   ├── store/     # Zustand stores
│   │   ├── types/     # TypeScript types
│   │   └── utils/     # Utility functions
│   └── ...
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/       # Routes and middleware
│   │   ├── agents/    # LangGraph multi-agent system
│   │   ├── services/  # Business logic
│   │   ├── integrations/ # External API clients
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── core/      # Security, logging, exceptions
│   │   └── database/  # DB connection and base
│   ├── migrations/    # Alembic migrations
│   └── tests/         # pytest tests
├── docs/              # Project documentation
├── docker-compose.yml
└── README.md
```

## Documentation

- [Product Requirements](docs/PRD.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Agent Architecture](docs/AGENT_ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [API Specification](docs/API_SPECIFICATION.md)
- [Security](docs/SECURITY.md)
- [Integrations](docs/INTEGRATIONS.md)
- [Deployment](docs/DEPLOYMENT.md)

## AQI Standard

AirAware AI uses the **Indian CPCB National AQI** standard:

| Category | Range | Color |
|----------|-------|-------|
| Good | 0–50 | Green |
| Satisfactory | 51–100 | Yellow-Green |
| Moderate | 101–200 | Yellow |
| Poor | 201–300 | Orange |
| Very Poor | 301–400 | Red |
| Severe | 401–500 | Dark Red |

## License

This project is proprietary. All rights reserved.
