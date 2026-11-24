@echo off
title ArogyaLink - Smart Rural Healthcare Platform
echo ======================================================================
echo          ArogyaLink - Smart Rural Healthcare Platform
echo   National Health Mission (MoHFW) / Ayushman Bharat ABDM Ready
echo ======================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check dependencies
if not exist "node_modules" (
    echo [SETUP] Installing root and workspace dependencies...
    call npm install
)

echo [STARTING] Starting ArogyaLink Monorepo (API Server :4000 + Web Portal :3000)...
echo.
echo  - API Server: http://localhost:4000
echo  - Web Portal: http://localhost:3000
echo  - Local Network (Wi-Fi): Access via http://^<YOUR_LOCAL_IP^>:3000
echo.
echo Press Ctrl+C in this terminal to stop all servers.
echo ======================================================================
echo.

call npm run dev
