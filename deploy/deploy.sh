#!/usr/bin/env bash
# ============================================================================
# Sky APX — Deploy script
# Used by CI/CD (GitHub Actions) and manual SSH deploys.
#
# Usage (from project root on EC2):
#   bash deploy/deploy.sh
#
# What it does:
#   1. Pull latest code from git
#   2. Install deps (production only)
#   3. Apply DB migrations + seed
#   4. Build the application
#   5. Restart the systemd service
# ============================================================================
set -euo pipefail

APP_DIR="/opt/skyapx/app"
SERVICE_NAME="skyapx"

log() { echo -e "\033[1;36m[deploy]\033[0m $*"; }

cd "$APP_DIR"

# --- 1. Pull latest ---
log "Pulling latest code…"
git fetch origin main
git reset --hard origin/main

# --- 2. Install deps ---
log "Installing production dependencies…"
npm install --omit=dev

# --- 3. DB migrations ---
log "Applying database migrations…"
npm run db:setup || log "⚠ db:setup failed (is DATABASE_URL set?) — continuing with existing schema"

# --- 4. Build ---
log "Building application…"
npm run build

# --- 5. Restart ---
log "Restarting $SERVICE_NAME…"
sudo systemctl restart "$SERVICE_NAME"

# --- 6. Health check ---
log "Waiting for server to start…"
sleep 3
if curl -sf http://127.0.0.1:3000/ > /dev/null 2>&1; then
  log "✅ Deploy successful — server is healthy"
else
  log "⚠ Health check failed — check: journalctl -u $SERVICE_NAME -n 50"
  sudo systemctl status "$SERVICE_NAME" --no-pager
  exit 1
fi