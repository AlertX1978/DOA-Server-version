import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../styles/theme';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'Search...' }: SearchInputProps) {
  const { theme } = useTheme();
  const [local, setLocal] = useState(value);
  const debounced = useDebounce(local, 300);

  // Push debounced value upstream
  useEffect(() => {
    if (debounced !== value) {
      onChange(debounced);
    }
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync from parent when value is reset externally
  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
      {/* Search icon */}
      <span
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          color: theme.textSubtle,
          fontSize: 14,
          pointerEvents: 'none',
        }}
      >
        &#x1F50D;
      </span>

      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 12px 8px 32px',
          borderRadius: 6,
          border: `1px solid ${theme.inputBorder}`,
          backgroundColor: theme.inputBg,
          color: theme.text,
          fontSize: 14,
          outline: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 2px ${COLORS.primary}40`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      {/* Clear button */}
      {local && (
        <button
          onClick={() => {
            setLocal('');
            onChange('');
          }}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: theme.textSubtle,
            fontSize: 16,
            cursor: 'pointer',
            padding: '0 4px',
            lineHeight: 1,
          }}
          aria-label="Clear search"
        >
          x
        </button>
      )}
    </div>
  );
}
