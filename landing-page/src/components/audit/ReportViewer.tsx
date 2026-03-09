import { useState } from 'react';
import { format } from 'date-fns';
import { useReports, useGenerateReport } from '../../hooks/audit/useReports';
import SectionLoader from '../shared/SectionLoader';
import SectionError from '../shared/SectionError';

export default function ReportViewer() {
  const { data: reports = [], isLoading, isError, refetch } = useReports();
  const generateMutation = useGenerateReport();
  const [selectedId, setSelectedId] = useState<string>(reports[0]?.report_id ?? '');

  const selected = reports.find(r => r.report_id === selectedId) ?? reports[0];
  const generating = generateMutation.isPending;

  const handleGenerate = () => {
    generateMutation.mutate(undefined, {
      onSuccess: (newReport) => {
        if (newReport && newReport.report_id) {
          setSelectedId(newReport.report_id);
        }
      }
    });
  };

  const scoreColor = (score: number) =>
    score >= 90 ? 'var(--status-online)' : score >= 70 ? 'var(--status-warning)' : 'var(--status-error)';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Reports</h2>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            background: 'var(--brand)',
            color: 'var(--text-inverse)',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 500,
            fontSize: '13px',
            fontFamily: 'inherit',
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.7 : 1,
            transition: 'background 150ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => { if (!generating) e.currentTarget.style.background = 'var(--brand-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--brand)'; }}
        >
          {generating && (
            <span style={{
              width: '14px', height: '14px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite',
            }} />
          )}
          {generating ? 'Generating…' : 'Generate Report'}
        </button>
      </div>

      {/* Generation error inline message */}
      {generateMutation.isError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--status-error)',
        }}>
          Report generation failed. Please try again.
        </div>
      )}

      {/* Loading state */}
      {isLoading && <SectionLoader lines={4} label="Loading reports…" />}

      {/* Error state */}
      {isError && !isLoading && (
        <SectionError
          message="Could not load report data."
          onRetry={() => refetch()}
        />
      )}

      {/* Content — only when loaded */}
      {!isLoading && !isError && (
        <>
          {/* Reports table */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '24px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Report Type', 'Generated', 'Score', 'Action'].map((h) => (
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
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                      No reports generated yet
                    </td>
                  </tr>
                )}
                {reports.map((r) => (
                  <tr
                    key={r.report_id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {r.report_type.replace('-', ' ')}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {format(new Date(r.generated_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="font-mono" style={{ padding: '12px 16px', fontSize: '14px', color: scoreColor(r.compliance_score) }}>
                      {r.compliance_score}%
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => setSelectedId(r.report_id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--brand)',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          padding: 0,
                        }}
                      >
                        {selectedId === r.report_id ? 'Viewing' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Report text viewer */}
          {selected && (
            <div
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                {selected.report_type.charAt(0).toUpperCase() + selected.report_type.slice(1).replace('-', ' ')} Activity Summary — {format(new Date(selected.generated_at), 'MMM d, yyyy')}
              </h2>
              <div style={{ borderBottom: '1px solid var(--border)', margin: '8px 0 16px 0' }} />
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.7 }}>
                {selected.summary_text.split('\n\n').map((paragraph, i) => {
                  // Check if paragraph is a heading (all-caps line)
                  const lines = paragraph.split('\n');
                  return (
                    <div key={i} style={{ marginBottom: '16px' }}>
                      {lines.map((line, j) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;

                        // ALL CAPS heading
                        if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith('•')) {
                          return (
                            <div
                              key={j}
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: 'var(--text-secondary)',
                                marginTop: '20px',
                                marginBottom: '8px',
                              }}
                            >
                              {trimmed}
                            </div>
                          );
                        }

                        // Bullet
                        if (trimmed.startsWith('•')) {
                          return (
                            <div key={j} style={{ paddingLeft: '16px', marginBottom: '4px', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0 }}>•</span>
                              {trimmed.slice(1).trim()}
                            </div>
                          );
                        }

                        // Normal text
                        return <p key={j} style={{ margin: '0 0 4px 0' }}>{trimmed}</p>;
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
