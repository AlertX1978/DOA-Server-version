import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../styles/theme';
import Modal from '../shared/Modal';
import ConfirmDialog from '../shared/ConfirmDialog';
import FormField from '../shared/FormField';
import SearchInput from '../shared/SearchInput';
import ApprovalChainEditor from '../shared/ApprovalChainEditor';
import type { Threshold, ThresholdApprover, Role } from '../../types';
import {
  getThresholds,
  createThreshold,
  updateThreshold,
  deleteThreshold,
  replaceThresholdApprovers,
} from '../../api/admin.api';
import { getRoles } from '../../api/admin.api';

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface ThresholdFormState {
  threshold_id: string;
  type: string;
  name: string;
  code: string;
  min_value: string;
  max_value: string;
  min_capex: string;
  max_capex: string;
  min_markup: string;
  max_markup: string;
  max_gross_margin: string;
  condition_text: string;
  notes: string;
  sort_order: number;
  approvers: Array<{
    role_id: number;
    role: string;
    action: string;
    label: string;
    sort_order: number;
  }>;
}

const emptyForm = (): ThresholdFormState => ({
  threshold_id: '',
  type: '',
  name: '',
  code: '',
  min_value: '',
  max_value: '',
  min_capex: '',
  max_capex: '',
  min_markup: '',
  max_markup: '',
  max_gross_margin: '',
  condition_text: '',
  notes: '',
  sort_order: 0,
  approvers: [],
});

// ---------------------------------------------------------------------------
// Helper: format currency/number
// ---------------------------------------------------------------------------

function formatNumber(val: number | null): string {
  if (val == null) return '\u2014';
  return val.toLocaleString();
}

function formatRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return '\u2014';
  if (min != null && max != null) return `${formatNumber(min)} - ${formatNumber(max)}`;
  if (min != null) return `>= ${formatNumber(min)}`;
  return `<= ${formatNumber(max)}`;
}

// ---------------------------------------------------------------------------
// Sub-component: ThresholdForm (Modal)
// ---------------------------------------------------------------------------

interface ThresholdFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: ThresholdFormState, editingId: number | null) => Promise<void>;
  editingItem: Threshold | null;
  roles: Role[];
  knownTypes: string[];
}

function ThresholdForm({ isOpen, onClose, onSave, editingItem, roles, knownTypes }: ThresholdFormProps) {
  const { theme } = useTheme();
  const [form, setForm] = useState<ThresholdFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setForm({
        threshold_id: editingItem.threshold_id,
        type: editingItem.type,
        name: editingItem.name,
        code: editingItem.code,
        min_value: editingItem.min_value != null ? String(editingItem.min_value) : '',
        max_value: editingItem.max_value != null ? String(editingItem.max_value) : '',
        min_capex: editingItem.min_capex != null ? String(editingItem.min_capex) : '',
        max_capex: editingItem.max_capex != null ? String(editingItem.max_capex) : '',
        min_markup: editingItem.min_markup != null ? String(editingItem.min_markup) : '',
        max_markup: editingItem.max_markup != null ? String(editingItem.max_markup) : '',
        max_gross_margin: editingItem.max_gross_margin != null ? String(editingItem.max_gross_margin) : '',
        condition_text: editingItem.condition_text ?? '',
        notes: editingItem.notes ?? '',
        sort_order: editingItem.sort_order,
        approvers: (editingItem.approvers ?? []).map((a) => ({
          role_id: a.role_id ?? 0,
          role: a.role,
          action: a.action,
          label: a.label,
          sort_order: a.sort_order,
        })),
      });
    } else {
      setForm(emptyForm());
    }
    setErrors({});
  }, [isOpen, editingItem]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.threshold_id.trim()) errs.threshold_id = 'Threshold ID is required';
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.code.trim()) errs.code = 'Code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form, editingItem?.id ?? null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${theme.inputBorder}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: 14,
    outline: 'none',
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  // Map approvers to ApprovalChainEditor format (uses 'kind' field for 'label')
  const chainApprovers = form.approvers.map((a) => ({
    role_id: a.role_id,
    role: a.role,
    action: a.action,
    kind: a.label, // We repurpose the 'kind' column to show 'label'
    sort_order: a.sort_order,
  }));

  const handleChainChange = (approvers: Array<{ role_id: number; role: string; action: string; kind: string; sort_order: number }>) => {
    setForm((f) => ({
      ...f,
      approvers: approvers.map((a) => ({
        role_id: a.role_id,
        role: a.role,
        action: a.action,
        label: a.kind, // Map 'kind' back to 'label'
        sort_order: a.sort_order,
      })),
    }));
  };

  const roleOptions = roles.filter((r) => r.is_active).map((r) => ({ id: r.id, name: r.name }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingItem ? 'Edit Threshold' : 'Create Threshold'} width={680}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <FormField label="Threshold ID" required error={errors.threshold_id}>
          <input
            type="text"
            value={form.threshold_id}
            onChange={(e) => setForm((f) => ({ ...f, threshold_id: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Type">
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            style={selectStyle}
          >
            <option value="">-- Select Type --</option>
            {knownTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
            {form.type && !knownTypes.includes(form.type) && (
              <option value={form.type}>{form.type}</option>
            )}
          </select>
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <FormField label="Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Code" required error={errors.code}>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <FormField label="Min Value">
          <input
            type="number"
            value={form.min_value}
            onChange={(e) => setForm((f) => ({ ...f, min_value: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Max Value">
          <input
            type="number"
            value={form.max_value}
            onChange={(e) => setForm((f) => ({ ...f, max_value: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <FormField label="Min CAPEX">
          <input
            type="number"
            value={form.min_capex}
            onChange={(e) => setForm((f) => ({ ...f, min_capex: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Max CAPEX">
          <input
            type="number"
            value={form.max_capex}
            onChange={(e) => setForm((f) => ({ ...f, max_capex: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
        <FormField label="Min Markup">
          <input
            type="number"
            value={form.min_markup}
            onChange={(e) => setForm((f) => ({ ...f, min_markup: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Max Markup">
          <input
            type="number"
            value={form.max_markup}
            onChange={(e) => setForm((f) => ({ ...f, max_markup: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Max Gross Margin">
          <input
            type="number"
            value={form.max_gross_margin}
            onChange={(e) => setForm((f) => ({ ...f, max_gross_margin: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
      </div>

      <FormField label="Condition Text">
        <input
          type="text"
          value={form.condition_text}
          onChange={(e) => setForm((f) => ({ ...f, condition_text: e.target.value }))}
          style={inputStyle}
        />
      </FormField>

      <FormField label="Notes">
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </FormField>

      <FormField label="Sort Order">
        <input
          type="number"
          value={form.sort_order}
          onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
          style={{ ...inputStyle, width: 100 }}
        />
      </FormField>

      {/* Approval Chain with label (showKind=true makes the "Kind" column visible, which we label as "Label") */}
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <label
          style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 13,
            fontWeight: 600,
            color: theme.textMuted,
            letterSpacing: '0.03em',
          }}
        >
          Approval Chain
        </label>
        <ApprovalChainEditor
          approvers={chainApprovers}
          roles={roleOptions}
          onChange={handleChainChange}
          showKind={true}
        />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <button
          onClick={onClose}
          style={{
            padding: '8px 18px',
            borderRadius: 6,
            backgroundColor: theme.tagBg,
            color: theme.text,
            fontSize: 14,
            fontWeight: 500,
            border: `1px solid ${theme.cardBorder}`,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            padding: '8px 18px',
            borderRadius: 6,
            backgroundColor: COLORS.primary,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ThresholdsPage() {
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Threshold | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Threshold | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedThresholds, fetchedRoles] = await Promise.all([getThresholds(), getRoles()]);
      setThresholds(fetchedThresholds);
      setRoles(fetchedRoles);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load thresholds');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Known types
  const knownTypes = useMemo(() => {
    const types = new Set<string>();
    for (const t of thresholds) {
      if (t.type) types.add(t.type);
    }
    return Array.from(types).sort();
  }, [thresholds]);

  // Group by type
  const grouped = useMemo(() => {
    let filtered = thresholds;
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.code.toLowerCase().includes(lower) ||
          t.type.toLowerCase().includes(lower) ||
          (t.notes && t.notes.toLowerCase().includes(lower)),
      );
    }

    const groups = new Map<string, Threshold[]>();
    for (const t of filtered) {
      const key = t.type || 'Uncategorized';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }

    // Sort thresholds within each group
    for (const [, items] of groups) {
      items.sort((a, b) => a.sort_order - b.sort_order);
    }

    return groups;
  }, [thresholds, search]);

  // ---- CRUD ----

  const handleSave = async (form: ThresholdFormState, editingId: number | null) => {
    const toNum = (s: string): number | null => (s.trim() === '' ? null : Number(s));
    const payload: Record<string, unknown> = {
      threshold_id: form.threshold_id.trim(),
      type: form.type.trim(),
      name: form.name.trim(),
      code: form.code.trim(),
      min_value: toNum(form.min_value),
      max_value: toNum(form.max_value),
      min_capex: toNum(form.min_capex),
      max_capex: toNum(form.max_capex),
      min_markup: toNum(form.min_markup),
      max_markup: toNum(form.max_markup),
      max_gross_margin: toNum(form.max_gross_margin),
      condition_text: form.condition_text.trim() || null,
      notes: form.notes.trim() || null,
      sort_order: form.sort_order,
    };

    const approverPayload = form.approvers.map((a) => ({
      role_id: a.role_id,
      action: a.action,
      label: a.label,
      sort_order: a.sort_order,
    }));

    try {
      if (editingId != null) {
        const updated = await updateThreshold(editingId, payload);
        await replaceThresholdApprovers(updated.id, approverPayload);
        showToast('success', `Updated threshold "${updated.name}"`);
      } else {
        const created = await createThreshold(payload);
        await replaceThresholdApprovers(created.id, approverPayload);
        showToast('success', `Created threshold "${created.name}"`);
      }
      await fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Save failed');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteThreshold(deleteTarget.id);
      showToast('success', `Deleted threshold "${deleteTarget.name}"`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Delete failed');
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEdit = (item: Threshold) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  // ---- styles ----

  const cellStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderBottom: `1px solid ${theme.cardBorder}`,
    fontSize: 13,
    color: theme.text,
    verticalAlign: 'middle',
  };

  const thStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: theme.textSubtle,
    backgroundColor: theme.headerBg,
    whiteSpace: 'nowrap',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text, margin: 0 }}>Thresholds</h1>
        <button
          onClick={openCreate}
          style={{
            padding: '8px 18px',
            borderRadius: 6,
            backgroundColor: COLORS.primary,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.primaryLight; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.primary; }}
        >
          + Create Threshold
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search thresholds..." />
        <span style={{ fontSize: 13, color: theme.textSubtle }}>
          {thresholds.length} threshold{thresholds.length !== 1 ? 's' : ''} in {knownTypes.length} group{knownTypes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: theme.textSubtle }}>Loading...</div>
      )}

      {/* Grouped sections */}
      {!loading && Array.from(grouped.entries()).map(([type, items]) => (
        <div key={type} style={{ marginBottom: 24 }}>
          {/* Group header */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: COLORS.primary + '15',
              borderRadius: '10px 10px 0 0',
              border: `1px solid ${theme.cardBorder}`,
              borderBottom: 'none',
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: 0 }}>
              {type}
              <span style={{ fontWeight: 400, fontSize: 13, color: theme.textSubtle, marginLeft: 8 }}>
                ({items.length})
              </span>
            </h2>
          </div>

          {/* Table */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: '0 0 10px 10px',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Code</th>
                    <th style={thStyle}>Value Range</th>
                    <th style={thStyle}>CAPEX Range</th>
                    <th style={thStyle}>Notes</th>
                    <th style={thStyle}>Approvers</th>
                    <th style={{ ...thStyle, width: 100, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr
                      key={t.id}
                      style={{ transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = theme.tagBg; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                    >
                      <td style={cellStyle}>{t.name}</td>
                      <td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: 12 }}>{t.code}</td>
                      <td style={cellStyle}>{formatRange(t.min_value, t.max_value)}</td>
                      <td style={cellStyle}>{formatRange(t.min_capex, t.max_capex)}</td>
                      <td style={cellStyle}>
                        <span title={t.notes ?? undefined}>
                          {t.notes ? (t.notes.length > 40 ? t.notes.substring(0, 40) + '...' : t.notes) : '\u2014'}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 10,
                            backgroundColor: (t.approvers?.length ?? 0) > 0 ? COLORS.primary + '30' : theme.tagBg,
                            color: (t.approvers?.length ?? 0) > 0 ? (theme.name === 'dark' ? COLORS.primaryLight : COLORS.primaryDark) : theme.textSubtle,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {t.approvers?.length ?? 0}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            onClick={() => openEdit(t)}
                            style={btnStyle(theme)}
                            title="Edit"
                          >
                            &#9998;
                          </button>
                          <button
                            onClick={() => setDeleteTarget(t)}
                            style={{ ...btnStyle(theme), color: COLORS.danger }}
                            title="Delete"
                          >
                            &#128465;
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {!loading && grouped.size === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: theme.textSubtle }}>
          No thresholds found.
        </div>
      )}

      {/* Form modal */}
      <ThresholdForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        editingItem={editingItem}
        roles={roles}
        knownTypes={knownTypes}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Threshold"
        message={deleteTarget ? `Are you sure you want to delete threshold "${deleteTarget.name}" (${deleteTarget.code})?` : ''}
        confirmText="Delete"
        danger
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function btnStyle(theme: { cardBorder: string; textSubtle: string }): React.CSSProperties {
  return {
    background: 'none',
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: 4,
    color: theme.textSubtle,
    fontSize: 14,
    cursor: 'pointer',
    padding: '3px 8px',
    lineHeight: 1,
  };
}
