# ePharmic AI Platform — Architecture & Deployment Guide

**Company:** EnviroApps Inc  
**Product Suite:** ePharmic · eSTEL · eSTAR (Electronic Stability Testing and Reporting)  
**Compliance:** 21 CFR Part 11 · ICH Q1A · ICH Q1E · GMP  
**Version:** 1.0.0  
**Date:** February 2026  

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Project Structure](#2-project-structure)
3. [Microservice Architecture](#3-microservice-architecture)
4. [Landing Page (React Portal)](#4-landing-page-react-portal)
5. [Configuration & Service Registry](#5-configuration--service-registry)
6. [Database Schema & Easy Migration](#6-database-schema--easy-migration)
7. [Session Security Architecture](#7-session-security-architecture)
8. [API Gateway & Routing](#8-api-gateway--routing)
9. [AI Provider Abstraction](#9-ai-provider-abstraction)
10. [Deployment-Ready Project Setup](#10-deployment-ready-project-setup)
11. [Team Onboarding Guide](#11-team-onboarding-guide)
12. [Compliance Mapping](#12-compliance-mapping)
13. [References](#13-references)

---

## 1. Platform Overview

The ePharmic AI Platform is a unified, AI-powered pharmaceutical stability intelligence platform consisting of **four independent microservices**, each owned by a separate team, all accessible through a **single React landing page (portal)**.

### What It Does

| Capability | Description |
|------------|-------------|
| Audit Trail Monitoring | Multi-agent AI system that monitors audit trails for 21 CFR Part 11 compliance |
| Stability Report Generation | Automated ICH-compliant stability report generation from experimental data |
| Out-of-Trend Alerting | Predictive analytics to detect OOT stability results before they become failures |
| Data Entry Validation | AI-powered data entry assistant with real-time validation and compliance checking |

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│               SINGLE LANDING PAGE (React Portal)                 │
│           epharmic.enviroapps.com  ·  Port 3000                  │
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐      │
│  │  MS-1    │   │  MS-2    │   │  MS-3    │   │  MS-4    │      │
│  │  Audit   │   │Stability │   │Predictive│   │  Data    │      │
│  │  Trail   │   │ Report   │   │  OOT     │   │  Entry   │      │
│  │  Agent   │   │Generator │   │ Alerting │   │  Agent   │      │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘      │
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
              │      Snowflake Schema Database     │
              │   PostgreSQL (dev) → Snowflake     │
              │     (prod) via SQLAlchemy ORM      │
              └────────────────────────────────────┘
```

---

## 2. Project Structure

### Complete Repository Layout

```
epharmic-ai-platform/
│
├── landing-page/                        ← React Single Portal (Port 3000)
│   ├── src/
│   │   ├── App.tsx                      ← Root component with routing
│   │   ├── main.tsx                     ← Entry point
│   │   ├── index.css                    ← CSS variables, fonts, base resets
│   │   │
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx          ← Main hub page (route: /)
│   │   │   └── AuditDashboard.tsx       ← MS-1 dashboard (route: /audit)
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── PlatformHeader.tsx   ← Sticky header with branding
│   │   │   │   └── PlatformFooter.tsx   ← Compliance references footer
│   │   │   ├── overview/
│   │   │   │   └── PlatformOverview.tsx ← Compliance score bar
│   │   │   ├── services/
│   │   │   │   ├── ServiceCard.tsx      ← Individual microservice card
│   │   │   │   ├── ServiceCardGrid.tsx  ← 2×2 grid layout
│   │   │   │   ├── ServiceStatusBadge.tsx ← Health indicator badge
│   │   │   │   └── SkeletonCard.tsx     ← Loading placeholder
│   │   │   ├── feed/
│   │   │   │   └── GlobalActivityFeed.tsx ← Merged activity timeline
│   │   │   ├── shared/
│   │   │   │   ├── ErrorBoundary.tsx    ← Graceful error handling
│   │   │   │   └── MetricCard.tsx       ← Reusable metric display
│   │   │   └── audit/                   ← MS-1 Dashboard components
│   │   │       ├── AuditSidebar.tsx
│   │   │       ├── AuditOverview.tsx
│   │   │       ├── AnomalyTable.tsx
│   │   │       ├── IntegrityView.tsx
│   │   │       ├── ReportViewer.tsx
│   │   │       ├── AgentControl.tsx
│   │   │       ├── AuditSettings.tsx
│   │   │       └── FilterBar.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useServiceHealth.ts      ← Polls /health for all services
│   │   │   ├── useServiceSummary.ts     ← Fetches /summary (JWT required)
│   │   │   ├── useActivityFeed.ts       ← Merges activity feeds
│   │   │   └── audit/                   ← Dashboard-specific hooks
│   │   │       ├── useAnomalies.ts
│   │   │       ├── useIntegrity.ts
│   │   │       ├── useReports.ts
│   │   │       └── useAgentStatus.ts
│   │   │
│   │   ├── config/
│   │   │   ├── services.ts              ← Imports service-registry.json
│   │   │   ├── simulatedData.ts         ← Mock data for development
│   │   │   └── simulatedAuditData.ts    ← Mock audit data
│   │   │
│   │   └── store/
│   │       └── auth.ts                  ← Zustand JWT session store
│   │
│   ├── public/
│   │   └── service-registry.json        ← Runtime service config
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
│
├── services/
│   ├── audit-trail-service/             ← MS-1 (Owner: Karthik8402)
│   │   ├── myMSskill.md                ← MS-1 specification
│   │   ├── agents/
│   │   │   ├── human_error_agent.py     ← Detects operator mistakes
│   │   │   ├── log_integrity_agent.py   ← Verifies audit completeness
│   │   │   ├── summary_agent.py         ← Generates compliance reports
│   │   │   └── orchestrator.py          ← Coordinates all agents
│   │   ├── api/
│   │   │   ├── main.py                  ← FastAPI application
│   │   │   └── routes/
│   │   │       ├── health.py            ← GET /health (contract)
│   │   │       ├── summary.py           ← GET /summary (contract)
│   │   │       ├── activity.py          ← GET /activity/recent (contract)
│   │   │       ├── agents.py            ← Agent control endpoints
│   │   │       └── reports.py           ← Report generation
│   │   ├── shared_ai/
│   │   │   ├── provider_interface.py    ← Abstract AI provider
│   │   │   ├── gemini_provider.py       ← Google Gemini (free dev)
│   │   │   ├── openai_provider.py       ← OpenAI (production)
│   │   │   └── factory.py              ← Provider factory pattern
│   │   ├── db/
│   │   │   ├── models.py               ← SQLAlchemy ORM models
│   │   │   └── migrations/             ← Alembic migration scripts
│   │   ├── config/
│   │   │   ├── settings.py             ← Environment configuration
│   │   │   └── compliance_rules.yaml   ← Detection thresholds
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── stability-testing-service/       ← MS-2 (Team B, Port 8002)
│   ├── oot-detection-service/           ← MS-3 (Team C, Port 8003)
│   └── data-entry-service/              ← MS-4 (Team D, Port 8004)
│
├── shared/
│   └── contracts/
│       ├── service-registry.json        ← Single source of truth
│       └── api-contract.yaml            ← Mandatory API contract
│
├── gateway/
│   └── nginx.conf                       ← API Gateway routing config
│
├── docs/
│   ├── architecture.md
│   ├── team-onboarding.md
│   ├── api-contract.md
│   └── compliance-mapping.md
│
├── docker-compose.yml                   ← Development environment
├── docker-compose.prod.yml              ← Production environment
├── .env.example                         ← Environment template
├── skill.md                             ← Platform-level specification
└── README.md
```

### Structure Philosophy

Each microservice is **fully self-contained**:
- Own `Dockerfile`
- Own `requirements.txt` or `package.json`
- Own database models and migrations
- Own AI agent implementations
- Own test suite

The only shared elements live in:
- `shared/contracts/` — API contract and service registry
- `shared/auth/` — JWT utilities (optional, can be copied per service)

---

## 3. Microservice Architecture

### Service Registry

All 4 microservices are defined in a single JSON configuration file that acts as the **single source of truth** for the entire platform:

| Service ID | Name | Port | Owner | Compliance |
|-----------|------|------|-------|------------|
| `audit-trail` | Agentic AI — Audit Trail & Log Integrity | 8001 | Karthik8402 | 21 CFR Part 11 |
| `stability-report` | Automated Stability Report Generator | 8002 | Team B | ICH Q1A, 21 CFR Part 211 |
| `oot-alerting` | Predictive Stability & OOT Alerting System | 8003 | Team C | ICH Q1E, 21 CFR Part 211 |
| `data-entry` | Intelligent Data Entry & Validation Agent | 8004 | Team D | 21 CFR Part 11, GMP |

### Mandatory API Contract

Every microservice **MUST** expose exactly 3 endpoints. This is the inter-team agreement:

#### 1. `GET /health` — Service Health (No Auth Required)

The landing page polls this every 30 seconds to determine service status.

```json
{
  "status": "healthy",
  "service_name": "audit-trail-service",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "last_activity": "2026-02-19T10:30:00Z"
}
```

**Status mapping:**
| Response | Landing Page Badge |
|----------|-------------------|
| HTTP 200 + `status: "healthy"` | 🟢 Online |
| HTTP 200 + `status: ≠ "healthy"` | 🟡 Degraded |
| Timeout (>5s) or network error | 🔴 Offline |

#### 2. `GET /summary` — Dashboard Card Stats (JWT Required)

Provides the numbers displayed on each service card.

```json
{
  "total_processed": 1204,
  "alerts_today": 3,
  "last_run": "2026-02-19T10:25:00Z",
  "compliance_score": 94,
  "quick_stats": {}
}
```

#### 3. `GET /activity/recent?limit=5` — Activity Feed (JWT Required)

Provides recent events for the global activity timeline.

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

### MS-1 Detailed Structure (Audit Trail Service)

The most mature microservice, using a multi-agent AI architecture:

```
┌─────────────────────────────────────────────────┐
│                ORCHESTRATOR                      │
│    Coordinates all 3 agents, merges results      │
├───────────────┬───────────────┬──────────────────┤
│   Agent 1     │   Agent 2     │    Agent 3       │
│  Human Error  │ Log Integrity │  Summary &       │
│  Detection    │ Verification  │  Reporting       │
│               │               │                  │
│ - Failed      │ - Sequential  │ - Daily/Weekly   │
│   logins      │   numbering   │   reports        │
│ - Bulk        │ - Timestamps  │ - AI-generated   │
│   deletions   │ - E-signatures│   narrative      │
│ - Off-hours   │ - RBAC auth   │ - Compliance     │
│   access      │ - Checksums   │   scoring        │
│ - Repeated    │               │                  │
│   corrections │               │                  │
└───────┬───────┴───────┬───────┴──────┬───────────┘
        │               │              │
        └───────────────┼──────────────┘
                        │
                  ┌─────▼─────┐
                  │  FastAPI   │
                  │  REST API  │
                  │  Port 8001 │
                  └─────┬─────┘
                        │
                  ┌─────▼─────┐
                  │ SQLAlchemy │
                  │    ORM     │
                  └─────┬─────┘
                        │
                  ┌─────▼─────┐
                  │ PostgreSQL │
                  │ / Snowflake│
                  └────────────┘
```

---

## 4. Landing Page (React Portal)

### Purpose

The landing page is the **operational control surface** — not a marketing page. It shows what's running, what's broken, what needs attention, and gives one-click access to any service.

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 + TypeScript | UI rendering |
| Build | Vite | Fast dev server + optimized build |
| Styling | Tailwind CSS v4 + CSS custom properties | Design system |
| Components | shadcn/ui | Dropdown, Tooltip, Button primitives |
| Server State | TanStack Query v5 | Polling, caching, error handling |
| Client State | Zustand | JWT token, theme, UI state |
| Routing | React Router v6 | Portal → Dashboard navigation |
| HTTP | Native `fetch` | No axios dependency |
| Toasts | sonner | Status change notifications |
| Timestamps | date-fns | Relative time formatting |

### Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  HEADER — sticky, 56px height                           │
│  Logo · Platform status summary · Theme toggle · User   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PLATFORM OVERVIEW BAR                                  │
│  Compliance score · Services online · Last sync time    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SERVICE CARDS — 2×2 grid (desktop), 1-col (mobile)     │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │   MS-1       │  │   MS-2       │                     │
│  │  Audit Trail │  │  Stability   │                     │
│  └──────────────┘  └──────────────┘                     │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │   MS-3       │  │   MS-4       │                     │
│  │  OOT Alert   │  │  Data Entry  │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ACTIVITY FEED — last 10 events across all services     │
├─────────────────────────────────────────────────────────┤
│  FOOTER — compliance references, version, copyright     │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
service-registry.json (static config)
        │
        ├── ServiceCardGrid reads the service list
        │
        └── For each service:
                │
                ├── useServiceHealth(service.status_endpoint)
                │     → GET /health  (no auth, every 30s)
                │     → Determines badge: online / degraded / offline
                │
                ├── useServiceSummary(service.gateway_prefix + '/summary')
                │     → GET /summary  (JWT, every 30s, only if online)
                │     → Populates card metrics
                │
                └── useActivityFeed(service.gateway_prefix + '/activity/recent')
                      → GET /activity/recent?limit=5  (JWT, every 30s)
                      → Feeds into merged GlobalActivityFeed

        PlatformOverview
                │
                └── Reads from all useServiceSummary results
                    → Averages compliance_score (excluding offline services)
                    → Counts online/degraded/offline services
```

### Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 640px | Single column. Cards stack. Header collapses. |
| 640–1024px | 2-column card grid. Full header. |
| > 1024px | 2-column card grid with full layout. |
| > 1280px | Centered with `max-width: 1280px`, padding 48px. |

---

## 5. Configuration & Service Registry

### Configuration Management Strategy

The platform uses a **layered configuration** approach:

```
┌─────────────────────────────────┐
│     Environment Variables       │  ← Runtime secrets (API keys, DB URLs)
│         (.env file)             │
├─────────────────────────────────┤
│     service-registry.json       │  ← Service discovery & display config
│    (shared/contracts/)          │
├─────────────────────────────────┤
│     api-contract.yaml           │  ← Mandatory endpoint definitions
│    (shared/contracts/)          │
├─────────────────────────────────┤
│    compliance_rules.yaml        │  ← Per-service detection thresholds
│    (per service config/)        │
├─────────────────────────────────┤
│     docker-compose.yml          │  ← Container orchestration config
│                                 │
└─────────────────────────────────┘
```

### Service Registry JSON (Config Microservice)

The `service-registry.json` is the centralized configuration for all microservices. The landing page reads this at startup to know what services exist.

```json
{
  "platform": "ePharmic AI Platform",
  "company": "EnviroApps Inc",
  "version": "1.0.0",
  "services": [
    {
      "id": "audit-trail",
      "name": "Agentic AI Audit Trail & Log Integrity",
      "owner": "Karthik8402",
      "description": "Multi-agent AI monitoring audit trails...",
      "icon": "🔍",
      "color": "#6366f1",
      "status_endpoint": "/api/audit/health",
      "dashboard_path": "/audit",
      "gateway_prefix": "/api/audit",
      "port": 8001,
      "features": ["Human Error Detection", "Log Integrity", "Compliance Reports"],
      "compliance": ["21 CFR Part 11"]
    }
    // ... other services follow the same schema
  ]
}
```

**How to add a new microservice:**

1. Add a new entry to `service-registry.json`
2. Assign a unique `id`, `port`, and `gateway_prefix`
3. Implement the 3 mandatory endpoints
4. Add routing rules to `gateway/nginx.conf`
5. Add the service to `docker-compose.yml`

### Environment Variables

```bash
# .env.example — Required environment variables

# Database
DATABASE_URL=postgresql://epharmic:password@postgres:5432/epharmic_db

# JWT Authentication
JWT_SECRET=your-256-bit-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRY_MINUTES=15
REFRESH_TOKEN_DAYS=7

# AI Provider (switch without code changes)
AI_PROVIDER=gemini          # Options: gemini, openai, azure, anthropic, ollama
GEMINI_API_KEY=your-key     # Free during development
OPENAI_API_KEY=             # For production

# Gateway
VITE_API_GATEWAY_URL=http://localhost:8000

# Database passwords
DB_PASSWORD=your-db-password
```

---

## 6. Database Schema & Easy Migration

### Snowflake Schema Design

The platform uses a **Snowflake Schema** — a normalized dimensional model that provides clean audit lineage, perfectly suited for pharmaceutical regulatory requirements.

```
                    ┌──────────────────────┐
                    │   fact_audit_events   │
                    │  (Central Fact Table) │
                    └───┬──┬──┬──┬──┬──────┘
                        │  │  │  │  │
              ┌─────────┘  │  │  │  └──────────┐
              │            │  │  │              │
        ┌─────▼─────┐  ┌──▼──▼──▼──┐    ┌─────▼─────┐
        │ dim_time   │  │ dim_user  │    │dim_session│
        └────────────┘  └─────┬─────┘    └───────────┘
                              │
                        ┌─────▼─────┐
                        │ dim_role  │  ← Snowflaked from dim_user
                        └───────────┘

        ┌────────────┐
        │ dim_module  │
        └──────┬─────┘
               │
        ┌──────▼──────────┐
        │ dim_compliance  │  ← Snowflaked from dim_module
        └─────────────────┘
```

### Schema Definition

```sql
-- =============================================
-- CENTRAL FACT TABLE
-- Records every auditable event in the system
-- =============================================
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

-- =============================================
-- DIMENSION TABLES (with Snowflake normalization)
-- =============================================
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
    compliance_category_id INT REFERENCES dim_compliance(compliance_id)
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

### Easy Migration Strategy

The platform is designed for **zero-friction database migration** between engines:

```
┌─────────────────────────────────────────────────┐
│           APPLICATION CODE (Python)              │
│                                                  │
│   All queries via SQLAlchemy ORM                 │
│   Zero raw SQL in application code               │
│                                                  │
├─────────────────────────────────────────────────┤
│           SQLAlchemy ORM Layer                    │
│                                                  │
│   Models defined in Python classes               │
│   Database-agnostic query API                    │
│   Handles dialect differences automatically      │
│                                                  │
├─────────────────────────────────────────────────┤
│           Alembic Migration Engine               │
│                                                  │
│   Version-controlled schema changes              │
│   Auto-generates migration scripts               │
│   Supports upgrade and downgrade                 │
│                                                  │
├──────────────┬──────────────┬────────────────────┤
│  PostgreSQL  │  Snowflake   │  BigQuery          │
│  (Development)│ (Production) │ (Alternative)      │
│              │              │                    │
│  Just change │  Just change │  Just change       │
│  DATABASE_URL│  DATABASE_URL│  DATABASE_URL      │
└──────────────┴──────────────┴────────────────────┘
```

**Step-by-step migration process:**

#### Step 1: Define Models in SQLAlchemy (Write Once)

```python
# db/models.py
from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class FactAuditEvent(Base):
    __tablename__ = 'fact_audit_events'

    event_id = Column(UUID, primary_key=True)
    user_id = Column(Integer, ForeignKey('dim_user.user_id'))
    risk_score = Column(DECIMAL(5, 2))
    is_compliant = Column(Boolean)
    # ... all columns defined in Python
```

#### Step 2: Use Alembic for Schema Versioning

```bash
# Initialize Alembic (one-time setup)
alembic init db/migrations

# Auto-generate migration from model changes
alembic revision --autogenerate -m "add_risk_score_column"

# Apply migration (upgrade)
alembic upgrade head

# Rollback migration (downgrade)
alembic downgrade -1
```

#### Step 3: Switch Database by Changing One Environment Variable

```bash
# Development (PostgreSQL)
DATABASE_URL=postgresql://epharmic:password@localhost:5432/epharmic_db

# Production (Snowflake)
DATABASE_URL=snowflake://user:pass@account/db/schema

# Alternative Cloud (BigQuery)
DATABASE_URL=bigquery://project/dataset
```

**No code changes required.** SQLAlchemy handles all dialect differences automatically.

---

## 7. Session Security Architecture

### Authentication Flow

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
│     · Access Token (JWT, 15 min)  │
│     · Refresh Token (7 days, DB)  │
│     · HttpOnly + Secure cookies   │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│  3. Session Metadata              │
│     · IP Address                  │
│     · Device fingerprint          │
│     · Geo-location                │
│     · Created / last-used         │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│  4. Per-Request Validation        │
│     · JWT signature check         │
│     · Expiry check                │
│     · Session active in DB        │
│     · IP + Device consistency     │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│  5. Audit Every Request           │
│     · Log to fact_audit_events    │
│     · Flag: new IP, new device    │
│     · Flag: off-hours access      │
└──────────────────────────────────┘
```

### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id_123",
    "username": "jdoe",
    "role": "analyst",
    "iat": 1708300800,
    "exp": 1708301700,
    "session_id": "uuid-session-abc"
  }
}
```

### Security Threat Mitigation

| Threat | Mitigation Strategy |
|--------|-------------------|
| **Token Theft** | Short-lived JWTs (15 min) + Refresh token rotation. Old refresh tokens are immediately invalidated. |
| **Session Hijacking** | Device fingerprint binding + IP address consistency checks. Any change triggers re-authentication. |
| **Concurrent Sessions** | Configurable max sessions per user. Oldest session automatically revoked when limit is reached. |
| **CSRF Attacks** | `SameSite=Strict` cookies + CSRF tokens on state-changing requests. |
| **Privilege Escalation** | RBAC validation on every request. Critical actions require step-up re-authentication (electronic signature). |
| **Brute Force** | Rate limiting at API Gateway (Nginx). Account lockout after N failed attempts. |
| **Man-in-the-Middle** | HTTPS enforced. `Secure` flag on all cookies. HSTS headers. |
| **Logout Incomplete** | Server-side refresh token revocation. Token blacklist with TTL matching JWT expiry. |

### 21 CFR Part 11 Compliance — Electronic Signatures

For critical pharmaceutical actions (batch release, data correction, report approval):

```
User clicks "Approve Report"
    │
    ▼
┌──────────────────────────────────┐
│  Step-Up Authentication           │
│                                   │
│  "This action requires your       │
│   electronic signature"           │
│                                   │
│  [Username] ________              │
│  [Password] ________              │
│  [Reason]   ________              │
│                                   │
│  [Cancel]  [Sign & Submit]        │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Record in fact_audit_events:     │
│  · user_id                        │
│  · action: "report_approval"      │
│  · e_signature: true              │
│  · reason: "Monthly review"       │
│  · timestamp (tamper-proof)       │
│  · ip_address, device             │
└──────────────────────────────────┘
```

### Frontend Session Management (Zustand Store)

```typescript
// store/auth.ts
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// Token is stored in Zustand (memory) — not localStorage
// Refresh token is in HttpOnly cookie (browser manages it)
// On page reload: silent refresh via /auth/refresh endpoint
```

---

## 8. API Gateway & Routing

### Nginx Gateway Configuration

```
Client Request
    │
    ▼
┌─────────────────────────────────────────────────┐
│              NGINX API GATEWAY                    │
│              Port 8000                            │
│                                                   │
│  ┌──────────────┐  ┌───────────────────────────┐ │
│  │ Rate Limiting │  │ JWT Validation (optional) │ │
│  │ 100 req/min   │  │ Forward to services       │ │
│  └──────────────┘  └───────────────────────────┘ │
│                                                   │
│  Route Mapping:                                   │
│  ─────────────                                    │
│  /api/audit/*        → http://audit-trail:8001    │
│  /api/stability/*    → http://stability:8002      │
│  /api/oot/*          → http://oot-alerting:8003   │
│  /api/data-entry/*   → http://data-entry:8004     │
│                                                   │
│  CORS:                                            │
│  Origin: http://localhost:3000 (dev)              │
│  Origin: https://epharmic.enviroapps.com (prod)   │
│                                                   │
│  Headers:                                         │
│  Access-Control-Allow-Headers: Authorization      │
│  Access-Control-Allow-Methods: GET, POST, PUT     │
└─────────────────────────────────────────────────┘
```

---

## 9. AI Provider Abstraction

### Switch AI Models with Zero Code Changes

```
Development (FREE)          Production (switchable)
──────────────────          ───────────────────────
AI_PROVIDER=gemini    →     AI_PROVIDER=openai
                            AI_PROVIDER=azure
                            AI_PROVIDER=anthropic
                            AI_PROVIDER=ollama (offline)
```

### Provider Architecture

```python
# shared_ai/provider_interface.py
from abc import ABC, abstractmethod

class AIProvider(ABC):
    @abstractmethod
    async def analyze(self, prompt: str, data: dict) -> str:
        """Send analysis request to AI model"""
        pass

    @abstractmethod
    async def generate_report(self, template: str, findings: list) -> str:
        """Generate narrative compliance report"""
        pass
```

```python
# shared_ai/factory.py
import os

def get_ai_provider() -> AIProvider:
    provider = os.getenv("AI_PROVIDER", "gemini")

    match provider:
        case "gemini":
            return GeminiProvider()      # FREE: gemini-1.5-flash
        case "openai":
            return OpenAIProvider()      # GPT-4
        case "azure":
            return AzureOpenAIProvider() # Azure-hosted GPT-4
        case "anthropic":
            return AnthropicProvider()   # Claude 3
        case "ollama":
            return OllamaProvider()      # Local (offline)
        case _:
            raise ValueError(f"Unknown AI provider: {provider}")
```

**Single `.env` variable = full provider switch. Zero code changes.**

---

## 10. Deployment-Ready Project Setup

### Development Environment

```bash
# 1. Clone the repository
git clone https://github.com/Karthik8402/estar-ai-platform.git
cd estar-ai-platform

# 2. Copy environment template
cp .env.example .env
# Edit .env with your API keys and database credentials

# 3. Start all services with Docker Compose
docker-compose up --build

# Services available at:
# Landing Page:  http://localhost:3000
# API Gateway:   http://localhost:8000
# Audit Trail:   http://localhost:8001
# Stability:     http://localhost:8002
# OOT Alerting:  http://localhost:8003
# Data Entry:    http://localhost:8004
# PostgreSQL:    localhost:5432
```

### Docker Compose (Development)

```yaml
version: "3.9"
services:

  # Landing Page (React Portal)
  landing-page:
    build: ./landing-page
    ports: ["3000:3000"]
    environment:
      - VITE_API_GATEWAY=http://localhost:8000

  # MS-1: Audit Trail Service
  audit-trail-service:
    build: ./services/audit-trail-service
    ports: ["8001:8001"]
    environment:
      - AI_PROVIDER=gemini
      - GEMINI_API_KEY=${GEMINI_KEY}
      - DATABASE_URL=postgresql://epharmic:${DB_PASSWORD}@postgres:5432/epharmic_db
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres

  # MS-2: Stability Report Service (Team B)
  stability-report-service:
    image: enviroapps/stability-report:latest
    ports: ["8002:8002"]

  # MS-3: OOT Alerting Service (Team C)
  oot-alerting-service:
    image: enviroapps/oot-alerting:latest
    ports: ["8003:8003"]

  # MS-4: Data Entry Service (Team D)
  data-entry-service:
    image: enviroapps/data-entry:latest
    ports: ["8004:8004"]

  # API Gateway
  gateway:
    image: nginx:alpine
    ports: ["8000:8000"]
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/nginx.conf

  # Database
  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: epharmic_db
      POSTGRES_USER: epharmic
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Production Deployment Checklist

| # | Task | Status |
|---|------|--------|
| 1 | All 4 services start with `docker-compose up` | ☐ |
| 2 | `GET /health` returns valid JSON for each service (no auth) | ☐ |
| 3 | `GET /summary` returns valid JSON with JWT token | ☐ |
| 4 | `GET /activity/recent` returns activity array with JWT | ☐ |
| 5 | Landing page displays correct stats from all services | ☐ |
| 6 | Landing page shows merged activity feed | ☐ |
| 7 | Service offline → landing page degrades gracefully | ☐ |
| 8 | JWT authentication works end-to-end | ☐ |
| 9 | HTTPS configured with valid SSL certificate | ☐ |
| 10 | Database migrations applied via Alembic | ☐ |
| 11 | AI provider configured for production (OpenAI/Azure) | ☐ |
| 12 | Rate limiting enabled on API Gateway | ☐ |
| 13 | CORS restricted to production domain | ☐ |
| 14 | Environment-specific `.env` files secured | ☐ |
| 15 | Docker images tagged and pushed to registry | ☐ |
| 16 | Lighthouse performance score ≥ 90 | ☐ |
| 17 | Unit tests pass for all contract endpoints | ☐ |
| 18 | Dark mode fully functional | ☐ |
| 19 | Mobile layout verified at 375px | ☐ |
| 20 | Compliance documentation complete | ☐ |

### Production Docker Compose Additions

```yaml
# docker-compose.prod.yml — Production overrides
services:
  landing-page:
    environment:
      - VITE_API_GATEWAY=https://api.epharmic.enviroapps.com
    # Built and served via Nginx in production

  audit-trail-service:
    environment:
      - AI_PROVIDER=openai                    # Production AI provider
      - DATABASE_URL=snowflake://...          # Production database
    restart: always
    deploy:
      resources:
        limits:
          memory: 512M

  gateway:
    volumes:
      - ./gateway/nginx-prod.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt     # SSL certificates
```

### Dockerfile Template (Per Service)

```dockerfile
# services/audit-trail-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run database migrations on startup
RUN chmod +x entrypoint.sh

EXPOSE 8001

ENTRYPOINT ["./entrypoint.sh"]
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## 11. Team Onboarding Guide

### For Teams B, C, and D — What You Need to Do

Each team only needs to:

1. **Implement 3 mandatory endpoints** — See [API Contract](#mandatory-api-contract) section
2. **Accept JWT Authorization header** — `Authorization: Bearer <token>`
3. **Run on your assigned port** — Team B: `8002`, Team C: `8003`, Team D: `8004`
4. **Build and push a Docker image** — `enviroapps/<service-name>:latest`

Everything else (UI, business logic, internal DB, tech stack) is entirely up to each team.

### Minimum Viable Service Template

```python
# Quick-start: A minimal FastAPI service that passes the contract

from fastapi import FastAPI
from datetime import datetime, timezone

app = FastAPI()

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service_name": "your-service-name",
        "version": "1.0.0",
        "uptime_seconds": 0,
        "last_activity": datetime.now(timezone.utc).isoformat()
    }

@app.get("/summary")
async def summary():
    return {
        "total_processed": 0,
        "alerts_today": 0,
        "last_run": datetime.now(timezone.utc).isoformat(),
        "compliance_score": 100,
        "quick_stats": {}
    }

@app.get("/activity/recent")
async def activity(limit: int = 5):
    return {"items": []}
```

---

## 12. Compliance Mapping

| Regulation | What It Covers | How the Platform Complies |
|-----------|----------------|--------------------------|
| **21 CFR Part 11** | Electronic records & signatures | Append-only audit trail, e-signatures on critical actions, user auth, tamper detection |
| **ICH Q1A** | Stability testing guidelines | Automated stability data collection, trend analysis, report generation |
| **ICH Q1E** | Evaluation of stability data | Predictive OOT detection, statistical modeling, early warning alerts |
| **21 CFR Part 211** | Current GMP requirements | Validated data entry, automated compliance checks, role-based access |
| **GMP** | Good Manufacturing Practice | Data integrity controls, validated systems, audit trail completeness |

---

## 13. References

| Resource | Link |
|----------|------|
| 21 CFR Part 11 — Electronic Records | https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-11 |
| ICH Q1A — Stability Testing Guidelines | https://www.ich.org/page/quality-guidelines |
| ICH Q1E — Evaluation for Stability Data | https://www.ich.org/page/quality-guidelines |
| FastAPI Documentation | https://fastapi.tiangolo.com/ |
| SQLAlchemy + Alembic | https://alembic.sqlalchemy.org/ |
| shadcn/ui Components | https://ui.shadcn.com/ |
| TanStack Query | https://tanstack.com/query/latest |
| Zustand State Management | https://zustand-demo.pmnd.rs/ |

---

**Document Version:** 1.0.0  
**Last Updated:** February 24, 2026  
**Author:** Karthik8402  
**Company:** EnviroApps Inc  

---

*This document serves as the complete technical reference for the ePharmic AI Platform. For questions, contact the platform owner.*
