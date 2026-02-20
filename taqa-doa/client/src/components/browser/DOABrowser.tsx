import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../styles/theme';
import { getBrowseItems, getBrowseFunctions } from '../../api/browse.api';
import BrowseTreeNode from './BrowseTreeNode';
import LoadingSpinner from '../shared/LoadingSpinner';
import type { BrowseItem, BrowseTreeNodeData } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Correct common typos and inconsistencies in function names from source data. */
function normalizeFunction(func: string | undefined): string {
  if (!func) return '';
  const normalized = func.trim();
  const corrections: Record<string, string> = {
    'Human Recourses': 'Human Resources',
    'Corporate  Finance': 'Corporate Finance', // double space
    'Corproate Finance': 'Corporate Finance', // typo
    'End user all functions': 'End User',
    'End user of all functions': 'End User',
    'End user all functions ': 'End User',
    'End user of all functions ': 'End User',
    'End user': 'End User',
    'Commercial and Marketing': 'Commercial & Marketing',
    'Corporate Treasury ': 'Corporate Treasury',
    'TAQA General Assebmbly': 'TAQA General Assembly', // typo
  };
  return corrections[normalized] || normalized;
}

/** Numeric code comparison: split by '.' and compare each part as numbers. */
function compareCodeNumerically(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const valA = partsA[i] || 0;
    const valB = partsB[i] || 0;
    if (valA !== valB) return valA - valB;
  }
  return 0;
}

/** Get parent code (e.g. '4.2.3.2' -> '4.2.3', '4' -> null). */
function getParentCode(code: string): string | null {
  const parts = code.split('.');
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('.');
}

/** Count all nodes in a hierarchy (including root). */
function countAllNodes(nodes: BrowseTreeNodeData[]): number {
  return nodes.reduce((sum, node) => {
    return sum + 1 + (node.children ? countAllNodes(node.children) : 0);
  }, 0);
}

// ---------------------------------------------------------------------------
// DOABrowser
// ---------------------------------------------------------------------------

export default function DOABrowser() {
  const { theme } = useTheme();

  // Data fetched from API
  const [allItems, setAllItems] = useState<BrowseItem[]>([]);
  const [allFunctions, setAllFunctions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFunction, setFilterFunction] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // -----------------------------------------------------------------------
  // Load data on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const [items, functions] = await Promise.all([getBrowseItems(), getBrowseFunctions()]);
        if (cancelled) return;
        setAllItems(items);
        // Normalize and dedupe function names
        const funcSet = new Set<string>();
        functions.forEach((f) => {
          const n = normalizeFunction(f);
          if (n) funcSet.add(n);
        });
        // Also collect from items in case the /functions endpoint misses any
        items.forEach((item) => {
          const n = normalizeFunction(item.function_name || undefined);
          if (n) funcSet.add(n);
        });
        setAllFunctions(Array.from(funcSet).sort());
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load browse data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // -----------------------------------------------------------------------
  // Build hierarchical tree from flat items
  // -----------------------------------------------------------------------
  const { hierarchy, allNodeIds } = useMemo(() => {
    // Helper: clean trailing dots from codes (e.g. "3.8.1." → "3.8.1")
    const cleanCode = (code: string) => code.replace(/\.$/, '');
    const getDepth = (code: string) => cleanCode(code).split('.').length;

    // Sort all items by sort_order (document order)
    const sortedAll = [...allItems].sort((a, b) => a.sort_order - b.sort_order);

    // Apply search/function filters
    let filteredItems = sortedAll;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.code.toLowerCase().includes(term) ||
          item.title.toLowerCase().includes(term) ||
          (item.description && item.description.toLowerCase().includes(term)) ||
          (item.comments && item.comments.toLowerCase().includes(term)),
      );
    }

    if (filterFunction) {
      filteredItems = filteredItems.filter(
        (item) => normalizeFunction(item.function_name || undefined) === filterFunction,
      );
    }

    // When filtered, include ancestor items so the tree has complete paths.
    // Walk through ALL items in sort_order, tracking the current ancestor
    // stack; when a filtered item is encountered, mark all its ancestors.
    let items: typeof sortedAll;

    if (searchTerm || filterFunction) {
      const matchedIds = new Set(filteredItems.map((i) => i.id));
      const neededIds = new Set(matchedIds);

      // Stack-based ancestor tracking over the full sorted list
      const stack: typeof sortedAll = [];
      for (const item of sortedAll) {
        const depth = getDepth(item.code);
        while (stack.length > 0 && getDepth(stack[stack.length - 1].code) >= depth) {
          stack.pop();
        }
        stack.push(item);
        if (matchedIds.has(item.id)) {
          for (const ancestor of stack) {
            neededIds.add(ancestor.id);
          }
        }
      }

      items = sortedAll.filter((item) => neededIds.has(item.id));
    } else {
      items = sortedAll;
    }

    // ---- Build code → sorted occurrences for resolving duplicate parent codes ----
    const codeOccurrences = new Map<string, Array<{ sortOrder: number; id: number }>>();
    items.forEach((item) => {
      const cc = cleanCode(item.code);
      const list = codeOccurrences.get(cc) || [];
      list.push({ sortOrder: item.sort_order, id: item.id });
      codeOccurrences.set(cc, list);
    });

    // Helper: for a given parent code, find the correct parent instance
    // by picking the closest previous occurrence (by sort_order)
    function resolveParentId(parentCode: string, childSortOrder: number): number | null {
      const cc = cleanCode(parentCode);
      const occurrences = codeOccurrences.get(cc);
      if (!occurrences || occurrences.length === 0) return null;
      if (occurrences.length === 1) return occurrences[0].id;

      let best: (typeof occurrences)[0] | null = null;
      for (const occ of occurrences) {
        if (occ.sortOrder <= childSortOrder) {
          if (!best || occ.sortOrder > best.sortOrder) {
            best = occ;
          }
        }
      }
      // Fallback: if parent appears after child in sort order, use first occurrence
      return best ? best.id : occurrences[0].id;
    }

    // ---- Create tree nodes for every item ----
    const nodeById = new Map<number, BrowseTreeNodeData>();
    const allIds: string[] = [];
    let syntheticIdCounter = -1;

    items.forEach((item) => {
      nodeById.set(item.id, {
        id: item.id,
        code: item.code,
        title: item.title,
        description: item.description || '',
        comments: item.comments || '',
        function: normalizeFunction(item.function_name || undefined) || '',
        approvalChain: item.approvalChain || [],
        isRoot: getDepth(item.code) === 1,
        children: [],
      });
      allIds.push(String(item.id));
    });

    // ---- Create synthetic ancestor for a missing code ----
    function ensureSyntheticAncestor(code: string): number {
      const existing = codeOccurrences.get(code);
      if (existing && existing.length > 0) return existing[0].id;

      const synId = syntheticIdCounter--;
      const fullItem = allItems.find((it) => cleanCode(it.code) === code);
      const depth = code.split('.').length;
      const node: BrowseTreeNodeData = {
        id: synId,
        code,
        title: fullItem ? fullItem.title : `Section ${code}`,
        description: fullItem?.description || '',
        comments: fullItem?.comments || '',
        function: fullItem ? normalizeFunction(fullItem.function_name || undefined) : '',
        approvalChain: fullItem?.approvalChain || [],
        isRoot: depth === 1,
        children: [],
      };
      nodeById.set(synId, node);
      codeOccurrences.set(code, [{ sortOrder: -1, id: synId }]);
      allIds.push(String(synId));
      return synId;
    }

    // ---- Link each node to its parent ----
    const roots: BrowseTreeNodeData[] = [];
    const linkedChildren = new Set<number>(); // prevent double-linking

    items.forEach((item) => {
      const node = nodeById.get(item.id)!;
      const depth = getDepth(item.code);

      if (depth === 1) {
        roots.push(node);
        return;
      }

      // Determine parent code from DB parent_code or by trimming the item code
      const itemCleanCode = cleanCode(item.code);
      let parentCode = item.parent_code
        ? cleanCode(item.parent_code)
        : itemCleanCode.split('.').slice(0, -1).join('.');

      // Guard against self-reference (e.g. "3.8.1." has parent_code "3.8.1")
      if (parentCode === itemCleanCode) {
        parentCode = itemCleanCode.split('.').slice(0, -1).join('.');
      }

      if (!parentCode) {
        roots.push(node);
        return;
      }

      // Resolve to the specific parent instance (handles duplicate codes)
      let parentId = resolveParentId(parentCode, item.sort_order);

      if (parentId === null) {
        // Parent code doesn't exist - create synthetic ancestors up the chain
        const parts = parentCode.split('.');
        let ancestorCode = '';
        let lastAncestorId: number | null = null;

        for (let i = 0; i < parts.length; i++) {
          ancestorCode = i === 0 ? parts[0] : ancestorCode + '.' + parts[i];
          const existingId = resolveParentId(ancestorCode, item.sort_order);

          if (existingId !== null) {
            lastAncestorId = existingId;
          } else {
            const synId = ensureSyntheticAncestor(ancestorCode);
            const synNode = nodeById.get(synId)!;
            if (lastAncestorId !== null && !linkedChildren.has(synId)) {
              nodeById.get(lastAncestorId)!.children.push(synNode);
              linkedChildren.add(synId);
            } else if (synNode.isRoot && !linkedChildren.has(synId)) {
              roots.push(synNode);
              linkedChildren.add(synId);
            }
            lastAncestorId = synId;
          }
        }

        parentId = lastAncestorId;
      }

      if (parentId !== null) {
        nodeById.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    roots.sort((a, b) => compareCodeNumerically(cleanCode(a.code), cleanCode(b.code)));

    return { hierarchy: roots, allNodeIds: allIds };
  }, [searchTerm, filterFunction, allItems]);

  // -----------------------------------------------------------------------
  // Auto-expand sections when searching or filtering
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (searchTerm || filterFunction) {
      setExpandedSections(new Set(allNodeIds));
    }
  }, [searchTerm, filterFunction, allNodeIds]);

  // -----------------------------------------------------------------------
  // Section toggle helpers
  // -----------------------------------------------------------------------
  const toggleSection = (code: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(allNodeIds));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  // -----------------------------------------------------------------------
  // Styles
  // -----------------------------------------------------------------------
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: `1px solid ${theme.cardBorder}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: '14px',
  };

  // -----------------------------------------------------------------------
  // Loading / Error states
  // -----------------------------------------------------------------------
  if (loading) {
    return <LoadingSpinner theme={theme} />;
  }

  if (error) {
    return (
      <div
        style={{
          padding: '24px',
          backgroundColor: theme.dangerBg,
          border: `1px solid ${COLORS.danger}40`,
          borderRadius: '12px',
          color: theme.dangerText,
          textAlign: 'center',
        }}
      >
        <p style={{ fontWeight: '600', marginBottom: '8px' }}>Failed to load DOA data</p>
        <p style={{ fontSize: '14px' }}>{error}</p>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div data-testid="browse-doa-root">
      {/* Search and filter controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px', maxWidth: '400px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: theme.textMuted,
              marginBottom: '8px',
            }}
          >
            Search
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code, title, or description..."
            style={inputStyle}
          />
        </div>
        <div style={{ minWidth: '200px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: theme.textMuted,
              marginBottom: '8px',
            }}
          >
            Filter by Function
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              data-testid="browse-filter-function"
              value={filterFunction}
              onChange={(e) => setFilterFunction(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="" data-testid="browse-filter-function-option-">
                All functions
              </option>
              {allFunctions.map((func) => (
                <option
                  key={func}
                  value={func}
                  data-testid={`browse-filter-function-option-${func.replace(/\s+/g, '-')}`}
                >
                  {func}
                </option>
              ))}
            </select>
            {filterFunction && (
              <button
                data-testid="browse-filter-clear"
                onClick={() => {
                  setFilterFunction('');
                  setExpandedSections(new Set());
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  backgroundColor: COLORS.danger + '20',
                  color: COLORS.danger,
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar and expand/collapse controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <p style={{ color: theme.textMuted }}>
          Showing{' '}
          <span style={{ color: COLORS.primary, fontWeight: '600' }}>{countAllNodes(hierarchy)}</span> items
          in <span style={{ color: COLORS.primary, fontWeight: '600' }}>{hierarchy.length}</span> chapters
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            data-testid="browse-expand-all"
            onClick={expandAll}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: theme.tagBg,
              color: theme.textMuted,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Expand All
          </button>
          <button
            data-testid="browse-collapse-all"
            onClick={collapseAll}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: theme.tagBg,
              color: theme.textMuted,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Collapse All
          </button>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setExpandedSections(new Set());
              }}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: COLORS.danger + '20',
                color: COLORS.danger,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Version and reference notes */}
      <div
        style={{
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: theme.tagBg,
          borderRadius: '8px',
          fontSize: '12px',
          color: theme.textMuted,
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>DOA Reader v4.0 (reference only)</div>
        <div>Do not replace the main DOA file for verification.</div>
        <div style={{ marginTop: '4px' }}>Technical support (bug fixes): atkachyov@tq.com</div>
      </div>

      {/* Tree nodes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {hierarchy.map((node) => (
          <BrowseTreeNode
            key={node.id}
            node={node}
            level={0}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}
