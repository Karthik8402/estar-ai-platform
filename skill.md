# 📘 skill.md — eSTAR (Electronic Stability Testing and Reporting) AI Platform
### EnviroApps Inc eSTAR (Electronic Stability Testing and Reporting) AI Platform · EnviroApps Inc
> **Project Type:** Agentic AI Microservices Platform  
> **Company:** EnviroApps Inc  
> **Product Suite:** ePharmic · eSTEL · eSTAR  
> **Compliance:** 21 CFR Part 11 · ICH Q1A · ICH Q1E · GMP  
> **Status:** Planning Phase — Not Started  
> **Date:** 2026-02-19  

---

## 🎯 Project Vision

Build a unified AI-powered pharmaceutical stability intelligence platform consisting of **four independent microservices**, each owned by a separate team, all accessible through a **single React landing page (portal)**. The platform provides agentic AI capabilities to automate audit trail monitoring, stability report generation, out-of-trend alerting, and intelligent data entry validation — all compliant with pharmaceutical regulatory standards.

---

## 🏛️ Platform Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│               SINGLE LANDING PAGE (React Portal)                 │
│           epharmic.enviroapps.com  ·  Port 3000                  │
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐       │
│  │  MS-1    │   │  MS-2    │   │  MS-3    │   │  MS-4    │       │
│  │ Audit    │   │Stability │   │Predictive│   │  Data    │       │
│  │ Trail    │   │ Report   │   │  OOT     │   │  Entry   │       │
│  │  Agent   │   │Generator │   │ Alerting │   │  Agent   │       │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘       │
└───────┼──────────────┼──────────────┼───────────────┼────────────┘
        │              │              │               │
        ▼              ▼              ▼               ▼
┌───────────────────────────────────────────────────────────────┐
│                  API GATEWAY  ·  Port 8000                    │
│         Nginx · JWT Auth · Rate Limiting · CORS               │
│  /api/audit/*  /api/stability/*  /api/oot/*  /api/data-entry/*│
└───────┬──────────────┬──────────────┬───────────────┬─────────┘
        │              │              │               │
   ┌────▼────┐    ┌────▼────┐    ┌───▼─────┐    ┌───▼─────┐
   │  MS-1   │    │  MS-2   │    │  MS-3   │    │  MS-4   │
   │ :8001   │    │ :8002   │    │ :8003   │    │ :8004   │
   │ Python  │    │ Team B  │    │ Team C  │    │ Team D  │
   └────┬────┘    └────┬────┘    └───┬─────┘    └───┬─────┘
        └──────────────┴─────────────┴──────────────┘
                                │
              ┌─────────────────▼─────────────────┐
              │      Snowflake Schema Database    │
              │   PostgreSQL (dev) → Snowflake    │
              │     (prod) via SQLAlchemy ORM     │
              └───────────────────────────────────┘
```

---

## 📦 Repository Structure

```
epharmic-ai-platform/
├── landing-page/                        ← React Single Portal (MS owner: Karthik8402)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx          ← Main hub page
│   │   │   └── ServiceFrame.tsx         ← Per-service embed wrapper
│   │   ├── components/
│   │   │   ├── ServiceCard.tsx          ← Individual microservice card
│   │   │   ├── GlobalActivityFeed.tsx   ← Merged activity from all 4
│   │   │   ├── ComplianceScoreBar.tsx   ← Platform compliance meter
│   │   │   ├── ServiceStatusBadge.tsx   ← 🟢🔴🟡 health indicator
│   │   │   └── PlatformHeader.tsx       ← Branding + user session
│   │   ├── hooks/
│   │   │   ├── useServiceHealth.ts      ← Polls /health for all 4
│   │   │   ├── useServiceSummary.ts     ← Fetches /summary from all 4
│   │   │   └── useActivityFeed.ts       ← Merges activity feeds
│   │   ├── config/
│   │   │   └── services.ts              ← Imports service-registry.json
│   │   └── store/
│   │       └── auth.ts                  ← Shared JWT session (Zustand)
│   ├── public/
│   │   └── service-registry.json        ← Shared service config
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── services/
│   └── audit-trail-service/             ← MS-1 (Owner: Karthik8402)
│       ├── skill.md                     ← MS-1 specific requirements
│       ├── agents/
│       │   ├── human_error_agent.py
│       │   ├── log_integrity_agent.py
│       │   ├── summary_agent.py
│       │   └── orchestrator.py
│       ├── api/
│       │   ├── main.py
│       │   └── routes/
│       │       ├── health.py            ← REQUIRED contract endpoint
│       │       ├── summary.py           ← REQUIRED contract endpoint
│       │       ├── activity.py          ← REQUIRED contract endpoint
│       │       ├── agents.py
│       │       └── reports.py
│       ├── shared_ai/
│       │   ├── provider_interface.py    ← Abstract AI provider
│       │   ├── gemini_provider.py       ← FREE (dev/test)
│       │   ├── openai_provider.py       ← (production)
│       │   └── factory.py              ← Switch via .env
│       ├── db/
│       │   ├── models.py               ← SQLAlchemy Snowflake schema
│       │   └── migrations/             ← Alembic migrations
│       ├── config/
│       │   ├── settings.py
│       │   └── compliance_rules.yaml
│       ├── tests/
│       ├── Dockerfile
│       └── requirements.txt
│
├── gateway/
│   └── nginx.conf                       ← API Gateway routing config
│
├── shared/
│   ├── auth/
│   │   ├── jwt_utils.py                 ← Shared JWT helpers
│   │   └── session_models.py
│   ├── db/
│   │   └── snowflake_schema.sql         ← Master schema definition
│   └── contracts/
│       ├── service-registry.json        ← Service discovery config
│       └── api-contract.yaml            ← Mandatory API contract
│
├── docs/
│   ├── architecture.md
│   ├── team-onboarding.md               ← Guide for Teams B, C, D
│   ├── api-contract.md
│   └── compliance-mapping.md
│
├── docker-compose.yml                   ← Run all 4 services + gateway locally
├── docker-compose.prod.yml
├── .env.example
├── skill.md                             ← THIS FILE (platform-level)
└── README.md
```

---

## 🔌 Service Registry (Inter-Team Contract)

The **`service-registry.json`** is the single source of truth shared with all teams.
The landing page reads this file to know what services exist, where they are, and how to display them.

```json
{
  "platform": "ePharmic AI Platform",
  "company": "EnviroApps Inc",
  "version": "1.0.0",
  "services": [
    {
      "id": "audit-trail",
      "name": "Agentic AI — Audit Trail & Log Integrity",
      "owner": "Karthik8402",
      "description": "Multi-agent AI monitoring audit trails and system logs for 21 CFR Part 11 compliance",
      "icon": "🔍",
      "color": "#6366f1",
      "status_endpoint": "/api/audit/health",
      "dashboard_path": "/audit",
      "gateway_prefix": "/api/audit",
      "port": 8001,
      "features": ["Human Error Detection", "Log Integrity", "Compliance Reports"],
      "compliance": ["21 CFR Part 11"]
    },
    {
      "id": "stability-report",
      "name": "Automated Stability Report Generator",
      "owner": "Team B",
      "description": "Automatically generates ICH-compliant stability reports from experimental data",
      "icon": "📊",
      "color": "#10b981",
      "status_endpoint": "/api/stability/health",
      "dashboard_path": "/stability",
      "gateway_prefix": "/api/stability",
      "port": 8002,
      "features": ["Auto Report Generation", "Data Aggregation", "PDF Export"],
      "compliance": ["ICH Q1A", "21 CFR Part 211"]
    },
    {
      "id": "oot-alerting",
      "name": "Predictive Stability & OOT Alerting System",
      "owner": "Team C",
      "description": "Predicts out-of-trend stability results before they become failures",
      "icon": "⚡",
      "color": "#f59e0b",
      "status_endpoint": "/api/oot/health",
      "dashboard_path": "/oot",
      "gateway_prefix": "/api/oot",
      "port": 8003,
      "features": ["Predictive Alerts", "Trend Analysis", "Risk Scoring"],
      "compliance": ["ICH Q1E", "21 CFR Part 211"]
    },
    {
      "id": "data-entry",
      "name": "Intelligent Data Entry & Validation Agent",
      "owner": "Team D",
      "description": "AI-powered data entry assistant with real-time validation and compliance checking",
      "icon": "✅",
      "color": "#3b82f6",
      "status_endpoint": "/api/data-entry/health",
      "dashboard_path": "/data-entry",
      "gateway_prefix": "/api/data-entry",
      "port": 8004,
      "features": ["Smart Validation", "Auto-correction", "Compliance Check"],
      "compliance": ["21 CFR Part 11", "GMP"]
    }
  ]
}
```

---

## 📋 Mandatory API Contract (All 4 Teams Must Implement)

Every microservice **MUST** expose these 3 endpoints exactly as specified:

### `GET /health` — Service health (no auth required)
```json
{
  "status": "healthy",
  "service_name": "audit-trail-service",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "last_activity": "2026-02-19T10:30:00Z"
}
```

### `GET /summary` — Dashboard card stats (JWT required)
```json
{
  "total_processed": 1204,
  "alerts_today": 3,
  "last_run": "2026-02-19T10:25:00Z",
  "compliance_score": 94,
  "quick_stats": {}
}
```

### `GET /activity/recent?limit=5` — Activity feed (JWT required)
```json
{
  "items": [
    {
      "id": "evt_001",
      "timestamp": "2026-02-19T10:30:00Z",
      "message": "Anomalous login pattern detected for user JohnDoe",
      "severity": "warn",
      "service": "audit-trail"
    }
  ]
}
```

---

## 🔐 Session Security Architecture

```
User Login
    │
    ▼
┌──────────────────────────────────┐
│  1. Identity Verification         │
│     · Username + Password (bcrypt)│
│     · Optional: TOTP / MFA        │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│  2. Token Issuance                │
│     · Access Token (JWT, 15 min) │
│     · Refresh Token (7 days, DB) │
│     · HttpOnly + Secure cookies  │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│  3. Session Metadata             │
│     · IP Address                 │
│     · Device fingerprint         │
│     · Geo-location               │
│     · Created / last-used        │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│  4. Per-Request Validation        │
│     · JWT signature check        │
│     · Expiry check               │
│     · Session active in DB       │
│     · IP + Device consistency    │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│  5. Audit Every Request          │
│     · Log to fact_audit_events   │
│     · Flag: new IP, new device   │
│     · Flag: off-hours access     │
└──────────────────────────────────┘
```

| Security Concern       | Solution                                          |
|------------------------|---------------------------------------------------|
| Token theft            | Short-lived JWTs (15 min) + Refresh token rotation|
| Session hijacking      | Device fingerprint + IP binding                   |
| Concurrent sessions    | Configurable max sessions per user                |
| Privileged actions     | Step-up re-authentication                         |
| 21 CFR Part 11         | Electronic signature on critical actions          |
| CSRF                   | SameSite=Strict cookies + CSRF tokens             |
| Logout                 | Server-side refresh token revocation              |

---

## 🗄️ Snowflake Schema Design

The Snowflake schema provides clean, normalized data with clear audit lineage — perfectly suited for pharmaceutical regulatory requirements and easy migration across database engines.

```sql
-- FACT TABLE
CREATE TABLE fact_audit_events (
    event_id        UUID PRIMARY KEY,
    timestamp_id    INT REFERENCES dim_time(time_id),
    user_id         INT REFERENCES dim_user(user_id),
    action_id       INT REFERENCES dim_action(action_id),
    module_id       INT REFERENCES dim_module(module_id),
    session_id      UUID REFERENCES dim_session(session_id),
    risk_score      DECIMAL(5,2),
    is_compliant    BOOLEAN,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- SNOWFLAKED DIMENSIONS
CREATE TABLE dim_user (
    user_id     SERIAL PRIMARY KEY,
    username    VARCHAR(100),
    email       VARCHAR(255),
    role_id     INT REFERENCES dim_role(role_id)  -- snowflaked
);

CREATE TABLE dim_role (
    role_id          SERIAL PRIMARY KEY,
    role_name        VARCHAR(50),
    permissions_json JSONB
);

CREATE TABLE dim_module (
    module_id              SERIAL PRIMARY KEY,
    module_name            VARCHAR(100),
    compliance_category_id INT REFERENCES dim_compliance(compliance_id)  -- snowflaked
);

CREATE TABLE dim_compliance (
    compliance_id   SERIAL PRIMARY KEY,
    regulation_code VARCHAR(50),   -- e.g. '21CFR11', 'ICH_Q1A'
    description     TEXT
);

CREATE TABLE dim_session (
    session_id         UUID PRIMARY KEY,
    ip_address         VARCHAR(45),
    device_fingerprint VARCHAR(255),
    geo_location       VARCHAR(100),
    created_at         TIMESTAMP,
    last_used_at       TIMESTAMP
);
```

**Migration Strategy:**
- All queries via **SQLAlchemy ORM** — zero raw SQL in application code
- **Alembic** for version-controlled schema migrations
- Change `DATABASE_URL` env var to switch between:
  - `postgresql://...` → Development
  - `snowflake://...` → Production cloud
  - `bigquery://...` → Alternative cloud

---

## 🤖 AI Provider Abstraction (Gemini → Any Model)

```
Development (FREE)          Production (switchable)
──────────────────          ───────────────────────
AI_PROVIDER=gemini    →     AI_PROVIDER=openai
                            AI_PROVIDER=azure
                            AI_PROVIDER=anthropic
                            AI_PROVIDER=ollama
```

**Single .env variable = full provider switch. Zero code changes.**

Architecture:
```
Agent Code
    │
    ▼
AIProvider (Abstract Interface)
    ├── GeminiProvider      → google-generativeai (gemini-1.5-flash FREE)
    ├── OpenAIProvider      → openai (gpt-4)
    ├── AzureOpenAIProvider → azure-openai
    ├── AnthropicProvider   → anthropic (claude-3)
    └── OllamaProvider      → ollama (local, offline)
```

---

## 🌐 Landing Page Design Specification

### Visual Layout
```
┌──────────────────────────────────────────────────────────────┐
│  🧪 ePharmic AI Platform              [👤 User]  [Logout]   │
│  EnviroApps Inc — Stability Intelligence Suite               │
├──────────────────────────────────────────────────────────────┤
│  Platform Compliance Score:  ████████░░  82%                 │
│  4 Services  ·  3 Online  ·  Last Sync: 2 min ago            │
├──────────┬──────────┬──────────┬─────────────────────────────┤
│ 🔍 Audit │ 📊 Stab  │ ⚡ OOT   │ ✅ Data Entry             │
│  Trail   │ Reports  │ Alerting │  Validation                 │
│ ──────── │ ──────── │ ──────── │  ────────────               │
│ 🟢 Live  │ 🟢 Live  │ 🔴 Down  │  🟡 Warning               │
│  1,204   │   47     │    --    │    892                      │
│  logs    │  reports │          │  entries                    │
│ analyzed │  today   │          │  validated                  │
│  3 alerts│ 0 issues │ ⚠️ Check │  2 errors                   │
│ [Open →] │ [Open →] │ [Open →] │  [Open →]                   │
├──────────┴──────────┴──────────┴─────────────────────────────┤
│  📋 Recent Activity (All Services — Live Feed)               │
│  ─────────────────────────────────────────────               │
│  🔍 [2m ago]  Audit: Anomalous login pattern detected        │
│  ✅ [5m ago]  DataEntry: 50 records validated successfully   │
│  📊 [12m ago] Stability: Monthly report generated (PDF)      │
│  🔍 [18m ago] Audit: User corrected entry #4521            │
└──────────────────────────────────────────────────────────────┘
```

### React Tech Stack
| Layer           | Technology                          |
|-----------------|-------------------------------------|
| Framework       | React 18 + TypeScript               |
| Build Tool      | Vite                                |
| UI Components   | shadcn/ui + Tailwind CSS            |
| Server State    | TanStack Query (React Query v5)     |
| Client State    | Zustand                             |
| Routing         | React Router v6                     |
| Charts          | Recharts                            |
| Forms           | React Hook Form + Zod               |
| HTTP Client     | Axios with JWT interceptors         |
| Testing         | Vitest + React Testing Library      |

### Key Landing Page Behaviors
- **Auto-polls** all 4 `/health` endpoints every 30 seconds
- **Shows live status** badge (🟢 healthy / 🟡 degraded / 🔴 down) per service
- **If a service is down**, card shows graceful error — does not crash the page
- **Activity feed** merges real-time events from all 4 services
- **Compliance score** is averaged from all 4 service `/summary` responses
- **[Open →] button** navigates to that service's dedicated dashboard route

---

## 🚀 Implementation Phases

| Phase | Duration | Goal | Owner |
|-------|----------|------|-------|
| **Phase 0** | Week 1 | Repo setup, Docker Compose, shared contracts, DB schema, `.env` config | Karthik8402 |
| **Phase 1** | Week 2–3 | MS-1 Audit Trail agents (Gemini FREE), Landing Page skeleton | Karthik8402 |
| **Phase 2** | Week 3–4 | Landing Page full UI: cards, health polling, activity feed | Karthik8402 |
| **Phase 3** | Week 4–5 | MS-2 Stability Report Generator | Team B |
| **Phase 4** | Week 4–5 | MS-3 OOT Alerting | Team C |
| **Phase 5** | Week 4–5 | MS-4 Data Entry Agent | Team D |
| **Phase 6** | Week 6 | API Gateway integration, session security, JWT auth | Karthik8402 |
| **Phase 7** | Week 7 | Full 4-service integration test, Docker Compose smoke test | All Teams |
| **Phase 8** | Week 8 | Demo prep, compliance docs, Gemini → prod AI switch test | All Teams |

---

## 🐳 Docker Compose (Run All 4 Services Locally)

```yaml
version: "3.9"
services:
  landing-page:
    build: ./landing-page
    ports: ["3000:3000"]
    environment:
      - VITE_API_GATEWAY_URL=http://localhost:8000

  audit-trail-service:          # MS-1 — YOUR service
    build: ./services/audit-trail-service
    ports: ["8001:8001"]
    environment:
      - AI_PROVIDER=gemini       # FREE during dev
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}

  stability-report-service:     # MS-2 — Team B
    image: enviroapps/stability-report:latest
    ports: ["8002:8002"]

  oot-alerting-service:         # MS-3 — Team C
    image: enviroapps/oot-alerting:latest
    ports: ["8003:8003"]

  data-entry-service:           # MS-4 — Team D
    image: enviroapps/data-entry:latest
    ports: ["8004:8004"]

  gateway:
    image: nginx:alpine
    ports: ["8000:8000"]
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/nginx.conf

  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: epharmic_db
      POSTGRES_USER: epharmic
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```

---

## 👥 Team Onboarding (For Teams B, C, D)

Share this with your teammates. They only need to do **3 things**:

1. **Implement the 3 mandatory endpoints** exactly as defined in the API Contract section above
2. **Accept JWT Authorization header** — `Authorization: Bearer <token>`
3. **Run on their assigned port** — Team B: `8002`, Team C: `8003`, Team D: `8004`
4. **Build and push a Docker image** — `enviroapps/<service-name>:latest`

Everything else (UI, business logic, internal DB) is entirely up to each team.

---

## ✅ Definition of Done (Per Microservice)

- [ ] Service starts on correct port with `docker-compose up`
- [ ] `GET /health` returns valid JSON without authentication
- [ ] `GET /summary` returns valid JSON with JWT token
- [ ] `GET /activity/recent` returns activity array with JWT token
- [ ] Landing page card shows correct stats from this service
- [ ] Landing page activity feed shows events from this service
- [ ] Unit tests cover all 3 contract endpoints
- [ ] Dockerfile builds successfully
- [ ] README documents how to run locally

---

## 📚 References

- [21 CFR Part 11 — Electronic Records](https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-11)
- [ICH Q1A — Stability Testing Guidelines](https://www.ich.org/page/quality-guidelines)
- [ICH Q1E — Evaluation for Stability Data](https://www.ich.org/page/quality-guidelines)
- [LangGraph — Multi-Agent Orchestration](https://langchain-ai.github.io/langgraph/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy + Alembic](https://alembic.sqlalchemy.org/)
- [shadcn/ui Components](https://ui.shadcn.com/)