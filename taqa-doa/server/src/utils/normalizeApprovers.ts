import { GROUP_PRIORITY } from '../models/constants';
import { parseActionToken } from './parseActionToken';
import { ActionToken } from '../models/types';

/**
 * Approver entry as it comes in (must have at minimum `role` and `action`).
 */
interface ApproverInput {
  role: string;
  action: string;
}

/**
 * Internal representation used during sorting -- carries parse metadata.
 */
interface ParsedApprover extends ApproverInput {
  _parsed: ActionToken;
  _originalIndex: number;
}

/**
 * Deduplicate and sort an approval chain following TAQA's ordering rules.
 *
 * Sort order: I (Initiate) -> R (Review) -> E (Endorse) -> X (Approve) -> N (Notify)
 * Within each group: ascending numeric levels.
 * EX is highest endorsement (level 10, after E9, before X).
 * '*' suffix is ignored for sorting but kept in display.
 *
 * This is a direct TypeScript port of the client-side
 * `normalizeAndSortApprovers()` function (HTML lines 180-223).
 *
 * @param approvers - Raw approval chain entries
 * @returns Deduplicated and sorted approver list
 */
export function normalizeAndSortApprovers<T extends ApproverInput>(
  approvers: T[] | null | undefined
): T[] {
  if (!approvers || !Array.isArray(approvers) || approvers.length === 0) {
    return [];
  }

  // Step 1: Parse each approver with token info
  const parsed: ParsedApprover[] = approvers.map((approver, originalIndex) => {
    const tokenInfo = parseActionToken(approver.action);
    return { ...approver, _parsed: tokenInfo, _originalIndex: originalIndex };
  });

  // Step 2: Deduplicate using normalised key (role + token)
  // Keep FIRST occurrence (stable)
  const seen = new Set<string>();
  const deduped = parsed.filter((approver) => {
    // Normalise role: trim, collapse whitespace, lowercase
    const normalizedRole = (approver.role || '').trim().replace(/\s+/g, ' ').toLowerCase();
    // Normalise token: uppercase, strip '*' for comparison only
    const normalizedToken = (approver._parsed.original || '').toUpperCase().replace(/\*/g, '');
    const key = normalizedRole + '|' + normalizedToken;

    if (seen.has(key)) {
      return false; // Duplicate -- discard
    }
    seen.add(key);
    return true; // First occurrence -- keep
  });

  // Step 3: Sort the deduped list
  deduped.sort((a, b) => {
    const aGroup = GROUP_PRIORITY[a._parsed.group] ?? 4;
    const bGroup = GROUP_PRIORITY[b._parsed.group] ?? 4;
    if (aGroup !== bGroup) return aGroup - bGroup;
    if (a._parsed.level !== b._parsed.level) return a._parsed.level - b._parsed.level;
    if (a._parsed.hasStar !== b._parsed.hasStar) return a._parsed.hasStar ? 1 : -1;
    return a._originalIndex - b._originalIndex;
  });

  // Step 4: Return cleaned result (strip internal metadata)
  return deduped.map((approver) => {
    const { _parsed, _originalIndex, ...rest } = approver;
    return { ...rest, action: _parsed.original } as unknown as T;
  });
}
