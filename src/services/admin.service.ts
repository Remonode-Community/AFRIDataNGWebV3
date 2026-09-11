import { apiClient } from './api-client';
import {
  AdminDashboard,
  AdminUser,
  Agent,
  UpdateUserStatusRequest,
  RefundTransactionRequest,
  GenerateReportRequest,
  ApiResponse,
  PaginatedResponse,
  AirtimeConversion,
  AirtimeConversionFilters,
  UpdateAirtimeConversionStatusRequest,
  FundAirtimeConversionWalletRequest,
  AddAirtimeConversionCommentRequest,
  BulkUpdateAirtimeConversionStatusRequest,
  AirtimeConversionAnalytics,
} from '@/types/api.types';
import type {
  ServiceSubsidyConfig,
  ToggleSubsidyResponse,
  UpdateSubsidyPayload,
} from '@/types/vtu.types';

class AdminService {
  async getDashboard(): Promise<ApiResponse<{ data: any }>> {
    return apiClient.get('/admin/dashboard/comprehensive');
  }

  // USER MANAGEMENT
  async getUsers(page = 1, per_page = 20, filters?: any): Promise<ApiResponse<PaginatedResponse<AdminUser>>> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/admin/users?${params.toString()}`);
  }

  async getUser(userId: string): Promise<ApiResponse<AdminUser>> {
    return apiClient.get(`/admin/users/${userId}`);
  }

  async createUser(data: any): Promise<any> {
    return apiClient.post('/admin/users', data);
  }

  async updateUser(userId: string, data: any): Promise<any> {
    return apiClient.put(`/admin/users/${userId}`, data);
  }

  async deleteUser(userId: string): Promise<any> {
    return apiClient.delete(`/admin/users/${userId}`);
  }

  async suspendUser(userId: string): Promise<any> {
    return apiClient.put(`/admin/users/${userId}/suspend`, {});
  }

  async activateUser(userId: string): Promise<any> {
    return apiClient.put(`/admin/users/${userId}/activate`, {});
  }

  async verifyUser(userId: string): Promise<any> {
    return apiClient.put(`/admin/users/${userId}/verify`, {});
  }

  async assignRolesToUser(userId: string, roleIds: number[]): Promise<any> {
    return apiClient.put(`/admin/users/${userId}/roles`, { role_ids: roleIds });
  }

  async assignPermissionsToUser(userId: string, permissionIds: number[]): Promise<any> {
    return apiClient.put(`/admin/users/${userId}/permissions`, { permission_ids: permissionIds });
  }

  async getUserTransactions(userId: string, page = 1, per_page = 50): Promise<any> {
    return apiClient.get(`/admin/users/${userId}/transactions?page=${page}&per_page=${per_page}`);
  }

  async getUserWallet(userId: string): Promise<any> {
    return apiClient.get(`/admin/users/${userId}/wallet`);
  }

  async getUserReferrals(userId: string, page = 1, per_page = 50): Promise<any> {
    return apiClient.get(`/admin/users/${userId}/referrals?page=${page}&per_page=${per_page}`);
  }

  async exportUsers(format = 'csv'): Promise<any> {
    return apiClient.get(`/admin/users/export?format=${format}`);
  }

  async bulkUserAction(userIds: number[], action: string): Promise<any> {
    return apiClient.post('/admin/users/bulk-action', { user_ids: userIds, action });
  }

  async updateUserStatus(
    userId: string,
    data: UpdateUserStatusRequest
  ): Promise<ApiResponse<{ user: AdminUser }>> {
    return apiClient.put(`/admin/users/${userId}/status`, data);
  }

  // TRANSACTIONS ENDPOINTS
  async getAllTransactions(page = 1, per_page = 50, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/transactions/all?${params.toString()}`);
  }

  async getTransactionDetails(transactionId: string): Promise<any> {
    return apiClient.get(`/transactions/${transactionId}`);
  }

  async verifyAirtimeConversion(conversionId: number, approved: boolean, notes?: string): Promise<any> {
    return apiClient.post('/transactions/airtime-conversion/verify', {
      conversion_id: conversionId,
      approved,
      notes,
    });
  }

  async getTransactions(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/admin/transactions?${params.toString()}`);
  }

  async refundTransaction(
    transactionId: string,
    data: RefundTransactionRequest
  ): Promise<any> {
    return apiClient.post(`/admin/transactions/${transactionId}/refund`, data);
  }

  // ROLES & PERMISSIONS
  async getRoles(): Promise<any> {
    return apiClient.get('/role/roles');
  }

  async getPermissions(): Promise<any> {
    return apiClient.get('/role/permissions');
  }

  async createRole(name: string): Promise<any> {
    return apiClient.post('/role/roles', { name });
  }

  async createPermission(name: string): Promise<any> {
    return apiClient.post('/role/permissions', { name });
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<any> {
    return apiClient.post('/role/assign/role', { user_id: userId, role_id: roleId });
  }

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<any> {
    return apiClient.post('/role/role/permission', { role_id: roleId, permission_id: permissionId });
  }

  async revokePermissionFromRole(roleId: number, permissionId: number): Promise<any> {
    return apiClient.post('/role/role/permission/revoke', { role_id: roleId, permission_id: permissionId });
  }

  async updateRole(roleId: number, name: string): Promise<any> {
    return apiClient.put(`/role/roles/${roleId}`, { name });
  }

  async deleteRole(roleId: number): Promise<any> {
    return apiClient.delete(`/role/roles/${roleId}`);
  }

  async deletePermission(permissionId: number): Promise<any> {
    return apiClient.delete(`/role/permissions/${permissionId}`);
  }

  // OFFER CODES
  async getOfferCodes(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/admin/offer-codes?${params.toString()}`);
  }

  async getOfferCode(offerId: number): Promise<any> {
    return apiClient.get(`/admin/offer-codes/${offerId}`);
  }

  async createOfferCode(data: any): Promise<any> {
    return apiClient.post('/admin/offer-codes', data);
  }

  async updateOfferCode(offerId: number, data: any): Promise<any> {
    return apiClient.put(`/admin/offer-codes/${offerId}`, data);
  }

  async deleteOfferCode(offerId: number): Promise<any> {
    return apiClient.delete(`/admin/offer-codes/${offerId}`);
  }

  // WALLET
  async getWalletStatistics(): Promise<any> {
    return apiClient.get('/stats/wallet');
  }

  async getWalletBalance(): Promise<any> {
    return apiClient.get('/wallet/balance');
  }

  async getWalletTransactions(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/wallet/transactions?${params.toString()}`);
  }

  // VTU
  async getVTUTransactionStats(): Promise<any> {
    return apiClient.get('/stats/vtu');
  }

  async getVTUTransactions(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/vtu/transactions?${params.toString()}`);
  }

  async getVTUBalance(): Promise<any> {
    return apiClient.get('/vtu/balance');
  }

  // VTU RECIPIENTS
  async getVTURecipients(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/vtu/recipients?${params.toString()}`);
  }

  async getVTURecipient(recipientId: number): Promise<any> {
    return apiClient.get(`/vtu/recipients/${recipientId}`);
  }

  async getRecentlyUsedRecipients(limit = 10): Promise<any> {
    return apiClient.get(`/vtu/recipients/quick-access/recently-used?limit=${limit}`);
  }

  async getFrequentlyUsedRecipients(limit = 10): Promise<any> {
    return apiClient.get(`/vtu/recipients/quick-access/frequently-used?limit=${limit}`);
  }

  async searchVTURecipients(query: string, transactionType?: string, serviceIdentifier?: string): Promise<any> {
    return apiClient.post('/vtu/recipients/search/suggest', {
      query,
      transaction_type: transactionType,
      service_identifier: serviceIdentifier,
    });
  }

  async updateVTURecipient(recipientId: number, data: any): Promise<any> {
    return apiClient.put(`/vtu/recipients/${recipientId}`, data);
  }

  async deleteVTURecipient(recipientId: number): Promise<any> {
    return apiClient.delete(`/vtu/recipients/${recipientId}`);
  }

  async recordRecipientUsage(recipientId: number, transactionId: number): Promise<any> {
    return apiClient.post(`/vtu/recipients/${recipientId}/record-usage`, { transaction_id: transactionId });
  }

  // REFERRALS
  async getReferrals(): Promise<any> {
    return apiClient.get('/referrals');
  }

  async getReferralPrograms(): Promise<any> {
    return apiClient.get('/referrals/programs');
  }

  async getReferralStats(): Promise<any> {
    return apiClient.get('/referrals/stats');
  }

  async getUserWithReferrals(userId: number): Promise<any> {
    return apiClient.get(`/referrals/single/${userId}`);
  }

  // NOTIFICATIONS
  async getNotificationStats(): Promise<any> {
    return apiClient.get('/admin/notifications/stats');
  }

  async getAdminNotifications(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return apiClient.get(`/admin/notifications?${params.toString()}`);
  }

  async sendNotificationToUser(userId: number, title: string, body: string, type: string, priority: string = 'normal', channel: string = 'both', metadata?: any): Promise<any> {
    return apiClient.post('/admin/notifications/send-to-user', {
      user_id: userId,
      title,
      body,
      type,
      priority,
      channel,
      metadata,
    });
  }

  async sendNotificationToUsers(userIds: number[], title: string, body: string, type: string, priority: string = 'normal', channel: string = 'both'): Promise<any> {
    return apiClient.post('/admin/notifications/send-to-users', {
      user_ids: userIds,
      title,
      body,
      type,
      priority,
      channel,
    });
  }

  async sendBroadcastCampaign(userIds: number[], title: string, body: string, options?: any): Promise<any> {
    return apiClient.post('/admin/notifications/broadcast', {
      title,
      body,
      channel: options?.channel || 'both',
      type: options?.type || 'system',
      priority: options?.priority || 'normal',
    });
  }

  // STATISTICS & ANALYTICS
  async getWalletStats(): Promise<any> {
    return apiClient.get('/stats/wallet');
  }

  async getVTUStats(): Promise<any> {
    return apiClient.get('/stats/vtu');
  }

  async getUserStats(): Promise<any> {
    return apiClient.get('/stats/user');
  }

  async getAllStats(): Promise<any> {
    return apiClient.get('/stats/all');
  }

  async getAdminStats(): Promise<any> {
    return apiClient.get('/stats/admin');
  }

  async generateReport(data: GenerateReportRequest): Promise<any> {
    return apiClient.post('/admin/reports/generate', data);
  }

  async getAgents(page = 1, per_page = 20): Promise<ApiResponse<PaginatedResponse<Agent>>> {
    return apiClient.get(`/admin/agents?page=${page}&per_page=${per_page}`);
  }

  async getAnalytics(metric: string, period: string): Promise<any> {
    return apiClient.get(`/admin/analytics?metric=${metric}&period=${period}`);
  }

  // ============= AIRTIME CONVERSION ENDPOINTS =============

  /**
   * Get paginated list of airtime conversions with filters
   */
  async getAirtimeConversions(
    filters: AirtimeConversionFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<AirtimeConversion>>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', String(filters.page));
    if (filters.per_page) params.append('per_page', String(filters.per_page));
    if (filters.status) params.append('status', filters.status);
    if (filters.network) params.append('network', filters.network);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.amount_min) params.append('amount_min', String(filters.amount_min));
    if (filters.amount_max) params.append('amount_max', String(filters.amount_max));
    if (filters.search) params.append('search', filters.search);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    return apiClient.get(`/admin/airtime-conversions?${params.toString()}`);
  }

  /**
   * Get details of a specific airtime conversion request
   */
  async getAirtimeConversion(
    conversionId: number
  ): Promise<ApiResponse<AirtimeConversion>> {
    return apiClient.get(`/admin/airtime-conversions/${conversionId}`);
  }

  /**
   * Update status of airtime conversion (confirm, reject, etc.)
   */
  async updateAirtimeConversionStatus(
    conversionId: number,
    data: UpdateAirtimeConversionStatusRequest
  ): Promise<ApiResponse<any>> {
    return apiClient.put(`/admin/airtime-conversions/${conversionId}/status`, data);
  }

  /**
   * Fund user wallet for approved airtime conversion
   */
  async fundAirtimeConversionWallet(
    conversionId: number,
    data: FundAirtimeConversionWalletRequest = {}
  ): Promise<ApiResponse<any>> {
    return apiClient.post(`/admin/airtime-conversions/${conversionId}/fund-wallet`, data);
  }

  /**
   * Add comment/note to airtime conversion
   */
  async addAirtimeConversionComment(
    conversionId: number,
    data: AddAirtimeConversionCommentRequest
  ): Promise<ApiResponse<any>> {
    return apiClient.post(`/admin/airtime-conversions/${conversionId}/comments`, data);
  }

  /**
   * Bulk update status of multiple airtime conversions
   */
  async bulkUpdateAirtimeConversionStatus(
    data: BulkUpdateAirtimeConversionStatusRequest
  ): Promise<ApiResponse<any>> {
    return apiClient.post('/admin/airtime-conversions/bulk/update-status', data);
  }

  /**
   * Get analytics and insights for airtime conversions
   */
  async getAirtimeConversionAnalytics(
    period: 'today' | 'week' | 'month' | 'year' = 'month',
    dateFrom?: string,
    dateTo?: string,
    network?: string
  ): Promise<ApiResponse<{ data: AirtimeConversionAnalytics }>> {
    const params = new URLSearchParams();
    params.append('period', period);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (network) params.append('network', network);

    return apiClient.get(`/admin/airtime-conversions/analytics/summary?${params.toString()}`);
  }

  /**
   * Export airtime conversions to CSV or Excel
   */
  async exportAirtimeConversions(
    format: 'csv' | 'excel' = 'csv',
    filters?: Partial<AirtimeConversionFilters>
  ): Promise<any> {
    return apiClient.post('/admin/airtime-conversions/export', {
      format,
      filters,
    });
  }

  /**
   * Retry funding for failed airtime conversion
   */
  async retryAirtimeConversionFunding(
    conversionId: number,
    notes?: string
  ): Promise<ApiResponse<any>> {
    return apiClient.put(`/admin/airtime-conversions/${conversionId}/retry-funding`, {
      notes,
    });
  }

  // ============= VTU SUBSIDY ENDPOINTS =============

  /**
   * Get all VTU services with their subsidy configurations
   */
  async getVTUServices(): Promise<ApiResponse<ServiceSubsidyConfig[]>> {
    return apiClient.get('/admin/vtu/services');
  }

  /**
   * Get a single VTU service with its subsidy configuration
   */
  async getVTUService(serviceId: string): Promise<ApiResponse<ServiceSubsidyConfig>> {
    return apiClient.get(`/admin/vtu/services/${serviceId}`);
  }

  /**
   * Toggle subsidy enabled/disabled for a VTU service
   */
  async toggleVTUSubsidy(serviceId: string): Promise<ApiResponse<ToggleSubsidyResponse>> {
    return apiClient.put(`/admin/vtu/services/${serviceId}/subsidy/toggle`);
  }

  /**
   * Update subsidy configuration for a VTU service
   */
  async updateVTUSubsidyConfig(
    serviceId: string,
    data: UpdateSubsidyPayload
  ): Promise<ApiResponse<ServiceSubsidyConfig>> {
    return apiClient.put(`/admin/vtu/services/${serviceId}/subsidy`, data);
  }

  // ── Agent Management ──────────────────────────────────────────────────

  async getAdminAgents(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return apiClient.get(`/admin/agents?${params.toString()}`);
  }

  async getAdminAgent(agentId: number): Promise<any> {
    return apiClient.get(`/admin/agents/${agentId}`);
  }

  async createAdminAgent(data: { user_id: number; commission_rate?: number; notes?: string }): Promise<any> {
    return apiClient.post('/admin/agents', data);
  }

  async updateAdminAgent(agentId: number, data: { status?: string; commission_rate?: number; notes?: string }): Promise<any> {
    return apiClient.put(`/admin/agents/${agentId}`, data);
  }

  async getAdminAgentWallet(agentId: number): Promise<any> {
    return apiClient.get(`/admin/agents/${agentId}/wallet`);
  }

  async getAdminAgentCommissions(agentId: number, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return apiClient.get(`/admin/agents/${agentId}/commissions?${params.toString()}`);
  }

  async getAdminAgentCustomers(agentId: number): Promise<any> {
    return apiClient.get(`/admin/agents/${agentId}/customers`);
  }

  async updateAdminAgentRates(agentId: number, rates: any[]): Promise<any> {
    return apiClient.put(`/admin/agents/${agentId}/rates`, { rates });
  }

  async assignAgentCustomer(agentId: number, userId: number): Promise<any> {
    return apiClient.post(`/admin/agents/${agentId}/assign-customer`, { user_id: userId });
  }

  async removeAgentCustomer(agentId: number, userId: number): Promise<any> {
    return apiClient.delete(`/admin/agents/${agentId}/remove-customer/${userId}`);
  }

  // ── Agent Fund Requests ───────────────────────────────────────────────

  async getAgentFundRequests(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return apiClient.get(`/admin/agent-fund-requests?${params.toString()}`);
  }

  async approveAgentFundRequest(requestId: number): Promise<any> {
    return apiClient.put(`/admin/agent-fund-requests/${requestId}/approve`, {});
  }

  async rejectAgentFundRequest(requestId: number, note?: string): Promise<any> {
    return apiClient.put(`/admin/agent-fund-requests/${requestId}/reject`, { note });
  }
}

class AgentService {
  async getDashboard(): Promise<any> {
    return apiClient.get('/agents/dashboard');
  }

  async getCustomers(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/agents/customers?${params.toString()}`);
  }

  async addCustomer(data: any): Promise<any> {
    return apiClient.post('/agents/customers', data);
  }

  async getCommissions(page = 1, per_page = 20, filters?: any): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('per_page', String(per_page));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    return apiClient.get(`/agents/commissions?${params.toString()}`);
  }

  async getPerformance(period = 'month'): Promise<any> {
    return apiClient.get(`/agents/performance?period=${period}`);
  }
}

class ReferralService {
  async getInfo(): Promise<any> {
    return apiClient.get('/referral/info');
  }

  async getCommissions(page = 1, per_page = 20): Promise<any> {
    return apiClient.get(`/referral/commissions?page=${page}&per_page=${per_page}`);
  }
}

export const adminService = new AdminService();
export const agentService = new AgentService();
export const referralService = new ReferralService();
