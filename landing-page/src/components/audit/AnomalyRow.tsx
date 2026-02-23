import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Anomaly } from '../../config/simulatedAuditData';

interface Props {
  anomaly: Anomaly;
}

const SEVERITY_COLORS: Record<string, { color: string; bg: string }> = {
  info: { color: 'var(--text-secondary)', bg: 'transparent' },
  warn: { color: 'var(--status-warning)', bg: 'rgba(245,158,11,0.1)' },
  error: { color: 'var(--status-error)', bg: 'rgba(239,68,68,0.1)' },
  critical: { color: 'var(--status-error)', bg: 'rgba(239,68,68,0.15)' },
};

export default function AnomalyRow({ anomaly }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const sev = SEVERITY_COLORS[anomaly.severity] || SEVERITY_COLORS.info;

  const riskColor = anomaly.risk_score >= 80
    ? 'var(--status-error)'
    : anomaly.risk_score >= 50
      ? 'var(--status-warning)'
      : 'var(--text-primary)';

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer', transition: 'background 100ms ease' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <td style={{ padding: '12px 16px', borderBottom: expanded ? 'none' : '1px solid var(--border)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sev.color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: sev.color }}>
              {anomaly.severity}
            </span>
          </span>
        </td>
        <td
          className="font-mono"
          style={{
            padding: '12px 16px',
            borderBottom: expanded ? 'none' : '1px solid var(--border)',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)',
          }}
        >
          {anomaly.anomaly_type}
        </td>
        <td
          style={{
            padding: '12px 16px',
            borderBottom: expanded ? 'none' : '1px solid var(--border)',
            fontSize: '14px',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            maxWidth: '400px',
          }}
        >
          {anomaly.message}
        </td>
        <td
          style={{
            padding: '12px 16px',
            borderBottom: expanded ? 'none' : '1px solid var(--border)',
            fontSize: '13px',
            color: 'var(--text-tertiary)',
            whiteSpace: 'nowrap',
          }}
        >
          {formatDistanceToNow(new Date(anomaly.timestamp), { addSuffix: true })}
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={4} style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>
            <div
              style={{
                background: 'var(--surface)',
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
              }}
            >
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                {anomaly.message}
              </p>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span>User: <strong>{anomaly.user}</strong></span>
                <span>·</span>
                <span>Session: {anomaly.session_id}</span>
                <span>·</span>
                <span>IP: {anomaly.ip_address}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span>Risk Score: <span style={{ fontWeight: 500, color: riskColor }}>{anomaly.risk_score}</span></span>
                <span>·</span>
                <span>AI Confidence: {anomaly.ai_confidence}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowJson(!showJson); }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--brand)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  padding: 0,
                }}
              >
                {showJson ? 'Hide JSON' : 'View JSON'}
              </button>
              {showJson && (
                <pre
                  className="font-mono"
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    overflow: 'auto',
                    color: 'var(--text-primary)',
                  }}
                >
                  {JSON.stringify(anomaly.raw_payload, null, 2)}
                </pre>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
