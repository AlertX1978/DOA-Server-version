// ---------------------------------------------------------------------------
// TAQA Brand Colors
// ---------------------------------------------------------------------------

export const COLORS = {
  primary: '#006B6B',
  primaryLight: '#008585',
  primaryDark: '#005454',
  accent: '#E86A2C',
  accentLight: '#FF8243',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#0EA5E9',
} as const;

// ---------------------------------------------------------------------------
// Approval chain ordering
// ---------------------------------------------------------------------------

/**
 * Sort order: I (Initiate) -> R (Review) -> E (Endorse) -> X (Approve) -> N (Notify - always last)
 */
export const GROUP_PRIORITY: Record<string, number> = {
  I: 0,
  R: 1,
  E: 2,
  X: 3,
  N: 4,
};

// ---------------------------------------------------------------------------
// Country lists
// ---------------------------------------------------------------------------

/** Countries where TAQA operates -- default "safe" list */
export const DEFAULT_SAFE_COUNTRIES: string[] = [
  'Bahrain',
  'Bangladesh',
  'Egypt',
  'India',
  'Iraq - Kurdistan',
  'Iraq - South',
  'Kuwait',
  'Libya',
  'Oman',
  'Pakistan',
  'Qatar',
  'Saudi Arabia',
  'Turkey',
  'United Arab Emirates',
];

/** Countries with special regulatory / compliance considerations */
export const DEFAULT_SPECIAL_COUNTRIES: string[] = [
  'Algeria',
  'Egypt',
  'Iraq - South',
  'Libya',
  'Pakistan',
];

/** Full list of countries available for selection (~110 entries) */
export const ALL_COUNTRIES: string[] = [
  'Afghanistan', 'Albania', 'Algeria', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Bolivia',
  'Bosnia and Herzegovina', 'Brazil', 'Brunei', 'Bulgaria', 'Cameroon', 'Canada',
  'Chad', 'Chile', 'China', 'Colombia', 'Congo', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Ecuador', 'Egypt', 'Equatorial Guinea', 'Estonia',
  'Ethiopia', 'Finland', 'France', 'Gabon', 'Georgia', 'Germany', 'Ghana', 'Greece',
  'Hungary', 'India', 'Indonesia', 'Iran', 'Iraq - Kurdistan', 'Iraq - South', 'Ireland',
  'Israel', 'Italy', 'Ivory Coast', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Kyrgyzstan', 'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Luxembourg', 'Malaysia',
  'Mali', 'Mauritania', 'Mexico', 'Mongolia', 'Morocco', 'Mozambique', 'Myanmar',
  'Netherlands', 'New Zealand', 'Niger', 'Nigeria', 'North Korea', 'Norway', 'Oman',
  'Pakistan', 'Panama', 'Papua New Guinea', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Saudi Arabia', 'Senegal', 'Serbia', 'Singapore',
  'Slovakia', 'Slovenia', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

// ---------------------------------------------------------------------------
// Threshold types
// ---------------------------------------------------------------------------

export const THRESHOLD_TYPES = [
  'contract_value',
  'capex',
  'direct_sales',
  'epf',
  'non_binding_rfq',
  'high_risk_market',
] as const;

// ---------------------------------------------------------------------------
// DOA category map (id -> name)
// ---------------------------------------------------------------------------

export const DOA_CATEGORIES: Record<number, string> = {
  1: 'Corporate Organisation & Structure',
  2: 'Board of Directors',
  3: 'Strategies, Plans & Policies',
  4: 'Commercial & Marketing',
  5: 'Human Resources',
  6: 'Treasury',
  7: 'Finance & Accounting',
  8: 'Tax',
  9: 'Supply Chain',
  10: 'QHSE',
  11: 'Legal & Compliance',
  12: 'Technology',
  13: 'Risk & Insurance',
  14: 'Internal Audit',
};

// ---------------------------------------------------------------------------
// DOA roles (display order)
// ---------------------------------------------------------------------------

export const DOA_ROLES: string[] = [
  'General Assembly', 'BOD', 'ExCom', 'NRC', 'Audit Committee', 'Risk & Sustainability',
  'CEO', 'COO', 'CFO', 'CTO', 'EPF',
  'Strategy & Corp Dev', 'Corporate Services', 'Chief of Staff', 'General Counsel',
  'Marketing & Commercial', 'QHSE', 'Internal Audit',
  'VP HR', 'VP GRC', 'VP Supply Chain', 'Group Financial Controller',
  'FP&A Director', 'Tax Director', 'Treasury Director',
  'Commercial Director', 'VP Geographies', 'Head of PSL',
  'Country Manager', 'Country Finance Lead', 'PSL/EPF Director',
  'Procurement & Sourcing Director', 'Supply Chain Ops Director',
  'HR Business Partner', 'Support Dept Head', 'Manufacturing/Eng Manager',
];
