#!/bin/bash

# Build script for Soft Power Lab
# This script builds the entire project: Rust engine, WASM, and React frontend

set -e

echo "================================"
echo "Soft Power Lab - Build System"
echo "================================"
echo ""

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_DIR="$PROJECT_ROOT/engine"
WEB_CLIENT_DIR="$PROJECT_ROOT/apps/web-client"

echo "[1/5] Testing Rust Engine..."
cd "$ENGINE_DIR"
cargo test --lib --release

echo ""
echo "[2/5] Building Rust Engine (Release)..."
cargo build --release

echo ""
echo "[3/5] Building WASM Bridge..."
cd "$ENGINE_DIR"
cargo build --release --target wasm32-unknown-unknown
wasm-bindgen target/wasm32-unknown-unknown/release/soft_power_wasm.wasm --out-dir "$WEB_CLIENT_DIR/src/wasm"

echo ""
echo "[4/5] Installing Web Client Dependencies..."
cd "$WEB_CLIENT_DIR"
npm install

echo ""
echo "[5/5] Building Web Client..."
npm run build

echo ""
echo "================================"
echo "✅ Build Complete!"
echo "================================"
echo ""
echo "Output locations:"
echo "  - Rust Engine: $ENGINE_DIR/target/release"
echo "  - Web Client: $WEB_CLIENT_DIR/dist"
echo ""
echo "To run development server:"
echo "  cd $WEB_CLIENT_DIR && npm run dev"
echo ""
