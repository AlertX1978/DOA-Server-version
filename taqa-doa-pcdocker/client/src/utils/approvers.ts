/**
 * Client-side approver normalization for browse view.
 * Mirrors the server-side normalizeAndSortApprovers exactly.
 */

const GROUP_PRIORITY: Record<string, number> = { I: 0, R: 1, E: 2, X: 3, N: 4 };

interface TokenInfo {
  group: string;
  level: number;
  original: string;
  hasStar: boolean;
}

export function parseActionToken(action: string | undefined): TokenInfo {
  if (!action || typeof action !== 'string') {
    return { group: 'Z', level: 999, original: action || '', hasStar: false };
  }
  let normalized = action.replace(/\s+/g, '').toUpperCase();
  const original = normalized;
  const hasStar = normalized.includes('*');
  normalized = normalized.replace(/\*/g, '');

  if (normalized === 'EX') {
    return { group: 'E', level: 10, original: hasStar ? 'EX*' : 'EX', hasStar };
  }

  const match = normalized.match(/^([IREXN])(\d*)$/);
  if (!match) {
    const groupMatch = normalized.match(/^([A-Z])/);
    const numMatch = normalized.match(/(\d+)/);
    return {
      group: groupMatch ? groupMatch[1] : 'Z',
      level: numMatch ? parseInt(numMatch[1], 10) : 999,
      original: hasStar ? original : action.replace(/\s+/g, ''),
      hasStar,
    };
  }

  const group = match[1];
  const levelStr = match[2];
  const level = levelStr ? parseInt(levelStr, 10) : 100;
  return {
    group,
    level,
    original: hasStar ? `${group}${levelStr || ''}*` : `${group}${levelStr || ''}`,
    hasStar,
  };
}

interface ApproverInput {
  role: string;
  action: string;
}

export function normalizeAndSortApprovers<T extends ApproverInput>(approvers: T[]): T[] {
  if (!approvers || !Array.isArray(approvers) || approvers.length === 0) {
    return [];
  }

  type ParsedApprover = T & { _parsed: TokenInfo; _originalIndex: number };

  const parsed: ParsedApprover[] = approvers.map((approver, i) => ({
    ...approver,
    _parsed: parseActionToken(approver.action),
    _originalIndex: i,
  }));

  const seen = new Set<string>();
  const deduped = parsed.filter((approver) => {
    const normalizedRole = (approver.role || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const normalizedToken = (approver._parsed.original || '').toUpperCase().replace(/\*/g, '');
    const key = normalizedRole + '|' + normalizedToken;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => {
    const aGroup = GROUP_PRIORITY[a._parsed.group] ?? 4;
    const bGroup = GROUP_PRIORITY[b._parsed.group] ?? 4;
    if (aGroup !== bGroup) return aGroup - bGroup;
    if (a._parsed.level !== b._parsed.level) return a._parsed.level - b._parsed.level;
    if (a._parsed.hasStar !== b._parsed.hasStar) return a._parsed.hasStar ? 1 : -1;
    return a._originalIndex - b._originalIndex;
  });

  return deduped.map((approver) => {
    const { _parsed, _originalIndex, ...rest } = approver;
    return { ...rest, action: _parsed.original } as unknown as T;
  });
}
