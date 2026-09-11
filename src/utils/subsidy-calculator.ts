import type { SubsidyType, SubsidyPreview } from '@/types/vtu.types';

/**
 * Calculate subsidy preview for admin configuration modal.
 * This is used for display purposes only - actual subsidy is calculated server-side.
 */
export function calculateSubsidyPreview(
  originalAmount: number,
  subsidyType: SubsidyType,
  subsidyValue: number,
  minDiscountCap?: number | null,
  maxDiscountCap?: number | null
): SubsidyPreview {
  const result: SubsidyPreview = {
    originalAmount,
    discount: 0,
    subsidizedAmount: originalAmount,
    savings: 0,
  };

  if (subsidyValue <= 0 || originalAmount <= 0) {
    return result;
  }

  let discount = 0;

  if (subsidyType === 'percentage') {
    discount = originalAmount * (subsidyValue / 100);
  } else {
    // Fixed amount discount
    discount = subsidyValue;
  }

  // Apply min/max caps if configured
  if (minDiscountCap !== null && minDiscountCap !== undefined && discount < minDiscountCap) {
    discount = minDiscountCap;
  }
  if (maxDiscountCap !== null && maxDiscountCap !== undefined && discount > maxDiscountCap) {
    discount = maxDiscountCap;
  }

  // Ensure we never go below zero
  discount = Math.max(0, discount);

  const subsidizedAmount = Math.round((originalAmount - discount) * 100) / 100;

  // Ensure subsidized amount is never negative
  result.discount = Math.round(discount * 100) / 100;
  result.subsidizedAmount = Math.max(0, subsidizedAmount);
  result.savings = Math.round((originalAmount - result.subsidizedAmount) * 100) / 100;

  return result;
}
