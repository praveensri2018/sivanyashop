#!/usr/bin/env bash
# PLACE: /srv/apps/sivanyashop/deploy.sh
# Deploy script to run on VPS (called by GitHub Actions or run manually)
set -euo pipefail
IFS=$'\n\t'

echo "=== Deploy start: $(date -u) ==="

# 1) Ensure we are in the repo directory
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "Working directory: $ROOT_DIR"

# 2) Optional: display current branch and commit
echo "Git branch: $(git rev-parse --abbrev-ref HEAD || true)"
echo "Latest commit: $(git rev-parse --short HEAD || true)"

# 3) Install/update dependencies (if desired)
# Uncomment if you want the server to run npm install (not needed if using docker builds)
# if [ -f package.json ]; then
#   echo "Running npm ci"
#   npm ci --production
# fi

# 4) Build / start Docker Compose
if [ -f docker-compose.yml ]; then
  echo "Using docker-compose to build and deploy containers"
  # Pull images (if using remote images) and build local images
  docker-compose pull --ignore-pull-failures || true
  docker-compose build --pull --no-cache
  docker-compose up -d
  echo "docker-compose up -d finished"
else
  echo "docker-compose.yml not found in $ROOT_DIR — please place compose file here."
fi

# 5) Post-deploy health check (API)
# Wait a few seconds for services to come up
sleep 5

# Attempt a simple health check (optional)
if command -v curl >/dev/null 2>&1; then
  echo "Performing quick health checks..."
  # API health (adjust domain or local mapped port as needed)
  if curl -fsS --max-time 5 https://api.sivanyatrendstops.com/health >/dev/null 2>&1; then
    echo "API health check OK"
  else
    echo "Warning: API health check failed (check logs)"
  fi
else
  echo "curl not available; skipping health checks"
fi

echo "=== Deploy finished: $(date -u) ==="
