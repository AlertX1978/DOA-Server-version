import type { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../styles/theme';

interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
}

export default function FormField({ label, children, error, required }: FormFieldProps) {
  const { theme } = useTheme();

  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          marginBottom: 4,
          fontSize: 13,
          fontWeight: 600,
          color: theme.textMuted,
          letterSpacing: '0.03em',
        }}
      >
        {label}
        {required && (
          <span style={{ color: COLORS.danger, marginLeft: 2 }}>*</span>
        )}
      </label>

      {children}

      {error && (
        <p
          style={{
            marginTop: 4,
            fontSize: 12,
            color: theme.dangerText,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
