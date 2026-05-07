export type UserRole = 'company_admin' | 'regulatory_authority' | 'marketplace_admin';

export interface AuthUser {
  user_id:      number;
  username:     string;
  role:         UserRole;
  company_id?:  number | null;
  authority_id?: number | null;
}

export interface RegisteredUser extends AuthUser {
  company_name?:   string | null;
  authority_name?: string | null;
  created_at:      string;
}

export interface Company {
  company_id:      number;
  name:            string;
  industry:        string;
  registration_no: string;
  wallet_balance?: number;
  created_at:      string;
}

export interface EnergyPlant {
  plant_id:    number;
  company_id:  number;
  name:        string;
  type:        'Solar' | 'Wind' | 'Hydro' | 'Biomass';
  capacity:    number;
  location:    string;
  status:      'Pending' | 'Approved' | 'Rejected';
  company_name?: string;
  created_at:  string;
}

export interface ProductionLog {
  log_id:               number;
  plant_id:             number;
  log_date:             string;
  energy_kwh:           number;
  verification_status:  'Pending' | 'Verified' | 'Rejected';
  plant_name?:          string;
  plant_type?:          string;
  company_name?:        string;
  company_id?:          number;
  submitted_at:         string;
}

export interface CarbonCredit {
  credit_id:      number;
  company_id:     number;
  log_id:         number;
  credits_issued: number;
  issued_date:    string;
  company_name?:  string;
  log_date?:      string;
  energy_kwh?:    number;
  plant_name?:    string;
  plant_type?:    string;
}

export interface CreditWallet {
  wallet_id:    number;
  company_id:   number;
  balance:      number;
  last_updated: string;
  company_name?: string;
}

export interface MarketListing {
  listing_id:       number;
  seller_id:        number;
  credit_id:        number;
  quantity:         number;
  credits_available?: number;
  original_credits?: number;
  price_per_credit: number;
  status:           'Active' | 'Sold' | 'Cancelled';
  seller_name?:     string;
  total_value?:     number;
  created_at:       string;
}

export interface Transaction {
  txn_id:           number;
  listing_id:       number;
  buyer_id:         number;
  seller_id?:       number;
  quantity:         number;
  total_amount:     number;
  txn_date:         string;
  buyer_name?:      string;
  seller_name?:     string;
  price_per_credit?: number;
  listing_status?:  'Active' | 'Sold' | 'Cancelled';
}

export interface RegulatoryAuthority {
  authority_id:  number;
  name:          string;
  jurisdiction:  string;
  contact_email: string;
}

export interface ComplianceReport {
  report_id:             number;
  company_id:            number;
  authority_id:          number;
  report_date:           string;
  total_credits_issued:  number;
  total_credits_traded:  number;
  status:                'Draft' | 'Submitted' | 'Audited';
  company_name?:         string;
  authority_name?:       string;
  created_at:            string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  error?:  string;
  code?:   string;
}

export interface DashboardKPIs {
  total_credits_issued: number;
  credits_issued?:      number;
  credits_count:        number;
  active_listings:      number;
  total_transactions:   number;
  marketplace_volume:   number;
  total_wallet_balance?: number;
  // Company-specific
  wallet_balance?: number;
  credits_bought?: number;
  credits_sold?:   number;
  buy_count?:      number;
  sell_count?:     number;
}
