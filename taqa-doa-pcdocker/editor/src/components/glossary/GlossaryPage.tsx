import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../styles/theme';
import {
  getGlossary,
  createGlossaryEntry,
  updateGlossaryEntry,
  deleteGlossaryEntry,
} from '../../api/admin.api';
import DataTable, { type Column } from '../shared/DataTable';
import Modal from '../shared/Modal';
import ConfirmDialog from '../shared/ConfirmDialog';
import FormField from '../shared/FormField';
import type { GlossaryEntry } from '../../types';

// ---------------------------------------------------------------------------
// Glossary Page
// ---------------------------------------------------------------------------

export default function GlossaryPage() {
  const { theme } = useTheme();
  const { showToast } = useToast();

  // ---- state ----
  const [items, setItems] = useState<GlossaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<GlossaryEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingItem, setDeletingItem] = useState<GlossaryEntry | null>(null);

  // ---- form state ----
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // ---- fetch ----
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGlossary();
      setItems(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load glossary';
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
    setFormCode('');
    setFormName('');
    setFormDescription('');
    setFormSortOrder(0);
    setEditingItem(null);
    setIsCreating(true);
  };

  const openEdit = (entry: GlossaryEntry) => {
    setFormCode(entry.code);
    setFormName(entry.name);
    setFormDescription(entry.description ?? '');
    setFormSortOrder(entry.sort_order);
    setEditingItem(entry);
    setIsCreating(false);
  };

  const closeModal = () => {
    setEditingItem(null);
    setIsCreating(false);
  };

  const isModalOpen = isCreating || editingItem !== null;

  // ---- save ----
  const handleSave = async () => {
    if (!formCode.trim()) {
      showToast('warning', 'Code is required');
      return;
    }
    if (!formName.trim()) {
      showToast('warning', 'Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: formCode.trim(),
        name: formName.trim(),
        description: formDescription.trim() || null,
        sort_order: formSortOrder,
      };

      if (editingItem) {
        await updateGlossaryEntry(editingItem.id, payload);
        showToast('success', 'Glossary entry updated');
      } else {
        await createGlossaryEntry(payload);
        showToast('success', 'Glossary entry created');
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
      await deleteGlossaryEntry(deletingItem.id);
      showToast('success', 'Glossary entry deleted');
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
      { key: 'code', label: 'Code', sortable: true, width: '80px' },
      { key: 'name', label: 'Name', sortable: true },
      {
        key: 'description',
        label: 'Description',
        sortable: false,
        render: (row: GlossaryEntry) => {
          const desc = row.description ?? '';
          return (
            <span
              style={{ color: theme.textMuted, fontSize: 13 }}
              title={desc}
            >
              {desc.length > 80 ? desc.slice(0, 80) + '...' : desc || '\u2014'}
            </span>
          );
        },
      },
      { key: 'sort_order', label: 'Sort Order', sortable: true, width: '110px' },
      {
        key: '_actions',
        label: 'Actions',
        width: '160px',
        render: (row: GlossaryEntry) => (
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

  // ---- shared input / textarea style ----
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

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 80,
    resize: 'vertical',
    fontFamily: 'inherit',
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
          Glossary
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
        <DataTable columns={columns} data={items} emptyMessage="No glossary entries found." />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Glossary Entry' : 'Create Glossary Entry'}
      >
        <FormField label="Code" required>
          <input
            type="text"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value.slice(0, 1))}
            style={inputStyle}
            placeholder="e.g. X, R, E"
            maxLength={1}
            autoFocus
          />
        </FormField>

        <FormField label="Name" required>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            style={inputStyle}
            placeholder="e.g. Approve, Review, Endorse"
          />
        </FormField>

        <FormField label="Description">
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            style={textareaStyle}
            placeholder="Description of this action code..."
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
        title="Delete Glossary Entry"
        message={`Are you sure you want to delete "${deletingItem?.name}" (${deletingItem?.code})? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
        danger
      />
    </div>
  );
}
