import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../styles/theme';
import { getGlossary } from '../../api/glossary.api';
import LoadingSpinner from '../shared/LoadingSpinner';
import type { GlossaryEntry } from '../../types';

const CODE_COLORS: Record<string, string> = {
  I: COLORS.info,
  R: COLORS.warning,
  E: COLORS.purple,
  X: COLORS.success,
  N: '#6B7280',
};

export default function HelpPanel() {
  const { theme } = useTheme();
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGlossary()
      .then(setGlossary)
      .catch((err) => console.error('Failed to load glossary:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner theme={theme} />;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: theme.cardBg,
        borderRadius: '24px',
        border: `1px solid ${theme.cardBorder}`,
        padding: '32px',
      }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: theme.text,
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          Activity Glossary
        </h2>

        <p style={{ color: theme.textMuted, marginBottom: '24px', fontSize: '14px' }}>
          The following codes indicate the type of action/authority assigned to each role in the approval workflow:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {glossary.map((entry) => (
            <div key={entry.code} style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              padding: '16px',
              backgroundColor: theme.tagBg,
              borderRadius: '12px',
            }}>
              <span style={{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: CODE_COLORS[entry.code] || theme.textSubtle,
                color: 'white', fontWeight: 'bold', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {entry.code}
              </span>
              <div>
                <div style={{ fontWeight: '600', color: theme.text, marginBottom: '4px' }}>{entry.name}</div>
                <div style={{ color: theme.textMuted, fontSize: '14px' }}>{entry.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: `${COLORS.info}15`,
          borderRadius: '12px',
          border: `1px solid ${COLORS.info}30`,
        }}>
          <p style={{ color: theme.text, fontSize: '13px', margin: 0 }}>
            <strong>Note:</strong> Numbers following the letters (e.g., X1, X2, R1, E2) indicate the sequence or priority of approvals within that action type.
          </p>
        </div>
      </div>
    </div>
  );
}
