# Railtracker — Monorepo
# Indian Railways Multi-Hop Pathfinding & Live Tracking Platform

## Project Structure
```
RAIL TRACKER/
├── backend/      # Go microservice (port :8080)
└── frontend/     # Next.js App Router (port :3000)
```

## Local Development
```bash
# Backend
cd backend
go run main.go

# Frontend
cd frontend
npm run dev
```

## Deployment
- **Frontend**: Vercel (auto-deploys from this repo)
- **Backend**: Railway (auto-deploys from /backend subfolder)
- **Database**: Neon PostgreSQL (cloud-hosted)
