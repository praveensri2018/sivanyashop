# => PLACE: /srv/apps/sivanyashop/deploy.sh (on the server)
#!/usr/bin/env bash
set -euo pipefail
LOG=/srv/apps/sivanyashop/deploy-$(date +%s).log
exec > >(tee -a "$LOG") 2>&1

echo "=== DEPLOY START: $(date) ==="

# ensure in repo root
cd /srv/apps/sivanyashop

# ensure correct branch and latest code (force reset to avoid conflicts)
git fetch --all --prune
git reset --hard origin/main

# optional: ensure submodules updated
# git submodule sync --recursive
# git submodule update --init --recursive

# Build / restart with docker compose if you use compose
if command -v docker >/dev/null 2>&1 && [ -f docker-compose.yml ]; then
  echo "Docker detected and docker-compose.yml exists. Building and restarting."
  docker compose build --pull --quiet
  docker compose up -d --remove-orphans --force-recreate
  docker system prune -f || true
  echo "Docker services status:"
  docker compose ps
else
  echo "Docker not found or docker-compose.yml missing. Falling back to npm (pm2) approach."

  # Install deps and restart pm2 (uncomment if you use pm2)
  # cd backend
  # npm ci --production
  # pm2 restart sivanya-backend || pm2 start index.js --name sivanya-backend
fi

echo "=== DEPLOY END: $(date) ==="
