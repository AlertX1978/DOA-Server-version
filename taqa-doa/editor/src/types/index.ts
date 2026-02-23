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

export interface BrowseItem {
  id: number;
  code: string;
  parent_code: string | null;
  title: string;
  description: string | null;
  comments: string | null;
  function_name: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  approvalChain: ApproverEntry[];
}

export interface ApproverEntry {
  id?: number;
  role_id: number;
  role: string;
  action: string;
  kind: string;
  sort_order: number;
}

export interface BrowseTreeNodeData {
  id: number;
  code: string;
  title: string;
  description: string;
  comments: string;
  function: string;
  approvalChain: ApproverEntry[];
  isRoot: boolean;
  children: BrowseTreeNodeData[];
}

export interface DOAItem {
  id: number;
  code: string;
  description: string | null;
  applies_to: string | null;
  category_id: number | null;
  category_name: string | null;
  business_owner: string | null;
  delegable: string | null;
  interpretation: string | null;
  created_at?: string;
  updated_at?: string;
  approvers: DOAItemApprover[];
}

export interface DOAItemApprover {
  id?: number;
  role_id: number;
  role: string;
  action: string;
  sort_order: number;
}

export interface Category {
  id: number;
  name: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Country {
  id: number;
  name: string;
  risk_level: 'safe' | 'special' | 'high_risk';
  created_at?: string;
  updated_at?: string;
}

export interface Threshold {
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
  approvers: ThresholdApprover[];
}

export interface ThresholdApprover {
  role: string;
  role_id?: number;
  action: string;
  label: string;
  sort_order: number;
}

export interface GlossaryEntry {
  id: number;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface AuditLogEntry {
  id: number;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  created_at: string;
  user_email?: string;
  user_display_name?: string;
}

export interface AppSetting {
  id: number;
  key: string;
  value: unknown;
  updated_at?: string;
}
