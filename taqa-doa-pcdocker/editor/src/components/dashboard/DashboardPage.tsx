import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../styles/theme';
import type { AuditLogEntry } from '../../types';
import { getBrowseItems } from '../../api/browse-items.api';
import { getDOAItems } from '../../api/doa-items.api';
import {
  getRoles,
  getCategories,
  getCountries,
  getThresholds,
  getGlossary,
  getAuditLog,
} from '../../api/admin.api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatCard {
  label: string;
  count: number | null;
  color: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Helper: format relative time
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
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

export default function DashboardPage() {
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [stats, setStats] = useState<StatCard[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        browseItems,
        doaItems,
        roles,
        categories,
        countries,
        thresholds,
        glossary,
        auditResult,
      ] = await Promise.all([
        getBrowseItems().catch(() => []),
        getDOAItems().catch(() => []),
        getRoles().catch(() => []),
        getCategories().catch(() => []),
        getCountries().catch(() => []),
        getThresholds().catch(() => []),
        getGlossary().catch(() => []),
        getAuditLog({ limit: 10 }).catch(() => ({ rows: [], total: 0 })),
      ]);

      setStats([
        { label: 'Browse Items', count: browseItems.length, color: COLORS.primary, icon: '\u{1F4C2}' },
        { label: 'DOA Items', count: doaItems.length, color: COLORS.accent, icon: '\u{1F4CB}' },
        { label: 'Roles', count: roles.length, color: COLORS.purple, icon: '\u{1F465}' },
        { label: 'Categories', count: categories.length, color: COLORS.info, icon: '\u{1F3F7}' },
        { label: 'Countries', count: countries.length, color: COLORS.success, icon: '\u{1F30D}' },
        { label: 'Thresholds', count: thresholds.length, color: COLORS.warning, icon: '\u{1F4CA}' },
        { label: 'Glossary', count: glossary.length, color: COLORS.primaryLight, icon: '\u{1F4D6}' },
      ]);
      setAuditEntries(auditResult.rows);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: theme.textSubtle }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text, margin: '0 0 24px 0' }}>
        Dashboard
      </h1>

      {/* Stat cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 10,
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Accent bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: stat.color,
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: theme.textSubtle, fontWeight: 500 }}>
                {stat.label}
              </span>
              <span style={{ fontSize: 20 }}>{stat.icon}</span>
            </div>

            <span style={{ fontSize: 28, fontWeight: 700, color: theme.text }}>
              {stat.count ?? '\u2014'}
            </span>
          </div>
        ))}
      </div>

      {/* Recent audit log */}
      <div
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${theme.cardBorder}`,
            backgroundColor: theme.headerBg,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: 0 }}>
            Recent Activity
          </h2>
        </div>

        {auditEntries.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: theme.textSubtle, fontSize: 14 }}>
            No recent activity.
          </div>
        ) : (
          <div>
            {auditEntries.map((entry) => {
              const ac = actionColor(entry.action);
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: `1px solid ${theme.cardBorder}`,
                  }}
                >
                  {/* Timestamp */}
                  <span
                    style={{
                      fontSize: 12,
                      color: theme.textSubtle,
                      minWidth: 70,
                      flexShrink: 0,
                    }}
                  >
                    {timeAgo(entry.created_at)}
                  </span>

                  {/* Action badge */}
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
                      flexShrink: 0,
                      minWidth: 56,
                      textAlign: 'center',
                    }}
                  >
                    {entry.action}
                  </span>

                  {/* Entity */}
                  <span style={{ fontSize: 13, color: theme.text, flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600 }}>{entry.entity_type}</span>
                    {entry.entity_id && (
                      <span style={{ color: theme.textSubtle, marginLeft: 4 }}>#{entry.entity_id}</span>
                    )}
                  </span>

                  {/* User */}
                  <span
                    style={{
                      fontSize: 12,
                      color: theme.textSubtle,
                      flexShrink: 0,
                      maxWidth: 180,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.user_display_name || entry.user_email || entry.user_id || 'system'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
