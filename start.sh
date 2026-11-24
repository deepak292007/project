#!/usr/bin/env bash
# ======================================================================
#          ArogyaLink - Smart Rural Healthcare Platform
#   National Health Mission (MoHFW) / Ayushman Bharat ABDM Ready
# ======================================================================

set -e

echo "======================================================================"
echo "         ArogyaLink - Smart Rural Healthcare Platform"
echo "======================================================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH."
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "[SETUP] Installing dependencies..."
    npm install
fi

echo "[STARTING] Starting ArogyaLink Monorepo (API Server :4000 + Web Portal :3000)..."
echo ""
echo " - API Server: http://localhost:4000"
echo " - Web Portal: http://localhost:3000"
echo " - Local Network (Wi-Fi): Access via http://<YOUR_LOCAL_IP>:3000"
echo ""
echo "Press Ctrl+C to stop all servers."
echo "======================================================================"
echo ""

npm run dev
