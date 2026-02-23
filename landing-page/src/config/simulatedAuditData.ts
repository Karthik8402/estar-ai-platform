// Simulated data for the Audit Trail Dashboard
// All data here will be replaced by real API calls once the backend is built

export interface Anomaly {
    event_id: string;
    timestamp: string;
    anomaly_type: 'human_error' | 'integrity_fail' | 'unauthorized';
    severity: 'info' | 'warn' | 'error' | 'critical';
    message: string;
    risk_score: number;
    ai_confidence: number;
    user: string;
    session_id: string;
    ip_address: string;
    raw_payload: Record<string, unknown>;
}

export interface IntegrityReport {
    integrity_score: number;
    entries_verified: number;
    violations: Array<{
        type: string;
        message: string;
        severity: 'warn' | 'error';
        user?: string;
        action?: string;
        timestamp: string;
    }>;
    checks: Array<{
        name: string;
        passed: boolean;
        detail: string;
    }>;
    last_check: string;
}

export interface AuditReport {
    report_id: string;
    report_type: 'daily' | 'weekly' | 'monthly' | 'on-demand';
    generated_at: string;
    compliance_score: number;
    anomaly_count: number;
    summary_text: string;
}

export interface AgentStatus {
    agent_id: string;
    name: string;
    description: string;
    status: 'running' | 'idle' | 'error' | 'stopped';
    last_run: string | null;
    next_run: string | null;
    cycle_seconds: number | null;
    last_result: string | null;
    error_message: string | null;
}

export interface AuditThresholds {
    failed_login_threshold: number;
    bulk_deletion_threshold: number;
    off_hours_start: string;
    off_hours_end: string;
    field_correction_limit: number;
    timestamp_tolerance: number;
}

export interface ComplianceRule {
    key: string;
    value: string;
}

/* ─── Anomalies (47 items) ─────────────────────────────────── */
function generateAnomalies(): Anomaly[] {
    const types: Anomaly['anomaly_type'][] = ['human_error', 'integrity_fail', 'unauthorized'];
    const severities: Anomaly['severity'][] = ['warn', 'error', 'critical'];
    const messages = [
        'Repeated failed logins (4 attempts) followed by successful login and immediate data correction on record #4521',
        'Role mismatch: analyst3 attempted admin-level configuration change',
        'Same field edited 4 times in one session by user jdoe',
        'Bulk deletion of 14 records in under 30 seconds',
        'Off-hours modification at 02:14 local time — batch release #312',
        'Failed login attempts from new IP address range',
        'Data correction without required electronic signature',
        'Unauthorized access attempt to compliance configuration',
        'Timestamp gap of 47s between sequential events',
        'Multiple password resets within 10 minutes',
        'Critical action performed without supervisor approval',
        'Audit log entry missing before/after values',
        'Access from unregistered device during restricted hours',
        'Repeated validation overrides on pH measurements',
        'Electronic signature mismatch on batch release document',
    ];
    const users = ['jdoe', 'analyst3', 'supervisor1', 'operator_k', 'lab_tech_m', 'admin_r'];

    const items: Anomaly[] = [];
    for (let i = 0; i < 47; i++) {
        const mins = i * 12 + Math.floor(Math.random() * 10);
        items.push({
            event_id: `evt_${String(i + 1).padStart(3, '0')}`,
            timestamp: new Date(Date.now() - mins * 60000).toISOString(),
            anomaly_type: types[i % types.length],
            severity: i < 3 ? severities[i % severities.length] : severities[Math.floor(Math.random() * 2)],
            message: messages[i % messages.length],
            risk_score: Math.round((30 + Math.random() * 65) * 10) / 10,
            ai_confidence: Math.round((0.6 + Math.random() * 0.35) * 1000) / 1000,
            user: users[i % users.length],
            session_id: `ses_${Math.random().toString(36).slice(2, 10)}`,
            ip_address: `10.0.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 255)}`,
            raw_payload: {
                action: i % 2 === 0 ? 'data_correction' : 'login_attempt',
                record_id: 4000 + i,
                module: ['data-entry', 'audit-trail', 'stability-report'][i % 3],
            },
        });
    }
    return items;
}

const ANOMALIES = generateAnomalies();

/* ─── Integrity ────────────────────────────────────────────── */
const INTEGRITY: IntegrityReport = {
    integrity_score: 94,
    entries_verified: 887,
    violations: [
        {
            type: 'missing_signature',
            message: 'Missing electronic signature on critical action',
            severity: 'error',
            user: 'jdoe',
            action: 'batch_release',
            timestamp: new Date(Date.now() - 180000).toISOString(),
        },
        {
            type: 'rbac_violation',
            message: 'Unauthorized role action detected',
            severity: 'error',
            user: 'analyst3',
            action: 'admin_config',
            timestamp: new Date(Date.now() - 420000).toISOString(),
        },
        {
            type: 'timestamp_gap',
            message: 'Timestamp gap: 47s between event #4480 and #4481',
            severity: 'warn',
            user: undefined,
            action: undefined,
            timestamp: new Date(Date.now() - 660000).toISOString(),
        },
    ],
    checks: [
        { name: 'Sequential event numbering', passed: true, detail: 'Passed' },
        { name: 'Timestamp ordering', passed: true, detail: 'Passed (3 warnings)' },
        { name: 'Electronic signatures present', passed: false, detail: '1 missing' },
        { name: 'RBAC authorization validation', passed: false, detail: '1 violation' },
        { name: 'Before/after values on corrections', passed: true, detail: 'Passed' },
        { name: 'Checksum integrity', passed: true, detail: 'Passed' },
    ],
    last_check: new Date(Date.now() - 240000).toISOString(),
};

/* ─── Reports ──────────────────────────────────────────────── */
const REPORTS: AuditReport[] = [
    {
        report_id: 'rpt_001',
        report_type: 'daily',
        generated_at: new Date(Date.now() - 3600000).toISOString(),
        compliance_score: 94,
        anomaly_count: 3,
        summary_text: `The audit trail system processed 1,204 log entries during the reporting period. Three anomalies were flagged for review, with an overall compliance score of 94%.

CRITICAL FINDINGS

• One unauthorized role escalation detected — user analyst3 attempted admin-level configuration changes without appropriate RBAC permissions. This action was blocked and logged.

• One missing electronic signature on a critical batch release action by user jdoe. The batch release was processed but flagged for retroactive signature compliance review.

OPERATIONAL SUMMARY

• 890 log entries analyzed by the Human Error Detection agent
• 887 entries passed integrity verification (99.7% pass rate)
• 2 human error patterns identified (repeated failed logins followed by data corrections)
• All checksum validations passed without exception

RECOMMENDATIONS

• Review and update access permissions for user analyst3 — current role does not authorize configuration changes
• Schedule re-training for user jdoe on electronic signature requirements for batch release procedures
• Consider tightening the off-hours modification threshold from 22:00 to 20:00 based on recent activity patterns
• No changes recommended to timestamp tolerance (±2s) — current gap appeared to be a network latency issue`,
    },
    {
        report_id: 'rpt_002',
        report_type: 'weekly',
        generated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        compliance_score: 91,
        anomaly_count: 12,
        summary_text: `Weekly compliance summary for the period ending February 16, 2026. The audit trail system maintained a compliance score of 91% across 8,432 log entries processed over seven days.

KEY METRICS

• Total entries processed: 8,432
• Anomalies flagged: 12 (0.14% rate)
• Average daily compliance score: 91.3%
• Peak anomaly day: Tuesday (5 events)

NOTABLE FINDINGS

• A pattern of off-hours data corrections was observed on Tuesday evening, correlating with a reported system outage that required emergency maintenance.
• Two instances of bulk record modifications exceeded the threshold of 10 records, both attributed to batch import operations that should have been routed through the automated pipeline.

TREND ANALYSIS

Compliance scores have remained stable in the 90-95% range over the past four weeks. The primary contributor to score reduction continues to be missing electronic signatures on non-critical actions.`,
    },
    {
        report_id: 'rpt_003',
        report_type: 'on-demand',
        generated_at: new Date(Date.now() - 9 * 86400000).toISOString(),
        compliance_score: 88,
        anomaly_count: 5,
        summary_text: `On-demand compliance report generated at the request of the compliance team lead. This report covers an investigation into unusual login patterns observed on February 14, 2026.

INVESTIGATION SUMMARY

Five anomalies were identified during the investigation period. Three were classified as human error patterns and two as potential unauthorized access attempts. All were resolved within 4 hours of detection.

RESOLUTION

• Affected user accounts were temporarily locked pending review
• Additional multi-factor authentication was enabled for high-risk operations
• No data integrity issues were found as a result of the suspicious activity`,
    },
];

/* ─── Agents ───────────────────────────────────────────────── */
const AGENTS: AgentStatus[] = [
    {
        agent_id: 'agent_1',
        name: 'Human Error Detection',
        description: 'Detects operator mistakes — repeated failed logins, bulk deletions, off-hours modifications, repeated field corrections.',
        status: 'running',
        last_run: new Date(Date.now() - 120000).toISOString(),
        next_run: null,
        cycle_seconds: 30,
        last_result: '2 patterns flagged (WARN)',
        error_message: null,
    },
    {
        agent_id: 'agent_2',
        name: 'Log Integrity Verification',
        description: 'Verifies audit trail completeness — sequential ordering, electronic signatures, RBAC authorization, checksum validation.',
        status: 'running',
        last_run: new Date(Date.now() - 240000).toISOString(),
        next_run: null,
        cycle_seconds: 300,
        last_result: '887/890 entries passed',
        error_message: null,
    },
    {
        agent_id: 'agent_3',
        name: 'Summary & Reporting',
        description: 'Generates narrative compliance summaries for regulatory review. Runs daily at 23:55 UTC or on-demand via Reports section.',
        status: 'idle',
        last_run: new Date(Date.now() - 22 * 3600000).toISOString(),
        next_run: '23:55 UTC',
        cycle_seconds: null,
        last_result: 'Daily report generated (94%)',
        error_message: null,
    },
];

/* ─── Settings ─────────────────────────────────────────────── */
const THRESHOLDS: AuditThresholds = {
    failed_login_threshold: 3,
    bulk_deletion_threshold: 10,
    off_hours_start: '22:00',
    off_hours_end: '06:00',
    field_correction_limit: 3,
    timestamp_tolerance: 2,
};

const COMPLIANCE_RULES: ComplianceRule[] = [
    { key: 'Regulation', value: '21 CFR Part 11' },
    { key: 'Electronic signatures', value: 'Required on CRITICAL actions' },
    { key: 'Audit trail', value: 'Append-only (no UPDATE/DELETE)' },
    { key: 'Access controls', value: 'RBAC validated per request' },
];

/* ─── Public API ───────────────────────────────────────────── */
export function getAnomalies(page: number, limit: number, severityFilter?: string, typeFilter?: string, search?: string) {
    let filtered = [...ANOMALIES];
    if (severityFilter && severityFilter !== 'all') {
        filtered = filtered.filter(a => a.severity === severityFilter);
    }
    if (typeFilter && typeFilter !== 'all') {
        filtered = filtered.filter(a => a.anomaly_type === typeFilter);
    }
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(a => a.message.toLowerCase().includes(q) || a.user.toLowerCase().includes(q));
    }
    const total = filtered.length;
    const start = (page - 1) * limit;
    return { items: filtered.slice(start, start + limit), total, page, totalPages: Math.ceil(total / limit) };
}

export function getIntegrity(): IntegrityReport {
    return INTEGRITY;
}

export function getReports(): AuditReport[] {
    return REPORTS;
}

export function getAgents(): AgentStatus[] {
    return [...AGENTS];
}

export function getThresholds(): AuditThresholds {
    return { ...THRESHOLDS };
}

export function getComplianceRules(): ComplianceRule[] {
    return COMPLIANCE_RULES;
}

export function getAuditActivity() {
    // Return only audit-trail events from the main simulated data
    return [
        { id: 'evt_001', timestamp: new Date(Date.now() - 120000).toISOString(), message: 'Anomalous login pattern detected for user JohnDoe', severity: 'warn' as const, service: 'audit-trail' },
        { id: 'evt_004', timestamp: new Date(Date.now() - 300000).toISOString(), message: 'Log integrity verified — 447 entries validated', severity: 'info' as const, service: 'audit-trail' },
        { id: 'evt_005', timestamp: new Date(Date.now() - 720000).toISOString(), message: 'Daily compliance report generated — score: 94%', severity: 'info' as const, service: 'audit-trail' },
        { id: 'evt_009', timestamp: new Date(Date.now() - 1500000).toISOString(), message: 'Electronic signature verified for batch release #312', severity: 'info' as const, service: 'audit-trail' },
        { id: 'evt_010', timestamp: new Date(Date.now() - 2400000).toISOString(), message: 'User corrected entry #4521 — flagged for review', severity: 'warn' as const, service: 'audit-trail' },
    ];
}
