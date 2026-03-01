import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../styles/theme';

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

interface NavItem {
  to: string;
  label: string;
}

const NAV_ITEMS: (NavItem | 'separator')[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/browse-items', label: 'Browse Items' },
  { to: '/doa-items', label: 'DOA Items' },
  { to: '/categories', label: 'Categories' },
  { to: '/roles', label: 'Roles' },
  { to: '/thresholds', label: 'Thresholds' },
  { to: '/countries', label: 'Countries' },
  { to: '/glossary', label: 'Glossary' },
  { to: '/settings', label: 'Settings' },
  'separator',
  { to: '/audit-log', label: 'Audit Log' },
  { to: '/import-export', label: 'Import/Export' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EditorShellProps {
  children: ReactNode;
}

export default function EditorShell({ children }: EditorShellProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user } = useUser();

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.pageBg,
      }}
    >
      {/* ---- Sidebar ---- */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          backgroundColor: theme.headerBg,
          borderRight: `1px solid ${theme.cardBorder}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          overflowY: 'auto',
        }}
      >
        {/* Logo / brand */}
        <div
          style={{
            padding: '20px 16px 12px',
            borderBottom: `1px solid ${theme.cardBorder}`,
          }}
        >
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.accent,
              margin: 0,
              letterSpacing: '0.02em',
            }}
          >
            DOA Editor
          </h1>
          <p
            style={{
              fontSize: 11,
              color: theme.textSubtle,
              marginTop: 2,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            TAQA Admin
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV_ITEMS.map((item, idx) => {
            if (item === 'separator') {
              return (
                <div
                  key={`sep-${idx}`}
                  style={{
                    height: 1,
                    backgroundColor: theme.cardBorder,
                    margin: '8px 16px',
                  }}
                />
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '9px 20px',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? COLORS.accent : theme.textMuted,
                  backgroundColor: isActive ? (isDark ? 'rgba(232, 106, 44, 0.12)' : 'rgba(232, 106, 44, 0.08)') : 'transparent',
                  borderLeft: isActive ? `3px solid ${COLORS.accent}` : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                })}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer area: user + theme toggle */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: `1px solid ${theme.cardBorder}`,
          }}
        >
          <button
            onClick={toggleTheme}
            style={{
              width: '100%',
              padding: '7px 12px',
              borderRadius: 6,
              backgroundColor: theme.tagBg,
              color: theme.textMuted,
              fontSize: 13,
              fontWeight: 500,
              border: `1px solid ${theme.cardBorder}`,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>

          {user && (
            <p
              style={{
                fontSize: 12,
                color: theme.textSubtle,
                marginTop: 8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.displayName}
            </p>
          )}
        </div>
      </aside>

      {/* ---- Main content ---- */}
      <div
        style={{
          flex: 1,
          marginLeft: 240,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* Top header bar */}
        <header
          style={{
            height: 56,
            backgroundColor: theme.headerBg,
            borderBottom: `1px solid ${theme.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: theme.text,
            }}
          >
            DOA Editor
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: 6,
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: 13,
                color: theme.textMuted,
              }}
            >
              {isDark ? 'Light' : 'Dark'}
            </button>

            {user && (
              <span
                style={{
                  fontSize: 13,
                  color: theme.textSubtle,
                  fontWeight: 500,
                }}
              >
                {user.displayName}
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main
          style={{
            flex: 1,
            padding: 24,
            maxWidth: 1280,
            width: '100%',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
