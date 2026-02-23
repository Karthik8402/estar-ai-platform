import { useState } from 'react';
import { getThresholds, getComplianceRules, type AuditThresholds } from '../../config/simulatedAuditData';

const THRESHOLD_META: Array<{ key: keyof AuditThresholds; label: string; suffix: string }> = [
  { key: 'failed_login_threshold', label: 'Failed login threshold', suffix: 'attempts' },
  { key: 'bulk_deletion_threshold', label: 'Bulk deletion threshold', suffix: 'records' },
  { key: 'off_hours_start', label: 'Off-hours start', suffix: 'local' },
  { key: 'off_hours_end', label: 'Off-hours end', suffix: 'local' },
  { key: 'field_correction_limit', label: 'Field correction limit', suffix: 'per session' },
  { key: 'timestamp_tolerance', label: 'Timestamp tolerance', suffix: 'seconds' },
];

export default function AuditSettings() {
  const [thresholds, setThresholds] = useState<AuditThresholds>(() => getThresholds());
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const rules = getComplianceRules();

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setEditMode(false);
    }, 800); // simulated save
  };

  const handleChange = (key: keyof AuditThresholds, value: string) => {
    setThresholds(prev => ({ ...prev, [key]: isNaN(Number(value)) ? value : Number(value) }));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Settings</h2>
        {editMode ? (
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
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        ) : (
          <button
            onClick={() => setEditMode(true)}
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
                  value={String(thresholds[key])}
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
                  {String(thresholds[key])}
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
