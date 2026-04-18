import { useState } from 'react';
import type { AuditThresholds } from '../../config/simulatedAuditData';
import { useThresholds, useComplianceRules, useUpdateThresholds } from '../../hooks/audit/useAuditConfig';
import SectionLoader from '../shared/SectionLoader';
import SectionError from '../shared/SectionError';

const THRESHOLD_META: Array<{ key: keyof AuditThresholds; label: string; suffix: string }> = [
  { key: 'failed_login_threshold', label: 'Failed login threshold', suffix: 'attempts' },
  { key: 'bulk_deletion_threshold', label: 'Bulk deletion threshold', suffix: 'records' },
  { key: 'off_hours_start', label: 'Off-hours start', suffix: 'local' },
  { key: 'off_hours_end', label: 'Off-hours end', suffix: 'local' },
  { key: 'field_correction_limit', label: 'Field correction limit', suffix: 'per session' },
  { key: 'timestamp_tolerance', label: 'Timestamp tolerance', suffix: 'seconds' },
  { key: 'late_pull_days_threshold', label: 'Late pull threshold', suffix: 'days' },
  { key: 'self_approval_enabled', label: 'Allow self-approval', suffix: '(true/false)' },
  { key: 'concurrent_session_window', label: 'Concurrent session window', suffix: 'minutes' },
  { key: 'missing_reason_severity', label: 'Missing reason severity', suffix: 'level' },
  { key: 'oos_override_severity', label: 'OOS override severity', suffix: 'level' },
  { key: 'backdated_entry_days', label: 'Backdated entry tolerance', suffix: 'days' },
];

export default function AuditSettings() {
  const { data: fetchedThresholds, isLoading: thresholdsLoading, isError: thresholdsError, refetch: refetchThresholds } = useThresholds();
  const { data: rules = [], isLoading: rulesLoading, isError: rulesError } = useComplianceRules();
  const updateThresholdsMutation = useUpdateThresholds();
  const [draftThresholds, setDraftThresholds] = useState<AuditThresholds | null>(null);
  const [editMode, setEditMode] = useState(false);
  const saving = updateThresholdsMutation.isPending;

  const isLoading = thresholdsLoading || rulesLoading;
  const thresholds = draftThresholds ?? fetchedThresholds ?? ({} as AuditThresholds);

  const beginEdit = () => {
    setDraftThresholds(fetchedThresholds ?? ({} as AuditThresholds));
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setDraftThresholds(null);
  };

  const handleSave = () => {
    updateThresholdsMutation.mutate(thresholds, {
      onSuccess: () => {
        setEditMode(false);
        setDraftThresholds(null);
      },
    });
  };

  const parseThresholdValue = (key: keyof AuditThresholds, value: string) => {
    if (key === 'self_approval_enabled') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    const numeric = Number(value);
    return Number.isNaN(numeric) ? value : numeric;
  };

  const handleChange = (key: keyof AuditThresholds, value: string) => {
    setDraftThresholds(prev => ({
      ...(prev ?? thresholds),
      [key]: parseThresholdValue(key, value),
    }));
  };

  if (isLoading) {
    return (
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Settings</h2>
        <SectionLoader type="cards" label="Loading settings…" />
      </div>
    );
  }

  if (thresholdsError || rulesError) {
    return (
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Settings</h2>
        <SectionError
          message="Could not load settings data."
          onRetry={() => refetchThresholds()}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Settings</h2>
        {editMode ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={cancelEdit}
              disabled={saving}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontWeight: 500,
                fontSize: '13px',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'var(--brand)',
                color: 'var(--text-inverse)',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 500,
                fontSize: '13px',
                fontFamily: 'inherit',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                transition: 'background 150ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {saving && (
                <span style={{
                  width: '14px', height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }} />
              )}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <button
            onClick={beginEdit}
            style={{
              background: 'var(--brand)',
              color: 'var(--text-inverse)',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 500,
              fontSize: '13px',
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
          >
            Edit
          </button>
        )}
      </div>

      {/* Save error inline */}
      {updateThresholdsMutation.isError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--status-error)',
        }}>
          Failed to save thresholds. Please try again.
        </div>
      )}

      {/* Detection Thresholds */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '16px',
          }}
        >
          Detection Thresholds
        </h3>

        {THRESHOLD_META.map(({ key, label, suffix }, i) => (
          <div
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: i < THRESHOLD_META.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editMode ? (
                <input
                  type="text"
                  value={String(thresholds[key] ?? '')}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="font-mono"
                  style={{
                    width: '80px',
                    textAlign: 'right',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong, var(--border))',
                    background: 'var(--surface-raised)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                />
              ) : (
                <span className="font-mono" style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {String(thresholds[key] ?? '—')}
                </span>
              )}
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{suffix}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Rules (read-only) */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '16px',
          }}
        >
          Compliance Rules
        </h3>

        {rules.length === 0 && (
          <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            No compliance rules configured
          </div>
        )}
        {rules.map((rule, i) => (
          <div
            key={rule.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: i < rules.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{rule.key}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>
              {rule.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
