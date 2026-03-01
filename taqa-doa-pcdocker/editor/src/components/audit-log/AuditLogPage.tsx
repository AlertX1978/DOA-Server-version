import { useState, useEffect, useCallback, Fragment } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../styles/theme';
import type { AuditLogEntry } from '../../types';
import { getAuditLog } from '../../api/admin.api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const ENTITY_TYPES = [
  'browse_item',
  'doa_item',
  'category',
  'role',
  'country',
  'threshold',
  'glossary',
  'setting',
];

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE'];

// ---------------------------------------------------------------------------
// Helper: format timestamp
// ---------------------------------------------------------------------------

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Helper: format JSON
// ---------------------------------------------------------------------------

function formatJson(val: unknown): string {
  if (val == null) return '(none)';
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

// ---------------------------------------------------------------------------
// Helper: action badge color
// ---------------------------------------------------------------------------

function actionColor(action: string): { bg: string; text: string } {
  switch (action.toUpperCase()) {
    case 'CREATE':
      return { bg: COLORS.success + '25', text: COLORS.success };
    case 'UPDATE':
      return { bg: COLORS.info + '25', text: COLORS.info };
    case 'DELETE':
      return { bg: COLORS.danger + '25', text: COLORS.danger };
    default:
      return { bg: COLORS.warning + '25', text: COLORS.warning };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AuditLogPage() {
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { limit: number; offset: number; entity_type?: string; action?: string } = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      };
      if (entityFilter) params.entity_type = entityFilter;
      if (actionFilter) params.action = actionFilter;

      const result = await getAuditLog(params);
      setEntries(result.rows);
      setTotal(result.total);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, actionFilter, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [entityFilter, actionFilter]);

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ---- Styles ----

  const selectStyle: React.CSSProperties = {
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${theme.inputBorder}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
  };

  const cellStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderBottom: `1px solid ${theme.cardBorder}`,
    fontSize: 13,
    color: theme.text,
    verticalAlign: 'top',
  };

  const thStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: theme.textSubtle,
    backgroundColor: theme.headerBg,
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  };

  const pageBtnStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 6,
    backgroundColor: theme.tagBg,
    color: disabled ? theme.textSubtle : theme.text,
    fontSize: 13,
    fontWeight: 500,
    border: `1px solid ${theme.cardBorder}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div>
      {/* Header */}
      <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text, margin: '0 0 20px 0' }}>
        Audit Log
      </h1>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} style={selectStyle} title="Filter by entity type" aria-label="Filter by entity type">
          <option value="">All Entity Types</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={selectStyle} title="Filter by action" aria-label="Filter by action">
          <option value="">All Actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <span style={{ fontSize: 13, color: theme.textSubtle }}>
          {total} entr{total !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: theme.textSubtle }}>Loading...</div>
      )}

      {/* Table */}
      {!loading && (
        <div
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 40 }}></th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Action</th>
                  <th style={thStyle}>Entity Type</th>
                  <th style={thStyle}>Entity ID</th>
                  <th style={thStyle}>Changes</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...cellStyle, textAlign: 'center', padding: '32px 16px', color: theme.textSubtle }}>
                      No audit log entries found.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const isExpanded = expandedRows.has(entry.id);
                    const ac = actionColor(entry.action);
                    const hasChanges = entry.old_value != null || entry.new_value != null;

                    return (
                      <Fragment key={entry.id}>
                        <tr
                          style={{ cursor: hasChanges ? 'pointer' : 'default', transition: 'background-color 0.15s' }}
                          onClick={() => hasChanges && toggleRow(entry.id)}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = theme.tagBg; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                        >
                          {/* Expand button */}
                          <td style={cellStyle}>
                            {hasChanges && (
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleRow(entry.id); }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: theme.textSubtle,
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                {isExpanded ? '\u25BC' : '\u25B6'}
                              </button>
                            )}
                          </td>

                          {/* Time */}
                          <td style={{ ...cellStyle, whiteSpace: 'nowrap', fontSize: 12 }}>
                            {formatTime(entry.created_at)}
                          </td>

                          {/* User */}
                          <td style={cellStyle}>
                            {entry.user_display_name || entry.user_email || entry.user_id || 'system'}
                          </td>

                          {/* Action */}
                          <td style={cellStyle}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 4,
                                backgroundColor: ac.bg,
                                color: ac.text,
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {entry.action}
                            </span>
                          </td>

                          {/* Entity type */}
                          <td style={cellStyle}>{entry.entity_type}</td>

                          {/* Entity ID */}
                          <td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: 12 }}>
                            {entry.entity_id ?? '\u2014'}
                          </td>

                          {/* Changes indicator */}
                          <td style={cellStyle}>
                            {hasChanges ? (
                              <span style={{ fontSize: 12, color: theme.textSubtle }}>
                                {isExpanded ? 'Hide details' : 'Show details'}
                              </span>
                            ) : (
                              <span style={{ fontSize: 12, color: theme.textSubtle }}>\u2014</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {isExpanded && hasChanges && (
                          <tr>
                            <td colSpan={7} style={{ padding: 0, borderBottom: `1px solid ${theme.cardBorder}` }}>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: 16,
                                  padding: '16px 20px',
                                  backgroundColor: theme.tagBg,
                                }}
                              >
                                {/* Old value */}
                                <div>
                                  <label
                                    style={{
                                      display: 'block',
                                      fontSize: 11,
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                      color: theme.textSubtle,
                                      marginBottom: 6,
                                    }}
                                  >
                                    Old Value
                                  </label>
                                  <pre
                                    style={{
                                      margin: 0,
                                      padding: 12,
                                      borderRadius: 6,
                                      backgroundColor: theme.inputBg,
                                      border: `1px solid ${theme.inputBorder}`,
                                      fontSize: 12,
                                      fontFamily: 'monospace',
                                      color: theme.text,
                                      overflowX: 'auto',
                                      maxHeight: 300,
                                      overflowY: 'auto',
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    {formatJson(entry.old_value)}
                                  </pre>
                                </div>

                                {/* New value */}
                                <div>
                                  <label
                                    style={{
                                      display: 'block',
                                      fontSize: 11,
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                      color: theme.textSubtle,
                                      marginBottom: 6,
                                    }}
                                  >
                                    New Value
                                  </label>
                                  <pre
                                    style={{
                                      margin: 0,
                                      padding: 12,
                                      borderRadius: 6,
                                      backgroundColor: theme.inputBg,
                                      border: `1px solid ${theme.inputBorder}`,
                                      fontSize: 12,
                                      fontFamily: 'monospace',
                                      color: theme.text,
                                      overflowX: 'auto',
                                      maxHeight: 300,
                                      overflowY: 'auto',
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    {formatJson(entry.new_value)}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderTop: `1px solid ${theme.cardBorder}`,
                backgroundColor: theme.headerBg,
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={pageBtnStyle(page === 0)}
              >
                Previous
              </button>

              <span style={{ fontSize: 13, color: theme.textMuted }}>
                Page {page + 1} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={pageBtnStyle(page >= totalPages - 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

