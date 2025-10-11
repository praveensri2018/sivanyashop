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

log() { echo "[$(date '+%F %T')] $*"; }

# ==== 1. GIT ====
log "Git pull..."
cd "$FRONTEND_DIR" && git pull
cd "$BACKEND_DIR" && git pull

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

# ==== 4. NGINX ====
log "Updating nginx configs..."
cat > "$NGX_AVAIL/$FRONTEND_DOMAIN" <<EOL
server {
    listen 80;
    server_name $FRONTEND_DOMAIN www.$FRONTEND_DOMAIN;
    root $FRONTEND_DIR/dist/sivanyashop/browser;
    index index.html;
    location / { try_files \$uri /index.html; }
}
EOL

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

ln -sf "$NGX_AVAIL/$FRONTEND_DOMAIN" "$NGX_ENABLED/$FRONTEND_DOMAIN"
ln -sf "$NGX_AVAIL/$API_DOMAIN" "$NGX_ENABLED/$API_DOMAIN"
nginx -t && systemctl reload nginx

# ==== 5. CERTBOT ====
if [ "$AUTO_CERTS" = "true" ] && command -v certbot >/dev/null; then
  if [ ! -d "/etc/letsencrypt/live/$FRONTEND_DOMAIN" ]; then
    log "Creating cert for $FRONTEND_DOMAIN..."
    certbot --nginx --non-interactive --agree-tos -m "$LE_EMAIL" -d "$FRONTEND_DOMAIN" -d "www.$FRONTEND_DOMAIN" || log "Certbot failed frontend"
  else
    log "Cert exists for $FRONTEND_DOMAIN"
  fi

  if [ ! -d "/etc/letsencrypt/live/$API_DOMAIN" ]; then
    log "Creating cert for $API_DOMAIN..."
    certbot --nginx --non-interactive --agree-tos -m "$LE_EMAIL" -d "$API_DOMAIN" || log "Certbot failed API"
  else
    log "Cert exists for $API_DOMAIN"
  fi

  nginx -t && systemctl reload nginx
else
  log "Skipping certbot"
fi

# ==== DONE ====
log "✅ Done! Frontend: http://$FRONTEND_DOMAIN  API: http://$API_DOMAIN/health"
