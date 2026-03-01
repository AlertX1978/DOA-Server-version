import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../styles/theme';
import UserManagement from './UserManagement';
import CountryManagement from './CountryManagement';
import AuditLog from './AuditLog';

// ---------------------------------------------------------------------------
// Admin password (simple client-side gate for internal tool)
// ---------------------------------------------------------------------------

const ADMIN_PASSWORD = 'taqa2026';

// ---------------------------------------------------------------------------
// Sub-tab definitions
// ---------------------------------------------------------------------------

const ADMIN_TABS = [
  { id: 'users', label: 'Users' },
  { id: 'countries', label: 'Countries' },
  { id: 'audit', label: 'Audit Log' },
] as const;

type AdminTabId = (typeof ADMIN_TABS)[number]['id'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminPanel() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<AdminTabId>('users');

  // ---- Password gate ----
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('admin_auth') === 'true',
  );
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  // ---- Tab navigation styles (pill-style, matching Header pattern) ----
  const navStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    backgroundColor: theme.tagBg,
    borderRadius: '16px',
    padding: '6px',
    marginBottom: '32px',
    width: 'fit-content',
  };

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    background: isActive
      ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`
      : 'transparent',
    color: isActive ? 'white' : theme.textMuted,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: `1px solid ${passwordError ? COLORS.danger + '80' : theme.cardBorder}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  // ---- Password gate screen ----
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.text, margin: '0 0 8px' }}>
            Administration
          </h2>
          <p style={{ color: theme.textSubtle, fontSize: '14px', margin: '0 0 24px' }}>
            Enter password to access admin panel
          </p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              placeholder="Enter admin password..."
              style={inputStyle}
              autoFocus
            />
            {passwordError && (
              <p style={{ color: COLORS.danger, fontSize: '13px', margin: '8px 0 0', textAlign: 'left' }}>
                Incorrect password. Please try again.
              </p>
            )}
            <button
              type="submit"
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---- Authenticated admin panel ----
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: theme.text, margin: '0 0 4px' }}>
          Administration
        </h1>
        <p style={{ color: theme.textSubtle, fontSize: '14px', margin: 0 }}>
          Manage users, countries, and view the audit trail.
        </p>
      </div>

      {/* Sub-tab navigation */}
      <nav style={navStyle}>
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={tabButtonStyle(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Active panel */}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'countries' && <CountryManagement />}
      {activeTab === 'audit' && <AuditLog />}
    </div>
  );
}
