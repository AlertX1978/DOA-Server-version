import { useTheme } from '../../context/ThemeContext';

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer style={{ borderTop: `1px solid ${theme.cardBorder}`, marginTop: '80px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
        <p style={{ textAlign: 'center', color: theme.textSubtle, fontSize: '14px' }}>
          DOA Reader &bull; For Internal Use Only
        </p>
      </div>
    </footer>
  );
}
