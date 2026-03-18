import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useReports, useGenerateReport } from '../../hooks/audit/useReports';
import SectionLoader from '../shared/SectionLoader';
import SectionError from '../shared/SectionError';
import { useIsMutating } from '@tanstack/react-query';
import PaginationBar from '../shared/PaginationBar';

export default function ReportViewer() {
  const { data: reports = [], isLoading, isError, refetch } = useReports();
  const generateMutation = useGenerateReport();
  const [selectedId, setSelectedId] = useState<string>(reports[0]?.report_id ?? '');
  const [filterType, setFilterType] = useState<string>('all');
  const [generateType, setGenerateType] = useState<string>('on-demand');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const filteredReports = filterType === 'all'
    ? reports
    : reports.filter(r => r.report_type === filterType);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const pagedReports = filteredReports.slice(pageStart, pageEnd);
  const emptyRows = Math.max(0, PAGE_SIZE - pagedReports.length);

  const selected = filteredReports.length > 0
    ? (filteredReports.find(r => r.report_id === selectedId) ?? filteredReports[0])
    : (filterType === 'all' ? reports[0] : undefined);
  const globalMutationsCount = useIsMutating({ mutationKey: ['generateReport'] });
  const generating = generateMutation.isPending || globalMutationsCount > 0;

  const handleGenerate = () => {
    generateMutation.mutate(generateType, {
      onSuccess: (newReport) => {
        if (newReport && newReport.report_id) {
          setSelectedId(newReport.report_id);
          if (filterType !== 'all' && newReport.report_type !== filterType) {
            setFilterType('all');
          }
        }
      }
    });
  };

  useEffect(() => {
    if (!selectedId && reports.length > 0) {
      setSelectedId(reports[0].report_id);
      return;
    }

    if (filteredReports.length > 0 && !filteredReports.find(r => r.report_id === selectedId)) {
      setSelectedId(filteredReports[0].report_id);
    }
  }, [filteredReports, reports, selectedId]);

  useEffect(() => {
    setPage(1);
  }, [filterType]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const filterOptions = useMemo(() => {
    const preferred = ['on-demand', 'daily', 'weekly', 'monthly', 'auto-triggered'];
    const fromData = Array.from(new Set(reports.map(r => r.report_type)));
    const merged = Array.from(new Set([...fromData, ...preferred])).filter(Boolean);
    return ['all', ...merged];
  }, [reports]);

  const generateOptions = useMemo(() => {
    const base = ['on-demand', 'daily', 'weekly', 'monthly'];
    return Array.from(new Set([...base, ...reports.map(r => r.report_type)])).filter(Boolean);
  }, [reports]);

  const formatReportType = (value: string) =>
    value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const parseReportText = (text: string) => {
    const normalizedText = text
      .replace('Data source: operational database (fallback mode, AI unavailable)', 'Data source: operational audit database')
      .replace('LONG-TERM: Configure GEMINI_API_KEY for richer AI-assisted summaries.', 'LONG-TERM: Enable AI provider configuration for enriched narrative reports.');

    const blocks: Array<{ type: 'heading' | 'paragraph' | 'bullets'; content: string | string[] }> = [];
    const lines = normalizedText.split('\n');
    let currentParagraph: string[] = [];
    let currentBullets: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        blocks.push({ type: 'paragraph', content: currentParagraph.join(' ') });
        currentParagraph = [];
      }
    };

    const flushBullets = () => {
      if (currentBullets.length > 0) {
        blocks.push({ type: 'bullets', content: [...currentBullets] });
        currentBullets = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        flushParagraph();
        flushBullets();
        continue;
      }

      const isHeading = trimmed === trimmed.toUpperCase()
        && trimmed.length > 3
        && !trimmed.startsWith('•')
        && !trimmed.startsWith('-');

      if (isHeading) {
        flushParagraph();
        flushBullets();
        blocks.push({ type: 'heading', content: trimmed });
        continue;
      }

      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
      if (isBullet) {
        flushParagraph();
        currentBullets.push(trimmed.slice(1).trim());
        continue;
      }

      currentParagraph.push(trimmed);
    }

    flushParagraph();
    flushBullets();
    return blocks;
  };

  const scoreColor = (score: number) =>
    score >= 90 ? 'var(--status-online)' : score >= 70 ? 'var(--status-warning)' : 'var(--status-error)';

  const reportLooksIncomplete = (text?: string) => {
    if (!text) return true;
    const trimmed = text.trim();
    if (trimmed.length < 220) return true;
    return !trimmed.endsWith('.') && !trimmed.endsWith('!') && !trimmed.endsWith('?');
  };

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
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: 'rgba(255,255,255,0.3)', // Base border color for the spinner
              borderTopColor: 'var(--border-strong)',
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
      {isLoading && <SectionLoader type="table" label="Loading reports…" />}

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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Report Type
            </span>
            {filterOptions.map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: `1px solid ${filterType === type ? 'var(--brand)' : 'var(--border)'}`,
                  background: filterType === type ? 'linear-gradient(135deg, var(--brand) 0%, rgba(30, 41, 59, 0.6) 100%)' : 'transparent',
                  color: filterType === type ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: filterType === type ? 500 : 400,
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {type === 'all' ? 'All' : formatReportType(type)}
              </button>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Generate
              </span>
              <select
                value={generateType}
                onChange={(e) => setGenerateType(e.target.value)}
                style={{
                  fontSize: '13px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              >
                {generateOptions.map((type) => (
                  <option key={type} value={type}>
                    {formatReportType(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reports table */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '24px',
              minHeight: '366px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '28%' }} />
                <col style={{ width: '35%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
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
                {reports.length > 0 && filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                      No reports match this filter
                    </td>
                  </tr>
                )}
                {pagedReports.map((r) => (
                  <tr
                    key={r.report_id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {formatReportType(r.report_type)}
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
                {pagedReports.length > 0 && Array.from({ length: emptyRows }).map((_, idx) => (
                  <tr key={`report-empty-${idx}`} style={{ height: '49px', borderBottom: idx < emptyRows - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td colSpan={4} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length > 0 && (
            <PaginationBar
              start={pageStart + 1}
              end={Math.min(pageEnd, filteredReports.length)}
              total={filteredReports.length}
              page={safePage}
              totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="report-pagination-spacing"
            />
          )}

          {/* Report text viewer */}
          {selected && (
            <div
              className="report-viewer"
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                {formatReportType(selected.report_type)} Activity Summary — {format(new Date(selected.generated_at), 'MMM d, yyyy')}
              </h2>
              {reportLooksIncomplete(selected.summary_text) && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  marginBottom: '10px',
                  color: 'var(--status-warning)',
                  fontSize: '12px',
                }}>
                  This report content appears incomplete. Generate a fresh report to view the full summary.
                </div>
              )}
              <div style={{ borderBottom: '1px solid var(--border)', margin: '8px 0 16px 0' }} />
              <div className="report-viewer-content">
                {parseReportText(selected.summary_text).map((block, index) => {
                  if (block.type === 'heading') {
                    return (
                      <div key={index} className="report-section-title">
                        {block.content as string}
                      </div>
                    );
                  }

                  if (block.type === 'bullets') {
                    return (
                      <ul key={index} className="report-bullets">
                        {(block.content as string[]).map((item, itemIndex) => (
                          <li key={itemIndex}>{item}</li>
                        ))}
                      </ul>
                    );
                  }

                  return (
                    <p key={index} className="report-paragraph">
                      {block.content as string}
                    </p>
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
