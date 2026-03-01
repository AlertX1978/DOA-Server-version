import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../styles/theme';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../api/admin.api';
import DataTable, { type Column } from '../shared/DataTable';
import Modal from '../shared/Modal';
import ConfirmDialog from '../shared/ConfirmDialog';
import FormField from '../shared/FormField';
import type { Category } from '../../types';

// ---------------------------------------------------------------------------
// Categories Page
// ---------------------------------------------------------------------------

export default function CategoriesPage() {
  const { theme } = useTheme();
  const { showToast } = useToast();

  // ---- state ----
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Category | null>(null);

  // ---- form state ----
  const [formName, setFormName] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // ---- fetch ----
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setItems(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load categories';
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
    setEditingItem(null);
    setIsCreating(true);
  };

  const openEdit = (cat: Category) => {
    setFormName(cat.name);
    setFormSortOrder(cat.sort_order);
    setEditingItem(cat);
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
        await updateCategory(editingItem.id, {
          name: formName.trim(),
          sort_order: formSortOrder,
        });
        showToast('success', 'Category updated');
      } else {
        await createCategory({
          name: formName.trim(),
          sort_order: formSortOrder,
        });
        showToast('success', 'Category created');
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

  // ---- delete ----
  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteCategory(deletingItem.id);
      showToast('success', 'Category deleted');
      setDeletingItem(null);
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Delete failed';
      showToast('error', msg);
    }
  };

  // ---- columns ----
  const columns: Column[] = useMemo(
    () => [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'sort_order', label: 'Sort Order', sortable: true, width: '120px' },
      {
        key: '_actions',
        label: 'Actions',
        width: '160px',
        render: (row: Category) => (
          <div style={{ display: 'flex', gap: 6 }}>
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeletingItem(row);
              }}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${COLORS.danger}`,
                backgroundColor: 'transparent',
                color: COLORS.danger,
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
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
          Categories
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
      {!loading && (
        <DataTable columns={columns} data={items} emptyMessage="No categories found." />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Category' : 'Create Category'}
      >
        <FormField label="Name" required>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            style={inputStyle}
            placeholder="e.g. Finance, HR, IT"
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

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deletingItem !== null}
        title="Delete Category"
        message={`Are you sure you want to delete "${deletingItem?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
        danger
      />
    </div>
  );
}
