#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

echo "My Store quick start"
echo "===================="

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed. Node.js 22 or newer is required."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed."
  exit 1
fi

node_version="$(node --version)"
node_major="${node_version#v}"
node_major="${node_major%%.*}"
if (( node_major < 22 )); then
  echo "ERROR: Node.js 22 or newer is required; found $node_version."
  exit 1
fi
echo "Node.js detected: $node_version"

./quick-setup.sh

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..."
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
else
  echo "Dependencies already installed."
fi

echo "Auditing all dependencies..."
npm audit --audit-level=high

echo
echo "Ready. Start the Worker with: npm run dev"
echo "Open: http://localhost:8787/availability.html"
