#!/usr/bin/env bash
# Run on a fresh Ubuntu 22.04/24.04 DigitalOcean Droplet (as root or with sudo).
set -euo pipefail

echo "==> Installing Docker..."
apt-get update -qq
apt-get install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -qq
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "==> Docker installed."
docker --version
docker compose version

echo ""
echo "Next steps:"
echo "  1. Clone your repo:  git clone https://github.com/YOUR_USER/PhantomX.git && cd PhantomX"
echo "  2. Configure env:    cp deploy/.env.prod.example .env.prod && nano .env.prod"
echo "  3. Start app:        docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build"
echo "  4. Open firewall:    ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable"
echo "  5. Visit:            http://YOUR_DROPLET_IP  (login: admin / admin123)"
