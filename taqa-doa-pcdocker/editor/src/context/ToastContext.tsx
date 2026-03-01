import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useTheme } from './ThemeContext';
import { COLORS } from '../styles/theme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { theme } = useTheme();

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const getColor = (type: ToastType) => {
    switch (type) {
      case 'success': return { bg: theme.successBg, text: theme.successText, border: COLORS.success };
      case 'error': return { bg: theme.dangerBg, text: theme.dangerText, border: COLORS.danger };
      case 'warning': return { bg: theme.warningBg, text: theme.warningText, border: COLORS.warning };
      case 'info': return { bg: theme.infoBg, text: theme.infoText, border: COLORS.info };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((toast) => {
          const colors = getColor(toast.type);
          return (
            <div
              key={toast.id}
              className="toast-enter"
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                backgroundColor: colors.bg,
                color: colors.text,
                borderLeft: `4px solid ${colors.border}`,
                fontSize: 14,
                fontWeight: 500,
                maxWidth: 400,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
