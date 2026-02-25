import { useState } from 'react';
import { useAnomalies } from '../../hooks/audit/useAnomalies';
import { getAnomalies as getSimulatedAnomalies } from '../../config/simulatedAuditData';
import FilterBar from './FilterBar';
import AnomalyRow from './AnomalyRow';

export default function AnomalyTable() {
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState('all');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const limit = 10;

  const { data } = useAnomalies(page, limit, severity, type, search);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleExport = () => {
    const header = 'Event ID,Timestamp,Severity,Type,Message,User,Risk Score\n';
    const allData = getSimulatedAnomalies(1, 100, severity, type, search);
    const csv = header + allData.items.map(a =>
      `${a.event_id},${a.timestamp},${a.severity},${a.anomaly_type},"${a.message}",${a.user},${a.risk_score}`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'anomalies.csv';
    link.click();
  };

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Anomalies</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {items.length > 0 ? `${total} flagged` : 'No anomalies match your filters'}
          </p>
        </div>
      </div>

      <FilterBar
        activeSeverity={severity}
        activeType={type}
        search={search}
        onSeverityChange={(s) => { setSeverity(s); setPage(1); }}
        onTypeChange={(t) => { setType(t); setPage(1); }}
        onSearchChange={(q) => { setSearch(q); setPage(1); }}
        onExport={handleExport}
      />

      {/* Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Severity', 'Type', 'Message', 'Time'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-tertiary)',
                      background: 'var(--surface)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((anomaly) => (
                <AnomalyRow key={anomaly.event_id} anomaly={anomaly} />
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                    No anomalies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Showing {start}–{end} of {total}
          </span>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{
              border: 'none',
              background: 'transparent',
              color: page <= 1 ? 'var(--text-tertiary)' : 'var(--brand)',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
            }}
          >
            ← Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            style={{
              border: 'none',
              background: 'transparent',
              color: page >= totalPages ? 'var(--text-tertiary)' : 'var(--brand)',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
