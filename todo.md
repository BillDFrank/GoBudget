Project Context (unchanged except infra)

• Frontend: Next.js (static export or Node server)
• Backend: FastAPI + SQLAlchemy + PostgreSQL
• Auth: JWT access & refresh tokens in secure, same-site, HttpOnly cookies
• OS: Ubuntu 22.04 LTS (root access)
• Core tools: Docker + Docker-Compose, Nginx (reverse-proxy + TLS), systemd services
• Backups: nightly pg_dump + rclone to any S3-compatible storage (free tier)
Folder Layout (monorepo on VPS)

Copy
/home/ubuntu/family-finances/
├── frontend/ # Next.js source
├── backend/ # FastAPI source
├── docker-compose.yml
├── .env # all secrets
├── nginx/ # site.conf & snippets
├── scripts/ # backup.sh, renew-tls.sh
└── logs/
Global Todo List

Legend: [S1] Sprint 1, etc.
All tasks are incremental; only infra & commands changed. 0. VPS Provisioning [S1]

[ ] Spin up VPS (1 vCPU, 1 GB RAM, 25 GB SSD).
[ ] Add non-root user ubuntu, enable SSH key login, disable password.
[ ] Update OS: apt update && apt upgrade -y.
[ ] Install: docker, docker-compose-plugin, nginx, certbot, git, make.

1. DNS & TLS [S1]

[ ] Point familyfinances.example.com → VPS IPv4.
[ ] sudo certbot --nginx -d familyfinances.example.com -d api.familyfinances.example.com (auto-renew). 2. Docker Compose Stack [S1]

/home/ubuntu/family-finances/docker-compose.yml:
yaml

Copy
services:
  backend:
    build: ./backend
    restart: unless-stopped
    env_file: .env
    expose: ["8000"]

  frontend:
    build: ./frontend
    restart: unless-stopped
    expose: ["3000"]

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx:/etc/nginx/conf.d
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend
[x] Add .env to .gitignore, template .env.example. 3. Nginx Reverse-Proxy Config [S1]

nginx/site.conf:

Copy
server {
listen 443 ssl http2;
server_name familyfinances.example.com;

    ssl_certificate     /etc/letsencrypt/live/familyfinances.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/familyfinances.example.com/privkey.pem;

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
    }

}

server {
listen 443 ssl http2;
server_name api.familyfinances.example.com;

    ssl_certificate     /etc/letsencrypt/live/familyfinances.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/familyfinances.example.com/privkey.pem;

    location / {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

}
[x] Add HSTS, CSP, X-Frame-Options headers via snippets.
[ ] Test with curl -I https://api.familyfinances.example.com/docs. 4. Frontend Dockerfile [S1]

frontend/Dockerfile:
dockerfile

Copy
FROM node:20-alpine AS deps
WORKDIR /app
COPY package\*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node","server.js"]
[x] Enable Next.js output: "standalone" in next.config.js. 5. Backend Dockerfile [S1]

backend/Dockerfile:
dockerfile

Copy
FROM python:3.11-slim
WORKDIR /code
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY ./app ./app
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"] 6. PostgreSQL Setup [S1]

[ ] docker compose up -d db
[ ] Run alembic upgrade head inside backend container.
[ ] Seed demo data: docker compose exec backend python scripts/seed.py. 7. CI/CD (GitHub Actions → VPS) [S2]

[ ] Add self-hosted runner on VPS:
bash

Copy
mkdir actions-runner && cd actions-runner
curl -s https://api.github.com/repos/<org>/family-finances/actions/runners/registration-token... | ./config.sh --url ... --token ...
sudo ./svc.sh install && sudo ./svc.sh start
[ ] Workflow .github/workflows/deploy.yml:
lint & test
docker build images
docker compose down && docker compose up -d 8. Environment Variables [S2]

.env:

Copy
POSTGRES_HOST=your_postgres_host
POSTGRES_PORT=5432
POSTGRES_USER=finuser
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=finances
DATABASE_URL=postgresql+asyncpg://finuser:your_strong_password@your_postgres_host:5432/finances
JWT_SECRET=your_super_secret_jwt_key
COOKIE_DOMAIN=.familyfinances.example.com
NEXT_PUBLIC_API_URL=https://api.familyfinances.example.com 9. Security Hardening [S3]

[ ] Enable UFW: allow 22, 80, 443 only.
[ ] Fail2ban on SSH & nginx.
[ ] Run containers as non-root (use USER 1001).
[ ] nightly apt upgrade via unattended-upgrades.
[ ] Set up Snyk/Dependabot scanning. 10. Backup Strategy [S3]

[ ] scripts/backup.sh:
bash

Copy
#!/bin/bash
docker compose exec -T db pg_dump -U finuser finances | gzip > /home/ubuntu/backups/$(date +%F).sql.gz
rclone copy /home/ubuntu/backups remote:s3-bucket/finances
[ ] Add cron: 0 3 \* \* \* /home/ubuntu/scripts/backup.sh. 11. Performance & Scaling [S3]

[ ] Enable nginx gzip & brotli.
[ ] Set worker_processes auto; in nginx.conf.
[ ] Add Redis cache container later if needed (commented in compose).
[ ] Use systemd limits to cap container RAM/CPU. 12. Monitoring & Logs [S4]

[ ] docker compose logs -f → journald.
[ ] Install netdata (1-click free) or cadvisor + prometheus + grafana (optional).
[ ] UptimeRobot free ping every 5 min. 13. Final Release Checklist [S4]

[ ] All Cypress E2E pass on production URL.
[ ] Lighthouse ≥ 95 (performance, a11y, best-practices).
[ ] curl -I shows security headers.
[ ] Backup script executed successfully.
[ ] Tag v1.0.0, update changelog.
Sprint Plan (unchanged scope, updated infra tasks)

Table

Copy
Sprint Key Infra Tasks
S1 VPS setup, DNS, Docker compose, TLS, local seed.
S2 GitHub self-hosted runner, CI/CD pipeline, auth flow live.
S3 Security hardening, backups, performance tuning.
S4 Monitoring, load test 50 VUs, release v1.0.0.
Commands Cheat-Sheet

Copy

# Full deploy

git pull
docker compose build --no-cache
docker compose up -d
docker image prune -f

# Tail logs

docker compose logs -f backend

# Manual DB migration

docker compose exec backend alembic upgrade head
