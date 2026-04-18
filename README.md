<p align="center">
  <img src="landing-page/public/estar.png" alt="eSTAR AI Platform Logo" width="120" />
</p>

<h1 align="center">eSTAR AI Platform</h1>

<p align="center">
  <strong>Electronic Stability Testing, Analyses & Reporting</strong><br/>
  Multi-Agent AI System for 21 CFR Part 11 Compliance
</p>

<p align="center">
  <a href="https://github.com/Karthik8402/estar-ai-platform/actions/workflows/deploy.yml">
    <img src="https://github.com/Karthik8402/estar-ai-platform/actions/workflows/deploy.yml/badge.svg" alt="Deploy Status" />
  </a>
  <img src="https://img.shields.io/badge/python-3.11+-blue?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/fastapi-0.110+-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

## Overview

**eSTAR AI Platform** is an enterprise-grade, AI-powered audit trail monitoring system built for pharmaceutical manufacturing environments. It ensures compliance with **21 CFR Part 11**, **ICH Q1A/Q1E**, and **GMP** regulations through three specialized AI agents that continuously analyze, verify, and report on electronic records and audit trails.

> Built by **EnviroApps Inc.** — Automating pharmaceutical compliance with Agentic AI.

### Key Capabilities

- 🔍 **Human Error Detection** — ML-powered anomaly detection across audit trail logs
- 🛡️ **Log Integrity Verification** — Cryptographic and rule-based integrity checks
- 📋 **Automated Compliance Reporting** — AI-generated 21 CFR Part 11 compliance reports
- ⚙️ **Configurable Thresholds** — Tunable detection parameters per regulatory requirement
- 📊 **Real-time Dashboard** — Live monitoring with service health, activity feeds, and metrics

---

## Live Deployment

| Service | URL |
|---------|-----|
| 🖥️ **Landing Page** | [landing-page.ambitiousforest-7d7bdb17.southeastasia.azurecontainerapps.io](https://landing-page.ambitiousforest-7d7bdb17.southeastasia.azurecontainerapps.io) |
| 🔌 **Audit Trail API** | [audit-trail-service.ambitiousforest-7d7bdb17.southeastasia.azurecontainerapps.io](https://audit-trail-service.ambitiousforest-7d7bdb17.southeastasia.azurecontainerapps.io) |
| 📚 **API Docs (Swagger)** | [audit-trail-service.../docs](https://audit-trail-service.ambitiousforest-7d7bdb17.southeastasia.azurecontainerapps.io/docs) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Azure Container Apps                      │
│  ┌────────────────────┐        ┌────────────────────────────┐   │
│  │   Landing Page      │        │   Audit Trail Service       │   │
│  │   (React 19 + Vite) │──API──▶│   (FastAPI + Python 3.11)  │   │
│  │   Nginx · Port 3000 │        │   Uvicorn · Port 8001      │   │
│  └────────────────────┘        └──────────┬─────────────────┘   │
│                                            │                     │
│  ┌─ Future ───────────┐                   │                     │
│  │ Stability Report    │                   │                     │
│  │ OOT Alerting        │                   │                     │
│  │ Data Entry Agent    │                   │                     │
│  └────────────────────┘                   │                     │
└────────────────────────────────────────────┼─────────────────────┘
                                             │
                                    ┌────────▼────────┐
                                    │   Neon.tech      │
                                    │   PostgreSQL 15  │
                                    │   (Managed DB)   │
                                    └─────────────────┘
                                             │
                                    ┌────────▼────────┐
                                    │   Google Gemini  │
                                    │   (AI Provider)  │
                                    └─────────────────┘
```

### Project Structure

```
estar-ai-platform/
├── landing-page/                    # React 19 + Vite + TailwindCSS v4
│   ├── src/
│   │   ├── pages/                   # LandingPage, AuditDashboard
│   │   ├── components/
│   │   │   ├── audit/               # AuditOverview, AnomalyTable, IntegrityView,
│   │   │   │                        # ReportViewer, AgentControl, AuditSettings
│   │   │   ├── layout/              # PlatformHeader, PlatformFooter
│   │   │   ├── services/            # ServiceCard, ServiceCardGrid
│   │   │   ├── overview/            # PlatformOverview (compliance bar)
│   │   │   ├── feed/                # GlobalActivityFeed
│   │   │   └── shared/              # ErrorBoundary, SectionLoader, MetricCard
│   │   ├── hooks/                   # React Query hooks (audit, health, activity)
│   │   ├── config/                  # API client, service registry, simulated data
│   │   └── index.css                # Design system (CSS custom properties)
│   ├── public/
│   │   ├── estar.png                # Platform logo
│   │   └── service-registry.json    # Microservice registry
│   ├── Dockerfile                   # Multi-stage: Node build → Nginx serve
│   └── nginx.conf                   # SPA routing + gzip + static caching
│
├── services/
│   └── audit-trail-service/         # Microservice 1 — FastAPI + PostgreSQL
│       ├── api/
│       │   ├── main.py              # FastAPI app, CORS, lifespan
│       │   └── routes/              # health, summary, activity, anomalies,
│       │                            # integrity, reports, agents, config
│       ├── agents/
│       │   └── scheduler.py         # APScheduler-based agent orchestrator
│       ├── db/
│       │   ├── models.py            # SQLAlchemy ORM (snowflake schema)
│       │   ├── database.py          # Engine, session, dependency injection
│       │   └── seed.py              # Database seeding with demo data
│       ├── shared_ai/
│       │   ├── factory.py           # AI provider factory (Gemini / OpenAI)
│       │   ├── gemini_provider.py   # Google Gemini integration
│       │   └── provider_interface.py # Abstract AI provider interface
│       ├── config/
│       │   └── settings.py          # Pydantic-settings based config
│       ├── alembic/                 # Database migrations
│       ├── Dockerfile               # Python 3.11-slim image
│       └── requirements.txt         # Python dependencies
│
├── shared/contracts/                # API contract (OpenAPI) + registry
├── docs/                            # Architecture documentation
├── .github/workflows/deploy.yml     # CI/CD: Build → GHCR → Azure
└── docker-compose_Version.yml       # Local development (all services)
```

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework with hooks and concurrent features |
| **Vite 7** | Build tool and dev server |
| **TailwindCSS v4** | Utility-first CSS framework |
| **TanStack Query v5** | Server state management and data fetching |
| **React Router v7** | Client-side routing |
| **Zustand** | Lightweight state management |
| **Sonner** | Toast notification system |
| **react-countup** | Animated number counters |
| **date-fns** | Date formatting utilities |
| **TypeScript 5.9** | Static type checking |

### Backend

| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python web framework |
| **SQLAlchemy 2.0** | ORM with snowflake schema design |
| **Alembic** | Database migration management |
| **PostgreSQL 15** | Relational database (via Neon.tech) |
| **APScheduler** | Background task scheduling for AI agents |
| **Google Gemini** | AI provider for compliance report generation |
| **Pydantic v2** | Data validation and settings management |
| **psycopg2** | PostgreSQL adapter |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Azure Container Apps** | Serverless container hosting |
| **GitHub Container Registry** | Docker image storage (`ghcr.io`) |
| **GitHub Actions** | CI/CD pipeline |
| **Nginx** | Static file serving + SPA routing |
| **Docker** | Containerization (multi-stage builds) |
| **Neon.tech** | Managed PostgreSQL (free tier) |

---

## Multi-Agent AI System

The platform employs three AI agents working in concert to monitor audit trails:

| Agent | ID | Description | Cycle |
|-------|----|-------------|-------|
| 🔍 **Human Error Detection** | `agent_1` | Analyzes audit events to detect anomalous patterns: repeated corrections, off-hours access, bulk deletions, missing correction reasons, self-approvals, and concurrent sessions | Configurable interval |
| 🛡️ **Log Integrity Verification** | `agent_2` | Verifies the integrity of audit trail entries through rule-based checks: sequence gaps, timestamp anomalies, orphan records, and field validation | Configurable interval |
| 📋 **Compliance Reporter** | `agent_3` | Uses Google Gemini AI to generate comprehensive compliance reports summarizing anomalies, integrity results, and regulatory status | On-demand / Scheduled |

### Detection Patterns (Agent 1)

- Repeated field corrections within a session
- Missing correction reasons on modified records
- Self-approval violations (maker-checker bypass)
- Off-hours access patterns (configurable time window)
- Bulk deletion attempts
- Concurrent session anomalies
- Backdated data entry detection
- OOS (Out-of-Specification) override flagging

---

## Getting Started

### Prerequisites

- **Docker Desktop** (recommended for full stack)
- **Python 3.11+** (backend only)
- **Node.js 20+** (frontend only)

### Option 1: Docker Compose (Full Stack)

```bash
# Clone the repository
git clone https://github.com/Karthik8402/estar-ai-platform.git
cd estar-ai-platform

# Set environment variables
export DB_PASSWORD=your-secure-password
export GEMINI_API_KEY=your-gemini-api-key

# Start all services
docker compose -f docker-compose_Version.yml up --build
```

> **Note:** The docker-compose file references placeholder images for stability-report, oot-alerting, and data-entry services. Currently, only the audit-trail-service is fully implemented.

### Option 2: Manual Setup

#### Backend (Audit Trail Service)

```bash
cd services/audit-trail-service

# Create and configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and GEMINI_API_KEY

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python -m alembic upgrade head

# Seed demo data
python -m db.seed

# Start the API server
uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
```

#### Frontend (Landing Page)

```bash
cd landing-page

# Install dependencies
npm install

# Start dev server (connects to localhost:8001 by default)
npm run dev
```

The landing page will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend (`services/audit-trail-service/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://epharmic:...@localhost:5432/epharmic_db` |
| `DATABASE_URL_FALLBACK` | Fallback DB connection (DNS issues) | — |
| `GEMINI_API_KEY` | Google Gemini API key for AI agents | — |
| `AI_PROVIDER` | AI provider (`gemini` or `openai`) | `gemini` |
| `JWT_SECRET` | Secret key for JWT tokens (deferred) | `change-me-in-development` |
| `SERVICE_PORT` | Port to run the service on | `8001` |
| `SIMULATION_INTERVAL_SECONDS` | Demo data generation interval | `240` |
| `CORS_ALLOW_ALL` | Allow all CORS origins | `true` |

### Frontend (`landing-page`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_GATEWAY_URL` | Backend API base URL | `http://localhost:8001` |
| `VITE_ENABLE_MULTI_SERVICE_LIVE` | Enable live polling for all services | `false` |

---

## API Reference

All endpoints are served by the **Audit Trail Service** (`/docs` for interactive Swagger UI).

### Contract Endpoints (Required by Platform)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check (DB, AI, uptime) |
| `GET` | `/summary` | Dashboard stats (processed, alerts, scores) |
| `GET` | `/activity/recent` | Recent audit events timeline |

### Anomaly Detection

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/anomalies` | Paginated anomaly list with filters (`?page=&severity=&type=&search=`) |

### Log Integrity

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/integrity` | Integrity check results and violations |

### Compliance Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/list` | List of generated reports |
| `POST` | `/reports/generate` | Generate new AI compliance report |

### Agent Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/agents/status` | Status of all 3 AI agents |
| `POST` | `/agents/start` | Start a specific agent (`{ "agent_id": "..." }`) |
| `POST` | `/agents/stop` | Stop a specific agent |
| `POST` | `/agents/start-all` | Start all agents |
| `POST` | `/agents/stop-all` | Stop all agents |

### Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/config/thresholds` | Current detection thresholds |
| `PUT` | `/config/thresholds` | Update detection thresholds |
| `GET` | `/config/compliance-rules` | Compliance rule configurations |

---

## CI/CD Pipeline

The project uses **GitHub Actions** for continuous deployment:

```
Push to main → Build Docker images → Push to GHCR → Deploy to Azure Container Apps
```

| Stage | Description |
|-------|-------------|
| **Build Backend** | Docker buildx → `ghcr.io/karthik8402/audit-trail-service:sha-XXXXXX` |
| **Build Frontend** | Docker buildx → `ghcr.io/karthik8402/landing-page:sha-XXXXXX` (bakes API URL) |
| **Deploy** | `az containerapp update` for both services to Azure Container Apps |

Deployment triggers:
- ✅ Push to `main` branch
- ✅ Manual trigger via `workflow_dispatch`
- ⚠️ Pull requests build but **do not deploy**

---

## Database Schema

The backend uses a **snowflake schema** designed for pharmaceutical audit trail compliance:

### Dimension Tables
- `dim_role` — User roles and permissions
- `dim_user` — System users
- `dim_compliance` — Regulatory codes (21 CFR Part 11, etc.)
- `dim_module` — Application modules
- `dim_action` — Auditable actions (requires e-signature flag)
- `dim_session` — Session metadata (IP, fingerprint, geo)
- `dim_time` — Time dimension (off-hours flag)

### Fact Table
- `fact_audit_events` — Central audit event log (risk score, compliance flag)

### Operational Tables
- `audit_anomalies` — Detected anomalies with AI confidence scores
- `integrity_checks` — Integrity verification results
- `integrity_violations` — Individual violation records
- `audit_reports` — Generated compliance reports
- `agent_configs` — Agent status and scheduling
- `audit_thresholds` — Configurable detection thresholds
- `compliance_rule_configs` — Compliance rule display data

---

## Compliance Standards

This platform is designed to assist with the following regulatory requirements:

| Standard | Coverage |
|----------|----------|
| **21 CFR Part 11** | Electronic records, electronic signatures, audit trails |
| **ICH Q1A** | Stability testing of new drug substances and products |
| **ICH Q1E** | Evaluation of stability data |
| **GMP** | Good Manufacturing Practice compliance |
| **21 CFR Part 211** | Current Good Manufacturing Practice for pharmaceuticals |

---

## Roadmap

- [ ] Stability Report Generator (Microservice 2)
- [ ] Predictive OOT Alerting System (Microservice 3)
- [ ] Intelligent Data Entry Agent (Microservice 4)
- [ ] JWT Authentication & Role-Based Access Control
- [ ] PDF Export for Compliance Reports
- [ ] API Gateway (Nginx reverse proxy)
- [ ] Automated test suite (pytest + Vitest)

---

## License

MIT License — **EnviroApps Inc.** © 2026
