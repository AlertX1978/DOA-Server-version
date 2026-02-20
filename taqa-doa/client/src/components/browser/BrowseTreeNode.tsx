import type { Theme } from '../../types';
import type { BrowseTreeNodeData } from '../../types';
import { COLORS } from '../../styles/theme';
import { normalizeAndSortApprovers } from '../../utils/approvers';

// ---------------------------------------------------------------------------
// BrowseApprovalChain (internal, not exported)
// ---------------------------------------------------------------------------

function BrowseApprovalChain({ node, theme }: { node: BrowseTreeNodeData; theme: Theme }) {
  const code = node.code;
  const approvalChain = node.approvalChain || [];

  // Sort approvers using the same normalized order (I -> R -> E -> X)
  const sortedApprovers = normalizeAndSortApprovers(
    approvalChain.map((a) => ({ role: a.role, action: a.action })),
  );

  // Hide entirely if no approval chain
  if (sortedApprovers.length === 0) {
    return null;
  }

  return (
    <div data-testid={`browse-approval-chain-${code}`} style={{ marginTop: '12px' }}>
      <h5
        style={{
          fontSize: '12px',
          color: theme.textSubtle,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '8px',
        }}
      >
        Approval Chain
      </h5>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {sortedApprovers.map((approver, idx) => (
          <div
            key={`${approver.role}-${idx}`}
            data-testid={`browse-approver-row-${code}-${idx}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: theme.tagBg,
              borderRadius: '6px',
            }}
          >
            <span
              data-testid={`browse-approver-role-${code}-${idx}`}
              style={{ flex: 1, color: theme.text, fontSize: '14px' }}
            >
              {approver.role}
            </span>
            <span
              data-testid={`browse-approver-token-${code}-${idx}`}
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                fontWeight: '600',
                backgroundColor: approver.action.startsWith('X')
                  ? `${COLORS.success}20`
                  : approver.action.startsWith('E')
                    ? `${COLORS.warning}20`
                    : approver.action.startsWith('R')
                      ? `${COLORS.info}20`
                      : approver.action.startsWith('I')
                        ? `${COLORS.primary}20`
                        : theme.tagBg,
                color: approver.action.startsWith('X')
                  ? COLORS.success
                  : approver.action.startsWith('E')
                    ? COLORS.warning
                    : approver.action.startsWith('R')
                      ? COLORS.info
                      : approver.action.startsWith('I')
                        ? COLORS.primary
                        : theme.text,
              }}
            >
              {approver.action}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BrowseTreeNode
// ---------------------------------------------------------------------------

interface BrowseTreeNodeProps {
  node: BrowseTreeNodeData;
  level: number;
  expandedSections: Set<string>;
  toggleSection: (code: string) => void;
  theme: Theme;
}

function BrowseTreeNode({ node, level, expandedSections, toggleSection, theme }: BrowseTreeNodeProps) {
  const nodeKey = String(node.id);
  const isExpanded = expandedSections.has(nodeKey);
  const hasChildren = node.children && node.children.length > 0;
  const indentPx = level * 20;

  // Count all descendant items
  const countDescendants = (n: BrowseTreeNodeData): number => {
    if (!n.children || n.children.length === 0) return 1;
    return n.children.reduce((sum, child) => sum + countDescendants(child), 0);
  };
  const descendantCount = countDescendants(node);

  // Chevron SVG used by both root and non-root nodes
  const chevron = (
    <svg
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
      stroke={theme.textMuted}
      style={{
        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
        transition: 'transform 0.2s',
        flexShrink: 0,
      }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  // -------------------------------------------------------------------------
  // ROOT nodes (chapters)
  // -------------------------------------------------------------------------
  if (node.isRoot) {
    return (
      <div
        data-testid={`doa-section-node-${node.code}`}
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <button
          data-testid={`doa-section-toggle-${node.code}`}
          aria-expanded={isExpanded}
          onClick={() => toggleSection(nodeKey)}
          style={{
            width: '100%',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'transparent',
            color: theme.text,
            cursor: 'pointer',
            textAlign: 'left',
            border: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '16px',
                fontFamily: 'monospace',
                fontWeight: '700',
                backgroundColor: `${COLORS.primary}30`,
                color: COLORS.primary,
              }}
            >
              {node.code}
            </span>
            <span data-testid={`doa-title-${node.code}`} style={{ fontSize: '16px', fontWeight: '600' }}>
              {node.title}
            </span>
            <span style={{ fontSize: '14px', color: theme.textMuted }}>({descendantCount} items)</span>
          </div>
          {chevron}
        </button>

        {isExpanded && (
          <div style={{ borderTop: `1px solid ${theme.cardBorder}`, padding: '12px' }}>
            {/* Approval chain for root node */}
            <BrowseApprovalChain node={node} theme={theme} />

            {/* Children */}
            {hasChildren && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {node.children.map((child) => (
                  <BrowseTreeNode
                    key={child.id}
                    node={child}
                    level={1}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    theme={theme}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // NON-ROOT nodes (subsections)
  // -------------------------------------------------------------------------
  return (
    <div
      data-testid={`doa-section-node-${node.code}`}
      style={{
        backgroundColor: theme.inputBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: '12px',
        overflow: 'hidden',
        marginLeft: `${indentPx}px`,
      }}
    >
      <button
        data-testid={`doa-section-toggle-${node.code}`}
        aria-expanded={isExpanded}
        onClick={() => toggleSection(nodeKey)}
        style={{
          width: '100%',
          padding: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          backgroundColor: 'transparent',
          color: theme.text,
          cursor: 'pointer',
          textAlign: 'left',
          border: 'none',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'monospace',
                fontWeight: '600',
                backgroundColor: `${COLORS.primary}20`,
                color: COLORS.primary,
              }}
            >
              {node.code}
            </span>
            {hasChildren && (
              <span style={{ fontSize: '12px', color: theme.textMuted }}>({descendantCount} items)</span>
            )}
            {node.function && (
              <span
                style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  backgroundColor: theme.tagBg,
                  borderRadius: '4px',
                  color: theme.textMuted,
                }}
              >
                {node.function}
              </span>
            )}
          </div>
          <h4 data-testid={`doa-title-${node.code}`} style={{ color: theme.text, fontWeight: '500', margin: 0 }}>
            {node.title}
          </h4>
        </div>
        {chevron}
      </button>

      {/* Expanded content: description, comments, approval chain, children */}
      {isExpanded && (
        <div
          style={{
            borderTop: `1px solid ${theme.cardBorder}`,
            padding: '16px',
            backgroundColor: theme.cardBg,
          }}
        >
          {/* Description */}
          {node.description && (
            <div data-testid={`doa-description-${node.code}`} style={{ marginBottom: '12px' }}>
              <h5
                style={{
                  fontSize: '12px',
                  color: theme.textSubtle,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px',
                }}
              >
                Description
              </h5>
              <p style={{ color: theme.text, fontSize: '14px', margin: 0 }}>{node.description}</p>
            </div>
          )}

          {/* Comments */}
          {node.comments && (
            <div data-testid={`doa-comments-${node.code}`} style={{ marginBottom: '12px' }}>
              <h5
                style={{
                  fontSize: '12px',
                  color: theme.textSubtle,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px',
                }}
              >
                Comments
              </h5>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: theme.warningBg,
                  border: `1px solid ${COLORS.warning}30`,
                  borderRadius: '8px',
                }}
              >
                <p style={{ color: theme.warningText, fontSize: '14px', margin: 0 }}>{node.comments}</p>
              </div>
            </div>
          )}

          {/* Approval Chain */}
          <BrowseApprovalChain node={node} theme={theme} />

          {/* Children */}
          {hasChildren && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {node.children.map((child) => (
                <BrowseTreeNode
                  key={child.id}
                  node={child}
                  level={level + 1}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  theme={theme}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BrowseTreeNode;
