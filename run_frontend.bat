@echo off
title AirAware AI - Frontend App
echo ========================================================
echo   AirAware AI - Frontend Web App (React 18 + Vite)
echo ========================================================
echo.

cd /d "%~dp0frontend"

if not exist ".env" (
    echo Copying .env.example to .env ...
    copy .env.example .env >nul
)

if not exist "node_modules\.install_success" (
    echo Installing frontend dependencies (one-time setup)...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed. Please check network and retry.
        pause
        exit /b 1
    )
    echo installed > "node_modules\.install_success"
)

echo Starting Vite Development Server on http://localhost:5173 ...
echo.

call npm run dev -- --host 0.0.0.0 --port 5173

pause
