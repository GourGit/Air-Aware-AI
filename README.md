# AirAware AI

**Agentic Urban Air Quality & Lifestyle Intelligence Platform**

> Understand Your Air. Improve Your Everyday.

AirAware AI is an intelligent urban air quality platform that helps individuals, families, students, commuters, and communities understand air pollution and make informed daily decisions.

The platform is structured as two connected products sharing a unified backend:
1. **Product A — Public AQI Website** (React 18 + TypeScript + Vite + Tailwind CSS)
   - Public exploration without mandatory registration: live CPCB AQI, location search, station telemetry inspector, Google Maps / canvas pollution map, and NAAQS benchmarks.
2. **Product B — Downloadable Mobile Application** (React Native + Expo)
   - Personalized mobile companion: onboarding, LangGraph multi-agent AI assistant, pollution-aware routines, indoor air advisor, ARAI/CEA transit comparator, impact tracking, and civic reports.
3. **Shared Backend Infrastructure** (FastAPI + PostgreSQL 18 + Redis + LangGraph)
   - Unified `/api/v1` API powering both web and mobile experiences.

---

## ⚡ 1-Click Launchers (Windows)

We provide one-click scripts so you can launch any component without manual configuration:

| Script | Purpose | URL / Action |
|---|---|---|
| **`run_all.bat`** | Launches both the shared FastAPI Backend and Product A Web Frontend | Both services in separate windows |
| **`run_frontend.bat`** | Launches **Product A (Public Web App)** | `http://localhost:5173` |
| **`run_mobile.bat`** | Launches **Product B (Mobile App)** via Expo | QR code for phone / Web preview / Emulator |
| **`run_backend.bat`** | Launches the **Shared FastAPI Backend** | `http://localhost:8000` (Docs: `/docs`) |

---

## 🛠️ PostgreSQL 18 & Database Setup

AirAware AI is configured for **PostgreSQL 18** (and supports 16, 17, and offline fallback mode):

### Option A: Local PostgreSQL 18 (Recommended)
1. Open `backend/.env`
2. Set your PostgreSQL 18 credentials:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/airaware_db
   ```
3. Apply database schema migrations:
   ```bash
   cd backend
   python -m alembic upgrade head
   ```
   *(Alternatively, `run_backend.bat` runs this automatically on startup, and the FastAPI application lifespan verifies tables upon connection).*
4. Run `run_backend.bat` to launch the API.

> **Resilient Local Mode**: If PostgreSQL or Redis is not running or offline, the backend **never crashes**. It automatically activates resilient mode, serving live CPCB CAAQMS sensor telemetry and calculations.

### Option B: Docker Desktop
If using Docker Desktop:
1. Start Docker Desktop on Windows.
2. `docker-compose.yml` uses `postgres:18-alpine` and `redis:7-alpine`:
   ```bash
   docker-compose up -d postgres redis
   ```

---

## 🌐 Product A: Public AQI Website (Web)

Public visitors can access:
- **Live CPCB AQI Overview** (`/dashboard`): Real-time station telemetry across Indian metros.
- **NAAQS Pollutant Analytics** (`/air-quality`): 6-pollutant concentration breakdown vs 24-hr statutory limits.
- **Geospatial Pollution Map** (`/map`): Dual-mode map with `@vis.gl/react-google-maps` (with fallback to coordinate canvas when `VITE_GOOGLE_MAPS_API_KEY` is not provided).
- **No mandatory login**: Guests can freely browse all atmospheric data.

Run via:
```bash
cd frontend
npm install
npm run dev
```

---

## 📱 Product B: Mobile Application (React Native + Expo)

The mobile companion provides:
- **Personalized AQI Dashboard**: Immediate CPCB air telemetry for user's city.
- **LangGraph Multi-Agent Chat**: Real-time consultation with Coordinator, AQI, Routine, and Safety agents.
- **Pollution-Aware Routine Generator**: Hourly schedule optimization avoiding thermal inversion peaks.
- **Indoor Air Advisor**: Air hygiene score, natural ventilation guidance, and HEPA purifier monitoring.
- **Sustainable Mobility Advisor**: Transit emissions calculator using official ARAI & CEA factors.
- **Personal Impact Tracker**: Kilograms of CO2e avoided and tree-equivalent absorption metrics.
- **Community Reporting**: Citizen reports for local burning, construction dust, and industrial smoke.

Run via:
```bash
cd mobile
npm install
npx expo start
```
*Press `w` in terminal for web preview, or scan the QR code with Expo Go on Android/iOS.*

---

## 🧪 Automated Testing

All tests run offline and verify CPCB algorithms, ARAI emissions factors, and multi-agent flows:

```bash
cd backend
python -m pytest tests/ -v
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│   PRODUCT A: Public Web App     │       │    PRODUCT B: Mobile App        │
│   (React 18 + Vite + Tailwind)  │       │    (React Native + Expo)        │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 └──────────────────┬──────────────────────┘
                                    │ HTTP / JSON
                                    ▼
                 ┌──────────────────────────────────────┐
                 │        FastAPI Shared Backend        │
                 │      (12 Route Groups under /api/v1) │
                 └──────────────────┬───────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│    PostgreSQL 18    │  │     Redis Cache     │  │  LangGraph Agents   │
│   Alembic Schema    │  │  Rate Limiting & AQI│  │  Multi-Agent Engine │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

## 🎨 CPCB NAQI Categories & Colors

| Category | Range | Color | Health Advisory |
|---|---|---|---|
| **Good** | 0–50 | `#009966` | Minimal impact. Clean air ideal for all outdoor activities. |
| **Satisfactory** | 51–100 | `#99CC33` | Minor breathing discomfort to sensitive individuals. |
| **Moderate** | 101–200 | `#FFCC00` | Breathing discomfort to people with asthma and heart disease. |
| **Poor** | 201–300 | `#FF9933` | Breathing discomfort to most people on prolonged exposure. |
| **Very Poor** | 301–400 | `#CC0033` | Respiratory illness on prolonged exposure. Avoid strenuous outdoor activity. |
| **Severe** | 401–500 | `#7E0023` | Seriously impacts healthy individuals and vulnerable groups. |
