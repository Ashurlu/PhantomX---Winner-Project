# Deploy SENTRIX on DigitalOcean

This guide publishes the app on a **Droplet** (VPS) using Docker. One server serves the React UI and FastAPI API on the same URL.

## What you need

- DigitalOcean account
- This repo on GitHub (push your code first)
- Optional: a domain name pointed at the droplet (for HTTPS)

## Step 1 — Create a Droplet

1. Log in to [DigitalOcean](https://cloud.digitalocean.com/).
2. **Create → Droplets**
3. Choose:
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → **$6/mo** (1 GB RAM) is enough for demos; use **$12/mo** (2 GB) if 3D pages feel slow
   - **Region:** closest to your users
   - **Authentication:** SSH key (recommended) or password
4. Create the droplet and note the **public IP** (e.g. `164.92.xxx.xxx`).

## Step 2 — Open firewall ports

In the droplet → **Networking → Firewall** (or during create):

| Port | Purpose        |
|------|----------------|
| 22   | SSH            |
| 80   | HTTP (the app) |
| 443  | HTTPS (optional) |

## Step 3 — Push code to GitHub

On your PC, commit and push this project to GitHub (if not already):

```bash
git add .
git commit -m "Add DigitalOcean production deploy"
git push origin main
```

## Step 4 — SSH into the droplet

```bash
ssh root@YOUR_DROPLET_IP
```

Install Docker (or run the helper script after cloning):

```bash
curl -fsSL https://get.docker.com | sh
```

## Step 5 — Clone and configure

```bash
git clone https://github.com/YOUR_GITHUB_USER/PhantomX.git
cd PhantomX
git checkout capstone-platform

cp deploy/.env.prod.example .env.prod
nano .env.prod
```

Edit `.env.prod`:

```env
JWT_SECRET=paste-output-of-openssl-rand-hex-32
PUBLIC_URL=http://YOUR_DROPLET_IP
DATA_SOURCE=mock
HTTP_PORT=80
```

Generate a secret on the droplet:

```bash
openssl rand -hex 32
```

## Step 6 — Build and run

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Wait 2–3 minutes for the first build. Check status:

```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost/api/v1/health
```

## Step 7 — Open the site

In your browser:

**http://YOUR_DROPLET_IP**

Login:

| User    | Password    |
|---------|-------------|
| admin   | admin123    |
| analyst | analyst123  |

Change the admin password after going live (Admin → Users).

---

## HTTPS (recommended)

1. Pick a hostname that resolves to the droplet IP. Either add a DNS **A
   record** for a domain you own, or use sslip.io, which needs no DNS account:
   `YOUR_SERVER_IP` → `64-226-121-100.sslip.io`.
2. Update `.env.prod`. `HTTP_PORT` matters: Caddy needs 80 for the ACME HTTP
   challenge, so the frontend has to move off it.

```env
DOMAIN=64-226-121-100.sslip.io
ACME_EMAIL=you@example.com
PUBLIC_URL=https://64-226-121-100.sslip.io
HTTP_PORT=127.0.0.1:8080
```

3. Bring the stack up with the `https` profile:

```bash
docker compose -f docker-compose.prod.yml -f deploy/docker-compose.https.yml \
  --env-file .env.prod --profile https up -d
```

Caddy then listens on 80/443, redirects HTTP to HTTPS, and proxies `/api/*` to
the backend and everything else to the frontend. The certificate renews itself.

Verify before assuming it worked — Caddy stays up even when certificate orders
are failing:

```bash
curl -fsS https://$DOMAIN/api/v1/health && docker logs sentrix-caddy | tail -20
```

---

## OpenRouter / API keys

After deploy, sign in as **admin** → **Admin Console → API Keys** and set your OpenRouter key and model (`openai/gpt-4o-mini`). Keys stay on the server only.

---

## Updates

SSH to the droplet, pull, rebuild:

```bash
cd PhantomX
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

User accounts and settings persist in the Docker volume `sentrix_data`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page | `docker compose ... logs frontend` |
| Login fails | `docker compose ... logs backend` — check `JWT_SECRET` is set |
| 502 on API | `docker compose ... ps` — backend must be healthy |
| **Backend unhealthy** | `docker compose ... logs backend` — often `ModuleNotFoundError: investigation_pipeline_defaults` if deploy used an old clone. Pull latest `capstone-platform`, rebuild. Ensure `.env.prod` has `JWT_SECRET` set. |
| **Web pentest module not found** | `pentest-agent/` was not in your GitHub repo. Commit it (see below), pull on the droplet, rebuild |
| Out of memory | Resize droplet to 2 GB RAM |

### Web pentest: "module not found" on deploy

The Web Assessment tab needs the **`pentest-agent/`** folder at the project root. It must be **committed to git** (not only on your laptop).

On your PC:

```bash
# If pentest-agent was a separate git clone, remove its nested .git first:
rm -rf pentest-agent/.git   # Linux/macOS
# Windows: Remove-Item -Recurse -Force pentest-agent\.git

git add pentest-agent/
git commit -m "Vendor pentest-agent for production deploy"
git push
```

On the droplet:

```bash
cd PhantomX   # or your clone path
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

If the build fails with `BUILD ERROR: pentest-agent/ is missing`, the folder still is not in the repo — push it from your PC first.

---

## Alternative: DigitalOcean App Platform

App Platform can host Docker images but **SQLite resets on redeploy** unless you attach a volume. For a stable demo, the **Droplet + Docker Compose** path above is simpler.
