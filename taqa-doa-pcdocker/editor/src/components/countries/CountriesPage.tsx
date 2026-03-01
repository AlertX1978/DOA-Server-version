import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '../../styles/theme';
import {
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
} from '../../api/admin.api';
import DataTable, { type Column } from '../shared/DataTable';
import Modal from '../shared/Modal';
import ConfirmDialog from '../shared/ConfirmDialog';
import FormField from '../shared/FormField';
import SearchInput from '../shared/SearchInput';
import type { Country } from '../../types';

// ---------------------------------------------------------------------------
// Risk-level badge colours
// ---------------------------------------------------------------------------

const RISK_COLORS: Record<string, { bg: string; text: string }> = {
  safe: { bg: 'rgba(16,185,129,0.2)', text: '#10B981' },
  special: { bg: 'rgba(245,158,11,0.2)', text: '#F59E0B' },
  high_risk: { bg: 'rgba(239,68,68,0.2)', text: '#EF4444' },
};

const RISK_LABELS: Record<string, string> = {
  safe: 'Safe',
  special: 'Special',
  high_risk: 'High Risk',
};

// ---------------------------------------------------------------------------
// Countries Page
// ---------------------------------------------------------------------------

export default function CountriesPage() {
  const { theme } = useTheme();
  const { showToast } = useToast();

  // ---- state ----
  const [items, setItems] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Country | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Country | null>(null);
  const [search, setSearch] = useState('');

  // ---- form state ----
  const [formName, setFormName] = useState('');
  const [formRiskLevel, setFormRiskLevel] = useState<string>('safe');
  const [saving, setSaving] = useState(false);

  // ---- fetch ----
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCountries();
      setItems(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load countries';
      setError(msg);
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- filtered data ----
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((c) => c.name.toLowerCase().includes(q));
  }, [items, search]);

  // ---- modal helpers ----
  const openCreate = () => {
    setFormName('');
    setFormRiskLevel('safe');
    setEditingItem(null);
    setIsCreating(true);
  };

  const openEdit = (country: Country) => {
    setFormName(country.name);
    setFormRiskLevel(country.risk_level);
    setEditingItem(country);
    setIsCreating(false);
  };

  const closeModal = () => {
    setEditingItem(null);
    setIsCreating(false);
  };

  const isModalOpen = isCreating || editingItem !== null;

  // ---- save ----
  const handleSave = async () => {
    if (isCreating && !formName.trim()) {
      showToast('warning', 'Name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await updateCountry(editingItem.id, {
          risk_level: formRiskLevel,
        });
        showToast('success', 'Country updated');
      } else {
        await createCountry({
          name: formName.trim(),
          risk_level: formRiskLevel,
        });
        showToast('success', 'Country created');
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
      await deleteCountry(deletingItem.id);
      showToast('success', 'Country deleted');
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
      {
        key: 'risk_level',
        label: 'Risk Level',
        sortable: true,
        width: '140px',
        render: (row: Country) => {
          const colors = RISK_COLORS[row.risk_level] ?? { bg: theme.tagBg, text: theme.text };
          return (
            <span
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: colors.bg,
                color: colors.text,
              }}
            >
              {RISK_LABELS[row.risk_level] ?? row.risk_level}
            </span>
          );
        },
      },
      {
        key: '_actions',
        label: 'Actions',
        width: '160px',
        render: (row: Country) => (
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

  // ---- shared input style ----
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
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: theme.text }}>
          Countries
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

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search countries..."
        />
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
        <DataTable
          columns={columns}
          data={filteredItems}
          emptyMessage="No countries found."
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Country' : 'Create Country'}
      >
        {/* Name field only on create */}
        {isCreating && (
          <FormField label="Name" required>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              style={inputStyle}
              placeholder="e.g. United Arab Emirates"
              autoFocus
            />
          </FormField>
        )}

        {/* Show country name as read-only when editing */}
        {editingItem && (
          <FormField label="Country">
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                backgroundColor: theme.tagBg,
                color: theme.textMuted,
                fontSize: 14,
              }}
            >
              {editingItem.name}
            </div>
          </FormField>
        )}

        <FormField label="Risk Level" required>
          <select
            value={formRiskLevel}
            onChange={(e) => setFormRiskLevel(e.target.value)}
            style={inputStyle}
          >
            <option value="safe">Safe</option>
            <option value="special">Special</option>
            <option value="high_risk">High Risk</option>
          </select>
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
        title="Delete Country"
        message={`Are you sure you want to delete "${deletingItem?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
        danger
      />
    </div>
  );
}
