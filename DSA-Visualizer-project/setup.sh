#!/bin/bash
# ─── CodeNakshatra DSA Visualizer — Setup Script ────────────────────────────
# Author: Utkarsh Gupta | ABES Engineering College

set -e

echo ""
echo "◈  CodeNakshatra DSA Visualizer — Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check g++
if ! command -v g++ &> /dev/null; then
  echo "❌  g++ not found. Install with:"
  echo "    Ubuntu/Debian: sudo apt install g++"
  echo "    macOS:         brew install gcc"
  exit 1
fi

# Check node
if ! command -v node &> /dev/null; then
  echo "❌  Node.js not found. Download from https://nodejs.org"
  exit 1
fi

echo "✅  g++ $(g++ --version | head -1 | awk '{print $3}')"
echo "✅  Node.js $(node --version)"
echo ""

# Compile C++ engine
echo "⚙   Compiling C++ DSA engine..."
cd backend
g++ -O2 -std=c++17 -o dsa_engine dsa_engine.cpp
echo "✅  C++ engine compiled → backend/dsa_engine"

# Install Node deps
echo ""
echo "📦  Installing Node.js dependencies..."
npm install --silent
echo "✅  Dependencies installed"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀  Starting server..."
echo "🌐  Open: http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
node server.js
