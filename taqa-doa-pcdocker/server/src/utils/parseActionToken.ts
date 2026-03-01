import { ActionToken } from '../models/types';

/**
 * Parse an approval action token string into its constituent parts.
 *
 * Token format: `[IREXN]\d*\*?`
 *   - I = Initiate, R = Review, E = Endorse, X = Approve, N = Notify
 *   - Optional number = approval level within the group
 *   - Optional `*` = conditional approval
 *   - Special case: "EX" maps to group E, level 10
 *
 * This is a direct TypeScript port of the client-side `parseActionToken()`
 * function (HTML lines 147-178).
 *
 * @param action - Raw action string (e.g. "X1", "E3*", "EX", "R")
 * @returns Parsed ActionToken
 */
export function parseActionToken(action: string | null | undefined): ActionToken {
  if (!action || typeof action !== 'string') {
    return { group: 'Z', level: 999, original: action || '', hasStar: false };
  }

  let normalized = action.replace(/\s+/g, '').toUpperCase();
  const original = normalized;
  const hasStar = normalized.includes('*');
  normalized = normalized.replace(/\*/g, '');

  // Special case: "EX" is the highest endorsement level (level 10)
  if (normalized === 'EX') {
    return { group: 'E', level: 10, original: hasStar ? 'EX*' : 'EX', hasStar };
  }

  const match = normalized.match(/^([IREXN])(\d*)$/);

  if (!match) {
    // Fallback: try to extract any recognisable group letter and number
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
