import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../styles/theme';
import { getRoles, createRole, updateRole } from '../../api/admin.api';
import DataTable, { type Column } from '../shared/DataTable';
import Modal from '../shared/Modal';
import FormField from '../shared/FormField';
import type { Role } from '../../types';

// ---------------------------------------------------------------------------
// Roles Page
// ---------------------------------------------------------------------------

export default function RolesPage() {
  const { theme } = useTheme();
  const { showToast } = useToast();

  // ---- state ----
  const [items, setItems] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // ---- form state ----
  const [formName, setFormName] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // ---- fetch ----
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoles();
      setItems(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load roles';
      setError(msg);
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- modal helpers ----
  const openCreate = () => {
    setFormName('');
    setFormSortOrder(0);
    setFormIsActive(true);
    setEditingItem(null);
    setIsCreating(true);
  };

  const openEdit = (role: Role) => {
    setFormName(role.name);
    setFormSortOrder(role.sort_order);
    setFormIsActive(role.is_active);
    setEditingItem(role);
    setIsCreating(false);
  };

  const closeModal = () => {
    setEditingItem(null);
    setIsCreating(false);
  };

  const isModalOpen = isCreating || editingItem !== null;

  // ---- save ----
  const handleSave = async () => {
    if (!formName.trim()) {
      showToast('warning', 'Name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await updateRole(editingItem.id, {
          name: formName.trim(),
          sort_order: formSortOrder,
          is_active: formIsActive,
        });
        showToast('success', 'Role updated');
      } else {
        await createRole({
          name: formName.trim(),
          sort_order: formSortOrder,
        });
        showToast('success', 'Role created');
      }
      closeModal();
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Save failed';
      showToast('error', msg);
    } finally {
      setSaving(false);
    }
  };

  // ---- columns ----
  const columns: Column[] = useMemo(
    () => [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'sort_order', label: 'Sort Order', sortable: true, width: '120px' },
      {
        key: 'is_active',
        label: 'Active',
        sortable: true,
        width: '100px',
        render: (row: Role) => (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: row.is_active ? theme.successBg : theme.dangerBg,
              color: row.is_active ? theme.successText : theme.dangerText,
            }}
          >
            {row.is_active ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        key: '_actions',
        label: 'Actions',
        width: '100px',
        render: (row: Role) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              border: `1px solid ${COLORS.primary}`,
              backgroundColor: 'transparent',
              color: COLORS.primary,
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        ),
      },
    ],
    [theme], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ---- input style ----
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: theme.text }}>
          Roles
        </h2>
        <button
          onClick={openCreate}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Create New
        </button>
      </div>

      {/* Loading / error */}
      {loading && (
        <p style={{ color: theme.textSubtle, fontSize: 14 }}>Loading...</p>
      )}
      {error && (
        <p style={{ color: theme.dangerText, fontSize: 14, marginBottom: 12 }}>
          {error}
        </p>
      )}

      {/* Table */}
      {!loading && <DataTable columns={columns} data={items} emptyMessage="No roles found." />}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Role' : 'Create Role'}
      >
        <FormField label="Name" required>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            style={inputStyle}
            placeholder="e.g. GM, VP, CEO"
            autoFocus
          />
        </FormField>

        <FormField label="Sort Order">
          <input
            type="number"
            value={formSortOrder}
            onChange={(e) => setFormSortOrder(Number(e.target.value))}
            style={inputStyle}
          />
        </FormField>

        {editingItem && (
          <FormField label="Active">
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
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: COLORS.primary }}
              />
              Role is active
            </label>
          </FormField>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button
            onClick={closeModal}
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
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: 'none',
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
