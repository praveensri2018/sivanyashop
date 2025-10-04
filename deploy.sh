#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

echo "=== Deploy start: $(date -u) ==="

# 1) Ensure we are in the repo directory
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"
echo "Working directory: $ROOT_DIR"

# 2) Display current branch and commit
echo "Git branch: $(git rev-parse --abbrev-ref HEAD || true)"
echo "Latest commit: $(git rev-parse --short HEAD || true)"

# 3) Pull latest code
echo "Pulling latest code..."
git fetch origin
git reset --hard origin/main

# 4) Stop running containers
echo "Stopping containers..."
/usr/bin/docker compose down

# 5) Build and start containers
echo "Building and starting containers..."
/usr/bin/docker compose up -d --build

# 6) Show nginx logs (last 20 lines)
echo "Nginx logs:"
/usr/bin/docker compose logs --tail=20 nginx

echo "=== Deploy end: $(date -u) ==="
