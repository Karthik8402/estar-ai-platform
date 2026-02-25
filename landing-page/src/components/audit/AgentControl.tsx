import { useState } from 'react';
import { useAgentStatus, useStartAgent, useStopAgent, useStartAllAgents, useStopAllAgents } from '../../hooks/audit/useAgentStatus';
import AgentCard from './AgentCard';

export default function AgentControl() {
  const { data: agents = [] } = useAgentStatus();
  const startAgent = useStartAgent();
  const stopAgent = useStopAgent();
  const startAll = useStartAllAgents();
  const stopAll = useStopAllAgents();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleStart = (agentId: string) => {
    startAgent.mutate(agentId);
  };

  const handleStop = (agentId: string) => {
    stopAgent.mutate(agentId);
  };

  const handleStartAll = () => {
    startAll.mutate();
  };

  const handleStopAll = () => {
    stopAll.mutate();
    setShowConfirm(false);
  };

  return (
    <div>
      {/* Header with bulk controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Agent Control</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleStartAll}
            style={{
              background: 'var(--status-online)',
              color: 'var(--text-inverse)',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Start All
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            style={{
              background: 'transparent',
              color: 'var(--status-error)',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid var(--status-error)',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Stop All
          </button>
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Stop all running agents?
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
              This will halt compliance monitoring.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleStopAll}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--status-error)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Stop All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent cards */}
      {agents.map((agent) => (
        <AgentCard
          key={agent.agent_id}
          agent={agent}
          onStart={() => handleStart(agent.agent_id)}
          onStop={() => handleStop(agent.agent_id)}
        />
      ))}
    </div>
  );
}
