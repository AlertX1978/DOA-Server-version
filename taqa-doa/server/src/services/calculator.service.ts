import { query } from '../config/database';
import { normalizeAndSortApprovers } from '../utils/normalizeApprovers';

// ---------------------------------------------------------------------------
// Input / Output interfaces
// ---------------------------------------------------------------------------

export interface CalculatorInput {
  contractValue: number;
  capexValue: number;
  contractType: 'standard' | 'nonBinding' | 'directSales' | 'directSalesMarkup' | 'epf';
  selectedCountry: string;
  manualHighRisk: boolean;
  grossMargin: number;          // default 100
  operatingProfitPercent: number; // default 45
  markupPercent: number;         // default 0
}

export interface ApproverEntry {
  role: string;
  action: string;
  label: string;
}

interface ThresholdRow {
  id: number;
  threshold_id: string;
  type: string;
  name: string;
  code: string;
  min_value: number | null;
  max_value: number | null;
  min_capex: number | null;
  max_capex: number | null;
  min_markup: number | null;
  max_markup: number | null;
  max_gross_margin: number | null;
  condition_text: string | null;
  notes: string | null;
  sort_order: number;
}

interface ThresholdApproverRow {
  threshold_id: number;
  role_name: string;
  action: string;
  label: string | null;
  sort_order: number;
}

interface CountryRow {
  id: number;
  name: string;
  risk_level: string;
}

interface CachedThreshold {
  id: string;
  type: string;
  name: string;
  code: string;
  notes: string | null;
  approvers: ApproverEntry[];
}

export interface CalculatorResult {
  threshold: {
    id: string;
    type: string;
    name: string;
    code: string;
    notes: string | null;
  } | null;
  approvers: ApproverEntry[];
  excludedApprovers: ApproverEntry[];
  flags: {
    isHighRisk: boolean;
    isSpecialCountry: boolean;
    isCapexExceeds10Percent: boolean;
    isLowOperatingProfit: boolean;
    capexPercentage: number;
    wasEscalated: boolean;
    escalationReason: string | null;
  };
}

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

let cachedThresholds: Map<string, CachedThreshold> | null = null;
let cachedCountries: Map<string, CountryRow> | null = null;

/**
 * Load all thresholds from the database and cache them in memory.
 * Each threshold is keyed by its `threshold_id` (e.g. 'over-200m', 'nb-over-50m').
 */
async function loadThresholds(): Promise<Map<string, CachedThreshold>> {
  if (cachedThresholds) return cachedThresholds;

  const thresholdResult = await query<ThresholdRow>(
    `SELECT id, threshold_id, type, name, code, min_value, max_value,
            min_capex, max_capex, min_markup, max_markup, max_gross_margin,
            condition_text, notes, sort_order
     FROM thresholds
     ORDER BY sort_order`
  );

  const approverResult = await query<ThresholdApproverRow>(
    `SELECT ta.threshold_id, r.name AS role_name, ta.action, ta.label, ta.sort_order
     FROM threshold_approvers ta
     JOIN roles r ON r.id = ta.role_id
     ORDER BY ta.threshold_id, ta.sort_order`
  );

  // Group approvers by threshold internal PK id
  const approversByThreshold = new Map<number, ApproverEntry[]>();
  for (const row of approverResult.rows) {
    const list = approversByThreshold.get(row.threshold_id) || [];
    list.push({
      role: row.role_name,
      action: row.action,
      label: row.label || 'Approve',
    });
    approversByThreshold.set(row.threshold_id, list);
  }

  const map = new Map<string, CachedThreshold>();
  for (const t of thresholdResult.rows) {
    map.set(t.threshold_id, {
      id: t.threshold_id,
      type: t.type,
      name: t.name,
      code: t.code,
      notes: t.notes,
      approvers: approversByThreshold.get(t.id) || [],
    });
  }

  cachedThresholds = map;
  return cachedThresholds;
}

/**
 * Load all countries from the database and cache them.
 */
async function loadCountries(): Promise<Map<string, CountryRow>> {
  if (cachedCountries) return cachedCountries;

  const result = await query<CountryRow>(
    `SELECT id, name, risk_level FROM countries ORDER BY name`
  );

  const map = new Map<string, CountryRow>();
  for (const row of result.rows) {
    map.set(row.name, row);
  }

  cachedCountries = map;
  return cachedCountries;
}

/**
 * Clear the in-memory cache (useful if thresholds/countries are updated).
 */
export function clearCalculatorCache(): void {
  cachedThresholds = null;
  cachedCountries = null;
}

// ---------------------------------------------------------------------------
// Helper: get a threshold by ID
// ---------------------------------------------------------------------------

function getThreshold(thresholds: Map<string, CachedThreshold>, id: string): CachedThreshold | undefined {
  return thresholds.get(id);
}

// ---------------------------------------------------------------------------
// Main evaluation function
// ---------------------------------------------------------------------------

/**
 * Evaluate the approval requirements for a given contract.
 *
 * This is an exact port of the client-side calculator logic from
 * doa-reader-v4_0.1w.html lines 1212-1431.
 */
export async function evaluateApproval(input: CalculatorInput): Promise<CalculatorResult> {
  const thresholds = await loadThresholds();
  const countries = await loadCountries();

  const cv = input.contractValue || 0;
  const capex = input.capexValue || 0;
  const gm = input.grossMargin ?? 100;
  const opProfit = input.operatingProfitPercent ?? 45;
  const markup = input.markupPercent ?? 0;
  const contractType = input.contractType || 'standard';

  // Determine country risk
  // In the original app: isHighRisk = !safeCountries.includes(country)
  // In our DB: 'safe' and 'special' countries are NOT high-risk; only 'high_risk' countries are
  // Special countries overlap with safe in the original (e.g., Egypt is both safe and special)
  // but in our DB they are 'special' which is NOT high_risk
  const countryData = countries.get(input.selectedCountry);
  const isHighRisk = input.manualHighRisk || (!!countryData && countryData.risk_level === 'high_risk');
  const isSpecialCountry = !!countryData && countryData.risk_level === 'special';

  // Calculate CAPEX percentage and flags
  const capexPercentage = cv > 0 && capex > 0 ? (capex / cv) * 100 : 0;
  const isCapexExceeds10Percent = capexPercentage > 10;
  const isLowOperatingProfit = opProfit <= 10;

  // Step 1: If contract value <= 0, return null
  if (cv <= 0) {
    return {
      threshold: null,
      approvers: [],
      excludedApprovers: [],
      flags: {
        isHighRisk,
        isSpecialCountry,
        isCapexExceeds10Percent,
        isLowOperatingProfit,
        capexPercentage,
        wasEscalated: false,
        escalationReason: null,
      },
    };
  }

  let matchedThreshold: CachedThreshold | undefined;
  let wasEscalated = false;
  let escalationReason: string | null = null;
  let customApprovers: ApproverEntry[] | null = null;
  let customThreshold: { id: string; type: string; name: string; code: string; notes: string | null } | null = null;

  // -------------------------------------------------------------------------
  // Step 2: Non-binding RFQs/RFPs/Quotes -- NOT affected by country risk
  // -------------------------------------------------------------------------
  if (contractType === 'nonBinding') {
    if (cv > 50000000) {
      matchedThreshold = getThreshold(thresholds, 'nb-over-50m');
    } else if (cv > 18750000) {
      matchedThreshold = getThreshold(thresholds, 'nb-18m-50m');
    } else {
      matchedThreshold = getThreshold(thresholds, 'nb-under-18m');
    }
  }

  // -------------------------------------------------------------------------
  // Step 3: High Risk Market overrides everything (for committed work only)
  // -------------------------------------------------------------------------
  else if (isHighRisk) {
    matchedThreshold = getThreshold(thresholds, 'high-risk');
  }

  // -------------------------------------------------------------------------
  // Step 4: EPF
  // -------------------------------------------------------------------------
  else if (contractType === 'epf') {
    if (cv <= 50000000 && capex <= 10000000) {
      matchedThreshold = getThreshold(thresholds, 'epf-50m');
    } else if (capex > 10000000) {
      matchedThreshold = getThreshold(thresholds, 'capex-over-10m');
    } else if (cv > 50000000 && cv <= 200000000) {
      matchedThreshold = getThreshold(thresholds, '50m-200m');
    } else if (cv > 200000000) {
      matchedThreshold = getThreshold(thresholds, 'over-200m');
    }
  }

  // -------------------------------------------------------------------------
  // Step 5: Direct Sales - Markup (Service Lines like Chemicals)
  // -------------------------------------------------------------------------
  else if (contractType === 'directSalesMarkup') {
    // ESCALATION CHECK 1: TCV > 200M -> BOD (4.2.2.1)
    if (cv > 200000000) {
      matchedThreshold = getThreshold(thresholds, 'over-200m');
    }
    // ESCALATION CHECK 2: Capex > 10M -> ExCom (4.2.2.3)
    else if (capex > 10000000) {
      matchedThreshold = getThreshold(thresholds, 'capex-over-10m');
    }
    // ESCALATION CHECK 3: TCV > 50M -> ExCom (4.2.2.2)
    else if (cv > 50000000) {
      matchedThreshold = getThreshold(thresholds, '50m-200m');
    }
    // ESCALATION CHECK 4: Capex 5-10M -> CEO X4 level (4.2.3.1.1)
    else if (capex > 5000000) {
      matchedThreshold = getThreshold(thresholds, '30m-50m');
    }
    // Within normal bounds - apply markup-based approval (4.2.3.2.4.x)
    else if (markup < 25) {
      matchedThreshold = getThreshold(thresholds, 'ds-markup-low');
    } else {
      matchedThreshold = getThreshold(thresholds, 'ds-markup-high');
    }
  }

  // -------------------------------------------------------------------------
  // Step 6: Direct Sales
  // -------------------------------------------------------------------------
  else if (contractType === 'directSales') {
    // If TCV > 50M, route to commercial escalation (4.2.2.*) instead of 4.2.3.2.*
    if (cv > 50000000) {
      if (cv > 200000000) {
        matchedThreshold = getThreshold(thresholds, 'over-200m');
      } else if (capex > 10000000) {
        matchedThreshold = getThreshold(thresholds, 'capex-over-10m');
      } else {
        matchedThreshold = getThreshold(thresholds, '50m-200m');
      }
    } else {
      // TCV <= 50M - apply 4.2.3.2.1/2/3/4/5 rules
      if (gm < 40) {
        matchedThreshold = getThreshold(thresholds, 'ds-low-margin');
      } else if (cv > 30000000) {
        matchedThreshold = getThreshold(thresholds, 'ds-30m-50m');
      } else if (cv > 18750000) {
        matchedThreshold = getThreshold(thresholds, 'ds-18m-30m');
      } else if (cv > 1875000) {
        matchedThreshold = getThreshold(thresholds, 'ds-1m-18m');
      } else {
        matchedThreshold = getThreshold(thresholds, 'ds-under-1m');
      }
    }
  }

  // -------------------------------------------------------------------------
  // Step 7: Standard Contracts
  // -------------------------------------------------------------------------
  else {
    // BAND 1: TCV > 200M -> BOD (4.2.2.1) - regardless of any other factor
    if (cv > 200000000) {
      matchedThreshold = getThreshold(thresholds, 'over-200m');
    }
    // BAND 2: TCV 50M - 200M -> ExCom (4.2.2.2)
    else if (cv > 50000000) {
      if (capex > 10000000) {
        matchedThreshold = getThreshold(thresholds, 'capex-over-10m');
      } else {
        matchedThreshold = getThreshold(thresholds, '50m-200m');
      }
    }
    // BAND 3: TCV 30M - 50M -> CEO X4 (4.2.3.1.1)
    else if (cv > 30000000) {
      if (capex > 10000000) {
        matchedThreshold = getThreshold(thresholds, 'capex-over-10m');
      } else {
        matchedThreshold = getThreshold(thresholds, '30m-50m');
      }
    }
    // BAND 4: TCV 5M - 30M -> COO level (4.2.3.1.2)
    else if (cv > 5000000) {
      if (capex > 10000000) {
        matchedThreshold = getThreshold(thresholds, 'capex-over-10m');
      } else if (capex > 5000000) {
        matchedThreshold = getThreshold(thresholds, '30m-50m');
      } else {
        matchedThreshold = getThreshold(thresholds, '5m-30m');
      }
    }
    // BAND 5: TCV <= 5M (4.2.3.1.3)
    else {
      // First check absolute Capex escalations
      if (capex > 10000000) {
        matchedThreshold = getThreshold(thresholds, 'capex-over-10m');
      } else if (capex > 5000000) {
        matchedThreshold = getThreshold(thresholds, '30m-50m');
      } else {
        // Percentage-based escalations
        const capexPercent = cv > 0 ? (capex / cv) * 100 : 0;

        // Escalated approval chain - 4.2.3.1.2 level (COO)
        const escalatedApprovers: ApproverEntry[] = [
          { role: 'Marketing & Commercial', action: 'X1', label: 'Approve' },
          { role: 'CFO', action: 'X2', label: 'Approve' },
          { role: 'COO', action: 'X3', label: 'Approve' },
        ];

        if (capexPercent > 10 && opProfit <= 10) {
          wasEscalated = true;
          escalationReason = 'Capex exceeds 10% of TCV AND Operating Profit <= 10%';
          customApprovers = escalatedApprovers;
          customThreshold = {
            id: '5m-30m-escalated',
            type: 'commercial',
            name: '<= SAR 5M (Escalated - Multiple Factors)',
            code: '4.2.3.1.2',
            notes: 'Capex exceeds 10% of TCV AND Operating Profit <= 10%. Per 4.2.3.1.3 requirements (fully loaded Operating Profit with net income > 10%), approval escalated to 4.2.3.1.2 level (COO).',
          };
        } else if (capexPercent > 10) {
          wasEscalated = true;
          escalationReason = 'Capex exceeds 10% of TCV';
          customApprovers = escalatedApprovers;
          customThreshold = {
            id: '5m-30m-escalated',
            type: 'commercial',
            name: '<= SAR 5M but Capex > 10% TCV (Escalated)',
            code: '4.2.3.1.2',
            notes: 'Capex exceeds 10% of TCV. Per 4.2.3.1.3 requirements, approval escalated to 4.2.3.1.2 level (COO).',
          };
        } else if (opProfit <= 10) {
          wasEscalated = true;
          escalationReason = 'Operating Profit <= 10%';
          customApprovers = escalatedApprovers;
          customThreshold = {
            id: '5m-30m-escalated',
            type: 'commercial',
            name: '<= SAR 5M but Operating Profit <= 10% (Escalated)',
            code: '4.2.3.1.2',
            notes: 'Operating Profit is <= 10%. Per 4.2.3.1.3 requirements (fully loaded Operating Profit with net income > 10%), approval escalated to 4.2.3.1.2 level (COO).',
          };
        } else {
          matchedThreshold = getThreshold(thresholds, 'under-5m');
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Build the base result
  // -------------------------------------------------------------------------
  let resultThreshold: { id: string; type: string; name: string; code: string; notes: string | null } | null = null;
  let resultApprovers: ApproverEntry[] = [];

  if (customThreshold && customApprovers) {
    resultThreshold = customThreshold;
    resultApprovers = [...customApprovers];
  } else if (matchedThreshold) {
    resultThreshold = {
      id: matchedThreshold.id,
      type: matchedThreshold.type,
      name: matchedThreshold.name,
      code: matchedThreshold.code,
      notes: matchedThreshold.notes,
    };
    resultApprovers = [...matchedThreshold.approvers];
  }

  // -------------------------------------------------------------------------
  // Step 8: Special Country escalation (post-calculation)
  // -------------------------------------------------------------------------
  if (resultThreshold && isSpecialCountry && contractType !== 'nonBinding') {
    const highLevelApprovers = ['BOD', 'ExCom', 'General Assembly'];
    const hasHighLevelApproval = resultApprovers.some(
      (a) => highLevelApprovers.includes(a.role) && a.action.startsWith('X')
    );

    if (!hasHighLevelApproval) {
      const hasCEONumberedApproval = resultApprovers.some(
        (a) => a.role === 'CEO' && /^X\d+/.test(a.action)
      );

      if (!hasCEONumberedApproval) {
        // Escalate to CEO level
        wasEscalated = true;
        escalationReason = `Special Country: ${input.selectedCountry} requires CEO approval`;
        resultThreshold = {
          ...resultThreshold,
          id: 'special-country-ceo',
          name: `${resultThreshold.name} (Special Country - CEO Required)`,
          notes: `${resultThreshold.notes || ''} SPECIAL COUNTRY: ${input.selectedCountry} requires CEO approval regardless of contract value per DOA special country designation.`,
        };
        resultApprovers = [
          { role: 'Marketing & Commercial', action: 'X1', label: 'Approve' },
          { role: 'CFO', action: 'X2', label: 'Approve' },
          { role: 'COO', action: 'X3', label: 'Approve' },
          { role: 'CEO', action: 'X4', label: 'Approve' },
        ];
      }
    }
  }

  // -------------------------------------------------------------------------
  // Step 9: Apply normalizeAndSortApprovers and filter
  // -------------------------------------------------------------------------
  const sortedApprovers = normalizeAndSortApprovers(resultApprovers);

  // Load the count_x_without_number setting from the database
  const settingResult = await query<{ value: unknown }>(
    `SELECT value FROM app_settings WHERE key = $1`,
    ['count_x_without_number']
  );
  const countXWithoutNumber = settingResult.rows.length > 0
    ? (settingResult.rows[0].value as { enabled?: boolean })?.enabled ?? false
    : false;

  let finalApprovers: ApproverEntry[];
  let excludedApprovers: ApproverEntry[];

  if (!countXWithoutNumber) {
    finalApprovers = sortedApprovers.filter((a) => a.action !== 'X');
    excludedApprovers = sortedApprovers.filter((a) => a.action === 'X');
  } else {
    finalApprovers = sortedApprovers;
    excludedApprovers = [];
  }

  return {
    threshold: resultThreshold,
    approvers: finalApprovers,
    excludedApprovers,
    flags: {
      isHighRisk,
      isSpecialCountry,
      isCapexExceeds10Percent,
      isLowOperatingProfit,
      capexPercentage,
      wasEscalated,
      escalationReason,
    },
  };
}

// ---------------------------------------------------------------------------
// Auxiliary queries (used by controller for GET endpoints)
// ---------------------------------------------------------------------------

/**
 * Get all thresholds grouped by type.
 */
export async function getAllThresholds(): Promise<Record<string, CachedThreshold[]>> {
  const thresholds = await loadThresholds();
  const grouped: Record<string, CachedThreshold[]> = {};

  for (const t of thresholds.values()) {
    if (!grouped[t.type]) {
      grouped[t.type] = [];
    }
    grouped[t.type].push(t);
  }

  return grouped;
}

/**
 * Get thresholds of a specific type.
 */
export async function getThresholdsByType(type: string): Promise<CachedThreshold[]> {
  const thresholds = await loadThresholds();
  const result: CachedThreshold[] = [];

  for (const t of thresholds.values()) {
    if (t.type === type) {
      result.push(t);
    }
  }

  return result;
}

/**
 * Get all countries with their risk levels.
 */
export async function getAllCountries(): Promise<CountryRow[]> {
  const countries = await loadCountries();
  return Array.from(countries.values());
}
