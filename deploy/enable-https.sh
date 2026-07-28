#!/usr/bin/env bash
# Put the droplet behind Caddy so the API is reachable over HTTPS.
#
# The Vercel frontend is served over HTTPS, so it cannot proxy to a plain-HTTP
# backend without sending tokens across the internet in the clear. Caddy
# terminates TLS with a Let's Encrypt certificate and reverse-proxies to the
# existing frontend/backend containers.
#
# Uses sslip.io, which resolves <dashed-ip>.sslip.io to that IP with no DNS
# account or record to manage.
#
# Run on the droplet as root:
#   bash /root/PhantomX/deploy/enable-https.sh

set -euo pipefail

IP="${IP:-YOUR_SERVER_IP}"
DOMAIN="${DOMAIN:-${IP//./-}.sslip.io}"
ACME_EMAIL="${ACME_EMAIL:-qarayevmurad949@gmail.com}"
APP="${APP:-/root/PhantomX}"

cd "$APP"

echo "==> Checking that $DOMAIN resolves to $IP ..."
resolved="$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1 || true)"
if [ "$resolved" != "$IP" ]; then
  echo "ERROR: $DOMAIN resolves to '${resolved:-nothing}', expected $IP."
  echo "Aborting before Let's Encrypt sees a failing challenge and rate-limits us."
  exit 1
fi
echo "    ok"

echo "==> Updating .env.prod (JWT_SECRET is left alone so sessions survive) ..."
touch .env.prod
sed -i '/^PUBLIC_URL=/d;/^DOMAIN=/d;/^ACME_EMAIL=/d' .env.prod
cat >> .env.prod <<EOF
PUBLIC_URL=https://${DOMAIN}
DOMAIN=${DOMAIN}
ACME_EMAIL=${ACME_EMAIL}
EOF

echo "==> Writing deploy/Caddyfile ..."
mkdir -p deploy
cat > deploy/Caddyfile <<'EOF'
{$DOMAIN} {
	email {$ACME_EMAIL}
	encode gzip

	handle /api/* {
		reverse_proxy backend:8000
	}

	handle {
		reverse_proxy frontend:80
	}
}
EOF

# Caddy needs port 80 for the ACME HTTP challenge, so the frontend has to stop
# publishing it. Everything reaches the frontend through Caddy from now on.
echo "==> Writing docker-compose.https.override.yml ..."
cat > docker-compose.https.override.yml <<'EOF'
services:
  frontend:
    ports: []

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    environment:
      DOMAIN: ${DOMAIN}
      ACME_EMAIL: ${ACME_EMAIL}
    volumes:
      - ./deploy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  caddy_data:
  caddy_config:
EOF

ufw allow 443 2>/dev/null || true

echo "==> Bringing the stack up (2-4 min on first run) ..."
docker compose -f docker-compose.prod.yml -f docker-compose.https.override.yml \
  --env-file .env.prod up -d --build

echo "==> Waiting for the Let's Encrypt certificate ..."
for _ in $(seq 1 36); do
  if curl -fsS "https://${DOMAIN}/api/v1/health" >/dev/null 2>&1; then
    echo
    echo "============================================"
    echo "  READY:  https://${DOMAIN}"
    echo "============================================"
    exit 0
  fi
  sleep 5
done

echo
echo "Not up yet. Check Caddy:"
echo "  cd $APP && docker compose -f docker-compose.prod.yml -f docker-compose.https.override.yml logs caddy"
exit 1
