import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../styles/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Approver {
  role_id: number;
  role: string;
  action: string;
  kind: string;
  sort_order: number;
}

interface RoleOption {
  id: number;
  name: string;
}

interface ApprovalChainEditorProps {
  approvers: Approver[];
  roles: RoleOption[];
  onChange: (approvers: Approver[]) => void;
  showKind?: boolean;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const ACTION_REGEX = /^[IREXN][0-9]*[*]?$/;

function isValidAction(value: string): boolean {
  return value === '' || ACTION_REGEX.test(value);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApprovalChainEditor({
  approvers,
  roles,
  onChange,
  showKind = true,
}: ApprovalChainEditorProps) {
  const { theme } = useTheme();

  // ---- helpers ----

  const update = (index: number, field: keyof Approver, value: string | number) => {
    const next = approvers.map((a, i) => (i === index ? { ...a, [field]: value } : a));
    onChange(next);
  };

  const handleRoleChange = (index: number, roleId: number) => {
    const role = roles.find((r) => r.id === roleId);
    const next = approvers.map((a, i) =>
      i === index ? { ...a, role_id: roleId, role: role?.name ?? '' } : a,
    );
    onChange(next);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...approvers];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    // Re-number sort_order sequentially
    next.forEach((a, i) => (a.sort_order = i + 1));
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (index >= approvers.length - 1) return;
    const next = [...approvers];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    next.forEach((a, i) => (a.sort_order = i + 1));
    onChange(next);
  };

  const remove = (index: number) => {
    const next = approvers.filter((_, i) => i !== index);
    next.forEach((a, i) => (a.sort_order = i + 1));
    onChange(next);
  };

  const addApprover = () => {
    const defaultRole = roles[0];
    const newApprover: Approver = {
      role_id: defaultRole?.id ?? 0,
      role: defaultRole?.name ?? '',
      action: 'X',
      kind: '',
      sort_order: approvers.length + 1,
    };
    onChange([...approvers, newApprover]);
  };

  // ---- shared styles ----

  const cellStyle: React.CSSProperties = {
    padding: '6px 8px',
    borderBottom: `1px solid ${theme.cardBorder}`,
    fontSize: 13,
    color: theme.text,
    verticalAlign: 'middle',
  };

  const inputStyle: React.CSSProperties = {
    padding: '5px 8px',
    borderRadius: 4,
    border: `1px solid ${theme.inputBorder}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: 13,
    width: '100%',
    outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const smallBtnStyle: React.CSSProperties = {
    background: 'none',
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: 4,
    color: theme.textSubtle,
    fontSize: 14,
    cursor: 'pointer',
    padding: '2px 6px',
    lineHeight: 1,
  };

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                style={{
                  ...cellStyle,
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.textSubtle,
                  backgroundColor: theme.headerBg,
                }}
              >
                Role
              </th>
              <th
                style={{
                  ...cellStyle,
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.textSubtle,
                  backgroundColor: theme.headerBg,
                  width: 100,
                }}
              >
                Action
              </th>
              {showKind && (
                <th
                  style={{
                    ...cellStyle,
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: theme.textSubtle,
                    backgroundColor: theme.headerBg,
                    width: 60,
                  }}
                >
                  Kind
                </th>
              )}
              <th
                style={{
                  ...cellStyle,
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.textSubtle,
                  backgroundColor: theme.headerBg,
                  width: 60,
                }}
              >
                Order
              </th>
              <th
                style={{
                  ...cellStyle,
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.textSubtle,
                  backgroundColor: theme.headerBg,
                  width: 100,
                  textAlign: 'center',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {approvers.length === 0 ? (
              <tr>
                <td
                  colSpan={showKind ? 5 : 4}
                  style={{
                    ...cellStyle,
                    textAlign: 'center',
                    padding: '20px 8px',
                    color: theme.textSubtle,
                  }}
                >
                  No approvers. Click "Add Approver" to start building the chain.
                </td>
              </tr>
            ) : (
              approvers.map((approver, idx) => {
                const actionValid = isValidAction(approver.action);
                return (
                  <tr key={idx}>
                    {/* Role select */}
                    <td style={cellStyle}>
                      <select
                        value={approver.role_id}
                        onChange={(e) => handleRoleChange(idx, Number(e.target.value))}
                        style={selectStyle}
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                        {/* Keep current value visible even if role list doesn't include it */}
                        {!roles.find((r) => r.id === approver.role_id) && (
                          <option value={approver.role_id}>{approver.role}</option>
                        )}
                      </select>
                    </td>

                    {/* Action input */}
                    <td style={cellStyle}>
                      <input
                        type="text"
                        value={approver.action}
                        onChange={(e) => update(idx, 'action', e.target.value.toUpperCase())}
                        maxLength={6}
                        style={{
                          ...inputStyle,
                          borderColor: actionValid ? theme.inputBorder : COLORS.danger,
                        }}
                        title="Format: I, R, E, X, or N followed by optional number and *"
                      />
                    </td>

                    {/* Kind input */}
                    {showKind && (
                      <td style={cellStyle}>
                        <input
                          type="text"
                          value={approver.kind}
                          onChange={(e) => update(idx, 'kind', e.target.value.slice(0, 1))}
                          maxLength={1}
                          style={inputStyle}
                        />
                      </td>
                    )}

                    {/* Sort order */}
                    <td style={cellStyle}>
                      <input
                        type="number"
                        value={approver.sort_order}
                        onChange={(e) => update(idx, 'sort_order', Number(e.target.value))}
                        min={1}
                        style={{ ...inputStyle, width: 50, textAlign: 'center' }}
                      />
                    </td>

                    {/* Action buttons */}
                    <td style={{ ...cellStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          style={{
                            ...smallBtnStyle,
                            opacity: idx === 0 ? 0.35 : 1,
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          }}
                          title="Move up"
                        >
                          &#9650;
                        </button>
                        <button
                          onClick={() => moveDown(idx)}
                          disabled={idx >= approvers.length - 1}
                          style={{
                            ...smallBtnStyle,
                            opacity: idx >= approvers.length - 1 ? 0.35 : 1,
                            cursor: idx >= approvers.length - 1 ? 'not-allowed' : 'pointer',
                          }}
                          title="Move down"
                        >
                          &#9660;
                        </button>
                        <button
                          onClick={() => remove(idx)}
                          style={{
                            ...smallBtnStyle,
                            color: COLORS.danger,
                            borderColor: COLORS.danger + '40',
                          }}
                          title="Remove approver"
                        >
                          &#10005;
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add button */}
      <button
        onClick={addApprover}
        style={{
          marginTop: 10,
          padding: '7px 16px',
          borderRadius: 6,
          backgroundColor: COLORS.primary,
          color: '#FFFFFF',
          fontSize: 13,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.primaryLight;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.primary;
        }}
      >
        + Add Approver
      </button>
    </div>
  );
}
