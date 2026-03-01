import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../styles/theme';
import {
  getCountries,
  addCountry,
  deleteCountry,
  updateCountryRisk,
  type CountryRecord,
} from '../../api/admin.api';
import LoadingSpinner from '../shared/LoadingSpinner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RISK_LEVELS = [
  { value: 'safe', label: 'Safe', color: COLORS.success },
  { value: 'special', label: 'Special', color: COLORS.warning },
  { value: 'high_risk', label: 'High Risk', color: COLORS.danger },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CountryManagement() {
  const { theme } = useTheme();

  const [countries, setCountries] = useState<CountryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  // ---- New country form ----
  const [newName, setNewName] = useState('');
  const [newRisk, setNewRisk] = useState('safe');
  const [adding, setAdding] = useState(false);

  // ---- Load countries ----
  const loadCountries = useCallback(async () => {
    try {
      setError(null);
      const data = await getCountries();
      setCountries(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load countries';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  // ---- Filtered + grouped ----
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return countries.filter((c) => c.name.toLowerCase().includes(q));
  }, [countries, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, CountryRecord[]> = { safe: [], special: [], high_risk: [] };
    for (const c of filtered) {
      const key = c.risk_level in groups ? c.risk_level : 'high_risk';
      groups[key].push(c);
    }
    // Sort alphabetically within each group
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    }
    return groups;
  }, [filtered]);

  // ---- Handlers ----
  const handleRiskChange = async (country: CountryRecord, newRisk: string) => {
    if (newRisk === country.risk_level) return;
    setUpdating(country.id);
    try {
      const updated = await updateCountryRisk(country.id, newRisk);
      setCountries((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update risk level';
      setError(message);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (country: CountryRecord) => {
    const confirmed = window.confirm(`Remove "${country.name}" from the country list?`);
    if (!confirmed) return;
    setUpdating(country.id);
    try {
      await deleteCountry(country.id);
      setCountries((prev) => prev.filter((c) => c.id !== country.id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete country';
      setError(message);
    } finally {
      setUpdating(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    setAdding(true);
    setError(null);
    try {
      const created = await addCountry(trimmed, newRisk);
      setCountries((prev) => [...prev, created]);
      setNewName('');
      setNewRisk('safe');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add country';
      setError(message);
    } finally {
      setAdding(false);
    }
  };

  // ---- Styles ----
  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '24px',
    padding: '32px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: `1px solid ${theme.cardBorder}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: '14px',
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme.cardBorder}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: '13px',
    cursor: 'pointer',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: theme.textSubtle,
    borderBottom: `2px solid ${theme.cardBorder}`,
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: '14px',
    color: theme.text,
    borderBottom: `1px solid ${theme.cardBorder}`,
    verticalAlign: 'middle',
  };

  const riskBadge = (level: string): React.CSSProperties => {
    const rl = RISK_LEVELS.find((r) => r.value === level) || RISK_LEVELS[2];
    return {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor:
        level === 'safe' ? theme.successBg : level === 'special' ? theme.warningBg : theme.dangerBg,
      color: level === 'safe' ? theme.successText : level === 'special' ? theme.warningText : theme.dangerText,
    };
  };

  // ---- Render ----
  if (loading) return <LoadingSpinner theme={theme} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Add country card */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.text, margin: '0 0 16px' }}>
          Add Country
        </h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: theme.textSubtle, marginBottom: '6px' }}>
              Country Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Saudi Arabia"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: '0 0 160px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: theme.textSubtle, marginBottom: '6px' }}>
              Risk Level
            </label>
            <select
              value={newRisk}
              onChange={(e) => setNewRisk(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {RISK_LEVELS.map((rl) => (
                <option key={rl.value} value={rl.value}>{rl.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: adding || !newName.trim()
                ? theme.cardBorder
                : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              cursor: adding || !newName.trim() ? 'not-allowed' : 'pointer',
              border: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {adding ? 'Adding...' : 'Add Country'}
          </button>
        </form>
      </div>

      {/* Country list card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.text, margin: 0 }}>Countries</h2>
            <p style={{ color: theme.textSubtle, fontSize: '13px', marginTop: '4px' }}>
              {countries.length} total &mdash;{' '}
              {countries.filter((c) => c.risk_level === 'safe').length} safe,{' '}
              {countries.filter((c) => c.risk_level === 'special').length} special,{' '}
              {countries.filter((c) => c.risk_level === 'high_risk').length} high risk
            </p>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries..."
            style={{ ...inputStyle, width: '260px', flex: '0 0 auto' }}
          />
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: theme.dangerBg,
            color: theme.dangerText,
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* Grouped tables */}
        {RISK_LEVELS.map(({ value: riskKey, label: riskLabel }) => {
          const group = grouped[riskKey] || [];
          if (group.length === 0) return null;

          return (
            <div key={riskKey} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={riskBadge(riskKey)}>{riskLabel}</span>
                <span style={{ fontSize: '13px', color: theme.textSubtle }}>
                  ({group.length} countr{group.length !== 1 ? 'ies' : 'y'})
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Country</th>
                      <th style={thStyle}>Risk Level</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((country) => (
                      <tr key={country.id}>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '500' }}>{country.name}</span>
                        </td>
                        <td style={tdStyle}>
                          <select
                            value={country.risk_level}
                            onChange={(e) => handleRiskChange(country, e.target.value)}
                            disabled={updating === country.id}
                            style={selectStyle}
                          >
                            {RISK_LEVELS.map((rl) => (
                              <option key={rl.value} value={rl.value}>{rl.label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <button
                            onClick={() => handleDelete(country)}
                            disabled={updating === country.id}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: updating === country.id ? 'wait' : 'pointer',
                              border: 'none',
                              backgroundColor: theme.dangerBg,
                              color: theme.dangerText,
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: theme.textSubtle, padding: '32px 0' }}>
            {search ? 'No countries match your search.' : 'No countries configured.'}
          </p>
        )}
      </div>
    </div>
  );
}
