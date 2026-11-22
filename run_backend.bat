@echo off
title AirAware AI - Backend Server
echo ========================================================
echo   AirAware AI - Backend API Server (FastAPI + Python)
echo ========================================================
echo.

cd /d "%~dp0backend"

REM Activate virtual environment if present
if exist "venv\Scripts\activate.bat" (
    echo Activating local venv...
    call "venv\Scripts\activate.bat"
) else if exist ".venv\Scripts\activate.bat" (
    echo Activating local .venv...
    call ".venv\Scripts\activate.bat"
) else if exist "%~dp0venv\Scripts\activate.bat" (
    echo Activating project root venv...
    call "%~dp0venv\Scripts\activate.bat"
) else if exist "%~dp0.venv\Scripts\activate.bat" (
    echo Activating project root .venv...
    call "%~dp0.venv\Scripts\activate.bat"
)

if not exist ".env" (
    echo Copying .env.example to .env ...
    copy .env.example .env >nul
)

REM Apply database schema migrations if PostgreSQL is running
echo Checking database schema migrations (Alembic)...
python -m alembic upgrade head >nul 2>&1

echo Starting FastAPI Backend on http://localhost:8000 ...
echo Interactive OpenAPI Documentation: http://localhost:8000/docs
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
