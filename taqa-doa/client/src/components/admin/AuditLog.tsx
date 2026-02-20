import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../styles/theme';
import { getAuditLog, type AuditLogEntry } from '../../api/admin.api';
import LoadingSpinner from '../shared/LoadingSpinner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 25;

const ENTITY_TYPES = [
  { value: '', label: 'All Entity Types' },
  { value: 'user', label: 'User' },
  { value: 'country', label: 'Country' },
  { value: 'threshold', label: 'Threshold' },
  { value: 'role', label: 'Role' },
  { value: 'setting', label: 'Setting' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Render a compact diff-like summary of old_value -> new_value */
function renderChanges(oldVal: unknown, newVal: unknown, theme: ReturnType<typeof useTheme>['theme']): React.ReactNode {
  if (oldVal == null && newVal == null) {
    return <span style={{ color: theme.textSubtle }}>--</span>;
  }

  const formatVal = (v: unknown): string => {
    if (v == null) return '(none)';
    if (typeof v === 'object') {
      try {
        return JSON.stringify(v, null, 0);
      } catch {
        return String(v);
      }
    }
    return String(v);
  };

  // If both are objects, show per-key changes
  if (
    oldVal != null &&
    newVal != null &&
    typeof oldVal === 'object' &&
    typeof newVal === 'object' &&
    !Array.isArray(oldVal) &&
    !Array.isArray(newVal)
  ) {
    const oldObj = oldVal as Record<string, unknown>;
    const newObj = newVal as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    const changedKeys = [...allKeys].filter(
      (k) => JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k]),
    );

    if (changedKeys.length === 0) {
      return <span style={{ color: theme.textSubtle }}>No changes</span>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {changedKeys.map((key) => (
          <div key={key} style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <span style={{ fontWeight: '600', color: theme.textMuted }}>{key}: </span>
            <span style={{ color: theme.dangerText, textDecoration: 'line-through' }}>
              {formatVal(oldObj[key])}
            </span>
            <span style={{ color: theme.textSubtle, margin: '0 4px' }}>&rarr;</span>
            <span style={{ color: theme.successText }}>{formatVal(newObj[key])}</span>
          </div>
        ))}
      </div>
    );
  }

  // Simple old -> new
  return (
    <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
      {oldVal != null && (
        <span style={{ color: theme.dangerText, textDecoration: 'line-through' }}>
          {formatVal(oldVal)}
        </span>
      )}
      {oldVal != null && newVal != null && (
        <span style={{ color: theme.textSubtle, margin: '0 4px' }}>&rarr;</span>
      )}
      {newVal != null && (
        <span style={{ color: theme.successText }}>{formatVal(newVal)}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action label styling
// ---------------------------------------------------------------------------

function actionBadgeStyle(action: string, theme: ReturnType<typeof useTheme>['theme']): React.CSSProperties {
  let bg = theme.infoBg;
  let color = theme.infoText;

  if (action.toLowerCase().includes('create') || action.toLowerCase().includes('add')) {
    bg = theme.successBg;
    color = theme.successText;
  } else if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('remove')) {
    bg = theme.dangerBg;
    color = theme.dangerText;
  } else if (action.toLowerCase().includes('update') || action.toLowerCase().includes('change')) {
    bg = theme.warningBg;
    color = theme.warningText;
  }

  return {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: bg,
    color,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AuditLog() {
  const { theme } = useTheme();

  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState('');
  const [offset, setOffset] = useState(0);

  // ---- Fetch ----
  const fetchLog = useCallback(
    async (currentOffset: number, append: boolean) => {
      try {
        setError(null);
        const params: { limit: number; offset: number; entity_type?: string } = {
          limit: PAGE_SIZE,
          offset: currentOffset,
        };
        if (entityFilter) params.entity_type = entityFilter;

        const result = await getAuditLog(params);

        if (append) {
          setRows((prev) => [...prev, ...result.rows]);
        } else {
          setRows(result.rows);
        }
        setTotal(result.total);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load audit log';
        setError(message);
      }
    },
    [entityFilter],
  );

  // Initial load + filter change
  useEffect(() => {
    setLoading(true);
    setOffset(0);
    fetchLog(0, false).finally(() => setLoading(false));
  }, [fetchLog]);

  // ---- Load more ----
  const handleLoadMore = async () => {
    const newOffset = offset + PAGE_SIZE;
    setLoadingMore(true);
    setOffset(newOffset);
    await fetchLog(newOffset, true);
    setLoadingMore(false);
  };

  const hasMore = rows.length < total;

  // ---- Styles ----
  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '24px',
    padding: '32px',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: theme.textSubtle,
    borderBottom: `2px solid ${theme.cardBorder}`,
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '14px',
    color: theme.text,
    borderBottom: `1px solid ${theme.cardBorder}`,
    verticalAlign: 'top',
  };

  const selectStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '12px',
    border: `1px solid ${theme.cardBorder}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: '14px',
    cursor: 'pointer',
  };

  // ---- Render ----
  if (loading) return <LoadingSpinner theme={theme} />;

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.text, margin: 0 }}>Audit Log</h2>
          <p style={{ color: theme.textSubtle, fontSize: '13px', marginTop: '4px' }}>
            {total} total entr{total !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          style={selectStyle}
        >
          {ENTITY_TYPES.map((et) => (
            <option key={et.value} value={et.value}>{et.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          backgroundColor: theme.dangerBg,
          color: theme.dangerText,
          fontSize: '13px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Date / Time</th>
              <th style={thStyle}>User</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Entity Type</th>
              <th style={thStyle}>Entity ID</th>
              <th style={thStyle}>Changes</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: theme.textSubtle, padding: '48px 16px' }}>
                  No audit log entries found.
                </td>
              </tr>
            )}
            {rows.map((entry) => (
              <tr key={entry.id}>
                {/* Date/Time */}
                <td style={{ ...tdStyle, fontSize: '13px', whiteSpace: 'nowrap', color: theme.textSubtle }}>
                  {formatTimestamp(entry.created_at)}
                </td>

                {/* User */}
                <td style={tdStyle}>
                  <div>
                    <span style={{ fontWeight: '500', fontSize: '13px' }}>
                      {entry.user_display_name || entry.user_email || entry.user_id || 'System'}
                    </span>
                    {entry.user_email && entry.user_display_name && (
                      <div style={{ fontSize: '11px', color: theme.textSubtle, marginTop: '2px' }}>
                        {entry.user_email}
                      </div>
                    )}
                  </div>
                </td>

                {/* Action */}
                <td style={tdStyle}>
                  <span style={actionBadgeStyle(entry.action, theme)}>
                    {entry.action}
                  </span>
                </td>

                {/* Entity Type */}
                <td style={{ ...tdStyle, fontSize: '13px' }}>
                  {entry.entity_type}
                </td>

                {/* Entity ID */}
                <td style={{ ...tdStyle, fontSize: '13px', fontFamily: 'monospace', color: theme.textSubtle }}>
                  {entry.entity_id || '--'}
                </td>

                {/* Changes */}
                <td style={{ ...tdStyle, maxWidth: '320px' }}>
                  {renderChanges(entry.old_value, entry.new_value, theme)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: loadingMore
                ? theme.cardBorder
                : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              cursor: loadingMore ? 'wait' : 'pointer',
              border: 'none',
            }}
          >
            {loadingMore ? 'Loading...' : `Load More (${rows.length} of ${total})`}
          </button>
        </div>
      )}
    </div>
  );
}
