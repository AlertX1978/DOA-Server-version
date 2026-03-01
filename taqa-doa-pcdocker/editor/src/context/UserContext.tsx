import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { IS_AUTH_CONFIGURED } from '../auth/msalConfig';
import apiClient from '../api/client';

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

const UserContext = createContext<UserContextType>({
  user: null,
  isAdmin: false,
  loading: true,
});

const DEV_USER: UserProfile = {
  id: 'dev',
  email: 'dev@taqa.local',
  displayName: 'Dev User',
  role: 'admin',
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
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
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUser();
    return () => { cancelled = true; };
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <UserContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  return useContext(UserContext);
}
