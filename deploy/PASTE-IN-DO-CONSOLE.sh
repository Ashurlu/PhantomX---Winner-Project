# Paste this ENTIRE block into DigitalOcean Droplet Console
# (Droplet page → Access → Launch Droplet Console)

bash <<'ENDSCRIPT'
set -euo pipefail
IP="YOUR_SERVER_IP"

echo "==> Docker..."
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh

echo "==> Clone..."
APP=/root/PhantomX
if [ -d "$APP/.git" ]; then
  cd "$APP" && git pull --ff-only || true
else
  git clone https://github.com/Ashurlu/PhantomX.git "$APP"
  cd "$APP"
  git checkout capstone-platform 2>/dev/null || git checkout main 2>/dev/null || true
fi
cd "$APP"

echo "==> Production config..."
JWT="$(openssl rand -hex 32)"
cat > .env.prod <<EOF
JWT_SECRET=${JWT}
PUBLIC_URL=http://${IP}
DATA_SOURCE=mock
HTTP_PORT=80
EOF

cat > docker-compose.prod.yml <<'EOF'
services:
  backend:
    build: ./backend
    environment:
      APP_NAME: SENTRIX
      DATA_SOURCE: mock
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGINS: ${PUBLIC_URL}
      PHANTOMX_DB_PATH: /app/data/phantomx.db
    volumes:
      - sentrix_data:/app/data
    expose:
      - "8000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health')"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_BASE: ""
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  sentrix_data:
EOF

cat > frontend/nginx.conf <<'EOF'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;
  client_max_body_size 4m;
  location /api/ {
    proxy_pass http://backend:8000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  location / {
    try_files $uri $uri/ /index.html;
  }
}
EOF

grep -q PHANTOMX_DB_PATH backend/Dockerfile || cat >> backend/Dockerfile <<'EOF'

ENV PHANTOMX_DB_PATH=/app/data/phantomx.db
RUN mkdir -p /app/data
EOF

ufw allow OpenSSH 2>/dev/null || true
ufw allow 80 2>/dev/null || true
ufw --force enable 2>/dev/null || true

echo "==> Build (3-5 min)..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

for i in $(seq 1 36); do
  curl -fsS http://127.0.0.1/api/v1/health >/dev/null 2>&1 && break
  sleep 5
done

echo ""
echo "============================================"
echo "  LIVE:  http://${IP}"
echo "  Login: admin / admin123"
echo "============================================"
ENDSCRIPT
