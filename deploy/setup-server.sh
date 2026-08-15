#!/usr/bin/env bash
# ============================================================================
# Sky APX — First-time server provisioning (Ubuntu 22.04/24.04 on EC2 free tier)
#
# Run as root or with sudo:
#   sudo bash deploy/setup-server.sh yourdomain.com
#
# What it does:
#   1. Creates a non-root `deploy` user
#   2. Installs Node 22 LTS, PM2, Caddy, MySQL 8
#   3. Configures the MySQL database
#   4. Sets up Caddy as reverse proxy + auto SSL
#   5. Creates a systemd service for Sky APX
#   6. Deploys the app from /opt/skyapx/app
# ============================================================================
set -euo pipefail

DOMAIN="${1:-}"
APP_DIR="/opt/skyapx/app"
DEPLOY_USER="deploy"
DB_NAME="skyapx"
MYSQL_ROOT_PASS="$(openssl rand -hex 16)"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log() { echo -e "\033[1;36m[skyapx]\033[0m $*"; }
fail() { echo -e "\033[1;31m[error]\033[0m $*" >&2; exit 1; }

check_root() {
  [[ $EUID -eq 0 ]] || fail "Run as root: sudo bash deploy/setup-server.sh yourdomain.com"
}

check_domain() {
  [[ -n "$DOMAIN" ]] || fail "Usage: sudo bash deploy/setup-server.sh <yourdomain.com>"
}

# ---------------------------------------------------------------------------
# 1. System updates + base packages
# ---------------------------------------------------------------------------
install_base() {
  log "Updating package lists..."
  apt-get update -qq
  apt-get install -y -qq curl git build-essential ufw gnupg debian-keyring debian-archive-keyring apt-transport-https

  log "Installing Node 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs

  log "Installing PM2..."
  npm install -g pm2
}

# ---------------------------------------------------------------------------
# 2. Caddy (automatic HTTPS)
# ---------------------------------------------------------------------------
install_caddy() {
  log "Installing Caddy..."
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/setup.deb.sh' | bash -
  apt-get install -y -qq caddy

  systemctl enable caddy
}

# ---------------------------------------------------------------------------
# 3. MySQL 8
# ---------------------------------------------------------------------------
install_mysql() {
  log "Installing MySQL 8..."
  apt-get install -y -qq mysql-server

  systemctl enable mysql
  systemctl start mysql

  log "Securing MySQL..."

  # Read existing password from .env if it exists
  EXISTING_PASS=""
  if [[ -f /opt/skyapx/.env ]]; then
    EXISTING_PASS=$(grep DATABASE_URL /opt/skyapx/.env 2>/dev/null | sed 's/.*:\([^@]*\)@.*/\1/' || true)
  fi

  # Try connecting without password first (fresh install)
  if mysql -u root -e "SELECT 1" &>/dev/null; then
    mysql -u root <<-EOSQL
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '$MYSQL_ROOT_PASS';
FLUSH PRIVILEGES;
EOSQL
  # Try with temppass123 (after manual reset)
  elif mysql -u root -ptemppass123 -e "SELECT 1" &>/dev/null; then
    mysql -u root -ptemppass123 <<-EOSQL
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '$MYSQL_ROOT_PASS';
FLUSH PRIVILEGES;
EOSQL
  # Try with existing password from .env
  elif [[ -n "$EXISTING_PASS" ]] && mysql -u root -p"$EXISTING_PASS" -e "SELECT 1" &>/dev/null; then
    mysql -u root -p"$EXISTING_PASS" <<-EOSQL
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '$MYSQL_ROOT_PASS';
FLUSH PRIVILEGES;
EOSQL
  else
    fail "Cannot connect to MySQL as root. Reset with: sudo mysqld_safe --skip-grant-tables"
  fi

  log "Creating database '$DB_NAME'..."
  mysql -u root -p"$MYSQL_ROOT_PASS" <<-EOSQL
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOSQL
}

# ---------------------------------------------------------------------------
# 4. Deploy user + app directory
# ---------------------------------------------------------------------------
setup_deploy_user() {
  if ! id "$DEPLOY_USER" &>/dev/null; then
    log "Creating user '$DEPLOY_USER'..."
    useradd -m -s /bin/bash "$DEPLOY_USER"
    # Add deploy user to caddy group for log access
    usermod -aG caddy "$DEPLOY_USER" 2>/dev/null || true
  fi

  mkdir -p "$APP_DIR"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" /opt/skyapx
}

# ---------------------------------------------------------------------------
# 5. Write .env
# ---------------------------------------------------------------------------
write_env() {
  log "Writing /opt/skyapx/.env..."
  cat > /opt/skyapx/.env <<ENVEOF
DATABASE_URL=mysql://root:${MYSQL_ROOT_PASS}@localhost:3306/${DB_NAME}
ADMIN_EMAIL=admin@skyapx.com
ADMIN_NAME="Sky APX Admin"
ADMIN_PASSWORD=admin123
HOST=0.0.0.0
PORT=3000
PUBLIC_APP_URL=https://$DOMAIN
NODE_ENV=production

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=skyapx.in@gmail.com
SMTP_PASS=your-app-password-here
NOTIFICATION_EMAIL=kamaleshk085@gmail.com,iamkamalesh008@gmail.com
ENVEOF
  chmod 600 /opt/skyapx/.env
  chown "$DEPLOY_USER:$DEPLOY_USER" /opt/skyapx/.env
}

# ---------------------------------------------------------------------------
# 6. Build the app
# ---------------------------------------------------------------------------
build_app() {
  log "Building the application..."
  cd "$APP_DIR"
  sudo -u "$DEPLOY_USER" bash -c '
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    set -a && source /opt/skyapx/.env && set +a
    npm install --omit=dev
    npm run db:setup
    npm run build
  '
}

# ---------------------------------------------------------------------------
# 7. Systemd service for Sky APX
# ---------------------------------------------------------------------------
install_service() {
  log "Installing systemd service..."
  cat > /etc/systemd/system/skyapx.service <<SVCUNIT
[Unit]
Description=Sky APX Medical Coding Academy
After=network.target mysql.service

[Service]
Type=simple
User=$DEPLOY_USER
Group=$DEPLOY_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=/opt/skyapx/.env
Environment=NODE_ENV=production
Environment=HOST=0.0.0.0
Environment=PORT=3000
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=skyapx

[Install]
WantedBy=multi-user.target
SVCUNIT
  systemctl daemon-reload
  systemctl enable skyapx
  systemctl restart skyapx
  log "Service 'skyapx' started."
}

# ---------------------------------------------------------------------------
# 8. Caddy config
# ---------------------------------------------------------------------------
configure_caddy() {
  log "Configuring Caddy for $DOMAIN..."

  # Create log directory
  mkdir -p /var/log/caddy

  # Copy Caddyfile and substitute domain
  sed "s/DOMAIN_NAME/$DOMAIN/g" \
    "$APP_DIR/deploy/Caddyfile" > /etc/caddy/Caddyfile

  # Test config
  caddy validate --config /etc/caddy/Caddyfile || fail "Caddy config test failed"

  systemctl restart caddy
  log "Caddy started — auto-provisioning SSL for $DOMAIN..."
}

# ---------------------------------------------------------------------------
# 9. Firewall
# ---------------------------------------------------------------------------
configure_firewall() {
  log "Configuring UFW..."
  ufw allow OpenSSH
  ufw allow 'Caddy Full'
  ufw --force enable
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
check_root
check_domain
log "=========================================="
log "  Sky APX — Server Setup"
log "  Domain: $DOMAIN"
log "=========================================="

install_base
install_caddy
install_mysql
setup_deploy_user
write_env
build_app
install_service
configure_caddy
configure_firewall

log "=========================================="
log "  Setup complete!"
log "  App:      https://$DOMAIN"
log "  MySQL:    root / $MYSQL_ROOT_PASS"
log "  Admin:    admin@skyapx.com / admin123"
log "  Service:  systemctl status skyapx"
log "  Caddy:    systemctl status caddy"
log "  Logs:     journalctl -u skyapx -f"
log "=========================================="
echo ""
echo "Save this MySQL root password somewhere safe: $MYSQL_ROOT_PASS"
