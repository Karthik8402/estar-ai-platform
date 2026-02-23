

/* ─── Simulated Health Data ────────────────────────────────── */
export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'loading';

export interface HealthData {
    status: ServiceStatus;
    service_name: string;
    version: string;
    uptime_seconds: number;
    last_activity: string;
    response_ms: number;
}

const SIMULATED_HEALTH: Record<string, HealthData> = {
    'audit-trail': {
        status: 'healthy',
        service_name: 'audit-trail-service',
        version: '1.0.0',
        uptime_seconds: 86400,
        last_activity: new Date().toISOString(),
        response_ms: 42,
    },
    'stability-report': {
        status: 'healthy',
        service_name: 'stability-report-service',
        version: '1.0.0',
        uptime_seconds: 72300,
        last_activity: new Date(Date.now() - 300000).toISOString(),
        response_ms: 38,
    },
    'oot-alerting': {
        status: 'down',
        service_name: 'oot-alerting-service',
        version: '1.0.0',
        uptime_seconds: 0,
        last_activity: new Date(Date.now() - 7200000).toISOString(),
        response_ms: -1,
    },
    'data-entry': {
        status: 'degraded',
        service_name: 'data-entry-service',
        version: '1.0.0',
        uptime_seconds: 43200,
        last_activity: new Date(Date.now() - 60000).toISOString(),
        response_ms: 280,
    },
};

/* ─── Simulated Summary Data ───────────────────────────────── */
export interface SummaryData {
    total_processed: number;
    alerts_today: number;
    last_run: string;
    compliance_score: number;
    quick_stats: Record<string, number>;
}

const SIMULATED_SUMMARY: Record<string, SummaryData> = {
    'audit-trail': {
        total_processed: 1204,
        alerts_today: 3,
        last_run: new Date(Date.now() - 120000).toISOString(),
        compliance_score: 94,
        quick_stats: { logs_analyzed_today: 890, anomalies_flagged: 3, integrity_checks_passed: 887 },
    },
    'stability-report': {
        total_processed: 47,
        alerts_today: 0,
        last_run: new Date(Date.now() - 600000).toISOString(),
        compliance_score: 98,
        quick_stats: { reports_generated: 47, pending_reviews: 2 },
    },
    'oot-alerting': {
        total_processed: 0,
        alerts_today: 0,
        last_run: new Date(Date.now() - 7200000).toISOString(),
        compliance_score: 0,
        quick_stats: {},
    },
    'data-entry': {
        total_processed: 892,
        alerts_today: 2,
        last_run: new Date(Date.now() - 60000).toISOString(),
        compliance_score: 87,
        quick_stats: { entries_validated: 892, errors_caught: 14 },
    },
};

/* ─── Simulated Activity Feed ──────────────────────────────── */
export interface ActivityItem {
    id: string;
    timestamp: string;
    message: string;
    severity: 'info' | 'warn' | 'error' | 'critical';
    service: string;
}

const SIMULATED_ACTIVITY: ActivityItem[] = [
    { id: 'evt_001', timestamp: new Date(Date.now() - 120000).toISOString(), message: 'Anomalous login pattern detected for user JohnDoe', severity: 'warn', service: 'audit-trail' },
    { id: 'evt_002', timestamp: new Date(Date.now() - 300000).toISOString(), message: '50 data entries validated successfully', severity: 'info', service: 'data-entry' },
    { id: 'evt_003', timestamp: new Date(Date.now() - 720000).toISOString(), message: 'Monthly stability report generated (PDF)', severity: 'info', service: 'stability-report' },
    { id: 'evt_004', timestamp: new Date(Date.now() - 1080000).toISOString(), message: 'User corrected entry #4521 — flagged for review', severity: 'warn', service: 'audit-trail' },
    { id: 'evt_005', timestamp: new Date(Date.now() - 1500000).toISOString(), message: 'Log integrity verified — 447 entries validated', severity: 'info', service: 'audit-trail' },
    { id: 'evt_006', timestamp: new Date(Date.now() - 2400000).toISOString(), message: 'Data entry validation error: pH value out of range', severity: 'error', service: 'data-entry' },
    { id: 'evt_007', timestamp: new Date(Date.now() - 3000000).toISOString(), message: 'Batch stability test #89 completed — all within spec', severity: 'info', service: 'stability-report' },
    { id: 'evt_008', timestamp: new Date(Date.now() - 3600000).toISOString(), message: 'OOT Alerting service connection lost', severity: 'critical', service: 'oot-alerting' },
    { id: 'evt_009', timestamp: new Date(Date.now() - 5400000).toISOString(), message: 'Electronic signature verified for batch release #312', severity: 'info', service: 'audit-trail' },
    { id: 'evt_010', timestamp: new Date(Date.now() - 7200000).toISOString(), message: 'Daily compliance summary generated — score: 91%', severity: 'info', service: 'audit-trail' },
];

/* ─── Public API ───────────────────────────────────────────── */
export function getSimulatedHealth(serviceId: string): HealthData | null {
    return SIMULATED_HEALTH[serviceId] ?? null;
}

export function getSimulatedSummary(serviceId: string): SummaryData | null {
    return SIMULATED_SUMMARY[serviceId] ?? null;
}

export function getSimulatedActivity(): ActivityItem[] {
    return SIMULATED_ACTIVITY;
}

export function getAverageComplianceScore(): number {
    const scores = Object.values(SIMULATED_SUMMARY)
        .map(s => s.compliance_score)
        .filter(s => s > 0);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

export function getOnlineCount(): number {
    return Object.values(SIMULATED_HEALTH).filter(h => h.status === 'healthy').length;
}

export function getTotalServices(): number {
    return Object.keys(SIMULATED_HEALTH).length;
}

export function getDegradedCount(): number {
    return Object.values(SIMULATED_HEALTH).filter(h => h.status === 'degraded').length;
}
