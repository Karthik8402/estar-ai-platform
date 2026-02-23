# Landing Page — UI/UX Specification
### eSTAR (Electronic Stability Testing and Reporting) AI Platform · EnviroApps Inc

> **Module:** Landing Page (React Portal)
> **Owner:** Karthik8402
> **Stack:** React 18 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui
> **Port:** 3000
> **Date:** 2026-02-23

---

## Design Direction

This is not a marketing page. This is the **operational control surface** for a pharmaceutical AI platform handling 21 CFR Part 11 compliance. Every pixel must earn its place.

The UI follows the design language of **ui.anchoos.com** — structured component blocks, generous whitespace, crisp typography, consistent card systems, and zero decorative noise. No particle backgrounds. No glassmorphism for the sake of it. No gradient text unless it serves hierarchy.

The page is a **dashboard portal** — it shows what's running, what's broken, what needs attention, and gives you one click to get into any service.

---

## Design Principles

1. **Density without clutter.** Show more information per screen, but never crowd it. Use whitespace as structure, not filler.
2. **Components, not pages.** Every section is a composable block. Cards, badges, feeds — each one works in isolation and composes cleanly.
3. **Typography does the work.** Don't rely on color or icons to create hierarchy. Font weight, size, and spacing should communicate importance before anything else.
4. **Muted by default, vivid on intent.** The base palette is neutral. Color appears only for status, actions, and alerts — never decoration.
5. **No loading jank.** Every data-dependent component has a skeleton. Layout dimensions are fixed before data arrives. Zero cumulative layout shift.
6. **Accessible.** All interactive elements have focus states. Color is never the sole indicator of meaning. Contrast ratios meet WCAG AA.

---

## Color System

Two modes: Light (default) and Dark. The system uses CSS custom properties with `class="dark"` toggle on `<html>`.

```css
:root {
  /* Neutrals — Light Mode */
  --background:       #ffffff;
  --surface:          #f8f9fb;
  --surface-raised:   #ffffff;
  --border:           #e4e7ec;
  --border-strong:    #cdd1da;

  /* Text */
  --text-primary:     #0f1729;
  --text-secondary:   #4b5563;
  --text-tertiary:    #9ca3af;
  --text-inverse:     #ffffff;

  /* Brand */
  --brand:            #4f46e5;    /* indigo-600 */
  --brand-hover:      #4338ca;    /* indigo-700 */
  --brand-subtle:     #eef2ff;    /* indigo-50 */
  --brand-muted:      #c7d2fe;    /* indigo-200 */

  /* Status — functional only */
  --status-online:    #059669;    /* emerald-600 */
  --status-online-bg: #ecfdf5;
  --status-warning:   #d97706;    /* amber-600 */
  --status-warning-bg:#fffbeb;
  --status-error:     #dc2626;    /* red-600 */
  --status-error-bg:  #fef2f2;
  --status-info:      #2563eb;    /* blue-600 */
  --status-info-bg:   #eff6ff;

  /* Shadows */
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:  0 2px 8px rgba(0,0,0,0.06);
  --shadow-lg:  0 4px 16px rgba(0,0,0,0.08);
  --shadow-card-hover: 0 8px 24px rgba(0,0,0,0.10);
}

.dark {
  --background:       #09090b;
  --surface:          #111113;
  --surface-raised:   #18181b;
  --border:           #27272a;
  --border-strong:    #3f3f46;

  --text-primary:     #fafafa;
  --text-secondary:   #a1a1aa;
  --text-tertiary:    #52525b;

  --brand-subtle:     #1e1b4b;
  --status-online-bg: #064e3b;
  --status-warning-bg:#78350f;
  --status-error-bg:  #7f1d1d;
  --status-info-bg:   #1e3a5f;

  --shadow-sm:  0 1px 2px rgba(0,0,0,0.20);
  --shadow-md:  0 2px 8px rgba(0,0,0,0.30);
  --shadow-lg:  0 4px 16px rgba(0,0,0,0.35);
  --shadow-card-hover: 0 8px 24px rgba(0,0,0,0.40);
}
```

> **Rule:** Service-specific accent colors (`service.color` from `service-registry.json`) are used ONLY for the small accent indicator on each card. They never bleed into backgrounds or text.

---

## Typography

One font family. No decorative typefaces.

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
}
```

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `heading-1` | 28px / 1.75rem | 700 | Page title — "ePharmic AI Platform" |
| `heading-2` | 20px / 1.25rem | 600 | Section titles — "Services", "Activity" |
| `heading-3` | 16px / 1rem | 600 | Card titles — service names |
| `body` | 14px / 0.875rem | 400 | Descriptions, feed messages |
| `body-small` | 13px / 0.8125rem | 400 | Timestamps, secondary labels |
| `caption` | 12px / 0.75rem | 500 | Badges, status text, metadata |
| `metric` | 24px / 1.5rem | 700, mono | KPI numbers on cards |
| `metric-label` | 11px / 0.6875rem | 500, uppercase, tracking-wide | Labels under metrics — "LOGS ANALYZED" |

**Hierarchy rule:** Within any card or section, there should be exactly 3 levels of visual weight — one bold element, one normal element, one muted element. Never more.

---

## Spacing Scale

Based on a 4px grid. No arbitrary values.

```
4  8  12  16  20  24  32  40  48  64  80
```

| Context | Value |
|---------|-------|
| Inline element gap | 8px |
| Card internal padding | 20px |
| Between cards (grid gap) | 16px |
| Section vertical spacing | 48px |
| Page horizontal padding | 24px (mobile), 48px (desktop) |
| Page max width | 1280px, centered |

---

## Page Layout

No sidebars. No tabs on the landing page. One continuous vertical scroll.

```
┌─────────────────────────────────────────────────────────┐
│  HEADER — sticky, 56px height                           │
│  Logo · Platform status summary · Theme toggle · User   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PLATFORM OVERVIEW BAR                                  │
│  Compliance score · Services online · Last sync time    │
│                                                         │
├────��────────────────────────────────────────────────────┤
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
│                                                         │
│  ACTIVITY FEED — last 10 events across all services     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  FOOTER — compliance references, version, copyright     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Page container:
```tsx
<main className="mx-auto max-w-[1280px] px-6 md:px-12 py-8">
  <PlatformOverview />
  <ServiceCardGrid />
  <ActivityFeed />
</main>
```

---

## Component Specifications

### 1. `PlatformHeader.tsx`

A narrow, functional header. Not a hero.

```
 ┌─────────────────────────────────────────────────────────┐
 │  🧪 ePharmic AI Platform          [☀/🌙] [K ▾]         │
 └─────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Height | 56px |
| Position | `sticky top-0 z-50` |
| Background | `var(--background)` with `border-b: 1px solid var(--border)` |
| Logo | Text only. "ePharmic" in `heading-3` weight 700, `var(--text-primary)`. "AI Platform" in weight 400, `var(--text-secondary)`. No image logo, no emoji in production. |
| Right side | Theme toggle (sun/moon icon button), User dropdown (initial avatar + name + chevron) |
| No transparency, no blur | Solid background. Simple. |

### 2. `PlatformOverview.tsx`

A single horizontal bar summarizing the entire platform at a glance.

```
 ┌─────────────────────────────────────────────────────────┐
 │                                                         │
 │  Platform Compliance                                    │
 │  ██████████████████░░░░  87%                            │
 │                                                         │
 │  4 Services  ·  3 Online  ·  1 Degraded  ·  Synced 30s ago │
 │                                                         │
 └─────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Container | `var(--surface)` background, `border: 1px solid var(--border)`, `border-radius: 12px`, padding 24px |
| Compliance bar | Native `<div>` progress bar. Track: `var(--border)`, fill: `var(--brand)`. Height 8px, border-radius 4px. |
| Score text | `metric` size, `var(--text-primary)`, displayed right of bar |
| Status line | `body-small` size, `var(--text-secondary)`. Uses `·` as separator. Status counts are computed from health poll results. |
| Compliance score | Averaged from all services' `/summary` → `compliance_score`. If a service is down, it's excluded from the average and noted. |
| Animation | Bar width transitions via CSS `transition: width 600ms ease-out`. Score number uses `react-countup` on initial mount only — not on every refresh. |

### 3. `ServiceCard.tsx`

The most important component. Each card represents one microservice. Clean, dense, scannable.

```
 ┌─────────────────────────────────────────────────────────┐
 │ ┃                                                       │
 │ ┃  Agentic AI — Audit Trail & Log Integrity             │
 │ ┃  Multi-agent AI monitoring audit trails               │  ← truncated to 1 line
 │ ┃                                                       │
 │ ┃  ● Online                                  Karthik8402│
 │ ┃                                                       │
 │ ┃  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
 │ ┃  │  1,204   │  │    3     │  │   94%    │            │
 │ ┃  │PROCESSED │  │ ALERTS   │  │COMPLIANCE│            │
 │ ┃  └──────────┘  └──────────┘  └──────────┘            │
 │ ┃                                                       │
 │ ┃  ░░░░░░░░░░░░░░░░░░░░  94%                           │
 │ ┃                                                       │
 │ ┃  Features: Human Error Detection · Log Integrity ·    │
 │ ┃            Compliance Reports                         │
 │ ┃                                                       │
 │ ┃                              [Open Dashboard →]       │
 │ ┃                                                       │
 └─────────────────────────────────────────────────────────┘
   ↑
   4px left border using service.color from registry
```

#### Card construction rules:

| Layer | Spec |
|-------|------|
| Container | `var(--surface-raised)`, `border: 1px solid var(--border)`, `border-radius: 12px`, `padding: 20px` |
| Left accent | `border-left: 4px solid {service.color}` — the ONLY place service color appears |
| Hover | `box-shadow: var(--shadow-card-hover)`, `border-color: var(--border-strong)`, `transition: all 200ms ease` — NO translateY, no scale, no glow. Just shadow and border. |
| Title | `heading-3`, `var(--text-primary)`. Text from `service.name` in registry. |
| Description | `body-small`, `var(--text-tertiary)`, single line, `text-overflow: ellipsis` |
| Status badge | See `ServiceStatusBadge` spec below |
| Owner | `caption` size, `var(--text-tertiary)`, aligned right of status row |
| Metrics row | 3 columns. Number in `metric` (mono, weight 700). Label in `metric-label` (uppercase, tracking-wide, `var(--text-tertiary)`). |
| Progress bar | Same as PlatformOverview bar but uses `service.color` for fill. Height 6px. |
| Features | `caption` size, `var(--text-tertiary)`. Comma-separated from `service.features` array. |
| CTA button | Text button: "Open Dashboard →". `body-small`, `var(--brand)`, `font-weight: 500`. Hover: `var(--brand-hover)`, underline. No background, no border. Right-aligned. |

#### Card data mapping:

```
service-registry.json  →  Static: name, description, icon, color, features, owner
GET /health            →  Status badge (healthy/degraded/down)
GET /summary           →  Metrics: total_processed, alerts_today, compliance_score
```

#### Card states:

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton placeholder. Card dimensions are identical. Three shimmer bars for title, metrics, progress. |
| **Healthy** | Full card with all data. Status badge green. |
| **Degraded** | Full card but status badge amber. Metrics may show stale data with "(stale)" label. |
| **Down** | Card shows title and status badge (red). Metrics section replaced with centered message: "Service unavailable" in `body-small`, `var(--text-tertiary)`. CTA button disabled. |
| **Error** | Same as Down. Error boundary catches render failures — card never crashes the page. |

### 4. `ServiceStatusBadge.tsx`

A small inline badge. No outer glow. No blinking. Clean.

| Status | Render |
|--------|--------|
| Online | `● Online` — dot is `var(--status-online)`, text is `var(--status-online)`, bg is `var(--status-online-bg)` |
| Degraded | `● Degraded` — `var(--status-warning)`, bg `var(--status-warning-bg)` |
| Offline | `● Offline` — `var(--status-error)`, bg `var(--status-error-bg)` |
| Loading | Shimmer bar, same dimensions as badge |

Badge container: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium`

The dot is a 6px `<span>` circle. No animation on the dot. Status is communicated through color and text — never color alone.

### 5. `ServiceCardGrid.tsx`

Layout wrapper for the 4 cards.

```tsx
<section className="mt-8">
  <h2 className="text-heading-2 text-[var(--text-primary)] mb-4">
    Services
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {services.map((service) => (
      <ServiceCard key={service.id} service={service} />
    ))}
  </div>
</section>
```

**Grid is 2×2 on desktop, not 4-across.** Cards have enough content that 4-across compresses them too much. 2-column gives each card breathing room while keeping all 4 visible without scrolling on most screens.

On mobile (< 768px): single column stack.

### 6. `GlobalActivityFeed.tsx`

A chronological list of recent events from all services. Simple table-like rows.

```
 ┌─────────────────────────────────────────────────────────┐
 │                                                         │
 │  Recent Activity                                        │
 │                                                         │
 │  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
 │  │  Audit Trail   Anomalous login pattern detected   │  │
 │  │  WARN          for user JohnDoe           2m ago  │  │
 │  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
 │  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
 │  │  Data Entry    50 records validated               │  │
 │  │  INFO          successfully                5m ago │  │
 │  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
 │  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
 │  │  Stability     Monthly report generated           │  │
 │  │  INFO          (PDF exported)             12m ago │  │
 │  └─ ─ ─ ─ ─ ─ ��� ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
 │                                                         │
 └─────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Container | `var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 12px`, padding 24px |
| Section title | `heading-2`, `var(--text-primary)` |
| Row | `padding: 12px 0`, separated by `border-bottom: 1px solid var(--border)`. Last row has no border. |
| Service name | `caption`, `font-weight: 600`, `var(--text-secondary)` |
| Severity tag | `caption`, uppercase. Color matches severity: info→`var(--status-info)`, warn→`var(--status-warning)`, error→`var(--status-error)`, critical→`var(--status-error)` with bold. Displayed as plain text, not a badge. |
| Message | `body`, `var(--text-primary)` |
| Timestamp | `body-small`, `var(--text-tertiary)`, right-aligned. Relative format using `date-fns/formatDistanceToNow`. |
| Max items | 10 visible. `max-height: 480px`, `overflow-y: auto` with styled scrollbar. |
| Empty state | "No recent activity" centered, `var(--text-tertiary)` |
| Feed source | `useActivityFeed` hook calls `GET /activity/recent?limit=5` on each service, merges all responses, sorts by timestamp descending. |

**No animations on feed rows.** New data replaces old data on 30-second poll. This is not a real-time websocket feed — it's polled. Animating arrivals on a poll cycle feels artificial.

### 7. `PlatformFooter.tsx`

Minimal. Functional.

```
 ┌─────────────────────────────────────────────────────────┐
 │  ePharmic AI Platform v1.0.0 · EnviroApps Inc           │
 │  21 CFR Part 11 · ICH Q1A · ICH Q1E · GMP              │
 └─────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Top border | `border-top: 1px solid var(--border)` |
| Padding | `py-6` |
| Text | `caption`, `var(--text-tertiary)`, centered |
| Compliance tags | Plain text separated by `·`. Not badges, not pills. |

---

## Hooks Specification

### `useServiceHealth.ts`

```typescript
// Polls GET /health for each service every 30 seconds
// No JWT required for health checks

interface HealthResponse {
  status: 'healthy' | string;
  service_name: string;
  version: string;
  uptime_seconds: number;
  last_activity: string;
}

type ServiceStatus = 'online' | 'degraded' | 'offline' | 'loading';

// Returns: Record<serviceId, { status: ServiceStatus, data: HealthResponse | null, error: Error | null }>

// Mapping logic:
// - Response 200 + status === 'healthy' → 'online'
// - Response 200 + status !== 'healthy' → 'degraded'
// - Response timeout (>5s) or network error → 'offline'
// - No response yet → 'loading'

// Uses TanStack Query with:
// - refetchInterval: 30_000
// - retry: 1
// - retryDelay: 2_000
// - staleTime: 25_000
```

### `useServiceSummary.ts`

```typescript
// Fetches GET /summary for each service
// JWT Bearer token required — reads from Zustand auth store
// Only fetches if service is 'online' (from useServiceHealth)

interface SummaryResponse {
  total_processed: number;
  alerts_today: number;
  last_run: string;
  compliance_score: number;
  quick_stats: Record<string, number>;
}

// Uses TanStack Query with:
// - enabled: status === 'online'
// - refetchInterval: 30_000
// - Headers: { Authorization: `Bearer ${token}` }
```

### `useActivityFeed.ts`

```typescript
// Fetches GET /activity/recent?limit=5 from each service
// Merges all responses into single sorted array
// JWT Bearer token required

interface ActivityItem {
  id: string;
  timestamp: string;
  message: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  service: string;
}

// Merge logic:
// 1. Fetch from all 4 services in parallel (Promise.allSettled)
// 2. Collect items from fulfilled responses, skip rejected
// 3. Concatenate all items arrays
// 4. Sort by timestamp descending
// 5. Take first 10

// Uses TanStack Query with:
// - refetchInterval: 30_000
```

---

## Loading & Error States

### Skeleton Design

Skeletons use a simple `animate-pulse` (Tailwind built-in). No custom shimmer gradient. The pulse is enough.

```tsx
// SkeletonCard — matches ServiceCard dimensions exactly
<div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
  <div className="h-5 w-3/4 rounded bg-[var(--border)] animate-pulse" />
  <div className="h-4 w-1/2 rounded bg-[var(--border)] animate-pulse mt-3" />
  <div className="flex gap-4 mt-6">
    <div className="h-10 w-20 rounded bg-[var(--border)] animate-pulse" />
    <div className="h-10 w-20 rounded bg-[var(--border)] animate-pulse" />
    <div className="h-10 w-20 rounded bg-[var(--border)] animate-pulse" />
  </div>
  <div className="h-2 w-full rounded bg-[var(--border)] animate-pulse mt-5" />
</div>
```

### Error Boundary

Each `ServiceCard` is wrapped in an `ErrorBoundary`. If a card's render throws, it shows:

```
┌─────────────────────────────────────────────────────────┐
│ ┃                                                       │
│ ┃  Audit Trail                                          │
│ ┃                                                       │
│ ┃  Unable to load service data.                         │
│ ┃  [Retry]                                              │
│ ┃                                                       │
└─────────────────────────────────────────────────────────┘
```

"Retry" is a plain text button in `var(--brand)`. Clicking it calls `queryClient.invalidateQueries` for that service's keys.

---

## Animations — Only What's Necessary

| What | Animation | Duration | Implementation |
|------|-----------|----------|----------------|
| Compliance bar fill | Width from 0% to value | 600ms, `ease-out` | CSS `transition: width` |
| Metric numbers | Count from 0 | 800ms, mount only | `react-countup`, `useInView` trigger |
| Card hover | Shadow increase + border darken | 200ms, `ease` | CSS `transition: box-shadow, border-color` |
| Theme switch | Background and text color | 150ms | CSS `transition: background-color, color` on `body` |
| Skeleton pulse | Opacity 0.5 ↔ 1 | Built-in | Tailwind `animate-pulse` |

**That's it.** No entrance animations. No staggered reveals. No page transitions. The page loads, the data appears, skeletons are replaced. Clean.

The only exception: `react-countup` on metric numbers during initial mount gives the numbers a sense of "arriving" without being theatrical.

---

## Toast Notifications

Use `sonner` for status change notifications only.

| Event | Toast |
|-------|-------|
| Service comes online | `toast.success("Audit Trail is online", { description: "Port 8001" })` |
| Service goes offline | `toast.error("OOT Alerting is offline", { description: "Port 8003 · Connection refused" })` |
| Service recovers from degraded | `toast.success("Stability Reports recovered")` |

Toast position: `bottom-right`. Max 3 visible. Auto-dismiss after 5s. Style: match the theme colors — no default sonner styling.

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| < 640px | Single column. Cards stack. Header collapses to logo + hamburger if needed. Feed rows stack service name above message. |
| 640–1024px | 2-column card grid. Full header. |
| > 1024px | 2-column card grid (cards have plenty of content — 2 columns is correct). Full layout. |
| > 1280px | Centered with `max-width: 1280px`, horizontal padding 48px. |

**No 4-column card layout.** The cards contain 6+ data points each. At 4-across they become unreadable. 2×2 is the right density.

---

## File Structure

```
landing-page/src/
├── components/
│   ├── layout/
│   │   ├── PlatformHeader.tsx
│   │   └── PlatformFooter.tsx
│   ├── overview/
│   │   └── PlatformOverview.tsx
│   ├── services/
│   │   ├── ServiceCard.tsx
│   │   ├── ServiceCardGrid.tsx
│   │   ├── ServiceStatusBadge.tsx
│   │   └── SkeletonCard.tsx
│   ├── feed/
│   │   └── GlobalActivityFeed.tsx
│   └── shared/
│       └── ErrorBoundary.tsx
├── hooks/
│   ├── useServiceHealth.ts
│   ├── useServiceSummary.ts
│   └── useActivityFeed.ts
├── config/
│   └── services.ts                 ← Loads service-registry.json
├── store/
│   └── auth.ts                     ← Zustand JWT session
├── styles/
│   └── index.css                   ← CSS variables, font imports, base resets
├── pages/
│   ├── LandingPage.tsx             ← Composes all sections
│   └── ServiceDashboard.tsx        ← Per-service route (future)
├── App.tsx
└── main.tsx
```

No `canvas/` folder. No `hero/` folder. No `animations.css`. The structure reflects what actually exists.

---

## What Was Removed (and Why)

| Removed | Reason |
|---------|--------|
| Canvas particle background | Decorative noise. Pharmaceutical dashboards need trust, not tech demos. Hurts performance on lower-end hospital workstations. |
| Glassmorphism / backdrop-blur | Inconsistent rendering across browsers. Adds visual complexity without information value. |
| Gradient text | Legibility issues in both light and dark mode. Plain colored text is clearer. |
| Animated border trace on hover | Distracting. A subtle shadow change communicates hover state perfectly well. |
| Staggered card entrance animations | The page loads in under 200ms. Staggering cards by 100ms each makes a fast page feel slow. |
| Status dot pulse/glow animation | Creates visual noise in peripheral vision. The word "Online" next to a colored dot is sufficient. |
| Activity feed slide-in animation | Data arrives via polling, not streaming. Animating polled data feels dishonest. |
| Emoji icons in production | Use text or simple SVG icons. Emoji rendering varies across OS. In `service-registry.json`, `icon` field is used for development reference only — not rendered in production UI. |
| Hero section with large compliance ring | Replaced with compact `PlatformOverview` bar. The compliance score is one data point — it doesn't need a hero section. |
| `framer-motion` dependency | Not needed. CSS transitions handle the 5 animations we actually use. One fewer dependency. |
| Custom scrollbar CSS | Let the browser handle scrollbars. Custom scrollbars break accessibility and feel inconsistent. |

---

## Dark Mode Toggle

The theme toggle is a simple icon button in the header.

```typescript
// store/theme.ts (or integrated into auth.ts)
// Reads from localStorage on mount, falls back to system preference
// Sets class="dark" on <html> element
// Persists choice to localStorage

const getInitialTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem('epharmic-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
```

---

## Data Flow Summary

```
service-registry.json (static)
        │
        ├──→ ServiceCardGrid reads service list
        │
        └──→ For each service:
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

---

## Tech Stack (Final)

| Layer | Choice | Note |
|-------|--------|------|
| Framework | React 18 + TypeScript | — |
| Build | Vite | Fast dev server, optimized build |
| Styling | Tailwind CSS v4 + CSS custom properties | No CSS-in-JS |
| Components | shadcn/ui | Only used for: Dropdown Menu, Tooltip, Button |
| Server state | TanStack Query v5 | Polling, caching, error handling |
| Client state | Zustand | JWT token, theme, minimal UI state |
| Routing | React Router v6 | Landing page + future service dashboard routes |
| HTTP | fetch (native) | No axios. Native fetch + TanStack Query is sufficient. |
| Metric animation | react-countup | Mount-only number animation |
| Toasts | sonner | Status change notifications |
| Timestamps | date-fns | `formatDistanceToNow` for relative times |

### Dependencies (package.json additions)

```json
{
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.5.0",
  "react-router-dom": "^6.22.0",
  "react-countup": "^6.5.0",
  "sonner": "^1.4.0",
  "date-fns": "^3.0.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.0"
}
```

No `framer-motion`. No `recharts` (no charts on the landing page). No `axios`. No `zod` or `react-hook-form` (no forms on the landing page).

---

## Acceptance Criteria

| # | Criterion | Validation |
|---|-----------|------------|
| 1 | Page loads and renders all 4 service cards within 500ms | Lighthouse performance score ≥ 90 |
| 2 | Cards show skeleton state while data loads | Visual inspection — no layout shift when data arrives |
| 3 | Status badges reflect actual service health | Stop a service container → badge shows "Offline" within 30s |
| 4 | Down service card degrades gracefully | Service offline → card shows "Service unavailable", page does not crash |
| 5 | Compliance score is computed from live data | Average of all online services' compliance_score from /summary |
| 6 | Activity feed merges events from all services | Events from different services appear sorted by timestamp |
| 7 | Dark mode works completely | Toggle switches all colors. No flashing. Persists on reload. |
| 8 | Mobile layout is usable | Cards stack, text is readable, no horizontal scroll at 375px |
| 9 | No console errors in production build | `vite build` produces clean output |
| 10 | Page works with 0 services running | Shows all cards as "Offline", overview says "0 Services Online", feed says "No recent activity" |