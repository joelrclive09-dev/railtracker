# 🚀 Railtracker Production Deployment Guide

Railtracker is architected as a high-performance monorepo:
- **Backend**: Go (Golang) microservice with in-memory graph index & real-time REST API (Port `:8080`).
- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind CSS, Leaflet Google Satellite Radar) (Port `:3000`).
- **Database**: PostgreSQL (`railhop`) with 8,151 Indian Railways stations and 186,119 timetable rows.

---

## ⚡ Option 1: Instant Sharing via Cloudflare Tunnel or ngrok (No Cloud Setup Needed)
If you want to immediately send a public URL to someone on WhatsApp / email to test live on their mobile phone or PC right now:

### Using Cloudflare Tunnel (Free, No Sign-up Needed):
1. Download `cloudflared.exe` or install via winget:
   ```powershell
   winget install Cloudflare.cloudflared
   ```
2. Start an instant public HTTPS tunnel for the frontend:
   ```powershell
   cloudflared tunnel --url http://localhost:3000
   ```
3. Cloudflare will print a secure URL like `https://random-words.trycloudflare.com`. Anyone can open this link on their mobile or desktop browser!

### Using ngrok:
```powershell
ngrok http 3000
```

---

## 🐳 Option 2: 1-Click Local or VPS Docker Deployment
Both services are Dockerized with multi-stage production Dockerfiles.

1. Ensure Docker Desktop or Docker engine is running.
2. Launch both services with Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. Verify running containers:
   ```bash
   docker compose ps
   ```
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8080/healthz`

---

## ☁️ Option 3: Permanent Cloud Deployment (Vercel + Railway / Render)

### Step 1: Export Your Database (8,151 Stations & Schedules)
Export your local `railhop` database to a `.sql` file:
```powershell
pg_dump -U postgres -d railhop -F c -b -v -f railhop_dump.dump
# or plain SQL text dump:
pg_dump -U postgres -d railhop -f railhop_backup.sql
```

### Step 2: Deploy PostgreSQL on the Cloud
Create a free PostgreSQL database on **Neon.tech**, **Supabase**, or **Railway.app**:
- Once provisioned, copy the connection URL:
  `postgres://user:password@cloud-host:5432/railhop?sslmode=require`
- Restore your data:
  ```powershell
  psql "postgres://user:password@cloud-host:5432/railhop?sslmode=require" < railhop_backup.sql
  ```

### Step 3: Deploy the Go Backend (Railway or Render)
1. Push your repository to GitHub.
2. On **Railway.app** or **Render.com**:
   - Create a **New Web Service** pointing to the `./backend` directory (or select Dockerfile).
   - Set Environment Variables:
     - `DATABASE_URL`: `postgres://user:password@cloud-host:5432/railhop?sslmode=require`
     - `PORT`: `8080`
   - Deploy. You will receive a backend URL (e.g. `https://railtracker-backend.up.railway.app`).
   - Test by opening `https://railtracker-backend.up.railway.app/healthz`.

### Step 4: Deploy the Next.js Frontend (Vercel)
1. On **Vercel.com**:
   - Import your GitHub repository.
   - Set Root Directory: `frontend`
   - Set Environment Variable:
     - `NEXT_PUBLIC_API_URL`: `https://railtracker-backend.up.railway.app` (your deployed backend URL from Step 3)
   - Click **Deploy**.
2. Vercel will assign a production domain (e.g. `https://railtracker.vercel.app`).
3. You can now share this URL with anyone worldwide!

---

## 🛡️ Production Environment Variables Reference

| Variable | Description | Default (Local) | Production Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:0912@localhost:5432/railhop?sslmode=disable` | `postgres://admin:pass@db.example.com:5432/railhop?sslmode=require` |
| `PORT` | HTTP port for Go backend | `8080` | `8080` (or dynamically assigned by cloud host) |
| `NEXT_PUBLIC_API_URL` | Public backend URL for frontend client requests | `http://localhost:8080` | `https://railtracker-backend.up.railway.app` |

---

## 🧪 Healthcheck & Verification
- Backend status:
  `GET /healthz` -> `{"status": "ok", "stations": 8151, "trains": 11112, "hubs": 263}`
- Route finder:
  `GET /api/v1/routes/search?from=QLN&to=RMM`
- Real-time station radar:
  `GET /api/v1/stations/live-board?station=ALLP`
- Live train tracking:
  `GET /api/v1/trains/live?number=16128`
