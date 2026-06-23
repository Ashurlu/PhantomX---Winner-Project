#!/usr/bin/env bash
# One-shot install for droplet YOUR_SERVER_IP — run as root on a fresh Ubuntu droplet.
set -euo pipefail

PUBLIC_IP="${PUBLIC_IP:-YOUR_SERVER_IP}"
REPO="${REPO:-https://github.com/Ashurlu/PhantomX.git}"
BRANCH="${BRANCH:-capstone-platform}"
APP_DIR="${APP_DIR:-/root/PhantomX}"

echo "==> Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Cloning app..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH" 2>/dev/null || git checkout main 2>/dev/null || true
  git pull --ff-only || true
else
  rm -rf "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR" 2>/dev/null \
    || git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> Writing .env.prod..."
JWT_SECRET="$(openssl rand -hex 32)"
cat > .env.prod <<EOF
JWT_SECRET=${JWT_SECRET}
PUBLIC_URL=http://${PUBLIC_IP}
DATA_SOURCE=mock
HTTP_PORT=80
EOF

echo "==> Opening firewall..."
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH || true
  ufw allow 80 || true
  ufw allow 443 || true
  ufw --force enable || true
fi

echo "==> Building and starting containers (3–5 min)..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

echo "==> Waiting for health..."
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1/api/v1/health" >/dev/null 2>&1; then
    echo ""
    echo "============================================"
    echo "  LIVE:  http://${PUBLIC_IP}"
    echo "  Login: admin / admin123"
    echo "============================================"
    exit 0
  fi
  sleep 5
done

echo "Health check timed out. Logs:"
docker compose -f docker-compose.prod.yml logs --tail=80
exit 1
