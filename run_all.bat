@echo off
title AirAware AI - Application Launcher
echo ========================================================
echo   AirAware AI - Starting Both Backend and Frontend
echo ========================================================
echo.
echo Launching Backend in a separate window...
start "AirAware Backend" cmd /c "%~dp0run_backend.bat"

timeout /t 3 /nobreak >nul

echo Launching Frontend in a separate window...
start "AirAware Frontend" cmd /c "%~dp0run_frontend.bat"

echo.
echo ========================================================
echo   Services are starting!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ========================================================
echo.
