import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { IS_AUTH_CONFIGURED } from '../auth/msalConfig';
import apiClient from '../api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'viewer';
}

interface UserContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const UserContext = createContext<UserContextType>({
  user: null,
  isAdmin: false,
  loading: true,
});

// ---------------------------------------------------------------------------
// Dev-mode fallback profile (used when Azure AD is not configured)
// ---------------------------------------------------------------------------

const DEV_USER: UserProfile = {
  id: 'dev',
  email: 'dev@taqa.local',
  displayName: 'Dev User',
  role: 'admin',
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      // When auth is not configured, use a local dev user so the admin
      // panel is accessible during development.
      if (!IS_AUTH_CONFIGURED) {
        setUser(DEV_USER);
        setLoading(false);
        return;
      }

      try {
        const { data } = await apiClient.get<{
          id: string;
          email: string;
          displayName: string;
          display_name?: string;
          role: 'admin' | 'viewer';
        }>('/auth/me');

        if (!cancelled) {
          setUser({
            id: data.id,
            email: data.email,
            displayName: data.displayName || data.display_name || data.email,
            role: data.role,
          });
        }
      } catch (err) {
        console.error('[UserContext] Failed to load user profile:', err);
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <UserContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </UserContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
