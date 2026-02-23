# Audit Trail Dashboard — UI/UX Specification
### eSTAR AI Platform · MS-1 Frontend

> **Module:** Audit Trail Dashboard (React — route `/audit`)
> **Owner:** Karthik8402
> **Stack:** React 18 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui
> **Parent:** Landing Page Portal (Port 3000)
> **Backend:** audit-trail-service (Port 8001)
> **Date:** 2026-02-23

---

## Relationship to the Landing Page

The Landing Page is the **portal**. It shows 4 service cards — one per microservice. When the user clicks "Open Dashboard →" on the Audit Trail card, React Router navigates to `/audit`, which renders this dashboard.

```
Landing Page (/)
  └── ServiceCard: "Audit Trail" → [Open Dashboard →]
        └── navigates to /audit
              └── AuditDashboard.tsx ← THIS SPEC
```

This dashboard shares the same `PlatformHeader`, the same design tokens, the same color system, the same typography, and the same spacing rules as the Landing Page. It is not a separate app — it's a route within the same React SPA.

**What stays the same:**
- CSS custom properties (all `var(--*)` tokens)
- Font stack (Inter + JetBrains Mono)
- Spacing scale (4px grid)
- Component primitives (badges, borders, shadows)
- PlatformHeader at the top
- Dark/light mode toggle behavior
- TanStack Query for server state
- Zustand for auth/JWT

**What's different:**
- This page has a **sidebar navigation** (the landing page does not)
- This page has **data tables** (the landing page only has cards and a feed)
- This page has **agent controls** (start/stop buttons — the landing page is read-only)
- This page has a **report viewer** (rendered Gemini-generated narrative text)

---

## Design Direction

This is a **working dashboard for a compliance team**. They will spend hours here reviewing anomalies, checking agent status, reading integrity reports. Every decision must favor **scanability and information density** over visual flair.

Think: **Linear.app's issue tracker** meets a **Datadog service page**. Dense, functional, keyboard-navigable, zero decoration.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  PLATFORM HEADER (shared — same as Landing Page)                │
│  ePharmic AI Platform        [☀/🌙] [K ▾]                      │
├────────────┬────────────────────────────────────────────────────┤
│            │                                                    │
│  SIDEBAR   │  MAIN CONTENT AREA                                │
│  200px     │  flex-1, scrollable                                │
│            │                                                    │
│  Overview  │  ┌────────────────────────────────────────────┐   │
│  Anomalies │  │  (active section renders here)             │   │
│  Integrity │  │                                            │   │
│  Reports   │  │                                            │   │
│  Agents    │  │                                            │   │
│  Settings  │  │                                            │   │
│            │  └────────────────────────────────────────────┘   │
│            │                                                    │
│  ← Back    │                                                    │
│            │                                                    │
├────────────┴────────────────────────────────────────────────────┤
│  FOOTER (shared — same as Landing Page)                         │
└─────────────────────────────────────────────────────────────────┘
```

### Shell Component

```tsx
// pages/AuditDashboard.tsx
<div className="flex h-[calc(100vh-56px)]">
  <AuditSidebar activeSection={section} onNavigate={setSection} />
  <main className="flex-1 overflow-y-auto px-8 py-6">
    {section === 'overview'   && <AuditOverview />}
    {section === 'anomalies'  && <AnomalyTable />}
    {section === 'integrity'  && <IntegrityView />}
    {section === 'reports'    && <ReportViewer />}
    {section === 'agents'     && <AgentControl />}
    {section === 'settings'   && <AuditSettings />}
  </main>
</div>
```

The sidebar + content area fill the viewport below the header. Content area scrolls independently. Sidebar is fixed.

---

## Sidebar — `AuditSidebar.tsx`

```
┌────────────┐
│            │
│  AUDIT     │  ← section title, caption size
│  TRAIL     │
│            │
│  Overview  │  ← active: bg var(--surface), text var(--text-primary)
│  Anomalies │     font-weight 500
│  Integrity │
│  Reports   │  ← inactive: text var(--text-secondary)
│  Agents    │     font-weight 400
│  Settings  │
│            │
│            │
│            │
│  ← Back    │  ← returns to landing page (/)
│            │
└────────────┘
```

| Element | Spec |
|---------|------|
| Width | 200px fixed |
| Background | `var(--background)` |
| Right border | `1px solid var(--border)` |
| Nav items | `body` size (14px), padding `8px 12px`, `border-radius: 8px` |
| Active item | `background: var(--surface)`, `color: var(--text-primary)`, `font-weight: 500` |
| Inactive item | `color: var(--text-secondary)`, `font-weight: 400` |
| Hover (inactive) | `background: var(--surface)`, `transition: background 150ms` |
| Active indicator | Left border `3px solid var(--brand)` on active item. No other indicator. |
| "← Back" link | `body-small`, `var(--text-tertiary)`. Bottom of sidebar, `margin-top: auto`. Navigates to `/` |
| Section title | "AUDIT TRAIL" in `caption` size, `var(--text-tertiary)`, uppercase, `tracking-wide`, `margin-bottom: 12px` |

Mobile (< 768px): Sidebar collapses into a horizontal tab bar below the header. Tabs scroll horizontally if needed.

---

## Section 1: Overview — `AuditOverview.tsx`

The default view when entering the dashboard. Shows everything at a glance — service health, today's numbers, compliance posture, and the last few events.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Audit Trail & Log Integrity                                │
│  21 CFR Part 11 Compliance Monitoring                       │
│                                                             │
│  ● Online  ·  v1.0.0  ·  Uptime 4h 23m  ·  Last run 2m ago│
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐│
│  │   1,204   │  │     3     │  │    94%    │  │    887   ││
│  │   LOGS    │  │  ALERTS   │  │COMPLIANCE │  │INTEGRITY ││
│  │ ANALYZED  │  │  TODAY    │  │  SCORE    │  │ PASSED   ││
│  └───────────┘  └───────────┘  └───────────┘  └──────────┘│
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Quick Stats                                                │
│                                                             │
│  Logs analyzed today     890                                │
│  Anomalies flagged         3                                │
│  Integrity checks        887                                │
│  Human errors detected     2                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Recent Activity                                            │
│                                                             │
│  WARN   Anomalous login pattern detected       2m ago       │
│         for user JohnDoe                                    │
│  INFO   Log integrity verified — 447           5m ago       │
│         entries validated                                   │
│  INFO   Daily compliance report generated     12m ago       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Overview components breakdown:

#### 1. Page Header Block

| Element | Spec |
|---------|------|
| Title | "Audit Trail & Log Integrity" — `heading-1` (28px, weight 700) |
| Subtitle | "21 CFR Part 11 Compliance Monitoring" — `body` (14px), `var(--text-secondary)` |
| Status line | Same inline format as Landing Page card status. `body-small`, `var(--text-secondary)`. Uses `·` separators. |
| Container | No background, no border. Just text with `margin-bottom: 32px`. |

#### 2. Metric Cards Row

A horizontal row of 4 metric cards. Each card is a small, self-contained block.

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <MetricCard value={1204}  label="LOGS ANALYZED"    />
  <MetricCard value={3}     label="ALERTS TODAY"     accent="warning" />
  <MetricCard value={94}    label="COMPLIANCE SCORE" suffix="%" />
  <MetricCard value={887}   label="INTEGRITY PASSED" />
</div>
```

**`MetricCard.tsx` spec:**

| Element | Spec |
|---------|------|
| Container | `var(--surface-raised)`, `border: 1px solid var(--border)`, `border-radius: 12px`, `padding: 20px` |
| Value | `metric` size (24px, JetBrains Mono, weight 700), `var(--text-primary)` |
| Label | `metric-label` (11px, uppercase, tracking-wide, weight 500), `var(--text-tertiary)` |
| Accent variant | When `accent="warning"`, value color is `var(--status-warning)`. When `accent="error"`, value is `var(--status-error)`. Default: `var(--text-primary)`. |
| Animation | `react-countup` on mount, 800ms. No animation on subsequent data refreshes — only on first paint. |
| Hover | `box-shadow: var(--shadow-md)`, `transition: box-shadow 200ms` |

Data source: `GET /summary` → `total_processed`, `alerts_today`, `compliance_score`, `quick_stats.integrity_checks_passed`

#### 3. Quick Stats Block

A simple key-value list. Not a table — just aligned rows.

| Element | Spec |
|---------|------|
| Container | `var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 12px`, `padding: 20px` |
| Section title | `heading-3` (16px, weight 600), `margin-bottom: 12px` |
| Row | `display: flex; justify-content: space-between; padding: 6px 0` |
| Key | `body` (14px), `var(--text-secondary)` |
| Value | `body` (14px), `var(--text-primary)`, `font-weight: 500`, JetBrains Mono |
| Separator | `border-bottom: 1px solid var(--border)` between rows. Last row: no border. |

Data source: `GET /summary` → `quick_stats` object. Keys are formatted from snake_case to Title Case.

#### 4. Recent Activity (Dashboard-Scoped)

Same visual format as the Landing Page's `GlobalActivityFeed`, but filtered to only show `service: "audit-trail"` events.

Data source: `GET /activity/recent?limit=10`

---

## Section 2: Anomalies — `AnomalyTable.tsx`

A data table showing all flagged anomalies. This is where the compliance team spends most of their time.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Anomalies                              [Filter ▾] [Export] │
│  3 flagged today · 47 total this week                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ SEVERITY │ TYPE         │ MESSAGE           │ TIME     ││
│  │──────────│──────────────│───────────────────│──────────││
│  │ ● WARN   │ human_error  │ Repeated failed   │ 2m ago   ││
│  │          │              │ logins → data edit │          ││
│  │──────────│──────────────│───────────────────│──────────││
│  │ ● ERROR  │ unauthorized │ Role mismatch:    │ 14m ago  ││
│  │          │              │ analyst → admin op │          ││
│  │──────────│──────────────│───────────────────│──────────││
│  │ ● WARN   │ human_error  │ Same field edited │ 23m ago  ││
│  │          │              │ 4x in one session │          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Showing 3 of 47  ·  [← Prev]  [Next →]                    │
│                                                             │
└───────���─────────────────────────────────────────────────────┘
```

### Table Spec

| Element | Spec |
|---------|------|
| Container | `var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 12px`, `overflow: hidden` |
| Table | Native `<table>` with `width: 100%`. Not a div-based fake table. Semantic HTML for accessibility. |
| Header row | `background: var(--surface)`, `caption` size, uppercase, `var(--text-tertiary)`, `font-weight: 600`, `tracking-wide` |
| Header border | `border-bottom: 2px solid var(--border)` |
| Body rows | `padding: 12px 16px`, `border-bottom: 1px solid var(--border)` |
| Row hover | `background: var(--surface)`, `transition: background 100ms` |
| Severity cell | `ServiceStatusBadge` component reused from Landing Page. Same colors, same dot + text pattern. |
| Type cell | `caption` size, `var(--text-secondary)`, JetBrains Mono. Raw value from API (`human_error`, `integrity_fail`, `unauthorized`). |
| Message cell | `body` size, `var(--text-primary)`. Truncated to 2 lines with `line-clamp-2`. Full text on row click/expand. |
| Time cell | `body-small`, `var(--text-tertiary)`. Relative format via `date-fns`. |

### Filter Bar

```
[All] [WARN] [ERROR] [CRITICAL]  ·  [Today] [This Week] [This Month]  ·  🔍 Search
```

| Element | Spec |
|---------|------|
| Filter pills | `inline-flex` buttons. Active: `background: var(--brand-subtle)`, `color: var(--brand)`, `font-weight: 500`. Inactive: `var(--text-secondary)`, no background. |
| Pill shape | `padding: 4px 12px`, `border-radius: 9999px`, `border: 1px solid var(--border)` |
| Active pill border | `border-color: var(--brand)` |
| Search input | `body` size, `var(--surface-raised)` background, `border: 1px solid var(--border)`, `border-radius: 8px`, `padding: 6px 12px`. Placeholder: "Search anomalies…" in `var(--text-tertiary)`. |
| Export button | Text button: "Export" in `body-small`, `var(--brand)`. Downloads anomalies as CSV. |

### Row Expansion

Clicking a row expands it inline to show full details:

```
│ ● WARN   │ human_error  │ Repeated failed logins...  │ 2m ago   │
│          ┌──────────────────────────────────────────────────────│
│          │ Full message: Repeated failed logins (4 attempts)   │
│          │ followed by successful login and immediate data     │
│          │ correction on record #4521.                         │
│          │                                                     │
│          │ User: JohnDoe  ·  Session: abc-123  ·  IP: 10.0.1.5│
│          │ Risk Score: 72.5  ·  AI Confidence: 0.87            │
│          │                                                     │
│          │ Raw payload: [View JSON]                             │
│          └──────────────────────────────────────────────────────│
```

| Element | Spec |
|---------|------|
| Expanded area | `background: var(--surface)`, `padding: 16px`, `border-top: 1px solid var(--border)` |
| Full message | `body` size, `var(--text-primary)` |
| Metadata line | `body-small`, `var(--text-secondary)`, separated by `·` |
| Risk score | `var(--text-primary)`, `font-weight: 500`. If ≥ 80: `var(--status-error)`. If ≥ 50: `var(--status-warning)`. |
| "View JSON" | Text link in `var(--brand)`. Opens a `<pre>` block with `raw_payload` formatted with 2-space indent, JetBrains Mono, `body-small`. |
| Expand/collapse | No animation. Instant show/hide. Toggled via local state. |

Data source: `GET /api/audit/reports/anomalies` → returns array of `AnomalyReport` objects.

### Pagination

| Element | Spec |
|---------|------|
| Position | Below the table, right-aligned |
| Text | `body-small`, `var(--text-tertiary)`: "Showing 1–10 of 47" |
| Buttons | "← Prev" and "Next →" text buttons. Disabled state: `var(--text-tertiary)`, `cursor: not-allowed`. Active: `var(--brand)`. |
| Page size | 10 items per page. Not configurable (keeps it simple). |

---

## Section 3: Integrity — `IntegrityView.tsx`

Shows the output of Agent 2 (Log Integrity & Authorization Verification). A summary + violation list.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Log Integrity                                              │
│  Last check: 4 minutes ago                                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │  Integrity Score                                      │  │
│  │  ██████████████████████████████████░░░░  94%           │  │
│  │                                                       │  │
│  │  887 entries verified  ·  3 violations found           │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Violations                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ● Missing electronic signature on critical action      ││
│  │   User: jdoe  ·  Action: batch_release  ·  14:23 UTC  ││
│  │───────────────────────────────────────────────────────────│
│  │ ● Unauthorized role action detected                    ││
│  │   User: analyst3  ·  Action: admin_config  ·  13:58 UTC││
│  │───────────────────────────────────────────────────────────│
│  │ ● Timestamp gap: 47s between event #4480 and #4481    ││
│  │   Tolerance: ±2s  ·  Module: data-entry  ·  13:41 UTC ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Checks Performed                                           │
│                                                             │
│  ✓ Sequential event numbering           Passed              │
│  ✓ Timestamp ordering                   Passed (3 warnings) │
│  ✓ Electronic signatures present        1 missing           │
│  ✓ RBAC authorization validation        1 violation         │
│  ✓ Before/after values on corrections   Passed              │
│  ✓ Checksum integrity                   Passed              │
│                                                             │
└──────────────────────────────────��──────────────────────────┘
```

### Integrity Score Block

Same visual pattern as the Landing Page's `PlatformOverview` compliance bar.

| Element | Spec |
|---------|------|
| Container | `var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 12px`, `padding: 24px` |
| Title | `heading-2` (20px, weight 600) |
| Subtitle | `body-small`, `var(--text-tertiary)`: "Last check: 4 minutes ago" |
| Progress bar | Height 8px, `border-radius: 4px`. Track: `var(--border)`. Fill color based on score: ≥90% → `var(--status-online)`, 70–89% → `var(--status-warning)`, <70% → `var(--status-error)`. |
| Score text | `metric` size (24px, mono, weight 700), right of bar |
| Summary line | `body-small`, `var(--text-secondary)`: "887 entries verified · 3 violations found" |

### Violations List

Same visual pattern as Activity Feed rows from the Landing Page.

| Element | Spec |
|---------|------|
| Container | `var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 12px` |
| Row | `padding: 14px 20px`, `border-bottom: 1px solid var(--border)` |
| Bullet | `●` colored by severity. Missing signature → `var(--status-error)`. RBAC → `var(--status-error)`. Timestamp gap → `var(--status-warning)`. |
| Primary text | `body` (14px), `var(--text-primary)` |
| Detail line | `body-small`, `var(--text-secondary)`, separated by `·` |

### Checks Performed List

A checklist showing what Agent 2 validated.

| Element | Spec |
|---------|------|
| Container | `var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 12px`, `padding: 20px` |
| Row | `display: flex; justify-content: space-between; padding: 8px 0` |
| Check name | `body`, `var(--text-primary)` with `✓` prefix in `var(--status-online)` |
| Result | `body`, right-aligned. "Passed" in `var(--status-online)`. "1 missing" / "1 violation" in `var(--status-error)`. "Passed (3 warnings)" in `var(--status-warning)`. |

Data source: `GET /api/audit/reports/integrity`

---

## Section 4: Reports — `ReportViewer.tsx`

Shows Gemini-generated narrative reports. The compliance team reads these for regulatory review.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Reports                              [Generate Report]     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Report Type   │  Generated     │  Score  │  Action  │   │
│  │────────────────│────────────────│─────────│──────────│   │
│  │  Daily         │  Today 23:55   │  94%    │  [View]  │   │
│  │  Weekly        │  Feb 16        │  91%    │  [View]  │   │
│  │  On-demand     │  Feb 14 09:30  │  88%    │  [View]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  Daily Activity Summary — Feb 23, 2026               │   │
│  │  ──────────────────────────────────                  │   │
│  │                                                      │   │
│  │  The audit trail system processed 1,204 log entries  │   │
│  │  during the reporting period. Three anomalies were   │   │
│  │  flagged for review...                               │   │
│  │                                                      │   │
│  │  CRITICAL FINDINGS                                   │   │
│  │  • One unauthorized role escalation detected (user   │   │
│  │    analyst3 attempted admin-level configuration)      │   │
│  │                                                      │   │
│  │  RECOMMENDATIONS                                     │   │
│  │  • Review access permissions for analyst3             │   │
│  │  • Schedule re-training for JohnDoe on login...      │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Reports Table

Same table styling as the Anomaly table but simpler — fewer columns, no expansion.

| Column | Spec |
|--------|------|
| Report Type | `body`, `var(--text-primary)`. Values: "Daily", "Weekly", "Monthly", "On-demand" |
| Generated | `body-small`, `var(--text-secondary)`. Relative or absolute date. |
| Score | `body`, JetBrains Mono. Color-coded: ≥90 green, 70-89 amber, <70 red. |
| Action | Text button "View" in `var(--brand)`. Clicking loads report text into the viewer below. |

### Report Text Viewer

| Element | Spec |
|---------|------|
| Container | `var(--surface-raised)`, `border: 1px solid var(--border)`, `border-radius: 12px`, `padding: 24px` |
| Title | `heading-2`, `var(--text-primary)` |
| Divider | `border-bottom: 1px solid var(--border)`, `margin: 8px 0 16px 0` |
| Body text | `body` (14px), `var(--text-primary)`, `line-height: 1.7`. Generous leading for readability — this is a narrative document, not a dashboard metric. |
| Section headers in text | All-caps, `caption` size, `var(--text-secondary)`, `font-weight: 600`, `letter-spacing: 0.05em`, `margin-top: 20px` |
| Bullet points | Standard `<ul>` with `list-disc`, `var(--text-primary)` |
| Max width | `max-width: 720px` — text blocks wider than this hurt readability. |

### Generate Report Button

| Element | Spec |
|---------|------|
| Position | Top-right of the Reports section, inline with the section title |
| Style | `background: var(--brand)`, `color: var(--text-inverse)`, `padding: 8px 16px`, `border-radius: 8px`, `font-weight: 500`, `body-small` size |
| Hover | `background: var(--brand-hover)`, `transition: background 150ms` |
| Loading state | Button text changes to "Generating…" with a small spinner (CSS `animate-spin` on a 14px circle). Button is disabled. |
| Action | `POST /api/audit/reports/generate`. On success: `toast.success("Report generated")`, refresh reports list. On error: `toast.error("Failed to generate report")`. |

Data source: `GET /api/audit/reports/summary` for report list and text content.

---

## Section 5: Agents — `AgentControl.tsx`

Shows the status of all 3 AI agents and provides start/stop controls.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Agent Control                     [Start All] [Stop All]   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │  Agent 1: Human Error Detection                         ││
│  │  ● Running  ·  Last run: 2m ago  ·  Cycle: 30s         ││
│  │                                                         ││
│  │  Purpose: Detects operator mistakes — repeated failed   ││
│  │  logins, bulk deletions, off-hours modifications,       ││
│  │  repeated field corrections.                            ││
│  │                                                         ││
│  │  Last Result: 2 patterns flagged (WARN)         [Stop]  ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │  Agent 2: Log Integrity Verification                    ││
│  │  ● Running  ·  Last run: 4m ago  ·  Cycle: 5min        ││
│  │                                                         ││
│  │  Purpose: Verifies audit trail completeness —           ││
│  │  sequential ordering, electronic signatures, RBAC       ││
│  │  authorization, checksum validation.                    ││
│  │                                                         ││
│  │  Last Result: 887/890 entries passed           [Stop]   ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │  Agent 3: Summary & Reporting                           ││
│  │  ● Idle  ·  Last run: 22h ago  ·  Next: 23:55 UTC      ││
│  │                                                         ││
│  │  Purpose: Generates narrative compliance summaries      ││
│  │  for regulatory review. Runs daily at 23:55 UTC         ││
│  │  or on-demand via Reports section.                      ││
│  │                                                         ││
│  │  Last Result: Daily report generated (94%)      [Start] ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└���────────────────────────────────────────────────────────────┘
```

### Agent Card Spec

| Element | Spec |
|---------|------|
| Container | `var(--surface-raised)`, `border: 1px solid var(--border)`, `border-radius: 12px`, `padding: 20px`, `margin-bottom: 16px` |
| Agent name | `heading-3` (16px, weight 600), `var(--text-primary)` |
| Status line | `body-small`, `var(--text-secondary)`, `·` separated. Uses `ServiceStatusBadge` for the status portion: "● Running" (green), "● Idle" (neutral/`var(--text-tertiary)`), "● Error" (red), "● Stopped" (red). |
| Purpose text | `body` (14px), `var(--text-secondary)`, `line-height: 1.6`. 2–3 sentences max. |
| Last result | `body-small`, `var(--text-primary)`. Right-aligned on the same line as the Stop/Start button. |
| Start/Stop button | Text button aligned bottom-right. "Stop" in `var(--status-error)`. "Start" in `var(--status-online)`. `body-small`, `font-weight: 500`. |

### Agent States

| State | Visual |
|-------|--------|
| Running | `● Running` green badge. Stop button visible. |
| Idle | `● Idle` neutral (gray). Start button visible. Shows "Next: 23:55 UTC" for scheduled agents. |
| Error | `● Error` red badge. Error message shown below purpose text in `body-small`, `var(--status-error)`. Start button visible (to retry). |
| Stopped | `● Stopped` red badge. Start button visible. |

### Bulk Controls

| Element | Spec |
|---------|------|
| "Start All" | `background: var(--status-online)`, `color: var(--text-inverse)`, `padding: 6px 14px`, `border-radius: 8px`, `body-small`, `font-weight: 500` |
| "Stop All" | `background: transparent`, `border: 1px solid var(--status-error)`, `color: var(--status-error)`, same sizing |
| Position | Top-right of section, inline with "Agent Control" title |
| Confirmation | Stopping all agents shows a confirm dialog (shadcn AlertDialog): "Stop all running agents? This will halt compliance monitoring." [Cancel] [Stop All] |

Data source: `GET /api/audit/agents/status`
Actions: `POST /api/audit/agents/start`, `POST /api/audit/agents/stop`

---

## Section 6: Settings — `AuditSettings.tsx`

Configuration for detection thresholds and compliance rules. Read-only display with edit capability.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Settings                                           [Save]  │
│                                                             │
│  Detection Thresholds                                       │
│  ──────────────────                                         │
│                                                             │
│  Failed login threshold          3  attempts                │
│  Bulk deletion threshold        10  records                 │
│  Off-hours start               22:00  local                 │
│  Off-hours end                 06:00  local                 │
│  Field correction limit          3  per session             │
│  Timestamp tolerance             2  seconds                 │
│                                                             │
│  Compliance Rules                                           │
│  ────────────────                                           │
│                                                             │
│  Regulation: 21 CFR Part 11                                 │
│  Electronic signatures: Required on CRITICAL actions        │
│  Audit trail: Append-only (no UPDATE/DELETE)                │
│  Access controls: RBAC validated per request                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Settings Rows

| Element | Spec |
|---------|------|
| Container | `var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 12px`, `padding: 20px` |
| Section title | `heading-3`, `var(--text-primary)`, with underline (`border-bottom: 1px solid var(--border)`, `padding-bottom: 8px`, `margin-bottom: 16px`) |
| Row | `display: flex; justify-content: space-between; align-items: center; padding: 10px 0`, `border-bottom: 1px solid var(--border)` |
| Label | `body`, `var(--text-secondary)` |
| Value | `body`, JetBrains Mono, `var(--text-primary)`, `font-weight: 500` |
| Editable values | On edit mode: replace text with `<input>` — `background: var(--surface-raised)`, `border: 1px solid var(--border-strong)`, `border-radius: 6px`, `padding: 4px 8px`, `width: 80px`, `text-align: right`, JetBrains Mono |
| Save button | Same style as "Generate Report" button. Calls `PUT /api/audit/config/rules`. |
| Compliance Rules section | Read-only. No edit capability. Displayed as informational key-value rows. |

Data source: `GET /api/audit/config/rules`, `GET /api/audit/config/thresholds`

---

## Hooks Specification (Dashboard-Specific)

### `useAuditSummary.ts`

```typescript
// Fetches GET /summary — same as Landing Page but used for dashboard metrics
// Reuses the Landing Page hook but with dashboard-specific cache key
// JWT required

// Uses TanStack Query with:
// - queryKey: ['audit', 'summary']
// - refetchInterval: 30_000
```

### `useAnomalies.ts`

```typescript
// Fetches GET /api/audit/reports/anomalies
// Supports pagination: ?page=1&limit=10
// Supports filtering: ?severity=warn&type=human_error

interface Anomaly {
  event_id: string;
  timestamp: string;
  anomaly_type: 'human_error' | 'integrity_fail' | 'unauthorized';
  severity: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  risk_score: number;
  ai_confidence: number;
  user: string;
  session_id: string;
  raw_payload: Record<string, unknown>;
}

// Uses TanStack Query with:
// - queryKey: ['audit', 'anomalies', { page, severity, type }]
// - keepPreviousData: true (smooth pagination)
```

### `useIntegrity.ts`

```typescript
// Fetches GET /api/audit/reports/integrity

interface IntegrityReport {
  integrity_score: number;
  entries_verified: number;
  violations: Array<{
    type: string;
    message: string;
    user?: string;
    action?: string;
    timestamp: string;
  }>;
  checks: Array<{
    name: string;
    passed: boolean;
    detail: string;  // "Passed", "1 missing", "Passed (3 warnings)"
  }>;
  last_check: string;
}

// Uses TanStack Query with:
// - queryKey: ['audit', 'integrity']
// - refetchInterval: 60_000 (integrity checks run less frequently)
```

### `useReports.ts`

```typescript
// Fetches GET /api/audit/reports/summary — list of generated reports
// POST /api/audit/reports/generate — trigger new report

interface AuditReport {
  report_id: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  generated_at: string;
  compliance_score: number;
  anomaly_count: number;
  summary_text: string;
}

// Uses TanStack Query with:
// - queryKey: ['audit', 'reports']
// - useMutation for POST /generate
```

### `useAgentStatus.ts`

```typescript
// Fetches GET /api/audit/agents/status
// POST /api/audit/agents/start and /stop

interface AgentStatus {
  agent_id: string;
  name: string;
  status: 'running' | 'idle' | 'error' | 'stopped';
  last_run: string | null;
  next_run: string | null;
  cycle_seconds: number | null;
  last_result: string | null;
  error_message: string | null;
}

// Uses TanStack Query with:
// - queryKey: ['audit', 'agents']
// - refetchInterval: 15_000 (agents change state more frequently)
// - useMutation for start/stop
```

---

## File Structure

```
landing-page/src/
├── components/
│   ├── layout/
│   │   ├── PlatformHeader.tsx            ← Shared
│   │   └── PlatformFooter.tsx            ← Shared
│   ├── overview/
│   │   └── PlatformOverview.tsx          ← Landing Page only
│   ├── services/
│   │   ├── ServiceCard.tsx               ← Landing Page only
│   │   ├── ServiceCardGrid.tsx           ← Landing Page only
│   │   ├── ServiceStatusBadge.tsx        ← Shared (reused in dashboard)
│   │   └── SkeletonCard.tsx              ← Landing Page only
│   ├── feed/
│   │   └── GlobalActivityFeed.tsx        ← Shared (filtered in dashboard)
│   ├── shared/
│   │   ├── ErrorBoundary.tsx             ← Shared
│   │   └── MetricCard.tsx                ← Shared (used in both)
│   │
│   └── audit/                            ← NEW — Dashboard components
│       ├── AuditSidebar.tsx
│       ├── AuditOverview.tsx
│       ├── AnomalyTable.tsx
│       ├── AnomalyRow.tsx                ← Single row + expand logic
│       ├── IntegrityView.tsx
│       ├── IntegrityScoreBar.tsx
│       ├── ViolationList.tsx
│       ├── CheckList.tsx
│       ├── ReportViewer.tsx
│       ├── ReportTable.tsx
│       ├── ReportTextBlock.tsx
│       ├── AgentControl.tsx
│       ├── AgentCard.tsx
│       ├── AuditSettings.tsx
│       └── FilterBar.tsx
│
├── hooks/
│   ├── useServiceHealth.ts               ← Shared
│   ├── useServiceSummary.ts              ← Shared
│   ├── useActivityFeed.ts                ← Shared
│   │
│   └── audit/                            ← NEW — Dashboard hooks
│       ├── useAuditSummary.ts
│       ├── useAnomalies.ts
│       ├── useIntegrity.ts
│       ├── useReports.ts
│       └── useAgentStatus.ts
│
├── pages/
│   ├── LandingPage.tsx                   ← Landing Page route (/)
│   └── AuditDashboard.tsx                ← Dashboard route (/audit) — NEW
│
├── config/
│   └── services.ts
├── store/
│   └── auth.ts
├── styles/
│   └── index.css
├── App.tsx                               ← Router: / → LandingPage, /audit → AuditDashboard
└── main.tsx
```

---

## Routing

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuditDashboard from './pages/AuditDashboard';
import PlatformHeader from './components/layout/PlatformHeader';
import PlatformFooter from './components/layout/PlatformFooter';

export default function App() {
  return (
    <BrowserRouter>
      <PlatformHeader />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/audit" element={<AuditDashboard />} />
        {/* Future: /stability, /oot, /data-entry */}
      </Routes>
      <PlatformFooter />
    </BrowserRouter>
  );
}
```

---

## Loading & Error States

### Per-Section Skeletons

Every section that depends on API data shows a skeleton matching its exact layout dimensions. Same `animate-pulse` as the Landing Page — no custom shimmer.

| Section | Skeleton |
|---------|----------|
| Overview metric cards | 4 gray blocks in a row, matching card height |
| Quick stats | 4 rows of two gray bars (key + value) |
| Activity feed | 5 rows with gray bars for service name, message, time |
| Anomaly table | Table header + 5 skeleton rows |
| Integrity score | One gray bar (progress) + two lines |
| Violations | 3 skeleton rows |
| Reports table | 3 skeleton rows |
| Report text | 8 lines of gray bars at different widths |
| Agent cards | 3 cards with gray bars inside |
| Settings | 6 key-value skeleton rows |

### Error States

Each section is wrapped in its own `ErrorBoundary`. If a section's data fetch fails:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Unable to load anomaly data.                   │
│  [Retry]                                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

Same as Landing Page error card — plain text, "Retry" in `var(--brand)`, invalidates the relevant query key.

If the entire `/health` check fails (service is down), the dashboard shows a full-page centered message:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           Audit Trail Service Unavailable                    │
│                                                             │
│           Port 8001 is not responding.                       │
│           The service may be stopped or restarting.          │
│                                                             │
│           [Retry]  [← Back to Dashboard]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Animations — Same Rules as Landing Page

| What | Animation | Duration |
|------|-----------|----------|
| Metric card numbers | Count from 0 on first mount | 800ms |
| Integrity score bar fill | Width transition | 600ms, ease-out |
| Card hover | Shadow increase | 200ms |
| Sidebar active item | Background color change | 150ms |
| Skeleton pulse | Opacity pulse | Tailwind `animate-pulse` |

**No page transitions.** Section swaps are instant — the sidebar click changes the section state, the new section renders immediately. No fade, no slide. Instant is faster.

**No staggered list animations.** Table rows and violation items render all at once. Staggering 47 anomaly rows by 50ms each would be absurd.

---

## Toast Notifications (Dashboard-Specific)

| Event | Toast |
|-------|-------|
| Agent started | `toast.success("Human Error Detection agent started")` |
| Agent stopped | `toast("Log Integrity agent stopped", { icon: "⏹" })` |
| Agent error | `toast.error("Summary agent failed", { description: error.message })` |
| Report generated | `toast.success("Daily report generated", { description: "Compliance score: 94%" })` |
| Report failed | `toast.error("Report generation failed", { description: "Gemini API timeout" })` |
| Settings saved | `toast.success("Thresholds updated")` |
| Settings save failed | `toast.error("Failed to save settings")` |

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| < 768px | Sidebar → horizontal tab bar below header. Metric cards → 2×2 grid. Tables → horizontal scroll with `min-width: 600px`. Agent cards → single column. |
| 768–1024px | Sidebar visible (200px). Content area fills remaining. Metric cards → 2×2 or 4-col depending on section width. |
| > 1024px | Full layout. Sidebar (200px) + content. Tables are comfortable. |
| > 1280px | Content area maxes at 1080px within the content panel. Prevents overly wide table rows. |

---

## What's NOT in This Dashboard

| Excluded | Reason |
|----------|--------|
| Charts / graphs | The Overview section uses metric cards and a progress bar. Recharts adds 200KB+ for a bar chart that doesn't add more signal than the numbers themselves. If charts are needed later, they're added to a dedicated "Analytics" section — not crammed into Overview. |
| Real-time WebSocket feed | The backend uses polling (30s). Building a WebSocket layer for a polling backend is artificial. When the backend supports WebSocket, the dashboard adopts it. |
| Drag-and-drop | Nothing in this dashboard needs reordering. |
| Multi-select bulk actions on anomalies | Phase 1 scope. The compliance team reviews anomalies one at a time. Bulk acknowledge can be added if usage patterns demand it. |
| PDF export from browser | Reports are generated server-side by Agent 3. The browser displays text. If PDF is needed, it's a `GET /api/audit/reports/{id}/pdf` endpoint — not a client-side `html2pdf`. |
| Inline AI chat | The agents run server-side. There is no chat interface. The dashboard shows agent outputs, not a conversation. |

---

## Acceptance Criteria

| # | Criterion | Validation |
|---|-----------|------------|
| 1 | `/audit` route renders the dashboard with sidebar and Overview section | Navigation from Landing Page card works |
| 2 | All 6 sidebar sections render their content | Click each nav item → correct section appears |
| 3 | Overview metrics match `/summary` API response | Compare card values to raw API response |
| 4 | Anomaly table loads and paginates | Page through 47+ anomalies at 10 per page |
| 5 | Anomaly rows expand to show full details | Click row → expanded view with risk score, raw JSON |
| 6 | Severity and type filters work on anomaly table | Filter by WARN → only WARN rows. Filter by human_error → only human_error rows. |
| 7 | Integrity score bar reflects actual score | Score of 94% → bar fills to 94% with green color |
| 8 | Violations list shows all integrity failures | Count matches API response |
| 9 | Report viewer displays Gemini-generated text | Narrative is readable with proper formatting |
| 10 | Generate Report button triggers API and shows toast | POST succeeds → toast + new report in list |
| 11 | Agent cards show correct status for all 3 agents | Running/Idle/Error/Stopped matches API |
| 12 | Start/Stop buttons control agents | Start → status changes to Running. Stop → confirm dialog → Stopped. |
| 13 | Settings display current thresholds | Values match `GET /config/thresholds` |
| 14 | Settings save persists changes | Edit value → Save → refresh → value persists |
| 15 | Dashboard shows full-page error when service is down | Stop audit-trail-service → dashboard shows "Service Unavailable" |
| 16 | Mobile layout is functional | Sidebar collapses to tabs, tables scroll horizontally, all content accessible at 375px |
| 17 | Design tokens match Landing Page exactly | Same colors, same fonts, same spacing, same border-radius, same shadows |