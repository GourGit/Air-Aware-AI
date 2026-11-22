@echo off
title AirAware AI - Mobile App (React Native + Expo)
echo ========================================================
echo   AirAware AI - Mobile App (React Native + Expo)
echo ========================================================
echo.

cd /d "%~dp0mobile"

if not exist "node_modules\.install_success" (
    echo Installing mobile dependencies (one-time setup)...
    call npm install
    if errorlevel 1 (
        echo ERROR: Mobile npm install failed.
        pause
        exit /b 1
    )
    echo installed > "node_modules\.install_success"
)

echo Starting Expo Development Server...
echo Use Expo Go app on your phone to scan the QR code,
echo or press 'w' for web preview, 'a' for Android, 'i' for iOS.
echo.

call npx expo start

pause
