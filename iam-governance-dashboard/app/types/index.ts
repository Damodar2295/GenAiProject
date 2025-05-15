export interface ServiceAccount {
  rcd_added: string;
  sa_active: boolean;
  sa_isprivileged: boolean;
  sa_platform: string;
  sa_environment: string;
  sa_requesttype: string;
  sa_password_expiration_interval: string;
  sa_primary_use: string;
  sa_business_justification: string;
  sa_isisradocumented: boolean;
  sa_form_name: string;
  sa_completion_date: string;
  platformdefined_1_label: string;
  platformdefined_1_value: string;
  Database_Brand?: string;
  Database_Name?: string;
  Server?: string;
  other_use?: string;
  load_date?: string;
  [key: string]: any;
}

export interface FilterState {
  platform?: string;
  environment?: string;
  requestType?: string;
  privilegeStatus?: string;
  dateRange?: [Date, Date];
  activeStatus?: 'Active' | 'Inactive';
}

export interface Metrics {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  privilegedAccounts: number;
} 