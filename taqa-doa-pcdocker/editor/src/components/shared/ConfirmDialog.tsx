import Modal from './Modal';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../styles/theme';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
}: ConfirmDialogProps) {
  const { theme } = useTheme();

  const confirmBg = danger ? COLORS.danger : COLORS.primary;
  const confirmHoverBg = danger ? '#DC2626' : COLORS.primaryLight;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} width={440}>
      <p
        style={{
          color: theme.textMuted,
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 24,
        }}
      >
        {message}
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          onClick={onCancel}
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
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
          }}
        >
          {cancelText}
        </button>

        <button
          onClick={onConfirm}
          style={{
            padding: '8px 18px',
            borderRadius: 6,
            backgroundColor: confirmBg,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = confirmHoverBg;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = confirmBg;
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
