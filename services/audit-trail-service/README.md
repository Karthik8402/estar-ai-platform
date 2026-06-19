# eSTAR AI Platform: Audit Trail Microservice

A highly performant, 21 CFR Part 11 compliant audit trail microservice powered by **FastAPI**, **PostgreSQL**, and **Google Gemini AI**.

This service acts as the central brain for the ePharmic AI Platform's logs, maintaining an immutable record of system events, cryptographic integrity checks, and autonomous AI-driven anomaly detection.

## Features
- **FastAPI REST API**: High-performance, asynchronous endpoints serving the React frontend.
- **Snowflake Database Schema**: Complex PostgreSQL schema tracking users, roles, compliance modules, actions, time dimensions, and audit facts.
- **Autonomous AI Agents (APScheduler)**:
  - `Agent 1`: Log Analyzer (Detects human error patterns like repeated failed logins).
  - `Agent 2`: Integrity Monitor (Validates electronic signatures and Role-Based Access Controls).
  - `Agent 3`: Compliance AI (Triggers proactive summaries).
- **Gemini 2.5 Flash Integration**: Connects directly to Google's generative AI to produce regulatory-ready, on-demand compliance reports based on real-time database facts.

## Agent Workflow
![Agent Workflow Architecture](docs/agent_workflow.png)

## Getting Started

### 1. Prerequisites
- Python 3.11+
- PostgreSQL
- Docker (optional for easiest DB setup)

### 2. Environment Setup
Copy the example environment file and add your actual API keys:
```bash
cp .env.example .env
```
Ensure you add your `GEMINI_API_KEY` to the `.env` file. Do NOT commit the `.env` file to version control.

Set `DATABASE_URL` to your primary PostgreSQL connection string. If your cloud DB hostname occasionally fails DNS resolution, set `DATABASE_URL_FALLBACK` to a local PostgreSQL URL so startup can still proceed in development.

Example local values:
```env
DATABASE_URL=postgresql://epharmic:change-me-in-development@localhost:5432/epharmic_db
DATABASE_URL_FALLBACK=
DB_CONNECT_TIMEOUT_SECONDS=8
AUTO_CREATE_TABLES=true
ENABLE_SCHEDULER=true
CORS_ALLOW_ALL=false
```

### 3. Database Initialization
Start your PostgreSQL instance. If you are using Docker, run:
```bash
docker run -d --name epharmic-pg -e POSTGRES_DB=epharmic_db -e POSTGRES_USER=epharmic -e POSTGRES_PASSWORD=change-me-in-development -p 5432:5432 postgres:15
```

Install the Python dependencies:
```bash
python -m pip install -r requirements.txt
```

Seed the database with 50 realistic demo facts, roles, compliance rules, and agents:
```bash
python -m db.seed
```

### 4. Running the Service
Start the FastAPI server (which automatically launches the APScheduler background agents):
```bash
python -m uvicorn api.main:app --port 8001 --reload
```
The API contract and interactive Swagger UI will be available at `http://localhost:8001/docs`.

For API smoke tests that do not need a live database, run:
```bash
python -m unittest discover -s tests
```

### Troubleshooting: "could not translate host name"

This indicates DNS/network resolution failed for your DB host at startup.

- Verify your hostname and credentials in `.env` are correct.
- On Windows, test DNS directly: `nslookup <your-db-host>`.
- If cloud DNS is unstable, use a local Docker PostgreSQL instance and point `DATABASE_URL` (or `DATABASE_URL_FALLBACK`) to `localhost`.

## Core API Endpoints

### Data Retrieval
- `GET /activity/recent`: Returns the latest unified audit events.
- `GET /reports/summary`: Returns the latest generated compliance reports.
- `GET /reports/anomalies`: Paginated endpoints for viewing flagged anomalies.
- `GET /reports/integrity`: Returns the latest integrity check passes/failures.

### AI & Agents
- `POST /reports/generate`: Triggers an immediate generative AI summary report from Gemini.
- `GET /agents/status`: View the current run-state of the background loops.
- `POST /agents/start-all`: Resumes all AI background loops.
- `POST /agents/stop-all`: Pauses all AI background loops.

## Methodology & Algorithms

The Audit Trail Service implements a sophisticated multi-agent architecture for pharmaceutical compliance monitoring:

### 1. Database Architecture — Star Schema
The service uses a **snowflake star schema** (dimensions may reference sub-dimensions) optimizing analytical queries over pharmaceutical audit events per 21 CFR Part 11.

Key dimensions:
- `dim_role`: User roles with permission JSON
- `dim_user`: User accounts linked to roles
- `dim_compliance`: Regulatory frameworks
- `dim_module`: System modules like `stability_testing`
- `dim_action`: Action categories with e-signature requirements
- `dim_time`: Granular time dimensions including off-hours detection
- `dim_session`: Session tracking with IP and device fingerprinting

Central fact table `fact_audit_events` stores:
- Event metadata (UUID, timestamp, risk score)
- Compliance status flags
- Session and user references
- Raw payload for debugging

### 2. Agent 1 — Human Error Detection
- **Schedule**: Every 30 seconds
- **Core Patterns**:
  - Failed login clustering (detects brute-force attacks)
  - Off-hours activity detection (critical ops outside business hours)
  - High risk score events (automatically flagged)
  - Repeated field corrections (potential data manipulation)
  - Missing correction reasons (21 CFR Part 11 compliance requirement)
  - Self-approval detection (segregation of duties enforcement)

All thresholds are dynamically configurable via the `audit_thresholds` table without requiring service restarts.

### 3. Agent 2 — Log Integrity Verification
- **Schedule**: Every 60 seconds
- **Six integrity checks**:
  1. Sequential event numbering (detects timestamp manipulation)
  2. Electronic signatures on critical actions (RBAC compliance)
  3. Role-based access control validation
  4. Timestamp ordering (detects >1hr gaps indicating anomalies)
  5. Before/after values on corrections (maintains data provenance)
  6. Referential integrity (prevents orphaned records)

Results are upserted to maintain only the latest check status, enabling efficient dashboard rendering.

### 4. Agent 3 — Compliance Reporter
- **Schedule**: Every 120 seconds
- **Trigger-based reporting**: Generates compliance reports when critical anomalies exceed thresholds
- **AI-powered report generation**: Uses engineered prompts with Gemini AI for regulatory-grade documentation
- **Unique output requirements**: Plain text, ALL-CAPS section headers, 21 CFR Part 11 terminology

### 5. Data Simulation
- Generates realistic pharmaceutical audit patterns with controlled probabilities
- Covers brute force simulations, field corrections, missing signatures, and off-hours activities
- Ensures continuous testing environment with fresh data

### 6. Scheduler Architecture
- APScheduler integrated with FastAPI lifespan
- Configurable misfire grace periods prevent missed executions
- Jobs: `job_agent_1` (30s), `job_agent_2` (60s), `job_agent_3` (120s), `job_data_simulator` (180s)

## API Surface
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health, agent status, compliance score |
| `/summary` | GET | Aggregate stats for dashboard overview |
| `/activity` | GET | Recent audit event feed |
| `/api/audit/anomalies` | GET | Paginated anomaly list with filters |
| `/api/audit/integrity` | GET | Integrity check results + violations |
| `/api/audit/reports` | GET | Report list + content |
| `/api/audit/reports/generate` | POST | On-demand AI report generation |
| `/api/audit/agents` | GET/POST | Agent status control |
| `/api/audit/config` | GET/PUT | Threshold configuration |

## Security & Compliance Design Decisions
- **Star schema**: Optimizes analytical queries while mirroring data warehouse best practices
- **Upsert pattern**: Prevents table growth while maintaining latest check status
- **Configurable thresholds**: Compliance officers can tune detection without code changes
- **Low AI temperature (0.4)**: Ensures authoritative, reproducible regulatory language
- **Single `is_compliant` flag**: Enables fast filtering across all integrity checks
- **Exception handling**: Prevents raw stack traces in production regulatory environments

This implementation reflects the methodology as developed in `agents/scheduler.py`, `api/routes/`, `db/models.py`, and `shared_ai/` of the `audit-trail-service`.
