import { formatDistanceToNow, format } from 'date-fns';
import { CURRENCY_SYMBOL } from './constants';

// Currency formatting
export const formatCurrency = (amount: number | undefined | null, currency: string = 'NGN'): string => {
  if (amount === undefined || amount === null) return 'N/A';
  const symbol = CURRENCY_SYMBOL[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Date formatting
export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'Unknown';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Unknown';
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

// Phone formatting
export const formatPhoneNumber = (phone: string): string => {
  // E.164 format: +234XXXXXXXXXX
  if (phone.startsWith('+')) {
    return phone.slice(0, 3) + ' ' + phone.slice(3, 7) + ' ' + phone.slice(7);
  }
  return phone;
};

// Convert E.164 / international numbers to the local 11-digit format the API expects
export const toLocalPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+234')) return `0${cleaned.slice(4)}`;
  if (cleaned.startsWith('234') && cleaned.length === 13) return `0${cleaned.slice(3)}`;
  if (cleaned.startsWith('+')) return cleaned.slice(1);
  return cleaned;
};

// Truncate text
export const truncateText = (text: string, length: number = 50): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Mask card number
export const maskCardNumber = (cardNumber: string): string => {
  if (cardNumber.length < 4) return cardNumber;
  return '**** **** **** ' + cardNumber.slice(-4);
};

// Capitalize string
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Format large numbers
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};
