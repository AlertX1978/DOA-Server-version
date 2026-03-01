import type { Theme } from '../../types';

interface ActionBadgeProps {
  action: string;
  label?: string;
  countXWithoutNumber?: boolean;
  theme: Theme;
}

export default function ActionBadge({ action, label, countXWithoutNumber = true, theme }: ActionBadgeProps) {
  const isApproval = action.startsWith('X');
  const hasNumber = /\d/.test(action);
  const isExcluded = isApproval && !hasNumber && !countXWithoutNumber;

  let bgColor: string, textColor: string, borderColor: string;

  if (isExcluded) {
    bgColor = 'rgba(107,114,128,0.2)';
    textColor = '#9CA3AF';
    borderColor = 'rgba(107,114,128,0.3)';
  } else if (isApproval) {
    bgColor = theme.successBg;
    textColor = theme.successText;
    borderColor = 'rgba(16,185,129,0.3)';
  } else if (action.startsWith('E')) {
    bgColor = theme.warningBg;
    textColor = theme.warningText;
    borderColor = 'rgba(245,158,11,0.3)';
  } else if (action.startsWith('R')) {
    bgColor = theme.infoBg;
    textColor = theme.infoText;
    borderColor = 'rgba(14,165,233,0.3)';
  } else {
    bgColor = 'rgba(107,114,128,0.2)';
    textColor = '#9CA3AF';
    borderColor = 'rgba(107,114,128,0.3)';
  }

  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: bgColor,
      color: textColor,
      border: `1px solid ${borderColor}`,
      textDecoration: isExcluded ? 'line-through' : 'none',
      whiteSpace: 'nowrap',
    }}>
      {action} {label && `- ${label}`}
    </span>
  );
}
