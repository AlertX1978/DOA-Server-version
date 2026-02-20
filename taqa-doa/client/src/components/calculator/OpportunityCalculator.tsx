import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../styles/theme';
import { evaluateCalculator, getCountries } from '../../api/calculator.api';
import { getSettings } from '../../api/settings.api';
import { formatCurrency } from '../../utils/format';
import ActionBadge from '../shared/ActionBadge';
import LoadingSpinner from '../shared/LoadingSpinner';
import type { CalculatorResult, Country, FormState, Settings } from '../../types';

// ---------------------------------------------------------------------------
// Phase display configuration
// ---------------------------------------------------------------------------

const PHASE_META: Record<string, { label: string; color: string }> = {
  I: { label: 'Initiate', color: '#8B5CF6' },
  R: { label: 'Review / Recommend', color: '#0EA5E9' },
  E: { label: 'Endorse', color: '#F59E0B' },
  X: { label: 'Approve', color: '#10B981' },
  N: { label: 'Notify', color: '#6B7280' },
};

const DISPLAY_ORDER = ['X', 'E', 'R', 'I', 'N'];

const CONTRACT_TYPE_OPTIONS = [
  { value: 'standard', label: 'Standard (Bids, Tenders, Contracts)' },
  { value: 'nonBinding', label: 'Non-binding RFQ/RFP/Quote (Budgetary)' },
  { value: 'directSales', label: 'Direct Sales' },
  { value: 'directSalesMarkup', label: 'Direct Sales - Markup (Chemicals, etc.)' },
  { value: 'epf', label: 'EPF Commitments' },
];

// ---------------------------------------------------------------------------
// Default form state
// ---------------------------------------------------------------------------

const INITIAL_FORM: FormState = {
  contractValue: '',
  capexValue: '',
  contractType: 'standard',
  selectedCountry: 'Saudi Arabia',
  manualHighRisk: false,
  grossMargin: '',
  operatingProfitSAR: '',
  operatingProfitPercent: '45',
  markupPercent: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OpportunityCalculator() {
  const { theme } = useTheme();

  // ---- data from API ----
  const [countries, setCountries] = useState<Country[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // ---- form ----
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  // ---- result ----
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- initial data loading ----
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCountries(), getSettings()])
      .then(([c, s]) => {
        setCountries(c);
        setSettings(s);
      })
      .catch((err) => console.error('Failed to load initial data:', err))
      .finally(() => setDataLoading(false));
  }, []);

  // ---- country grouping (memoized) ----
  const countryGroups = useMemo(() => {
    if (!settings) return { special: [] as Country[], safe: [] as Country[], highRisk: [] as Country[] };
    const special = countries.filter((c) => settings.specialCountries.includes(c.name));
    const safe = countries.filter((c) => settings.safeCountries.includes(c.name));
    const highRisk = countries.filter(
      (c) => !settings.specialCountries.includes(c.name) && !settings.safeCountries.includes(c.name),
    );
    return { special, safe, highRisk };
  }, [countries, settings]);

  // ---- is the selected country already high-risk or special? ----
  const isCountryHighRisk = useMemo(() => {
    if (!form.selectedCountry) return false;
    const match = countries.find((c) => c.name === form.selectedCountry);
    return match?.risk_level === 'high_risk';
  }, [form.selectedCountry, countries]);

  const isCountrySpecial = useMemo(() => {
    if (!form.selectedCountry) return false;
    const match = countries.find((c) => c.name === form.selectedCountry);
    return match?.risk_level === 'special';
  }, [form.selectedCountry, countries]);

  // ---- bidirectional operating profit helpers ----
  const handleOperatingProfitSARChange = useCallback(
    (sarStr: string) => {
      const sarValue = parseFloat(sarStr) || 0;
      const cv = parseFloat(form.contractValue) || 0;
      const pct = cv > 0 ? ((sarValue / cv) * 100).toFixed(2) : form.operatingProfitPercent;
      setForm((prev) => ({ ...prev, operatingProfitSAR: sarStr, operatingProfitPercent: String(pct) }));
    },
    [form.contractValue, form.operatingProfitPercent],
  );

  const handleOperatingProfitPercentChange = useCallback(
    (pctStr: string) => {
      const pct = parseFloat(pctStr) || 0;
      const cv = parseFloat(form.contractValue) || 0;
      const sar = cv > 0 ? ((pct / 100) * cv).toFixed(0) : form.operatingProfitSAR;
      setForm((prev) => ({ ...prev, operatingProfitPercent: pctStr, operatingProfitSAR: String(sar) }));
    },
    [form.contractValue, form.operatingProfitSAR],
  );

  // ---- when contractValue changes, recalculate SAR from percent ----
  useEffect(() => {
    const cv = parseFloat(form.contractValue) || 0;
    const pct = parseFloat(form.operatingProfitPercent) || 0;
    if (cv > 0) {
      const sar = ((pct / 100) * cv).toFixed(0);
      setForm((prev) => {
        if (prev.operatingProfitSAR === sar) return prev;
        return { ...prev, operatingProfitSAR: sar };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.contractValue]);

  // ---- capex percentage ----
  const capexPercent = useMemo(() => {
    const cv = parseFloat(form.contractValue) || 0;
    const capex = parseFloat(form.capexValue) || 0;
    if (cv <= 0) return 0;
    return (capex / cv) * 100;
  }, [form.contractValue, form.capexValue]);

  // ---- debounced API call ----
  useEffect(() => {
    const cv = parseFloat(form.contractValue) || 0;
    if (cv <= 0) {
      setResult(null);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      evaluateCalculator({
        contractValue: cv,
        capexValue: parseFloat(form.capexValue) || 0,
        contractType: form.contractType as 'standard' | 'nonBinding' | 'directSales' | 'directSalesMarkup' | 'epf',
        selectedCountry: form.selectedCountry,
        manualHighRisk: form.manualHighRisk,
        grossMargin: parseFloat(form.grossMargin) || 0,
        operatingProfitPercent: parseFloat(form.operatingProfitPercent) || 0,
        markupPercent: parseFloat(form.markupPercent) || 0,
      })
        .then(setResult)
        .catch((err) => {
          console.error('Calculator evaluation failed:', err);
          setError(err instanceof Error ? err.message : 'Evaluation failed');
          setResult(null);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [
    form.contractValue,
    form.capexValue,
    form.contractType,
    form.selectedCountry,
    form.manualHighRisk,
    form.grossMargin,
    form.operatingProfitPercent,
    form.markupPercent,
  ]);

  // ---- field setter ----
  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setResult(null);
    setError(null);
  }, []);

  // ---- grouped approvers for display ----
  const groupedApprovers = useMemo(() => {
    if (!result) return null;
    const countX = settings?.countXWithoutNumber ?? true;

    const groups: Record<string, typeof result.approvers> = {};
    const excluded: typeof result.approvers = [];

    for (const approver of result.approvers) {
      const letter = approver.action.charAt(0);
      const hasNumber = /\d/.test(approver.action);

      if (letter === 'X' && !hasNumber && !countX) {
        excluded.push(approver);
        continue;
      }

      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(approver);
    }

    const ordered = DISPLAY_ORDER.filter((l) => groups[l]?.length).map((letter) => ({
      letter,
      meta: PHASE_META[letter],
      approvers: groups[letter],
    }));

    return { ordered, excluded };
  }, [result, settings]);

  // ---- styles ----
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: `1px solid ${theme.cardBorder}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: theme.textMuted,
    marginBottom: '8px',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '24px',
    padding: '32px',
  };

  // ---- loading screen ----
  if (dataLoading) return <LoadingSpinner theme={theme} />;

  // ---- visibility helpers ----
  const showCapex = form.contractType !== 'nonBinding';
  const showOperatingProfit = form.contractType !== 'nonBinding' && form.contractType !== 'epf';
  const showGrossMargin = form.contractType === 'directSales';
  const showMarkup = form.contractType === 'directSalesMarkup';

  // ---- render ----
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* ================================================================ */}
      {/* INPUT CARD                                                       */}
      {/* ================================================================ */}
      <div style={cardStyle}>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </span>
          Opportunity Details
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Country / Market */}
          <div>
            <label style={labelStyle}>
              Country / Market
              {isCountryHighRisk && (
                <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: theme.dangerBg, color: theme.dangerText, borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                  HIGH RISK
                </span>
              )}
              {isCountrySpecial && (
                <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: theme.warningBg, color: theme.warningText, borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                  SPECIAL - CEO REQUIRED
                </span>
              )}
            </label>
            <select
              style={{
                ...inputStyle,
                borderColor: isCountryHighRisk ? 'rgba(239,68,68,0.5)' : isCountrySpecial ? `${COLORS.warning}80` : theme.cardBorder,
              }}
              value={form.selectedCountry}
              onChange={(e) => {
                updateField('selectedCountry', e.target.value);
                updateField('manualHighRisk', false);
              }}
            >
              <option value="">Select Country...</option>
              {countryGroups.special.length > 0 && (
                <optgroup label="Special Countries (CEO Required)">
                  {countryGroups.special.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {countryGroups.safe.length > 0 && (
                <optgroup label="Safe Markets">
                  {countryGroups.safe.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {countryGroups.highRisk.length > 0 && (
                <optgroup label="Other Markets (High Risk)">
                  {countryGroups.highRisk.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Contract Type */}
          <div>
            <label style={labelStyle}>Contract Type</label>
            <select
              style={inputStyle}
              value={form.contractType}
              onChange={(e) => updateField('contractType', e.target.value)}
            >
              {CONTRACT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Total Contract Value */}
          <div>
            <label style={labelStyle}>Total Contract Value (SAR)</label>
            <input
              type="number"
              min="0"
              style={inputStyle}
              placeholder="e.g., 25000000"
              value={form.contractValue}
              onChange={(e) => updateField('contractValue', e.target.value)}
            />
            {form.contractValue && parseFloat(form.contractValue) > 0 && (
              <p style={{ marginTop: '6px', fontSize: '14px', fontWeight: '500', color: COLORS.primary }}>
                {formatCurrency(parseFloat(form.contractValue))}
              </p>
            )}
          </div>

          {/* Capex Value */}
          {showCapex && (
            <div>
              <label style={labelStyle}>
                Capex Value (SAR)
                {form.contractValue && form.capexValue && capexPercent > 0 && (
                  <span
                    style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: capexPercent > 10 ? theme.warningBg : theme.successBg,
                      color: capexPercent > 10 ? theme.warningText : theme.successText,
                    }}
                  >
                    {capexPercent.toFixed(1)}% of TCV
                  </span>
                )}
              </label>
              <input
                type="number"
                min="0"
                style={inputStyle}
                placeholder="e.g., 5000000"
                value={form.capexValue}
                onChange={(e) => updateField('capexValue', e.target.value)}
              />
              {form.capexValue && parseFloat(form.capexValue) > 0 && (
                <p style={{ marginTop: '6px', fontSize: '14px', fontWeight: '500', color: COLORS.primary }}>
                  {formatCurrency(parseFloat(form.capexValue))}
                </p>
              )}
              {capexPercent > 10 && parseFloat(form.contractValue) <= 5000000 && form.contractType === 'standard' && (
                <div style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: theme.warningBg, border: `1px solid ${COLORS.warning}30`, borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={theme.warningText} style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p style={{ color: theme.warningText, fontSize: '13px', margin: 0 }}>
                    <strong>Capex exceeds 10% of TCV.</strong> Per 4.2.3.1.3, approval will be escalated to 4.2.3.1.2 level.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Expected Operating Profit (bidirectional) */}
          {showOperatingProfit && (
            <div>
              <label style={labelStyle}>
                Expected Operating Profit
                {form.operatingProfitPercent && (
                  <span
                    style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: parseFloat(form.operatingProfitPercent) > 10 ? theme.successBg : theme.dangerBg,
                      color: parseFloat(form.operatingProfitPercent) > 10 ? theme.successText : theme.dangerText,
                    }}
                  >
                    {parseFloat(form.operatingProfitPercent) > 10 ? 'Above 10%' : 'Below 10%'}
                  </span>
                )}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
                <div>
                  <input
                    type="number"
                    min="0"
                    style={inputStyle}
                    placeholder="SAR value"
                    value={form.operatingProfitSAR}
                    onChange={(e) => handleOperatingProfitSARChange(e.target.value)}
                  />
                  {form.operatingProfitSAR && parseFloat(form.operatingProfitSAR) > 0 && (
                    <p style={{ marginTop: '4px', fontSize: '12px', color: theme.textMuted, margin: '4px 0 0' }}>
                      {formatCurrency(parseFloat(form.operatingProfitSAR))}
                    </p>
                  )}
                </div>
                <div style={{ color: theme.textMuted, fontWeight: '600', fontSize: '14px' }}>OR</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    style={{ ...inputStyle, paddingRight: '36px' }}
                    placeholder="%"
                    value={form.operatingProfitPercent}
                    onChange={(e) => handleOperatingProfitPercentChange(e.target.value)}
                  />
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted, fontWeight: '500' }}>%</span>
                </div>
              </div>
              <p style={{ marginTop: '6px', fontSize: '12px', color: theme.textSubtle }}>
                Edit either field - the other calculates automatically based on TCV
              </p>
            </div>
          )}

          {/* Gross Margin (directSales) */}
          {showGrossMargin && (
            <div>
              <label style={labelStyle}>Gross Margin (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                style={inputStyle}
                placeholder="Enter gross margin..."
                value={form.grossMargin}
                onChange={(e) => updateField('grossMargin', e.target.value)}
              />
            </div>
          )}

          {/* Markup Percent (directSalesMarkup) */}
          {showMarkup && (
            <div>
              <label style={labelStyle}>Markup (%)</label>
              <input
                type="number"
                min="0"
                style={inputStyle}
                placeholder="Enter markup percentage..."
                value={form.markupPercent}
                onChange={(e) => updateField('markupPercent', e.target.value)}
              />
            </div>
          )}

          {/* Manual High-Risk Override */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: (form.manualHighRisk || isCountryHighRisk) ? theme.dangerBg : 'rgba(239,68,68,0.05)',
            border: `1px solid ${(form.manualHighRisk || isCountryHighRisk) ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.15)'}`,
          }}>
            <input
              type="checkbox"
              id="manualHighRisk"
              checked={form.manualHighRisk}
              disabled={isCountryHighRisk}
              onChange={(e) => updateField('manualHighRisk', e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: COLORS.danger }}
            />
            <label
              htmlFor="manualHighRisk"
              style={{
                fontSize: '14px',
                color: theme.textMuted,
                cursor: isCountryHighRisk ? 'not-allowed' : 'pointer',
              }}
            >
              <span style={{ fontWeight: '600', color: COLORS.danger }}>Manual High-Risk Override</span>
              <span style={{ marginLeft: '8px', color: theme.textSubtle }}>
                {isCountryHighRisk ? '(country is already high risk)' : '(if determined by GRC)'}
              </span>
            </label>
          </div>

          {/* Reset button */}
          <button
            onClick={resetForm}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: `1px solid ${theme.cardBorder}`,
              backgroundColor: 'transparent',
              color: theme.textMuted,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Reset Form
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* RESULT CARD                                                      */}
      {/* ================================================================ */}
      <div style={cardStyle}>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </span>
          Review–Endorsement–Approval Chain
        </h2>

        {/* Loading state */}
        {loading && <LoadingSpinner theme={theme} />}

        {/* Error state */}
        {!loading && error && (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: theme.dangerBg,
              border: `1px solid ${COLORS.danger}30`,
              color: theme.dangerText,
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !result && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '256px',
              textAlign: 'center',
              color: theme.textSubtle,
            }}
          >
            <svg
              width="48"
              height="48"
              fill="none"
              viewBox="0 0 24 24"
              stroke={theme.textSubtle}
              style={{ marginBottom: '16px', opacity: 0.5 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <p style={{ fontSize: '14px', margin: 0 }}>
              Enter opportunity details to see the approval chain
            </p>
          </div>
        )}

        {/* Result display */}
        {!loading && !error && result && result.threshold && groupedApprovers && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Applicable Rule header */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: result.flags.isHighRisk ? theme.dangerBg : `${COLORS.primary}10`,
                border: `1px solid ${result.flags.isHighRisk ? 'rgba(239,68,68,0.2)' : COLORS.primary + '20'}`,
              }}
            >
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', color: result.flags.isHighRisk ? theme.dangerText : COLORS.primary, margin: '0 0 4px' }}>
                {result.threshold.code && `${result.threshold.code} \u2022 `}Applicable Rule
              </p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: theme.text, margin: '0 0 4px' }}>
                {result.threshold.name}
              </p>
              {form.selectedCountry && (
                <p style={{ color: theme.textMuted, fontSize: '14px', margin: '4px 0 0' }}>
                  Market: {form.selectedCountry}
                </p>
              )}
            </div>

            {/* Flags */}
            {(result.flags.isHighRisk || result.flags.isSpecialCountry || result.flags.wasEscalated) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {result.flags.isHighRisk && (
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: theme.dangerBg,
                      color: theme.dangerText,
                      border: `1px solid ${COLORS.danger}30`,
                    }}
                  >
                    High Risk
                  </span>
                )}
                {result.flags.isSpecialCountry && (
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: theme.warningBg,
                      color: theme.warningText,
                      border: `1px solid ${COLORS.warning}30`,
                    }}
                  >
                    Special Country
                  </span>
                )}
                {result.flags.wasEscalated && (
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: theme.infoBg,
                      color: theme.infoText,
                      border: `1px solid ${COLORS.info}30`,
                    }}
                  >
                    Escalated{result.flags.escalationReason ? `: ${result.flags.escalationReason}` : ''}
                  </span>
                )}
              </div>
            )}

            {/* Approval flow */}
            <div style={{ position: 'relative', display: 'flex', gap: '16px' }}>
              {/* Flow arrow on left side — START at bottom, END at top */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  minWidth: '50px',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: '700', color: COLORS.danger, letterSpacing: '0.05em' }}>
                  END
                </span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={COLORS.danger} style={{ marginBottom: '-4px' }}>
                    <path d="M12 4l-8 8h5v8h6v-8h5z"/>
                  </svg>
                  <div style={{ width: '3px', flex: 1, minHeight: '60px', backgroundColor: COLORS.danger, borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: COLORS.danger, letterSpacing: '0.05em' }}>
                  START
                </span>
              </div>

              {/* Phase groups */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {groupedApprovers.ordered.map(({ letter, meta, approvers }, phaseIdx) => (
                  <div key={letter}>
                    {/* Phase section header with horizontal lines */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '8px',
                        marginTop: phaseIdx > 0 ? '8px' : '0',
                      }}
                    >
                      <div style={{ height: '2px', flex: 1, background: `linear-gradient(90deg, ${meta.color}50, transparent)` }} />
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: letter === 'X' && result.flags.isHighRisk ? COLORS.danger : meta.color,
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: meta.color + '14',
                          border: `1px solid ${meta.color}40`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {meta.label}
                      </span>
                      <div style={{ height: '2px', flex: 1, background: `linear-gradient(90deg, transparent, ${meta.color}50)` }} />
                    </div>

                    {/* Approver cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[...approvers].reverse().map((approver, idx) => {
                        const withinPhaseNumber = approvers.length - idx;
                        const phaseColor = letter === 'X' && result.flags.isHighRisk ? COLORS.danger : meta.color;
                        return (
                          <div
                            key={`${approver.action}-${approver.role}-${idx}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '14px',
                              padding: '14px 16px',
                              borderRadius: '12px',
                              backgroundColor: theme.inputBg,
                              border: `1px solid ${meta.color}40`,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              {/* Numbered circle with gradient */}
                              <span
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: `linear-gradient(135deg, ${phaseColor}, ${phaseColor}99)`,
                                  color: 'white',
                                  fontSize: '13px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {letter}{withinPhaseNumber}
                              </span>
                              <div>
                                <p style={{ color: theme.text, fontWeight: '600', fontSize: '14px', margin: 0 }}>
                                  {approver.role}
                                </p>
                                <p style={{ color: theme.textMuted, fontSize: '13px', margin: 0 }}>
                                  {approver.label || meta.label} - Authority to {meta.label.toLowerCase().split(' ')[0]}
                                </p>
                              </div>
                            </div>

                            {/* Action badge */}
                            <ActionBadge
                              action={approver.action}
                              label={approver.label}
                              countXWithoutNumber={settings?.countXWithoutNumber ?? true}
                              theme={theme}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Excluded approvers */}
            {groupedApprovers.excluded.length > 0 && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(107,114,128,0.1)',
                  border: '1px solid rgba(107,114,128,0.2)',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: theme.textSubtle,
                    marginBottom: '10px',
                  }}
                >
                  Excluded Approvers (X without level number)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {groupedApprovers.excluded.map((approver, idx) => (
                    <div
                      key={`excluded-${approver.role}-${idx}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        color: theme.textSubtle,
                      }}
                    >
                      <span style={{ textDecoration: 'line-through' }}>{approver.role}</span>
                      <ActionBadge
                        action={approver.action}
                        label={approver.label}
                        countXWithoutNumber={false}
                        theme={theme}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Important Notes */}
            {result.threshold.notes && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: theme.warningBg,
                  border: `1px solid ${COLORS.warning}30`,
                }}
              >
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: theme.warningText,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    margin: '0 0 4px',
                  }}
                >
                  Important Notes
                </p>
                <p style={{ fontSize: '14px', color: theme.warningText, opacity: 0.9, margin: 0 }}>{result.threshold.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
