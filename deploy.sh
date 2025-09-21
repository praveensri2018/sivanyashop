#!/usr/bin/env bash
set -euo pipefail

REPO_DIR=/srv/apps/sivanyashop
cd "$REPO_DIR"

echo "== deploy (docker) started $(date) =="

git fetch --all
git reset --hard origin/main

docker compose build --pull frontend
docker compose up -d --no-deps --force-recreate frontend

echo "== deploy (docker) finished $(date) =="
