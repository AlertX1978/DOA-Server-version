import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../styles/theme';
import { getUsers, updateUserRole, toggleUserActive, type UserRecord } from '../../api/admin.api';
import LoadingSpinner from '../shared/LoadingSpinner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UserManagement() {
  const { theme } = useTheme();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null); // user id being updated

  // ---- Load users ----
  const loadUsers = useCallback(async () => {
    try {
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ---- Role change ----
  const handleRoleChange = async (user: UserRecord, newRole: string) => {
    if (newRole === user.role) return;
    setUpdating(user.id);
    try {
      const updated = await updateUserRole(user.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      setError(message);
    } finally {
      setUpdating(null);
    }
  };

  // ---- Active toggle ----
  const handleToggleActive = async (user: UserRecord) => {
    const newState = !user.is_active;
    if (!newState) {
      const confirmed = window.confirm(
        `Are you sure you want to deactivate ${user.display_name || user.email}? They will no longer be able to access the application.`,
      );
      if (!confirmed) return;
    }
    setUpdating(user.id);
    try {
      const updated = await toggleUserActive(user.id, newState);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to toggle user status';
      setError(message);
    } finally {
      setUpdating(null);
    }
  };

  // ---- Styles ----
  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '24px',
    padding: '32px',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: theme.textSubtle,
    borderBottom: `2px solid ${theme.cardBorder}`,
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '14px',
    color: theme.text,
    borderBottom: `1px solid ${theme.cardBorder}`,
    verticalAlign: 'middle',
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme.cardBorder}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: '13px',
    cursor: 'pointer',
  };

  // ---- Render ----
  if (loading) return <LoadingSpinner theme={theme} />;

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.text, margin: 0 }}>User Management</h2>
          <p style={{ color: theme.textSubtle, fontSize: '13px', marginTop: '4px' }}>
            {users.length} registered user{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); loadUsers(); }}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: `1px solid ${theme.cardBorder}`,
            backgroundColor: theme.inputBg,
            color: theme.text,
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          backgroundColor: theme.dangerBg,
          color: theme.dangerText,
          fontSize: '13px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Active</th>
              <th style={thStyle}>Last Login</th>
              <th style={thStyle}>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: theme.textSubtle, padding: '48px 16px' }}>
                  No users found.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} style={{ opacity: user.is_active ? 1 : 0.5 }}>
                {/* Name */}
                <td style={tdStyle}>
                  <span style={{ fontWeight: '600' }}>{user.display_name || '--'}</span>
                </td>

                {/* Email */}
                <td style={tdStyle}>{user.email}</td>

                {/* Role */}
                <td style={tdStyle}>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user, e.target.value)}
                    disabled={updating === user.id}
                    style={selectStyle}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>

                {/* Active toggle */}
                <td style={tdStyle}>
                  <button
                    onClick={() => handleToggleActive(user)}
                    disabled={updating === user.id}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: updating === user.id ? 'wait' : 'pointer',
                      border: 'none',
                      backgroundColor: user.is_active ? theme.successBg : theme.dangerBg,
                      color: user.is_active ? theme.successText : theme.dangerText,
                    }}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>

                {/* Last Login */}
                <td style={{ ...tdStyle, fontSize: '13px', color: theme.textSubtle }}>
                  {formatDate(user.last_login_at)}
                </td>

                {/* Created */}
                <td style={{ ...tdStyle, fontSize: '13px', color: theme.textSubtle }}>
                  {formatDate(user.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
