import { useState, useRef, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../styles/theme';

export default function UserMenu() {
  const { instance, accounts } = useMsal();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const account = accounts[0];
  const displayName = account?.name || account?.username || 'User';
  const email = account?.username || '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: '/' });
  };

  if (!account) return null;

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
          color: 'white',
          fontSize: '14px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        title={displayName}
      >
        {initials}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '48px',
            width: '280px',
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px', borderBottom: `1px solid ${theme.cardBorder}` }}>
            <p style={{ fontWeight: '600', color: theme.text, fontSize: '14px' }}>{displayName}</p>
            <p style={{ color: theme.textSubtle, fontSize: '13px', marginTop: '2px' }}>{email}</p>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px 16px',
              textAlign: 'left',
              color: COLORS.danger,
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
