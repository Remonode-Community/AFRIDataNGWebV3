import { apiClient } from './api-client';

export interface AgentDashboard {
  wallet_balance: number;
  total_earned: number;
  total_withdrawn: number;
  total_customers: number;
  this_month_earnings: number;
  pending_requests: number;
  commission_rate: number;
  recent_commissions: any[];
}

export interface AgentWallet {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
}

export interface AgentTransaction {
  id: number;
  agent_id: number;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference: string;
  metadata?: Record<string, any>;
  created_at: string;
  source_transaction?: any;
}

export interface AgentFundRequest {
  id: number;
  agent_id: number;
  amount: number;
  type: string;
  status: string;
  admin_note?: string;
  processed_at?: string;
  created_at: string;
}

export interface AgentCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  transaction_count?: number;
  total_spent?: number;
  pivot?: {
    assigned_at: string;
  };
}

export interface AgentRate {
  id: number;
  service_id: string;
  subsidy_type: string;
  subsidy_value: number;
  min_discount_cap?: number;
  max_discount_cap?: number;
  enabled: boolean;
}

class AgentService {
  async getDashboard() {
    return apiClient.get('/agents/dashboard');
  }

  async getWallet() {
    return apiClient.get('/agents/wallet');
  }

  async getWalletTransactions(filters?: {
    type?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/agents/wallet/transactions${query}`);
  }

  async createFundRequest(data: {
    amount: number;
    type: 'withdrawal' | 'transfer_to_wallet';
  }): Promise<any> {
    return apiClient.post('/agents/fund-requests', data);
  }

  async getFundRequests(filters?: {
    status?: string;
    per_page?: number;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/agents/fund-requests${query}`);
  }

  async getCustomers(per_page?: number): Promise<any> {
    const params = per_page ? `?per_page=${per_page}` : '';
    return apiClient.get(`/agents/customers${params}`);
  }

  async getCommissions(filters?: {
    date_from?: string;
    date_to?: string;
    per_page?: number;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/agents/commissions${query}`);
  }

  async getRates() {
    return apiClient.get('/agents/rates');
  }
}

export const agentService = new AgentService();
