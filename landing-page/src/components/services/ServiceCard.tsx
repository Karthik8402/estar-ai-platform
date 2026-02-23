import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CountUp from 'react-countup';
import type { ServiceConfig } from '../../config/services';
import { getSimulatedHealth, getSimulatedSummary, type ServiceStatus } from '../../config/simulatedData';
import ServiceStatusBadge from './ServiceStatusBadge';

interface Props {
  service: ServiceConfig;
}

function mapStatus(s: ServiceStatus): 'online' | 'degraded' | 'offline' | 'loading' {
  if (s === 'healthy') return 'online';
  if (s === 'degraded') return 'degraded';
  if (s === 'down') return 'offline';
  return 'loading';
}

export default function ServiceCard({ service }: Props) {
  const navigate = useNavigate();
  const health = getSimulatedHealth(service.id);
  const summary = getSimulatedSummary(service.id);
  const status = mapStatus(health?.status ?? 'loading');
  const isDown = status === 'offline';

  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    if (!isDown) {
      const t = setTimeout(() => setBarWidth(summary?.compliance_score ?? 0), 100);
      return () => clearTimeout(t);
    }
  }, [isDown, summary?.compliance_score]);

  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${service.color}`,
        borderRadius: '12px',
        padding: '20px',
        transition: 'box-shadow 200ms ease, border-color 200ms ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.borderLeftColor = service.color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.borderLeftColor = service.color;
      }}
    >
      {/* Title */}
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {service.name}
      </h3>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-tertiary)',
          marginTop: '2px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {service.description}
      </p>

      {/* Status + Owner row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '16px',
        }}
      >
        <ServiceStatusBadge status={status} />
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)' }}>
          {service.owner}
        </span>
      </div>

      {/* Metrics or Down state */}
      {isDown ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Service unavailable</p>
        </div>
      ) : (
        <>
          {/* Metrics row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px',
              marginTop: '20px',
            }}
          >
            <MetricCell value={summary?.total_processed ?? 0} label="Processed" />
            <MetricCell value={summary?.alerts_today ?? 0} label="Alerts" isWarn={(summary?.alerts_today ?? 0) > 0} />
            <MetricCell value={summary?.compliance_score ?? 0} label="Compliance" suffix="%" />
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: '6px',
              borderRadius: '4px',
              background: 'var(--border)',
              marginTop: '16px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${barWidth}%`,
                borderRadius: '4px',
                background: service.color,
                transition: 'width 600ms ease-out',
              }}
            />
          </div>

          {/* Features */}
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '16px', lineHeight: 1.6 }}>
            {service.features.join(' · ')}
          </p>
        </>
      )}

      {/* CTA */}
      <div style={{ textAlign: 'right', marginTop: '16px' }}>
        <button
          style={{
            background: 'none',
            border: 'none',
            fontSize: '13px',
            fontWeight: 500,
            color: isDown ? 'var(--text-tertiary)' : 'var(--brand)',
            cursor: isDown ? 'default' : 'pointer',
            fontFamily: 'inherit',
            padding: 0,
            opacity: isDown ? 0.5 : 1,
          }}
          disabled={isDown}
          onClick={() => { if (!isDown) navigate(service.dashboard_path); }}
          onMouseEnter={(e) => {
            if (!isDown) {
              e.currentTarget.style.color = 'var(--brand-hover)';
              e.currentTarget.style.textDecoration = 'underline';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = isDown ? 'var(--text-tertiary)' : 'var(--brand)';
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          Open Dashboard →
        </button>
      </div>
    </div>
  );
}

function MetricCell({ value, label, suffix = '', isWarn = false }: { value: number; label: string; suffix?: string; isWarn?: boolean }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        className="font-mono"
        style={{
          fontSize: '24px',
          fontWeight: 700,
          lineHeight: 1.2,
          color: isWarn ? 'var(--status-warning)' : 'var(--text-primary)',
        }}
      >
        <CountUp end={value} duration={0.8} separator="," />{suffix}
      </div>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-tertiary)',
          marginTop: '4px',
        }}
      >
        {label}
      </div>
    </div>
  );
}
