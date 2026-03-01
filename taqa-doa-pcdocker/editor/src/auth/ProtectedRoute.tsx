import { type ReactNode } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { IS_AUTH_CONFIGURED, loginRequest } from './msalConfig';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../styles/theme';

interface ProtectedRouteProps {
  children: ReactNode;
}

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

function LoginPrompt() {
  const { instance } = useMsal();
  const { theme } = useTheme();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((err) => {
      console.error('[auth] Login failed:', err);
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.pageBg }}>
      <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '24px', padding: '48px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: theme.text, marginBottom: '8px' }}>DOA Editor</h1>
        <p style={{ color: theme.textMuted, marginBottom: '32px', fontSize: '14px' }}>
          Sign in with your TAQA account to access the DOA Editor.
        </p>
        <button
          onClick={handleLogin}
          style={{ width: '100%', padding: '14px 24px', fontSize: '15px', fontWeight: '600', borderRadius: '12px', background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`, color: 'white', cursor: 'pointer' }}
        >
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}
