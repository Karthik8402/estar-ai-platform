# eSTAR AI Platform

**21 CFR Part 11 Compliance — Multi-Agent AI Audit Trail System**

[![Deploy](https://github.com/Karthik8402/estar-ai-platform/actions/workflows/deploy.yml/badge.svg)](https://github.com/Karthik8402/estar-ai-platform/actions/workflows/deploy.yml)

> Built by **EnviroApps Inc.** — Intelligent audit trail monitoring, human error detection, and compliance reporting for pharmaceutical manufacturing environments.

---

## 🌐 Live Deployment

| Service | URL |
|---------|-----|
| 🖥️ **Landing Page** | [landing-page.ambitiousforest-7d7bdb17.southeastasia.azurecontainerapps.io](https://landing-page.ambitiousforest-7d7bdb17.southeastasia.azurecontainerapps.io) |
| 🔌 **Audit Trail API** | [audit-trail-service.ambitiousforest-7d7bdb17.southeastasia.azurecontainerapps.io](https://audit-trail-service.ambitiousforest-7d7bdb17.southeastasia.azurecontainerapps.io) |
| 📚 **API Docs (Swagger)** | [.../docs](https://audit-trail-service.ambitiousforest-7d7bdb17.southeastasia.azurecontainerapps.io/docs) |

---

## 🏗️ Architecture

```
estar-ai-platform/
├── landing-page/              # React 19 + Vite + TailwindCSS frontend
│   ├── src/
│   │   ├── config/            # API client & configuration
│   │   ├── hooks/             # Data-fetching hooks (TanStack Query)
│   │   ├── pages/             # Dashboard, Anomalies, Reports, Agents, Settings
│   │   └── components/        # Reusable UI components
│   ├── Dockerfile             # Multi-stage: Node build → Nginx serve
│   └── nginx.conf             # SPA routing + gzip compression
│
├── services/
│   └── audit-trail-service/   # FastAPI + PostgreSQL (Microservice 1)
│       ├── api/               # FastAPI app, routes, middleware
│       ├── agents/            # AI agents (scheduler, human error, integrity)
│       ├── db/                # SQLAlchemy models, seed data
│       ├── alembic/           # Database migrations
│       ├── config/            # Settings (pydantic-settings)
│       └── Dockerfile         # Python 3.11-slim image
│
├── shared/                    # Shared utilities & types
├── docs/                      # Architecture documentation
└── docker-compose_Version.yml # Local development setup
```

**Deployment Stack:**
- **Frontend Hosting:** Azure Container Apps (Southeast Asia)
- **Backend Hosting:** Azure Container Apps (Consumption plan)
- **Database:** Neon.tech (Managed PostgreSQL — free tier)
- **Container Registry:** GitHub Container Registry (`ghcr.io`)

---

## 🤖 AI Agents

| Agent | Purpose |
|-------|---------|
| **Human Error Detection** | Detects anomalous patterns in audit logs using ML scoring |
| **Log Integrity Verification** | Verifies cryptographic integrity of audit trail entries |
| **Compliance Reporter** | Generates 21 CFR Part 11 compliance reports automatically |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Docker Desktop
- Python 3.11+
- Node.js 20+

### 1. Clone the repository
```bash
git clone https://github.com/Karthik8402/estar-ai-platform.git
cd estar-ai-platform
```

### 2. Set up the backend
```bash
cd services/audit-trail-service
cp .env.example .env
# Fill in your DATABASE_URL and GEMINI_API_KEY in .env
pip install -r requirements.txt
python -m alembic upgrade head
python -m db.seed
uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Set up the frontend
```bash
cd landing-page
npm install
# API calls go to localhost:8001 by default
npm run dev
```

### 4. Or use Docker Compose (all services)
```bash
docker compose -f docker-compose_Version.yml up --build
```

---

## 🔑 Environment Variables

Copy `.env.example` and fill in real values. **Never commit `.env` files.**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `GEMINI_API_KEY` | Google Gemini API key for AI agents |
| `JWT_SECRET` | Secret key for JWT tokens |
| `AI_PROVIDER` | `gemini` or `openai` |
| `SERVICE_PORT` | Port to run the service on (default: `8001`) |

---

## ☁️ Deploying to Azure

See [`azure_deployment_guide.md`](./azure_deployment_guide.md) for the full deployment walkthrough.

**Quick CI/CD:** Push to the `main` branch — GitHub Actions will automatically build and deploy both services to Azure Container Apps.

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/summary` | Dashboard summary stats |
| `GET` | `/activity/recent` | Recent audit events |
| `GET` | `/reports/anomalies` | Detected anomalies |
| `GET` | `/reports/integrity` | Integrity check results |
| `GET` | `/agents/status` | AI agent status |
| `POST` | `/agents/{name}/start` | Start an AI agent |
| `POST` | `/agents/{name}/stop` | Stop an AI agent |

---

## 🛡️ Compliance

This system is designed to assist with **21 CFR Part 11** compliance:
- ✅ Audit trail immutability monitoring
- ✅ Human error detection and flagging
- ✅ Electronic signature validation logging
- ✅ Automated compliance report generation (ICH Q1A, ICH Q1E, GMP)

---

## 📄 License

MIT License — EnviroApps Inc. © 2026
