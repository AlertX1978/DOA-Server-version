import { type ReactNode } from 'react';
import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
} from '@azure/msal-react';
import { IS_AUTH_CONFIGURED, loginRequest } from './msalConfig';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../styles/theme';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Renders children only when the user is authenticated.
 * When auth is not configured (dev mode), renders children unconditionally.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!IS_AUTH_CONFIGURED) {
    return <>{children}</>;
  }

  return (
    <>
      <AuthenticatedTemplate>{children}</AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <LoginPrompt />
      </UnauthenticatedTemplate>
    </>
  );
}

// ---------------------------------------------------------------------------
// Login prompt shown to unauthenticated users
// ---------------------------------------------------------------------------

function LoginPrompt() {
  const { instance } = useMsal();
  const { theme } = useTheme();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((err) => {
      console.error('[auth] Login failed:', err);
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.pageBg,
      }}
    >
      <div
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: '24px',
          padding: '48px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: theme.text, marginBottom: '8px' }}>
          DOA Reader
        </h1>
        <p style={{ color: theme.textMuted, marginBottom: '32px', fontSize: '14px' }}>
          Sign in with your TAQA account to access the Delegation of Authority system.
        </p>

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '14px 24px',
            fontSize: '15px',
            fontWeight: '600',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="10" height="10" fill="white" />
            <rect x="11" width="10" height="10" fill="white" />
            <rect y="11" width="10" height="10" fill="white" />
            <rect x="11" y="11" width="10" height="10" fill="white" />
          </svg>
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}
