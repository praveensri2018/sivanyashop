#!/bin/bash
set -e

# ========================
# CONFIG
# ========================
FRONTEND_DIR=/srv/apps/sivanyashop/frontend/sivanyashop
BACKEND_DIR=/srv/apps/sivanyashop/backend
FRONTEND_DOMAIN=sivanyatrendstops.com
API_DOMAIN=api.sivanyatrendstops.com

# ========================
# 1️⃣ Update code from git
# ========================
echo "Updating frontend and backend from git..."
cd $FRONTEND_DIR
git pull
cd $BACKEND_DIR
git pull

# ========================
# 2️⃣ Build Angular frontend
# ========================
echo "Building Angular frontend..."
cd $FRONTEND_DIR
npm install --no-audit --no-fund
npm run build -- --configuration production

# ========================
# 3️⃣ Start backend with PM2
# ========================
echo "Starting backend..."
cd $BACKEND_DIR
npm install --no-audit --no-fund
pm2 restart sivanyatrends-backend --update-env || pm2 start index.js --name sivanyatrends-backend
pm2 save

# ========================
# 4️⃣ Configure Nginx
# ========================

# Frontend server block
cat > /etc/nginx/sites-available/$FRONTEND_DOMAIN <<EOL
server {
    listen 80;
    server_name $FRONTEND_DOMAIN www.$FRONTEND_DOMAIN;

    root $FRONTEND_DIR/dist/sivanyashop/browser;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }
}
EOL

# API server block
cat > /etc/nginx/sites-available/$API_DOMAIN <<EOL
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

# Enable sites
ln -sf /etc/nginx/sites-available/$FRONTEND_DOMAIN /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/$API_DOMAIN /etc/nginx/sites-enabled/

# Test and reload Nginx
nginx -t
systemctl reload nginx

echo "✅ Deployment finished!"
echo "Frontend: http://$FRONTEND_DOMAIN"
echo "API: http://$API_DOMAIN/health"
