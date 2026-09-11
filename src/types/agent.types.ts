export interface Agent {
  id: number;
  user_id: number;
  status: 'active' | 'suspended' | 'inactive';
  commission_rate: number;
  assigned_by?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    phone_number: string;
  };
  wallet?: AgentWallet;
  assigned_by_user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface AgentWallet {
  id: number;
  agent_id: number;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string;
  updated_at: string;
}

export interface AgentTransaction {
  id: number;
  agent_id: number;
  type: 'commission' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'adjustment';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference: string;
  source_transaction_id?: number;
  metadata?: Record<string, any>;
  created_at: string;
  source_transaction?: any;
}

export interface AgentFundRequest {
  id: number;
  agent_id: number;
  amount: number;
  type: 'withdrawal' | 'transfer_to_wallet';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  admin_id?: number;
  admin_note?: string;
  processed_at?: string;
  created_at: string;
  agent?: Agent;
  admin?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface AgentServiceRate {
  id: number;
  agent_id: number;
  service_id: string;
  subsidy_type: 'percentage' | 'fixed';
  subsidy_value: number;
  min_discount_cap?: number;
  max_discount_cap?: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentCustomer {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone_number: string;
  transaction_count?: number;
  total_spent?: number;
  pivot?: {
    assigned_at: string;
  };
}

export interface AgentDashboardData {
  wallet_balance: number;
  total_earned: number;
  total_withdrawn: number;
  total_customers: number;
  this_month_earnings: number;
  pending_requests: number;
  commission_rate: number;
  recent_commissions: AgentTransaction[];
}

export type FundRequestType = 'withdrawal' | 'transfer_to_wallet';
export type FundRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type AgentStatus = 'active' | 'suspended' | 'inactive';
