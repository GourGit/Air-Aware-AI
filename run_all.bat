@echo off
title AirAware AI - Application Launcher
echo ========================================================
echo   AirAware AI - Multi-Platform System Launcher
echo ========================================================
echo.
echo Launching Shared FastAPI Backend in a separate window...
start "AirAware Backend" cmd /c ""%~dp0run_backend.bat""

timeout /t 3 /nobreak >nul

echo Launching Product A - Public AQI Web App in a separate window...
start "AirAware Frontend" cmd /c ""%~dp0run_frontend.bat""

echo.
echo ========================================================
echo   Services are starting!
echo   Product A (Public Web):  http://localhost:5173
echo   Product B (Mobile App):  Run run_mobile.bat for Expo
echo   Shared Backend API:      http://localhost:8000
echo   Interactive API Docs:    http://localhost:8000/docs
echo ========================================================
echo.
