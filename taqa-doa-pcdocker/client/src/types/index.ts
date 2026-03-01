// ---------------------------------------------------------------------------
// Shared TypeScript types for the DOA client
// ---------------------------------------------------------------------------

export interface Theme {
  name: string;
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  headerBg: string;
  tagBg: string;
  modalBg: string;
  successBg: string;
  successText: string;
  warningBg: string;
  warningText: string;
  dangerBg: string;
  dangerText: string;
  infoBg: string;
  infoText: string;
}

export interface Approver {
  role: string;
  action: string;
  label?: string;
}

export interface CalculatorInput {
  contractValue: number;
  capexValue: number;
  contractType: 'standard' | 'nonBinding' | 'directSales' | 'directSalesMarkup' | 'epf';
  selectedCountry: string;
  manualHighRisk: boolean;
  grossMargin: number;
  operatingProfitPercent: number;
  markupPercent: number;
}

export interface CalculatorResult {
  threshold: {
    id: string;
    type: string;
    name: string;
    code: string;
    notes: string | null;
  } | null;
  approvers: Approver[];
  excludedApprovers: Approver[];
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

export interface FormState {
  contractValue: string;
  capexValue: string;
  contractType: string;
  selectedCountry: string;
  manualHighRisk: boolean;
  grossMargin: string;
  operatingProfitSAR: string;
  operatingProfitPercent: string;
  markupPercent: string;
}

export interface BrowseItem {
  id: number;
  code: string;
  parent_code: string | null;
  title: string;
  description: string | null;
  comments: string | null;
  function_name: string | null;
  sort_order: number;
  approvalChain: { role: string; action: string; kind: string }[];
}

export interface BrowseTreeNodeData {
  id: number;
  code: string;
  title: string;
  description: string;
  comments: string;
  function: string;
  approvalChain: { role: string; action: string }[];
  isRoot: boolean;
  children: BrowseTreeNodeData[];
}

export interface GlossaryEntry {
  code: string;
  name: string;
  description: string;
}

export interface Country {
  name: string;
  risk_level: 'safe' | 'special' | 'high_risk';
}

export interface Settings {
  countXWithoutNumber: boolean;
  safeCountries: string[];
  specialCountries: string[];
  allCountries: Country[];
}
