import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../styles/theme';
import { getSettings, updateSetting } from '../../api/admin.api';
import type { AppSetting } from '../../types';

// ---------------------------------------------------------------------------
// Per-row editing state
// ---------------------------------------------------------------------------

interface RowState {
  localValue: string;
  isBool: boolean;
  saving: boolean;
}

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { theme } = useTheme();
  const { showToast } = useToast();

  // ---- state ----
  const [items, setItems] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});

  // ---- helpers ----
  const isBooleanValue = (val: unknown): val is boolean => typeof val === 'boolean';

  const toDisplayString = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  };

  // Build row states from fetched settings
  const buildRowStates = (settings: AppSetting[]): Record<string, RowState> => {
    const states: Record<string, RowState> = {};
    for (const s of settings) {
      states[s.key] = {
        localValue: isBooleanValue(s.value) ? String(s.value) : toDisplayString(s.value),
        isBool: isBooleanValue(s.value),
        saving: false,
      };
    }
    return states;
  };

  // ---- fetch ----
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSettings();
      setItems(data);
      setRowStates(buildRowStates(data));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load settings';
      setError(msg);
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- row change ----
  const setRowValue = (key: string, localValue: string) => {
    setRowStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], localValue },
    }));
  };

  // ---- save one setting ----
  const handleSave = async (setting: AppSetting) => {
    const row = rowStates[setting.key];
    if (!row) return;

    // Parse value back to the correct type
    let parsed: unknown;
    if (row.isBool) {
      parsed = row.localValue === 'true';
    } else {
      // Try JSON parse first, fall back to raw string
      try {
        parsed = JSON.parse(row.localValue);
      } catch {
        parsed = row.localValue;
      }
    }

    setRowStates((prev) => ({
      ...prev,
      [setting.key]: { ...prev[setting.key], saving: true },
    }));

    try {
      await updateSetting(setting.key, parsed);
      showToast('success', `Setting "${setting.key}" saved`);
      // Refresh to get the server's canonical value
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Save failed';
      showToast('error', msg);
    } finally {
      setRowStates((prev) => ({
        ...prev,
        [setting.key]: { ...prev[setting.key], saving: false },
      }));
    }
  };

  // ---- shared styles ----
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 6,
    border: `1px solid ${theme.inputBorder}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: 14,
    outline: 'none',
  };

  // ---- render ----
  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <h2 style={{ margin: 0, marginBottom: 20, fontSize: 22, fontWeight: 700, color: theme.text }}>
        Settings
      </h2>

      {/* Loading / error */}
      {loading && (
        <p style={{ color: theme.textSubtle, fontSize: 14 }}>Loading...</p>
      )}
      {error && (
        <p style={{ color: theme.dangerText, fontSize: 14, marginBottom: 12 }}>
          {error}
        </p>
      )}

      {/* Settings rows */}
      {!loading && items.length === 0 && (
        <p style={{ color: theme.textSubtle, fontSize: 14 }}>No settings found.</p>
      )}

      {!loading && items.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {items.map((setting) => {
            const row = rowStates[setting.key];
            if (!row) return null;

            return (
              <div
                key={setting.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 18px',
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: 10,
                  flexWrap: 'wrap',
                }}
              >
                {/* Key label */}
                <div
                  style={{
                    minWidth: 200,
                    fontWeight: 600,
                    fontSize: 14,
                    color: theme.text,
                    fontFamily: 'monospace',
                  }}
                >
                  {setting.key}
                </div>

                {/* Value editor */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  {row.isBool ? (
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        color: theme.text,
                        fontSize: 14,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={row.localValue === 'true'}
                        onChange={(e) =>
                          setRowValue(setting.key, e.target.checked ? 'true' : 'false')
                        }
                        style={{ width: 16, height: 16, accentColor: COLORS.primary }}
                      />
                      {row.localValue === 'true' ? 'Enabled' : 'Disabled'}
                    </label>
                  ) : (
                    <input
                      type="text"
                      value={row.localValue}
                      onChange={(e) => setRowValue(setting.key, e.target.value)}
                      style={inputStyle}
                    />
                  )}
                </div>

                {/* Save button */}
                <button
                  onClick={() => handleSave(setting)}
                  disabled={row.saving}
                  style={{
                    padding: '6px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: row.saving ? 'not-allowed' : 'pointer',
                    opacity: row.saving ? 0.7 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
