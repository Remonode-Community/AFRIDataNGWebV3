// VTU Service Types
export interface VTUService {
  identifier: string;
  name: string;
}

export interface VTUProvider {
  serviceID: string;
  name: string;
  minimium_amount: string | number;
  maximum_amount: string | number;
  convinience_fee: string;
  product_type: string;
  image?: string;
  biller_code?: string;
  biller_id?: string;
  image_url?: string;
  ported?: boolean;
  inter_switch_code?: string;
  inter_switch_id?: string;
}

export interface VTUVariation {
  variation_code: string;
  name: string;
  variation_amount: string;
  fixedPrice: string;
  subsidized?: VariationSubsidized;
}

export interface VariationSubsidized {
  enabled: boolean;
  original_amount: number;
  subsidized_amount: number;
  savings: number;
}

export interface VariationSubsidy {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface VTUVariationResponse {
  ServiceName: string;
  serviceID: string;
  convinience_fee: string;
  variations: VTUVariation[];
  subsidy?: VariationSubsidy;
}

export interface VTUPaymentRequest {
  amount: string | number;
  billersCode?: string;
  country_code?: string;
  email: string;
  operator_id?: string;
  phone: string;
  product_type_id?: string;
  request_id: string;
  serviceID: string;
  variation_code?: string;
  user_id: number;
}

export interface VTUPaymentResponse {
  response_description: string;
  request_id: string;
  transaction_id?: string;
  status: string;
  message?: string;
}

export interface AirtimeTransaction {
  id: string;
  phone: string;
  provider: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  request_id: string;
}

// Subsidy Types
export type SubsidyType = 'percentage' | 'fixed';

export interface ServiceSubsidyConfig {
  service_id: string;
  service_name: string;
  subsidy_enabled: boolean;
  subsidy_type: SubsidyType;
  subsidy_value: number;
  min_discount_cap: number | null;
  max_discount_cap: number | null;
}

export interface ToggleSubsidyResponse {
  service_id: string;
  service_name: string;
  subsidy_enabled: boolean;
}

export interface UpdateSubsidyPayload {
  subsidy_type: SubsidyType;
  subsidy_value: number;
  min_discount_cap?: number | null;
  max_discount_cap?: number | null;
}

export interface SubsidyPreview {
  originalAmount: number;
  discount: number;
  subsidizedAmount: number;
  savings: number;
}

export interface SubsidyMeta {
  subsidy_applied: boolean;
  subsidy_type: SubsidyType;
  subsidy_value: number;
  original_amount: number;
  subsidized_amount: number;
  savings: number;
}
