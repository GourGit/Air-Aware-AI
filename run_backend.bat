@echo off
title AirAware AI - Backend Server
echo ========================================================
echo   AirAware AI - Backend API Server (FastAPI + Python)
echo ========================================================
echo.

cd /d "%~dp0backend"

if not exist ".env" (
    echo Copying .env.example to .env ...
    copy .env.example .env >nul
)

echo Starting FastAPI Backend on http://localhost:8000 ...
echo Interactive OpenAPI Documentation: http://localhost:8000/docs
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
