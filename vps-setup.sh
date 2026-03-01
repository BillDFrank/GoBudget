#!/bin/bash

# GoBudget VPS Setup Script
# Usage: DOMAIN=your.domain.tld DEPLOY_USER=gobudget ./vps-setup.sh

set -euo pipefail

DOMAIN=${DOMAIN:-gobudget.duckdns.org}
DEPLOY_USER=${DEPLOY_USER:-gobudget}
PROJECT_DIR=${PROJECT_DIR:-/home/${DEPLOY_USER}/GoBudget}

echo "🚀 Setting up GoBudget VPS for domain ${DOMAIN}, deploy user ${DEPLOY_USER}..."

# Ensure running as root (will re-run with sudo if not)
if [ "$EUID" -ne 0 ]; then
  echo "This script needs sudo privileges. Re-running with sudo..."
  exec sudo bash "$0" "$@"
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "📦 Installing required packages (curl git nginx certbot ufw)..."
apt install -y curl git nginx certbot python3-certbot-nginx ufw software-properties-common

# Install Docker (if not present)
if ! command -v docker >/dev/null 2>&1; then
  echo "🐳 Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
fi

# Add deploy user to docker group later (user may not exist yet)

# Install Docker Compose (standalone) if neither docker compose nor docker-compose exists
if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
  echo "🔧 Installing Docker Compose..."
  curl -sL "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
fi

# Create deploy user if it doesn't exist
if ! id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
  echo "👤 Creating deploy user ${DEPLOY_USER}..."
  adduser --disabled-password --gecos "" "${DEPLOY_USER}"
  usermod -aG sudo "${DEPLOY_USER}" || true
fi

# Ensure deploy user is in docker group
usermod -aG docker "${DEPLOY_USER}" || true

# Create project directory and set ownership
echo "📁 Creating project directory ${PROJECT_DIR}..."
mkdir -p "${PROJECT_DIR}"
chown -R "${DEPLOY_USER}":"${DEPLOY_USER}" "${PROJECT_DIR}"

# Create external Docker networks if they don't exist
echo "🌐 Creating Docker networks..."
docker network create portfolio_default 2>/dev/null || true
docker network create mlflow-net 2>/dev/null || true

# Configure nginx site
echo "🔧 Configuring nginx for ${DOMAIN}..."
NGINX_CONF="/etc/nginx/sites-available/gobudget"
cat > "${NGINX_CONF}" <<'EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Replace placeholder with actual domain
sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" "${NGINX_CONF}"
ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/gobudget

# Test and reload nginx
nginx -t && systemctl reload nginx || true

# Setup UFW firewall
echo "🔒 Configuring UFW firewall..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable || true

# Create systemd service to start compose on boot
SERVICE_FILE="/etc/systemd/system/gobudget.service"
cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=GoBudget Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${PROJECT_DIR}
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable gobudget.service || true

# Final notes
cat <<EOF

✅ VPS setup complete!

Project directory: ${PROJECT_DIR}
Deploy user: ${DEPLOY_USER}
Nginx site: /etc/nginx/sites-available/gobudget

Next manual steps:
  1) Add your SSH public key to /home/${DEPLOY_USER}/.ssh/authorized_keys (or use your preferred user)
  2) Point your domain DNS to the VPS IP (e.g., ${DOMAIN})
  3) Obtain TLS certs: sudo certbot --nginx -d ${DOMAIN}
  4) Run the provided deployment (GitHub Actions will copy files and start services), or run locally:
       cd ${PROJECT_DIR} && /usr/local/bin/docker-compose pull || true && /usr/local/bin/docker-compose build --no-cache && /usr/local/bin/docker-compose up -d

Note: You may need to log out and back in for group changes (docker) to take effect.

EOF
