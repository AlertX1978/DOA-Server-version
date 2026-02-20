// ---------------------------------------------------------------------------
// DOA domain types
// ---------------------------------------------------------------------------

/** Top-level category in the DOA matrix (e.g. "Corporate Organisation & Structure") */
export interface Category {
  id: number;
  name: string;
  description?: string;
}

/** A role that can participate in an approval chain */
export interface Role {
  id: number;
  name: string;
  display_order: number;
}

/** Risk level classification for a country */
export type RiskLevel = 'safe' | 'special' | 'high_risk';

/** Country with associated risk level */
export interface Country {
  id: number;
  name: string;
  risk_level: RiskLevel;
}

// ---------------------------------------------------------------------------
// DOA items (the core approval matrix rows)
// ---------------------------------------------------------------------------

/** An individual approver entry within a DOA item */
export interface DOAItemApprover {
  role: string;
  action: string;
  label?: string;
  kind?: string;
}

/** A single row in the DOA matrix */
export interface DOAItem {
  id?: number;
  code: string;
  description: string;
  applies_to: string;
  category_id: number;
  business_owner: string;
  delegable?: string;
  interpretation?: string;
  approvers: Record<string, string>;
  approvalChain?: DOAItemApprover[];
}

// ---------------------------------------------------------------------------
// Thresholds (value-based approval tiers)
// ---------------------------------------------------------------------------

export type ThresholdType =
  | 'contract_value'
  | 'capex'
  | 'direct_sales'
  | 'epf'
  | 'non_binding_rfq'
  | 'high_risk_market';

export interface ThresholdApprover {
  role: string;
  action: string;
  label?: string;
  kind?: string;
}

export interface Threshold {
  id: string;
  name: string;
  code: string;
  threshold_type: ThresholdType;
  min_value?: number;
  max_value?: number;
  condition: string;
  approvers: ThresholdApprover[];
  notes?: string;
}

// ---------------------------------------------------------------------------
// Browse items (flattened view for the Browse tab)
// ---------------------------------------------------------------------------

export interface BrowseItemApprover {
  role: string;
  action: string;
}

export interface BrowseItem {
  code: string;
  description: string;
  applies_to: string;
  category_id: number;
  category_name: string;
  business_owner: string;
  delegable?: string;
  interpretation?: string;
  approvalChain: BrowseItemApprover[];
}

// ---------------------------------------------------------------------------
// Application settings
// ---------------------------------------------------------------------------

export interface AppSetting {
  id: number;
  key: string;
  value: unknown;
  updated_at: string;
  updated_by?: string;
}

// ---------------------------------------------------------------------------
// Users & access
// ---------------------------------------------------------------------------

export type UserRole = 'admin' | 'viewer';

export interface User {
  id: number;
  email: string;
  display_name: string;
  role: UserRole;
  azure_oid?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  id: number;
  user_id: number;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------

export interface GlossaryEntry {
  id: number;
  term: string;
  abbreviation?: string;
  definition: string;
  category?: string;
}

// ---------------------------------------------------------------------------
// Action token (result of parseActionToken)
// ---------------------------------------------------------------------------

export interface ActionToken {
  /** Single-letter action group: I, R, E, X, N, or Z (fallback) */
  group: string;
  /** Numeric level within the group (100 = no level specified, 999 = fallback) */
  level: number;
  /** Original string after normalisation */
  original: string;
  /** Whether the token had a trailing asterisk (conditional) */
  hasStar: boolean;
}

// ---------------------------------------------------------------------------
// Calculator
// ---------------------------------------------------------------------------

export type ContractType = 'standard' | 'nonBinding' | 'directSales' | 'directSalesMarkup' | 'epf';

export interface CalculatorInput {
  contractValue: number;
  capexValue: number;
  contractType: ContractType;
  selectedCountry: string;
  manualHighRisk: boolean;
  grossMargin: number;              // default 100
  operatingProfitPercent: number;   // default 45
  markupPercent: number;            // default 0
}

export interface ApproverEntry {
  role: string;
  action: string;
  label: string;
}

export interface CalculatorFlags {
  isHighRisk: boolean;
  isSpecialCountry: boolean;
  isCapexExceeds10Percent: boolean;
  isLowOperatingProfit: boolean;
  capexPercentage: number;
  wasEscalated: boolean;
  escalationReason: string | null;
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
  flags: CalculatorFlags;
}
