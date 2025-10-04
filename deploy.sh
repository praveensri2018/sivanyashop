# => PLACE: /srv/apps/sivanyashop/deploy.sh
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

# 3) Pull latest code
echo "Pulling latest code..."
git pull origin main || true

# 4) Determine docker-compose command
DOCKER_COMPOSE_CMD=""
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"  # v2 plugin
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker-compose"  # legacy v1
else
  echo "Error: Docker is not installed or docker-compose.yml missing!"
  exit 1
fi

echo "Using Docker Compose command: $DOCKER_COMPOSE_CMD"

# 5) Stop running containers
echo "Stopping containers..."
$DOCKER_COMPOSE_CMD down

# 6) Build and start containers
echo "Rebuilding and starting containers..."
$DOCKER_COMPOSE_CMD up -d --build

# 7) Optional: show running containers
echo "Current containers status:"
$DOCKER_COMPOSE_CMD ps

# 8) Follow nginx logs (you can comment this if you don't want to block the script)
echo "Tailing nginx logs (Ctrl+C to stop)..."
$DOCKER_COMPOSE_CMD logs -f nginx

echo "=== Deploy end: $(date -u) ==="
