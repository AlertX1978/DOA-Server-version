/**
 * Validation issue reported by `validateDOAData`.
 */
export interface DOAValidationIssue {
  code: string;
  issue: 'chain_parses_empty' | 'unrecognized_token' | 'duplicate_pair';
  detail: string;
}

/**
 * Shape of an item that can be validated.
 * Matches the flattened browse-data structure that includes an `approvalChain`.
 */
interface ValidatableItem {
  code: string;
  approvalChain?: { role?: string; action?: string }[];
}

/**
 * Run data-quality diagnostics against a list of DOA items.
 *
 * Checks performed:
 *   1. Chain exists but contains no valid tokens.
 *   2. Individual tokens that don't match the expected pattern.
 *   3. Duplicate (role, action) pairs within a single item.
 *
 * This is a direct TypeScript port of the client-side `validateDOAData()`
 * function (HTML lines 226-288). The only behavioural change is that issues
 * are returned instead of logged to the console.
 *
 * @param items - Array of DOA items to validate
 * @returns Array of validation issues (empty array = all clear)
 */
export function validateDOAData(items: ValidatableItem[] | null | undefined): DOAValidationIssue[] {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  const validTokenPattern = /^[IREXN]\d*\*?$/i;
  const issues: DOAValidationIssue[] = [];

  items.forEach((item) => {
    if (!item.approvalChain || !Array.isArray(item.approvalChain)) return;

    // Check 1: Chain exists but parses to empty (no valid tokens)
    if (item.approvalChain.length > 0) {
      const validTokens = item.approvalChain.filter(
        (a) => a.action && validTokenPattern.test(a.action.replace(/\s+/g, ''))
      );
      if (validTokens.length === 0) {
        issues.push({
          code: item.code,
          issue: 'chain_parses_empty',
          detail: `Chain has ${item.approvalChain.length} entries but no valid tokens`,
        });
      }
    }

    // Check 2: Unrecognised tokens
    item.approvalChain.forEach((approver) => {
      if (!approver.action) return;
      const normalized = approver.action.replace(/\s+/g, '').toUpperCase();
      if (!validTokenPattern.test(normalized) && normalized !== 'EX' && normalized !== 'EX*') {
        issues.push({
          code: item.code,
          issue: 'unrecognized_token',
          detail: `Role "${approver.role}" has unrecognized token "${approver.action}"`,
        });
      }
    });

    // Check 3: Duplicate (role, token) pairs
    const seen = new Set<string>();
    item.approvalChain.forEach((approver) => {
      const key = `${approver.role}:${approver.action}`;
      if (seen.has(key)) {
        issues.push({
          code: item.code,
          issue: 'duplicate_pair',
          detail: `Duplicate (role, token) pair: ${key}`,
        });
      }
      seen.add(key);
    });
  });

  return issues;
}
