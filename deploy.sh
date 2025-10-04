#!/usr/bin/env bash
# PLACE: /srv/apps/sivanyashop/deploy.sh
set -euo pipefail
IFS=$'\n\t'

# Fix PATH for non-interactive SSH sessions
export PATH=$PATH:/usr/bin

echo "=== Deploy start: $(date -u) ==="

# 1) Ensure we are in the repo directory
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"
echo "Working directory: $ROOT_DIR"

# 2) Optional: display current branch and commit
echo "Git branch: $(git rev-parse --abbrev-ref HEAD || true)"
echo "Latest commit: $(git rev-parse --short HEAD || true)"

# 3) Determine docker-compose command
DOCKER_COMPOSE_CMD=""
if command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker-compose"
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
else
  echo "Error: Neither docker-compose nor docker compose is installed."
  exit 1
fi
echo "Using Docker Compose command: $DOCKER_COMPOSE_CMD"

# 4) Build / start Docker Compose
if [ -f docker-compose.yml ]; then
  echo "Using Docker Compose to build and deploy containers"
  # Pull images (if using remote images) and build local images
  $DOCKER_COMPOSE_CMD pull --ignore-pull-failures || true
  $DOCKER_COMPOSE_CMD build --pull --no-cache
  $DOCKER_COMPOSE_CMD up -d
  echo "Docker Compose deployment finished"
else
  echo "docker-compose.yml not found in $ROOT_DIR — please place compose file here."
fi

# 5) Post-deploy health check (API)
sleep 5
if command -v curl >/dev/null 2>&1; then
  echo "Performing quick health checks..."
  if curl -fsS --max-time 5 https://api.sivanyatrendstops.com/health >/dev/null 2>&1; then
    echo "API health check OK"
  else
    echo "Warning: API health check failed (check logs)"
  fi
else
  echo "curl not available; skipping health checks"
fi

echo "=== Deploy finished: $(date -u) ==="
