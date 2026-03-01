import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../styles/theme';
import DataTable, { type Column } from '../shared/DataTable';
import Modal from '../shared/Modal';
import ConfirmDialog from '../shared/ConfirmDialog';
import FormField from '../shared/FormField';
import SearchInput from '../shared/SearchInput';
import ApprovalChainEditor from '../shared/ApprovalChainEditor';
import type { DOAItem, DOAItemApprover, Category, Role } from '../../types';
import {
  getDOAItems,
  createDOAItem,
  updateDOAItem,
  deleteDOAItem,
  replaceDOAItemApprovers,
} from '../../api/doa-items.api';
import { getCategories, getRoles } from '../../api/admin.api';

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface DOAFormState {
  code: string;
  description: string;
  applies_to: string;
  category_id: number | null;
  business_owner: string;
  delegable: string;
  interpretation: string;
  approvers: DOAItemApprover[];
}

const emptyForm = (): DOAFormState => ({
  code: '',
  description: '',
  applies_to: 'TAQA',
  category_id: null,
  business_owner: '',
  delegable: 'No',
  interpretation: '',
  approvers: [],
});

// ---------------------------------------------------------------------------
// Sub-component: DOAItemForm (Modal)
// ---------------------------------------------------------------------------

interface DOAItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: DOAFormState, editingId: number | null) => Promise<void>;
  editingItem: DOAItem | null;
  categories: Category[];
  roles: Role[];
}

function DOAItemForm({ isOpen, onClose, onSave, editingItem, categories, roles }: DOAItemFormProps) {
  const { theme } = useTheme();
  const [form, setForm] = useState<DOAFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setForm({
        code: editingItem.code,
        description: editingItem.description ?? '',
        applies_to: editingItem.applies_to ?? 'TAQA',
        category_id: editingItem.category_id,
        business_owner: editingItem.business_owner ?? '',
        delegable: editingItem.delegable ?? 'No',
        interpretation: editingItem.interpretation ?? '',
        approvers: (editingItem.approvers ?? []).map((a) => ({
          ...a,
          // Map to the ApprovalChainEditor shape (which expects 'kind')
        })),
      });
    } else {
      setForm(emptyForm());
    }
    setErrors({});
  }, [isOpen, editingItem]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
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

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  // Map DOAItemApprover to the ApprovalChainEditor shape (which includes 'kind')
  const chainApprovers = form.approvers.map((a) => ({
    role_id: a.role_id,
    role: a.role,
    action: a.action,
    kind: '',
    sort_order: a.sort_order,
  }));

  const handleChainChange = (approvers: Array<{ role_id: number; role: string; action: string; kind: string; sort_order: number }>) => {
    setForm((f) => ({
      ...f,
      approvers: approvers.map((a) => ({
        role_id: a.role_id,
        role: a.role,
        action: a.action,
        sort_order: a.sort_order,
      })),
    }));
  };

  const roleOptions = roles.filter((r) => r.is_active).map((r) => ({ id: r.id, name: r.name }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingItem ? 'Edit DOA Item' : 'Create DOA Item'} width={640}>
      <FormField label="Code" required error={errors.code}>
        <input
          type="text"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          style={inputStyle}
        />
      </FormField>

      <FormField label="Description">
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <FormField label="Applies To">
          <select
            value={form.applies_to}
            onChange={(e) => setForm((f) => ({ ...f, applies_to: e.target.value }))}
            style={selectStyle}
          >
            <option value="TAQA">TAQA</option>
            <option value="Wholly Owned">Wholly Owned</option>
          </select>
        </FormField>

        <FormField label="Category">
          <select
            value={form.category_id ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value ? Number(e.target.value) : null }))}
            style={selectStyle}
          >
            <option value="">-- None --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <FormField label="Business Owner">
          <input
            type="text"
            value={form.business_owner}
            onChange={(e) => setForm((f) => ({ ...f, business_owner: e.target.value }))}
            style={inputStyle}
          />
        </FormField>

        <FormField label="Delegable">
          <select
            value={form.delegable}
            onChange={(e) => setForm((f) => ({ ...f, delegable: e.target.value }))}
            style={selectStyle}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </FormField>
      </div>

      <FormField label="Interpretation">
        <textarea
          value={form.interpretation}
          onChange={(e) => setForm((f) => ({ ...f, interpretation: e.target.value }))}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </FormField>

      {/* Approval Chain */}
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
          showKind={false}
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

export default function DOAItemsPage() {
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [items, setItems] = useState<DOAItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DOAItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DOAItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedItems, fetchedCategories, fetchedRoles] = await Promise.all([
        getDOAItems(),
        getCategories(),
        getRoles(),
      ]);
      setItems(fetchedItems);
      setCategories(fetchedCategories);
      setRoles(fetchedRoles);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load DOA items');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let result = items;
    if (categoryFilter) {
      const catId = Number(categoryFilter);
      result = result.filter((it) => it.category_id === catId);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (it) =>
          it.code.toLowerCase().includes(lower) ||
          (it.description && it.description.toLowerCase().includes(lower)) ||
          (it.business_owner && it.business_owner.toLowerCase().includes(lower)) ||
          (it.category_name && it.category_name.toLowerCase().includes(lower)),
      );
    }
    return result;
  }, [items, search, categoryFilter]);

  // ---- CRUD ----

  const handleSave = async (form: DOAFormState, editingId: number | null) => {
    const payload = {
      code: form.code.trim(),
      description: form.description.trim() || null,
      applies_to: form.applies_to || null,
      category_id: form.category_id,
      business_owner: form.business_owner.trim() || null,
      delegable: form.delegable || null,
      interpretation: form.interpretation.trim() || null,
    };

    const approverPayload = form.approvers.map((a) => ({
      role_id: a.role_id,
      action: a.action,
      sort_order: a.sort_order,
    }));

    try {
      if (editingId != null) {
        const updated = await updateDOAItem(editingId, payload);
        await replaceDOAItemApprovers(updated.id, approverPayload);
        showToast('success', `Updated DOA item "${updated.code}"`);
      } else {
        const created = await createDOAItem(payload);
        await replaceDOAItemApprovers(created.id, approverPayload);
        showToast('success', `Created DOA item "${created.code}"`);
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
      await deleteDOAItem(deleteTarget.id);
      showToast('success', `Deleted DOA item "${deleteTarget.code}"`);
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

  const openEdit = (item: DOAItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  // Truncate helper
  const truncate = (text: string | null, maxLen: number): string => {
    if (!text) return '\u2014';
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + '...';
  };

  // ---- Table columns ----

  const columns: Column[] = useMemo(
    () => [
      { key: 'code', label: 'Code', sortable: true, width: '100px' },
      {
        key: 'description',
        label: 'Description',
        sortable: true,
        render: (row: DOAItem) => (
          <span title={row.description ?? undefined} style={{ fontSize: 13 }}>
            {truncate(row.description, 60)}
          </span>
        ),
      },
      { key: 'applies_to', label: 'Applies To', sortable: true, width: '110px' },
      { key: 'category_name', label: 'Category', sortable: true, width: '130px' },
      { key: 'business_owner', label: 'Business Owner', sortable: true, width: '130px' },
      {
        key: 'delegable',
        label: 'Delegable',
        sortable: true,
        width: '85px',
        render: (row: DOAItem) => {
          const isDelegable = row.delegable === 'Yes';
          return (
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 4,
                backgroundColor: isDelegable ? theme.successBg : theme.tagBg,
                color: isDelegable ? theme.successText : theme.textSubtle,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {row.delegable ?? '\u2014'}
            </span>
          );
        },
      },
      {
        key: 'approvers',
        label: 'Approvers',
        width: '90px',
        render: (row: DOAItem) => {
          const count = row.approvers?.length ?? 0;
          return (
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 10,
                backgroundColor: count > 0 ? COLORS.primary + '30' : theme.tagBg,
                color: count > 0 ? (theme.name === 'dark' ? COLORS.primaryLight : COLORS.primaryDark) : theme.textSubtle,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {count}
            </span>
          );
        },
      },
      {
        key: 'actions',
        label: 'Actions',
        width: '100px',
        render: (row: DOAItem) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(row); }}
              style={btnStyle(theme)}
              title="Edit"
            >
              &#9998;
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
              style={{ ...btnStyle(theme), color: COLORS.danger }}
              title="Delete"
            >
              &#128465;
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme],
  );

  const selectStyle: React.CSSProperties = {
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${theme.inputBorder}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text, margin: 0 }}>DOA Items</h1>
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
          + Create DOA Item
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search DOA items..." />

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={selectStyle}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <span style={{ fontSize: 13, color: theme.textSubtle }}>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: theme.textSubtle }}>Loading...</div>
      )}

      {/* Table */}
      {!loading && (
        <DataTable columns={columns} data={filteredItems} emptyMessage="No DOA items found." />
      )}

      {/* Form modal */}
      <DOAItemForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        editingItem={editingItem}
        categories={categories}
        roles={roles}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete DOA Item"
        message={deleteTarget ? `Are you sure you want to delete DOA item "${deleteTarget.code}"?` : ''}
        confirmText="Delete"
        danger
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper styles
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
