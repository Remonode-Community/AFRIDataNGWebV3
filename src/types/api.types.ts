/**
 * API Response and Request Types
 * Based on AFRIDataNG Backend API Specification
 */

// ============= Generic Response Wrapper =============
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error_code?: string;
  errors?: Record<string, string[]>;
  // VTU API specific fields
  content?: T;
  response_description?: string;
}

export interface PaginationMeta {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

// ============= User & Auth Types =============
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  profile_complete_status: boolean;
  created_at: string;
  roles: string[];
  permissions: string[];
  balance: number;
  formatted_balance: string;
}

export interface Role {
  id: string;
  name: 'customer' | 'agent' | 'admin';
  permissions?: string[];
}

export interface AuthResponse {
  token?: string;  // Made optional in case backend uses accessToken
  accessToken?: string;  // Some backends use this instead of token
  user: User;
  login_channel: string;
  pin_status?: {
    has_pin: boolean;
    is_locked: boolean;
    created_at: string | null;
    last_used_at: string | null;
    failed_attempts: string | number;
  };
  location?: {
    has_location: boolean;
  };
  email_verified: boolean;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  referral_code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyPhoneRequest {
  phone: string;
  code: string;
}

export interface RequestPhoneVerificationRequest {
  phone: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyPasswordResetOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  reset_token: string;
  password: string;
  password_confirmation: string;
}


// ============= User Profile & Settings =============
export interface UserPreferences {
  user_id: string;
  language: 'en' | 'fr' | 'es';
  currency: 'NGN' | 'USD' | 'EUR';
  timezone: string;
  notifications_email: boolean;
  notifications_sms: boolean;
  notifications_app: boolean;
  marketing_emails: boolean;
  two_factor_enabled: boolean;
  theme: 'light' | 'dark';
  show_balance_on_dashboard: boolean;
  show_transaction_history: boolean;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  profile_photo?: File;
  bio?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface UpdatePreferencesRequest {
  language?: 'en' | 'fr' | 'es';
  currency?: 'NGN' | 'USD' | 'EUR';
  timezone?: string;
  notifications_email?: boolean;
  notifications_sms?: boolean;
  notifications_app?: boolean;
  marketing_emails?: boolean;
  theme?: 'light' | 'dark';
  show_balance_on_dashboard?: boolean;
  show_transaction_history?: boolean;
}

// ============= Transaction Types =============
export type TransactionType = 'airtime' | 'data' | 'bills' | 'wallet_topup' | 'wallet_withdrawal';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type PurchasePaymentMethod = 'wallet' | 'card' | 'mobile_money' | 'bank_transfer';

export interface TransactionMetadata {
  plan_name?: string;
  bundle_size?: string;
  validity_period?: string;
  recipient_name?: string;
  bill_type?: string;
  customer_name?: string;
  due_date?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  provider: string;
  recipient_phone?: string | null;
  recipient_account_number?: string | null;
  amount: number;
  currency: string;
  fee: number;
  net_amount: number;
  status: TransactionStatus;
  reference: string;
  description: string;
  metadata?: TransactionMetadata;
  payment_method?: PurchasePaymentMethod;
  payment_reference?: string | null;
  error_message?: string | null;
  initiated_at: string;
  completed_at?: string | null;
  receipt_url?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
  };
}

export interface TransactionFilters {
  page?: number;
  per_page?: number;
  status?: string;
  type?: string;
  provider?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PurchaseAirtimeRequest {
  provider: string;
  phone_number: string;
  amount: number;
  payment_method: PurchasePaymentMethod;
  recipient_name?: string;
}

export interface PurchaseDataRequest {
  provider: string;
  phone_number: string;
  plan_id: string;
  amount: number;
  payment_method: PurchasePaymentMethod;
}

export interface PayBillsRequest {
  bill_type: 'electricity' | 'water' | 'internet' | 'insurance';
  provider: string;
  account_number: string;
  amount: number;
  payment_method: PurchasePaymentMethod;
  is_estimate?: boolean;
}

export interface ReportTransactionIssueRequest {
  issue_type: 'not_received' | 'duplicate' | 'wrong_amount' | 'technical_error';
  description: string;
  attachment?: File;
}

// ============= Provider Types =============
export interface Provider {
  id: string;
  name: string;
  code: string;
  type: string;
  logo_url: string;
  supported_services: string[];
  country: string;
  description: string;
  is_active: boolean;
}

export interface Plan {
  id: string;
  name: string;
  type: 'airtime' | 'data';
  amount: number;
  currency: string;
  description: string;
  metadata?: {
    bundle_size?: string;
    validity?: string;
    speed?: string;
  };
}

export interface VerifyBillAccountRequest {
  account_number: string;
  bill_type: 'electricity' | 'water' | 'internet' | 'insurance';
}

export interface BillAccount {
  account_number: string;
  customer_name?: string | null;
  outstanding_amount: number;
  due_date?: string | null;
  is_valid: boolean;
}

// ============= Wallet Types =============
export interface Wallet {
  user_id: string;
  balance: number;
  currency: string;
  pending_amount: number;
  locked_amount: number;
  available_balance: number;
  total_topups: number;
  total_spent: number;
  last_transaction?: {
    id: string;
    type: string;
    amount: number;
    created_at: string;
  };
}

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'debit' | 'refund';
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string;
  description: string;
  created_at: string;
}

// ============= Payment Types =============
export interface InitializePaymentRequest {
  amount: number;
  currency?: 'NGN' | 'USD';
  payment_method: 'card' | 'mobile_money' | 'bank_transfer';
  description?: string;
  email?: string;
  metadata?: Record<string, any>;
}

export interface PaymentInitializeResponse {
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    reference: string;
    payment_method: string;
    created_at: string;
  };
  authorization_url: string;
  access_code?: string;
  public_key?: string;
}

export interface VerifyPaymentRequest {
  reference: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  payment_method: string;
  gateway_response?: string;
  verified_at?: string | null;
}

export type PaymentMethodType = 'card' | 'mobile_money' | 'bank_account';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  display_name: string;
  is_default: boolean;
  is_active: boolean;
  metadata?: {
    last_four?: string;
    expiry?: string;
    issuer?: string;
  };
  created_at: string;
}

export interface AddPaymentMethodRequest {
  type: PaymentMethodType;
  card_number?: string;
  card_name?: string;
  expiry?: string;
  cvv?: string;
  phone_number?: string;
  account_number?: string;
  account_name?: string;
  bank_code?: string;
  set_as_default?: boolean;
}

// ============= Admin Types =============
export interface AdminDashboardMetrics {
  total_users: number;
  active_users_today: number;
  total_agents: number;
  total_transactions: number;
  today_transaction_count: number;
  today_revenue: number;
  monthly_revenue: number;
  total_revenue: number;
  failed_transactions_count: number;
  pending_transactions_count: number;
}

export interface TrendData {
  date: string;
  count?: number;
  amount?: number;
  growth_rate?: number;
}

export interface AdminDashboard {
  metrics: AdminDashboardMetrics;
  trends?: {
    user_growth: TrendData[];
    revenue_trend: TrendData[];
    transaction_volume: TrendData[];
  };
  alerts?: {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    created_at: string;
  }[];
}

export interface AdminUser extends User {
  status: 'active' | 'inactive' | 'suspended';
  is_verified: boolean;
  is_active?: string | number | boolean;
  last_login?: string | null;
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'inactive' | 'suspended';
  reason?: string;
}

export interface RefundTransactionRequest {
  reason: string;
  refund_amount?: number;
}

export interface Refund {
  id: string;
  transaction_id: string;
  refund_amount: number;
  status: 'processed' | 'pending';
  reason: string;
  created_at: string;
}

export interface GenerateReportRequest {
  type: 'revenue' | 'users' | 'transactions' | 'agents' | 'activity';
  start_date: string;
  end_date: string;
  format?: 'pdf' | 'csv' | 'json';
  include_charts?: boolean;
}

export interface Agent extends User {
  status: 'active' | 'inactive' | 'suspended';
  total_customers: number;
  total_commissions: number;
  this_month_earnings: number;
  performance_rating: number;
}

// ============= Agent Types =============
export interface AgentDashboard {
  agent: {
    id: string;
    name: string;
    commission_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    total_customers: number;
    active_customers: number;
  };
  metrics: {
    total_commission: number;
    monthly_commission: number;
    pending_commission: number;
    total_sales: number;
    this_month_sales: number;
  };
  earnings: Array<{
    date: string;
    amount: number;
    transaction_count: number;
  }>;
  top_customers: Array<{
    id: string;
    name: string;
    total_spent: number;
    transaction_count: number;
  }>;
}

// ============= Airtime to Cash Conversion Types =============
export type AirtimeConversionStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'rejected' | 'failed';
export type AirtimeNetwork = 'MTN' | 'Airtel' | '9mobile' | 'Glo';

export interface AirtimeConversionStatusHistory {
  id: number;
  status: AirtimeConversionStatus;
  changed_at: string;
  changed_by: number | null;
  changed_by_admin?: {
    id: number;
    name: string;
    email: string;
  };
  notes: string | null;
}

export interface AirtimeConversionComment {
  id: number;
  admin_id: number;
  admin: {
    name: string;
    email: string;
  };
  comment: string;
  visibility: 'internal' | 'user';
  created_at: string;
}

export interface AirtimeConversionUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_verified_at?: string;
  email_verified_at?: string;
  account_balance?: number;
  wallet_balance?: number;
  created_at?: string;
  last_login?: string;
  referral_code?: string;
}

export interface AirtimeConversion {
  id: number;
  user_id: number;
  user: AirtimeConversionUser;
  network: AirtimeNetwork;
  phone: string;
  amount: number | string;
  discounted_amount: number | string;
  commission: number | string;
  commission_percentage?: number;
  receipt_number: string;
  service_logo?: string;
  transaction_id: string;
  status: AirtimeConversionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  confirmed_by?: number;
  confirmed_by_admin?: any;
  funded_at?: string;
  funded_by?: number;
  funded_by_admin?: any;
  rejected_at?: string;
  rejected_by?: number;
  rejected_by_admin?: any;
  rejection_reason?: string;
  rejection_notes?: string;
  retry_count?: number | string;
  last_error_message?: string | null;
  status_histories?: AirtimeConversionStatusHistory[];
  comments?: AirtimeConversionComment[];
  central_transaction?: {
    id: number;
    user_id: number;
    transaction_type: string;
    amount: number;
    status: string;
    reference: string;
    transaction_date: string;
    metadata?: Record<string, any>;
  };
  deleted_at?: string | null;
  transaction_type?: string;
}

export interface AirtimeConversionFilters {
  page?: number;
  per_page?: number;
  status?: AirtimeConversionStatus;
  network?: AirtimeNetwork;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
  sort_by?: 'date' | 'amount';
  sort_order?: 'asc' | 'desc';
}

export interface UpdateAirtimeConversionStatusRequest {
  status: Exclude<AirtimeConversionStatus, 'pending'>;
  notes?: string;
  reason_for_rejection?: string;
}

export interface FundAirtimeConversionWalletRequest {
  authorization_notes?: string;
}

export interface AddAirtimeConversionCommentRequest {
  comment: string;
  visibility?: 'internal' | 'user';
}

export interface BulkUpdateAirtimeConversionStatusRequest {
  conversion_ids: number[];
  status: Exclude<AirtimeConversionStatus, 'pending'>;
  notes?: string;
  reason_for_rejection?: string;
}

export interface AirtimeConversionAnalytics {
  period: string;
  summary: {
    total_requests: number;
    pending: number;
    confirmed: number;
    processing: number;
    completed: number;
    rejected: number;
    failed: number;
  };
  financial: {
    total_original_amount: number;
    total_discounted_amount: number;
    total_commission: number;
    average_commission_percentage: number;
    total_funded: number;
  };
  performance: {
    approval_rate: number;
    rejection_rate: number;
    average_processing_time_hours: number;
    fastest_processing_minutes: number;
    slowest_processing_hours: number;
  };
  by_network: Record<AirtimeNetwork, {
    count: number;
    amount: number;
    status?: string;
    percentage: number;
  }>;
  trends: {
    daily?: Array<{
      date: string;
      requests: number;
      amount: number;
      completed: number;
    }>;
    hourly_peak?: string;
  };
  top_users?: Array<{
    user_id: number;
    name: string;
    request_count: number;
    total_amount: number;
  }>;
}

export interface WalletTransactionRecord {
  id: number;
  user_id: number;
  type: 'credit' | 'debit' | 'refund';
  amount: number;
  description: string;
  related_transaction_id: number;
  related_transaction_type: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  total_transactions: number;
  total_spent: number;
  last_transaction_date?: string | null;
  status: 'active' | 'inactive';
  added_at: string;
}

export interface AddCustomerRequest {
  phone: string;
  name?: string;
  email?: string;
}

export interface Commission {
  id: string;
  transaction_id: string;
  amount: number;
  percentage: number;
  status: 'earned' | 'pending' | 'paid';
  transaction_date: string;
  paid_date?: string | null;
}

export interface AgentPerformance {
  period: string;
  metrics: {
    total_sales: number;
    total_commission: number;
    customer_count: number;
    conversion_rate: number;
  };
  comparison_to_previous: {
    sales_growth: number;
    commission_growth: number;
  };
  daily_breakdown: Array<{
    date: string;
    sales: number;
    commission: number;
  }>;
}

// ============= Referral Types =============
export interface ReferralInfo {
  referral_code: string;
  referral_link: string;
  total_referred: number;
  total_commission: number;
  pending_commission: number;
  referral_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tier_commission_rate: number;
  referred_users: Array<{
    id: string;
    name: string;
    email: string;
    total_spent: number;
    referred_at: string;
  }>;
}

export interface ReferralCommission {
  id: string;
  from_user: {
    id: string;
    name: string;
  };
  transaction_id: string;
  amount: number;
  rate: number;
  status: 'earned' | 'pending' | 'paid';
  earned_at: string;
  paid_at?: string | null;
}
