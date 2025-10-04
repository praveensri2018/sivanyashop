# => PLACE: /srv/apps/sivanyashop/deploy.sh (on the server)
#!/usr/bin/env bash
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

# 3) Determine docker-compose command (use v2 if available)
DOCKER_COMPOSE_CMD=""
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"  # <-- v2 plugin
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker-compose"  # <-- legacy v1
else
  echo "Docker not found or docker-compose.yml missing. Falling back to npm (pm2) approach."

  # Install deps and restart pm2 (uncomment if you use pm2)
  # cd backend
  # npm ci --production
  # pm2 restart sivanya-backend || pm2 start index.js --name sivanya-backend
fi

echo "=== DEPLOY END: $(date) ==="
