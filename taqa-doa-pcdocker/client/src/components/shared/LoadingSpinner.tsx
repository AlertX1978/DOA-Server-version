import type { Theme } from '../../types';
import { COLORS } from '../../styles/theme';

export default function LoadingSpinner({ theme }: { theme: Theme }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '256px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: `4px solid ${theme.cardBorder}`,
        borderTopColor: COLORS.primary,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: theme.textMuted, marginTop: '16px' }}>Loading...</p>
    </div>
  );
}
