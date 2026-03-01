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
import type { BrowseItem, ApproverEntry, Role } from '../../types';
import {
  getBrowseItems,
  createBrowseItem,
  updateBrowseItem,
  deleteBrowseItem,
  replaceBrowseItemApprovers,
} from '../../api/browse-items.api';
import { getRoles } from '../../api/admin.api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIEW_MODE_KEY = 'doa-editor-browse-view';

// ---------------------------------------------------------------------------
// Tree node type
// ---------------------------------------------------------------------------

interface TreeNode {
  item: BrowseItem;
  children: TreeNode[];
  depth: number;
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface BrowseFormState {
  code: string;
  parent_code: string;
  title: string;
  description: string;
  comments: string;
  function_name: string;
  sort_order: number;
  approvers: ApproverEntry[];
}

const emptyForm = (): BrowseFormState => ({
  code: '',
  parent_code: '',
  title: '',
  description: '',
  comments: '',
  function_name: '',
  sort_order: 0,
  approvers: [],
});

// ---------------------------------------------------------------------------
// Helper: build tree from flat items
// ---------------------------------------------------------------------------

function buildTree(items: BrowseItem[]): TreeNode[] {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const map = new Map<string, TreeNode>();

  // Create nodes
  for (const item of sorted) {
    map.set(item.code, { item, children: [], depth: 0 });
  }

  const roots: TreeNode[] = [];

  for (const item of sorted) {
    const node = map.get(item.code)!;

    // Determine parent code: use parent_code field, or derive by trimming last segment
    let parentCode = item.parent_code;
    if (!parentCode) {
      const dotIdx = item.code.lastIndexOf('.');
      if (dotIdx > 0) {
        parentCode = item.code.substring(0, dotIdx);
      }
    }

    const parentNode = parentCode ? map.get(parentCode) : undefined;
    if (parentNode) {
      parentNode.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Set depth
  function setDepth(nodes: TreeNode[], depth: number) {
    for (const n of nodes) {
      n.depth = depth;
      setDepth(n.children, depth + 1);
    }
  }
  setDepth(roots, 0);

  return roots;
}

// ---------------------------------------------------------------------------
// Helper: count descendants
// ---------------------------------------------------------------------------

function countDescendants(items: BrowseItem[], code: string): number {
  let count = 0;
  for (const item of items) {
    if (item.parent_code === code || (item.code !== code && item.code.startsWith(code + '.'))) {
      count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Sub-component: TreeNodeRow
// ---------------------------------------------------------------------------

interface TreeNodeRowProps {
  node: TreeNode;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  onEdit: (item: BrowseItem) => void;
  onAddChild: (parentCode: string) => void;
  onDelete: (item: BrowseItem) => void;
}

function TreeNodeRow({ node, expanded, onToggle, onEdit, onAddChild, onDelete }: TreeNodeRowProps) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(false);
  const isExpanded = expanded.has(node.item.id);
  const hasChildren = node.children.length > 0;

  const approvalSummary = node.item.approvalChain ?? [];

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '8px 12px',
          paddingLeft: 12 + node.depth * 24,
          borderBottom: `1px solid ${theme.cardBorder}`,
          backgroundColor: hovered ? theme.tagBg : 'transparent',
          transition: 'background-color 0.15s',
          position: 'relative',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Expand/collapse chevron */}
        <button
          onClick={() => onToggle(node.item.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: hasChildren ? 'pointer' : 'default',
            padding: '0 6px 0 0',
            fontSize: 12,
            color: hasChildren ? theme.textSubtle : 'transparent',
            flexShrink: 0,
            marginTop: 2,
          }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '\u25BC' : '\u25B6'}
        </button>

        {/* Code + title */}
        <div
          style={{ flex: 1, cursor: hasChildren ? 'pointer' : 'default', minWidth: 0 }}
          onClick={() => hasChildren && onToggle(node.item.id)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 13,
                fontWeight: 600,
                color: COLORS.accent,
                flexShrink: 0,
              }}
            >
              {node.item.code}
            </span>
            <span style={{ fontSize: 14, color: theme.text }}>{node.item.title}</span>
          </div>

          {/* Expanded details */}
          {isExpanded && (
            <div style={{ marginTop: 8 }}>
              {node.item.description && (
                <p style={{ fontSize: 13, color: theme.textMuted, margin: '0 0 6px 0', lineHeight: 1.5 }}>
                  {node.item.description}
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {node.item.function_name && (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: COLORS.primary + '30',
                      color: theme.name === 'dark' ? COLORS.primaryLight : COLORS.primaryDark,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {node.item.function_name}
                  </span>
                )}
                {approvalSummary.map((a, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: 4,
                      backgroundColor: theme.tagBg,
                      border: `1px solid ${theme.cardBorder}`,
                      fontSize: 11,
                      color: theme.textMuted,
                    }}
                  >
                    {a.role}: {a.action}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons (visible on hover) */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s',
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(node.item); }}
            style={actionBtnStyle(theme)}
            title="Edit"
          >
            &#9998;
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddChild(node.item.code); }}
            style={actionBtnStyle(theme)}
            title="Add child"
          >
            +
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node.item); }}
            style={{ ...actionBtnStyle(theme), color: COLORS.danger }}
            title="Delete"
          >
            &#128465;
          </button>
        </div>
      </div>

      {/* Render children recursively */}
      {isExpanded &&
        node.children.map((child) => (
          <TreeNodeRow
            key={child.item.id}
            node={child}
            expanded={expanded}
            onToggle={onToggle}
            onEdit={onEdit}
            onAddChild={onAddChild}
            onDelete={onDelete}
          />
        ))}
    </>
  );
}

function actionBtnStyle(theme: { cardBorder: string; textSubtle: string }): React.CSSProperties {
  return {
    background: 'none',
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: 4,
    color: theme.textSubtle,
    fontSize: 14,
    cursor: 'pointer',
    padding: '2px 7px',
    lineHeight: 1,
  };
}

// ---------------------------------------------------------------------------
// Sub-component: BrowseItemForm (Modal)
// ---------------------------------------------------------------------------

interface BrowseItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: BrowseFormState, editingId: number | null) => Promise<void>;
  editingItem: BrowseItem | null;
  roles: Role[];
  initialParentCode?: string;
}

function BrowseItemForm({ isOpen, onClose, onSave, editingItem, roles, initialParentCode }: BrowseItemFormProps) {
  const { theme } = useTheme();
  const [form, setForm] = useState<BrowseFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setForm({
        code: editingItem.code,
        parent_code: editingItem.parent_code ?? '',
        title: editingItem.title,
        description: editingItem.description ?? '',
        comments: editingItem.comments ?? '',
        function_name: editingItem.function_name ?? '',
        sort_order: editingItem.sort_order,
        approvers: (editingItem.approvalChain ?? []).map((a) => ({ ...a })),
      });
    } else {
      const f = emptyForm();
      if (initialParentCode) {
        f.parent_code = initialParentCode;
      }
      setForm(f);
    }
    setErrors({});
  }, [isOpen, editingItem, initialParentCode]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = 'Code is required';
    if (!form.title.trim()) errs.title = 'Title is required';
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

  const roleOptions = roles.filter((r) => r.is_active).map((r) => ({ id: r.id, name: r.name }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingItem ? 'Edit Browse Item' : 'Create Browse Item'} width={640}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <FormField label="Code" required error={errors.code}>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Parent Code">
          <input
            type="text"
            value={form.parent_code}
            onChange={(e) => setForm((f) => ({ ...f, parent_code: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
      </div>

      <FormField label="Title" required error={errors.title}>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
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

      <FormField label="Comments">
        <textarea
          value={form.comments}
          onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <FormField label="Function Name">
          <input
            type="text"
            value={form.function_name}
            onChange={(e) => setForm((f) => ({ ...f, function_name: e.target.value }))}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Sort Order">
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
            style={inputStyle}
          />
        </FormField>
      </div>

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
          approvers={form.approvers}
          roles={roleOptions}
          onChange={(approvers) => setForm((f) => ({ ...f, approvers }))}
          showKind={true}
        />
      </div>

      {/* Footer buttons */}
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

export default function BrowseItemsPage() {
  const { theme } = useTheme();
  const { showToast } = useToast();

  // Data
  const [items, setItems] = useState<BrowseItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode
  const [viewMode, setViewMode] = useState<'tree' | 'table'>(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_KEY);
      if (stored === 'tree' || stored === 'table') return stored;
    } catch { /* ignore */ }
    return 'tree';
  });

  // Search & filter
  const [search, setSearch] = useState('');
  const [functionFilter, setFunctionFilter] = useState('');

  // Tree expanded state
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BrowseItem | null>(null);
  const [initialParentCode, setInitialParentCode] = useState<string | undefined>();

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<BrowseItem | null>(null);

  // Persist view mode
  useEffect(() => {
    try { localStorage.setItem(VIEW_MODE_KEY, viewMode); } catch { /* ignore */ }
  }, [viewMode]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedItems, fetchedRoles] = await Promise.all([getBrowseItems(), getRoles()]);
      setItems(fetchedItems);
      setRoles(fetchedRoles);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load browse items');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Distinct function names for filter dropdown
  const functionNames = useMemo(() => {
    const names = new Set<string>();
    for (const item of items) {
      if (item.function_name) names.add(item.function_name);
    }
    return Array.from(names).sort();
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let result = items;
    if (functionFilter) {
      result = result.filter((it) => it.function_name === functionFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (it) =>
          it.code.toLowerCase().includes(lower) ||
          it.title.toLowerCase().includes(lower) ||
          (it.description && it.description.toLowerCase().includes(lower)) ||
          (it.function_name && it.function_name.toLowerCase().includes(lower)),
      );
    }
    return result;
  }, [items, search, functionFilter]);

  // Tree data
  const treeNodes = useMemo(() => buildTree(filteredItems), [filteredItems]);

  // Toggle tree node
  const toggleExpand = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ---- CRUD handlers ----

  const handleSave = async (form: BrowseFormState, editingId: number | null) => {
    const payload = {
      code: form.code.trim(),
      parent_code: form.parent_code.trim() || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      comments: form.comments.trim() || null,
      function_name: form.function_name.trim() || null,
      sort_order: form.sort_order,
    };

    const approverPayload = form.approvers.map((a) => ({
      role_id: a.role_id,
      action: a.action,
      kind: a.kind,
      sort_order: a.sort_order,
    }));

    try {
      if (editingId != null) {
        const updated = await updateBrowseItem(editingId, payload);
        await replaceBrowseItemApprovers(updated.id, approverPayload);
        showToast('success', `Updated "${updated.title}"`);
      } else {
        const created = await createBrowseItem(payload);
        await replaceBrowseItemApprovers(created.id, approverPayload);
        showToast('success', `Created "${created.title}"`);
      }
      await fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Save failed');
      throw err; // re-throw so form stays open
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const childCount = countDescendants(items, deleteTarget.code);
    try {
      await deleteBrowseItem(deleteTarget.id, childCount > 0);
      showToast('success', `Deleted "${deleteTarget.title}"`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Delete failed');
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setInitialParentCode(undefined);
    setFormOpen(true);
  };

  const openEdit = (item: BrowseItem) => {
    setEditingItem(item);
    setInitialParentCode(undefined);
    setFormOpen(true);
  };

  const openAddChild = (parentCode: string) => {
    setEditingItem(null);
    setInitialParentCode(parentCode);
    setFormOpen(true);
  };

  // ---- Table columns ----

  const tableColumns: Column[] = useMemo(
    () => [
      { key: 'code', label: 'Code', sortable: true, width: '120px' },
      { key: 'title', label: 'Title', sortable: true },
      { key: 'function_name', label: 'Function', sortable: true, width: '140px' },
      { key: 'parent_code', label: 'Parent Code', sortable: true, width: '120px' },
      {
        key: 'approvers',
        label: 'Approvers',
        width: '90px',
        render: (row: BrowseItem) => {
          const count = row.approvalChain?.length ?? 0;
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
      { key: 'sort_order', label: 'Sort', sortable: true, width: '60px' },
      {
        key: 'actions',
        label: 'Actions',
        width: '100px',
        render: (row: BrowseItem) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(row); }}
              style={tableBtnStyle(theme)}
              title="Edit"
            >
              &#9998;
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
              style={{ ...tableBtnStyle(theme), color: COLORS.danger }}
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

  // Confirm dialog for delete
  const deleteChildCount = deleteTarget ? countDescendants(items, deleteTarget.code) : 0;
  const deleteMessage = deleteTarget
    ? deleteChildCount > 0
      ? `Are you sure you want to delete "${deleteTarget.title}" (${deleteTarget.code})? This item has ${deleteChildCount} descendant(s) that will also be deleted.`
      : `Are you sure you want to delete "${deleteTarget.title}" (${deleteTarget.code})?`
    : '';

  // ---- Styles ----

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

  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 16px',
    borderRadius: 6,
    backgroundColor: active ? COLORS.primary : theme.tagBg,
    color: active ? '#FFFFFF' : theme.textMuted,
    fontSize: 13,
    fontWeight: 600,
    border: active ? 'none' : `1px solid ${theme.cardBorder}`,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text, margin: 0 }}>Browse Items</h1>
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
          + Create New Item
        </button>
      </div>

      {/* Toolbar: view toggle + search + filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setViewMode('tree')} style={toggleBtnStyle(viewMode === 'tree')}>
            Tree
          </button>
          <button onClick={() => setViewMode('table')} style={toggleBtnStyle(viewMode === 'table')}>
            Table
          </button>
        </div>

        <SearchInput value={search} onChange={setSearch} placeholder="Search items..." />

        <select value={functionFilter} onChange={(e) => setFunctionFilter(e.target.value)} style={selectStyle}>
          <option value="">All Functions</option>
          {functionNames.map((fn) => (
            <option key={fn} value={fn}>{fn}</option>
          ))}
        </select>

        {/* Count badge */}
        <span style={{ fontSize: 13, color: theme.textSubtle }}>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: theme.textSubtle }}>Loading...</div>
      )}

      {/* Table view */}
      {!loading && viewMode === 'table' && (
        <DataTable columns={tableColumns} data={filteredItems} emptyMessage="No browse items found." />
      )}

      {/* Tree view */}
      {!loading && viewMode === 'tree' && (
        <div
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {treeNodes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: theme.textSubtle, fontSize: 14 }}>
              No browse items found.
            </div>
          ) : (
            treeNodes.map((node) => (
              <TreeNodeRow
                key={node.item.id}
                node={node}
                expanded={expanded}
                onToggle={toggleExpand}
                onEdit={openEdit}
                onAddChild={openAddChild}
                onDelete={setDeleteTarget}
              />
            ))
          )}
        </div>
      )}

      {/* Create/Edit modal */}
      <BrowseItemForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        editingItem={editingItem}
        roles={roles}
        initialParentCode={initialParentCode}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Browse Item"
        message={deleteMessage}
        confirmText="Delete"
        danger
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper styles
// ---------------------------------------------------------------------------

function tableBtnStyle(theme: { cardBorder: string; textSubtle: string }): React.CSSProperties {
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
