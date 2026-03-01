import { useMemo } from 'react';
import { COLORS } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { IS_AUTH_CONFIGURED } from '../../auth/msalConfig';
import ThemeToggle from '../shared/ThemeToggle';
import UserMenu from './UserMenu';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { isAdmin } = useUser();

  const tabs = useMemo(() => {
    const base = [
      { id: 'calculator', label: '4. Tenders & Contracts (Approvals)' },
      { id: 'browse', label: 'Browse DOA' },
      { id: 'help', label: 'Help' },
    ];
    if (isAdmin) {
      base.push({ id: 'admin', label: 'Admin' });
    }
    return base;
  }, [isAdmin]);

  return (
    <header style={{
      borderBottom: `1px solid ${theme.cardBorder}`,
      backdropFilter: 'blur(12px)',
      backgroundColor: theme.headerBg,
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: theme.text }}>DOA Reader</h1>
            <p style={{ color: theme.textMuted, fontSize: '14px' }}>Delegation of Authority &bull; Feb 2026 &bull; v4.0</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <nav style={{ display: 'flex', gap: '8px', backgroundColor: theme.tagBg, borderRadius: '16px', padding: '6px' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: activeTab === tab.id
                      ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`
                      : 'transparent',
                    color: activeTab === tab.id ? 'white' : theme.textMuted,
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} theme={theme} />
            {IS_AUTH_CONFIGURED && <UserMenu />}
          </div>
        </div>
      </div>
    </header>
  );
}
