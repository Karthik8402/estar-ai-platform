import { formatDistanceToNow } from 'date-fns';
import type { AgentStatus } from '../../config/simulatedAuditData';

interface Props {
  agent: AgentStatus;
  onStart: () => void;
  onStop: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  running: { color: 'var(--status-online)', label: 'Running' },
  idle: { color: 'var(--text-tertiary)', label: 'Idle' },
  error: { color: 'var(--status-error)', label: 'Error' },
  stopped: { color: 'var(--status-error)', label: 'Stopped' },
};

export default function AgentCard({ agent, onStart, onStop }: Props) {
  const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
  const isActive = agent.status === 'running';

  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
      }}
    >
      {/* Name */}
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
        {agent.name}
      </h3>

      {/* Status line */}
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusCfg.color }} />
          <span style={{ color: statusCfg.color, fontWeight: 500 }}>{statusCfg.label}</span>
        </span>
        {agent.last_run && (
          <>
            <span>·</span>
            <span>Last run: {formatDistanceToNow(new Date(agent.last_run), { addSuffix: true })}</span>
          </>
        )}
        {agent.cycle_seconds && (
          <>
            <span>·</span>
            <span>Cycle: {agent.cycle_seconds >= 60 ? `${agent.cycle_seconds / 60}min` : `${agent.cycle_seconds}s`}</span>
          </>
        )}
        {agent.next_run && !isActive && (
          <>
            <span>·</span>
            <span>Next: {agent.next_run}</span>
          </>
        )}
      </div>

      {/* Purpose */}
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
        {agent.description}
      </p>

      {/* Error message */}
      {agent.error_message && (
        <p style={{ fontSize: '13px', color: 'var(--status-error)', margin: '0 0 12px 0' }}>
          {agent.error_message}
        </p>
      )}

      {/* Last result + button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
          {agent.last_result ? `Last Result: ${agent.last_result}` : ''}
        </span>
        {isActive ? (
          <button
            onClick={onStop}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--status-error)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '4px 8px',
            }}
          >
            Stop
          </button>
        ) : (
          <button
            onClick={onStart}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--status-online)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '4px 8px',
            }}
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
}
