import { useState, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../styles/theme';
import { exportData, validateImport, importData } from '../../api/admin.api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENTITY_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'browse_items', label: 'Browse Items' },
  { key: 'doa_items', label: 'DOA Items' },
  { key: 'categories', label: 'Categories' },
  { key: 'roles', label: 'Roles' },
  { key: 'thresholds', label: 'Thresholds' },
  { key: 'countries', label: 'Countries' },
  { key: 'glossary', label: 'Glossary' },
  { key: 'settings', label: 'Settings' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportExportPage() {
  const { theme } = useTheme();
  const { showToast } = useToast();

  // ---- Export state ----
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(
    new Set(ENTITY_OPTIONS.map((e) => e.key)),
  );
  const [exporting, setExporting] = useState(false);

  // ---- Import state ----
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importJson, setImportJson] = useState<Record<string, unknown> | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    counts: Record<string, number>;
  } | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<Record<string, number> | null>(null);

  // ---- Export handlers ----

  const toggleEntity = (key: string) => {
    setSelectedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelectedEntities(new Set(ENTITY_OPTIONS.map((e) => e.key)));
  const deselectAll = () => setSelectedEntities(new Set());

  const handleExport = useCallback(async () => {
    if (selectedEntities.size === 0) {
      showToast('warning', 'Please select at least one entity type to export');
      return;
    }
    setExporting(true);
    try {
      const data = await exportData(Array.from(selectedEntities));
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `doa-export-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', 'Export completed successfully');
    } catch (err: any) {
      showToast('error', err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [selectedEntities, showToast]);

  // ---- Import handlers ----

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setValidationResult(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setImportJson(json);

      // Auto-validate
      setValidating(true);
      const result = await validateImport(json);
      setValidationResult(result);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        showToast('error', 'Invalid JSON file');
        setImportJson(null);
      } else {
        showToast('error', err.message || 'Validation failed');
      }
    } finally {
      setValidating(false);
    }
  };

  const handleImport = useCallback(async () => {
    if (!importJson) return;

    setImporting(true);
    try {
      const payload = { ...importJson, mode: importMode };
      const result = await importData(payload);
      setImportResult(result.imported);
      showToast('success', 'Import completed successfully');
    } catch (err: any) {
      showToast('error', err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [importJson, importMode, showToast]);

  const resetImport = () => {
    setImportFile(null);
    setImportJson(null);
    setValidationResult(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---- Shared styles ----

  const sectionStyle: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 24,
  };

  const sectionHeaderStyle: React.CSSProperties = {
    padding: '14px 20px',
    borderBottom: `1px solid ${theme.cardBorder}`,
    backgroundColor: theme.headerBg,
  };

  const sectionBodyStyle: React.CSSProperties = {
    padding: 20,
  };

  const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '9px 22px',
    borderRadius: 6,
    backgroundColor: disabled ? theme.textSubtle : COLORS.primary,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  });

  const secondaryBtnStyle: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 6,
    backgroundColor: theme.tagBg,
    color: theme.text,
    fontSize: 13,
    fontWeight: 500,
    border: `1px solid ${theme.cardBorder}`,
    cursor: 'pointer',
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text, margin: '0 0 24px 0' }}>
        Import / Export
      </h1>

      {/* ================================================================== */}
      {/* EXPORT SECTION */}
      {/* ================================================================== */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: 0 }}>Export</h2>
        </div>
        <div style={sectionBodyStyle}>
          <p style={{ fontSize: 14, color: theme.textMuted, marginTop: 0, marginBottom: 16 }}>
            Select the entity types to include in the export. The data will be downloaded as a JSON file.
          </p>

          {/* Select all / deselect all */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={selectAll} style={secondaryBtnStyle}>Select All</button>
            <button type="button" onClick={deselectAll} style={secondaryBtnStyle}>Deselect All</button>
          </div>

          {/* Entity checkboxes */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: 10,
              marginBottom: 20,
            }}
          >
            {ENTITY_OPTIONS.map((opt) => {
              const checked = selectedEntities.has(opt.key);
              return (
                <label
                  key={opt.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 6,
                    backgroundColor: checked ? COLORS.primary + '15' : theme.tagBg,
                    border: `1px solid ${checked ? COLORS.primary + '40' : theme.cardBorder}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleEntity(opt.key)}
                    style={{ accentColor: COLORS.primary }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 500, color: theme.text }}>
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || selectedEntities.size === 0}
            style={primaryBtnStyle(exporting || selectedEntities.size === 0)}
            onMouseEnter={(e) => {
              if (!exporting && selectedEntities.size > 0) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.primaryLight;
              }
            }}
            onMouseLeave={(e) => {
              if (!exporting && selectedEntities.size > 0) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.primary;
              }
            }}
          >
            {exporting ? 'Exporting...' : `Export ${selectedEntities.size} Entity Type${selectedEntities.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* IMPORT SECTION */}
      {/* ================================================================== */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: 0 }}>Import</h2>
        </div>
        <div style={sectionBodyStyle}>
          <p style={{ fontSize: 14, color: theme.textMuted, marginTop: 0, marginBottom: 16 }}>
            Upload a previously exported JSON file. The file will be validated before import.
          </p>

          {/* File input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${theme.inputBorder}`,
                backgroundColor: theme.inputBg,
                color: theme.text,
                fontSize: 14,
                cursor: 'pointer',
              }}
            />
            {importFile && (
              <button type="button" onClick={resetImport} style={secondaryBtnStyle}>
                Clear
              </button>
            )}
          </div>

          {/* Validating spinner */}
          {validating && (
            <div style={{ padding: '12px 0', color: theme.textSubtle, fontSize: 14 }}>
              Validating file...
            </div>
          )}

          {/* Validation results */}
          {validationResult && (
            <div style={{ marginBottom: 20 }}>
              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    backgroundColor: theme.dangerBg,
                    borderLeft: `4px solid ${COLORS.danger}`,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.dangerText, marginBottom: 6 }}>
                    Errors ({validationResult.errors.length})
                  </div>
                  {validationResult.errors.map((err, i) => (
                    <div key={i} style={{ fontSize: 13, color: theme.dangerText, marginBottom: 2 }}>
                      {err}
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    backgroundColor: theme.warningBg,
                    borderLeft: `4px solid ${COLORS.warning}`,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.warningText, marginBottom: 6 }}>
                    Warnings ({validationResult.warnings.length})
                  </div>
                  {validationResult.warnings.map((warn, i) => (
                    <div key={i} style={{ fontSize: 13, color: theme.warningText, marginBottom: 2 }}>
                      {warn}
                    </div>
                  ))}
                </div>
              )}

              {/* Counts */}
              {Object.keys(validationResult.counts).length > 0 && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    backgroundColor: theme.infoBg,
                    borderLeft: `4px solid ${COLORS.info}`,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.infoText, marginBottom: 8 }}>
                    Records to Import
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {Object.entries(validationResult.counts).map(([key, count]) => (
                      <span
                        key={key}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 6,
                          backgroundColor: theme.tagBg,
                          fontSize: 13,
                          color: theme.text,
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{key}:</span>
                        <span>{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid badge */}
              {validationResult.valid && validationResult.errors.length === 0 && (
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    backgroundColor: theme.successBg,
                    borderLeft: `4px solid ${COLORS.success}`,
                    marginBottom: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.successText,
                  }}
                >
                  Validation passed. File is ready to import.
                </div>
              )}
            </div>
          )}

          {/* Mode toggle + Import button */}
          {validationResult && validationResult.valid && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {/* Mode toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.textMuted }}>Mode:</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['merge', 'replace'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setImportMode(mode)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        backgroundColor: importMode === mode ? COLORS.primary : theme.tagBg,
                        color: importMode === mode ? '#FFFFFF' : theme.textMuted,
                        fontSize: 13,
                        fontWeight: 600,
                        border: importMode === mode ? 'none' : `1px solid ${theme.cardBorder}`,
                        cursor: 'pointer',
                      }}
                    >
                      {mode === 'merge' ? 'Merge' : 'Replace'}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: theme.textSubtle }}>
                  {importMode === 'merge'
                    ? '(adds new records, updates existing)'
                    : '(replaces all existing data)'}
                </span>
              </div>

              {/* Import button */}
              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                style={{
                  ...primaryBtnStyle(importing),
                  backgroundColor: importing ? theme.textSubtle : COLORS.accent,
                }}
                onMouseEnter={(e) => {
                  if (!importing) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.accentLight;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!importing) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.accent;
                  }
                }}
              >
                {importing ? 'Importing...' : 'Import Data'}
              </button>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div
              style={{
                marginTop: 20,
                padding: '12px 16px',
                borderRadius: 8,
                backgroundColor: theme.successBg,
                borderLeft: `4px solid ${COLORS.success}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.successText, marginBottom: 8 }}>
                Import Complete
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {Object.entries(importResult).map(([key, count]) => (
                  <span
                    key={key}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 6,
                      backgroundColor: theme.tagBg,
                      fontSize: 13,
                      color: theme.text,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{key}:</span>
                    <span>{count} imported</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
