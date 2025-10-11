#!/bin/bash
set -euo pipefail

# ==== CONFIG ====
FRONTEND_DIR=/srv/apps/sivanyashop/frontend/sivanyashop
BACKEND_DIR=/srv/apps/sivanyashop/backend
FRONTEND_DOMAIN=sivanyatrendstops.com
API_DOMAIN=api.sivanyatrendstops.com
LE_EMAIL=admin@sivanyatrendstops.com
AUTO_CERTS=true
PM2_APP_NAME=sivanyatrends-backend
NGX_AVAIL=/etc/nginx/sites-available
NGX_ENABLED=/etc/nginx/sites-enabled

log(){ echo "[$(date '+%F %T')] $*"; }

# require root
if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root"; exit 1
fi

# certbot binary fallback
CERTBOT="$(command -v certbot 2>/dev/null || echo /snap/bin/certbot)"

# ==== 1. GIT ====
log "Git pull..."
if [ -d "$FRONTEND_DIR" ]; then cd "$FRONTEND_DIR" && git pull || true; fi
if [ -d "$BACKEND_DIR" ]; then cd "$BACKEND_DIR" && git pull || true; fi

# ==== 2. BUILD ====
log "Building frontend..."
cd "$FRONTEND_DIR"
npm ci --no-audit --no-fund --legacy-peer-deps
npm run build -- --configuration production

# ==== 3. PM2 ====
log "Restarting backend..."
cd "$BACKEND_DIR"
npm ci --no-audit --no-fund --legacy-peer-deps
pm2 restart "$PM2_APP_NAME" --update-env || pm2 start index.js --name "$PM2_APP_NAME"
pm2 save

# ==== prepare backups and remove dup vhosts ====
mkdir -p /root/nginx-backups
# Move any extra site files that declare the same frontend domain (except canonical file)
grep -R "server_name .*${FRONTEND_DOMAIN}" /etc/nginx/sites-available -n 2>/dev/null | awk -F: '{print $1}' | sort -u | while read -r f; do
  if [ "$f" != "$NGX_AVAIL/$FRONTEND_DOMAIN" ]; then
    log "Backing up and disabling duplicate $f"
    mv "$f" /root/nginx-backups/ 2>/dev/null || true
    rm -f "$NGX_ENABLED/$(basename "$f")" 2>/dev/null || true
  fi
done

# also handle explicit known duplicates
for dup in sivanyashop.com sivanytrendstops.com; do
  if [ -f "$NGX_AVAIL/$dup" ] && [ "$dup" != "$FRONTEND_DOMAIN" ]; then
    log "Moving extra $dup to backup"
    mv "$NGX_AVAIL/$dup" /root/nginx-backups/ 2>/dev/null || true
    rm -f "$NGX_ENABLED/$dup" 2>/dev/null || true
  fi
done

# ==== 4. NGINX (preserve SSL) ====
log "Updating nginx configs..."
# FRONTEND - keep if has SSL
if grep -q "listen 443" "$NGX_AVAIL/$FRONTEND_DOMAIN" 2>/dev/null; then
  log "Keeping existing $FRONTEND_DOMAIN (has SSL)"
else
  [ -f "$NGX_AVAIL/$FRONTEND_DOMAIN" ] && cp "$NGX_AVAIL/$FRONTEND_DOMAIN" /root/nginx-backups/"$FRONTEND_DOMAIN.$(date +%s)".bak || true
  cat > "$NGX_AVAIL/$FRONTEND_DOMAIN" <<EOL
server {
    listen 80;
    server_name $FRONTEND_DOMAIN www.$FRONTEND_DOMAIN;
    root $FRONTEND_DIR/dist/sivanyashop/browser;
    index index.html;
    location / { try_files \$uri /index.html; }
}
EOL
  log "Wrote HTTP config for $FRONTEND_DOMAIN"
fi

# API - keep if has SSL
if grep -q "listen 443" "$NGX_AVAIL/$API_DOMAIN" 2>/dev/null; then
  log "Keeping existing $API_DOMAIN (has SSL)"
else
  [ -f "$NGX_AVAIL/$API_DOMAIN" ] && cp "$NGX_AVAIL/$API_DOMAIN" /root/nginx-backups/"$API_DOMAIN.$(date +%s)".bak || true
  cat > "$NGX_AVAIL/$API_DOMAIN" <<EOL
server {
    listen 80;
    server_name $API_DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOL
  log "Wrote HTTP config for $API_DOMAIN"
fi

ln -sf "$NGX_AVAIL/$FRONTEND_DOMAIN" "$NGX_ENABLED/$FRONTEND_DOMAIN"
ln -sf "$NGX_AVAIL/$API_DOMAIN" "$NGX_ENABLED/$API_DOMAIN"
nginx -t && systemctl reload nginx

# ==== 5. CERTBOT ====
if [ "$AUTO_CERTS" = "true" ] && [ -x "$CERTBOT" ]; then
  log "Checking SSL setup..."

  # Check if nginx has listen 443 blocks
  if ! grep -q "listen 443" "$NGX_AVAIL/$FRONTEND_DOMAIN" 2>/dev/null; then
    log "No SSL block found for $FRONTEND_DOMAIN — running certbot..."
    "$CERTBOT" --nginx --non-interactive --agree-tos -m "$LE_EMAIL" -d "$FRONTEND_DOMAIN" -d "www.$FRONTEND_DOMAIN" || log "certbot failed for $FRONTEND_DOMAIN"
  else
    log "SSL block already present for $FRONTEND_DOMAIN"
  fi

  if ! grep -q "listen 443" "$NGX_AVAIL/$API_DOMAIN" 2>/dev/null; then
    log "No SSL block found for $API_DOMAIN — running certbot..."
    "$CERTBOT" --nginx --non-interactive --agree-tos -m "$LE_EMAIL" -d "$API_DOMAIN" || log "certbot failed for $API_DOMAIN"
  else
    log "SSL block already present for $API_DOMAIN"
  fi

  nginx -t && systemctl reload nginx
else
  log "Skipping certbot (missing binary or AUTO_CERTS disabled)"
fi

log "✅ Done! HTTPS check complete."