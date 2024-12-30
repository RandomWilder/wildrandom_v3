/**
 * Currency Utility Functions
 * 
 * Enterprise-grade currency handling utilities that ensure consistent
 * formatting and calculations across the application. Matches backend
 * precision and business rules.
 */

// Currency formatting options matching backend precision
const DEFAULT_CURRENCY_OPTIONS: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };
  
  /**
   * Format a number as currency with proper localization
   * 
   * @param value - Number to format
   * @param options - Optional Intl.NumberFormatOptions to override defaults
   * @returns Formatted currency string
   */
  export const formatCurrency = (
    value: number | string,
    options: Partial<Intl.NumberFormatOptions> = {}
  ): string => {
    try {
      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
      
      if (isNaN(numericValue)) {
        console.warn('Invalid currency value provided:', value);
        return '$0.00';
      }
  
      return new Intl.NumberFormat(
        'en-US',
        { ...DEFAULT_CURRENCY_OPTIONS, ...options }
      ).format(numericValue);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return '$0.00';
    }
  };
  
  /**
   * Parse a currency string back to a number
   * 
   * @param value - Currency string to parse
   * @returns Parsed number value
   */
  export const parseCurrency = (value: string): number => {
    try {
      // Remove currency symbol, commas, and whitespace
      const sanitized = value.replace(/[$,\s]/g, '');
      const parsed = parseFloat(sanitized);
      
      if (isNaN(parsed)) {
        console.warn('Invalid currency string provided:', value);
        return 0;
      }
      
      // Round to 2 decimal places to match backend precision
      return Math.round(parsed * 100) / 100;
    } catch (error) {
      console.error('Error parsing currency:', error);
      return 0;
    }
  };
  
  /**
   * Format a large currency value with K/M/B suffix
   * 
   * @param value - Number to format
   * @returns Formatted currency string with suffix
   */
  export const formatCompactCurrency = (value: number): string => {
    try {
      if (value === 0) return '$0';
      
      const absValue = Math.abs(value);
      
      if (absValue >= 1000000000) {
        return formatCurrency(value / 1000000000) + 'B';
      }
      if (absValue >= 1000000) {
        return formatCurrency(value / 1000000) + 'M';
      }
      if (absValue >= 1000) {
        return formatCurrency(value / 1000) + 'K';
      }
      
      return formatCurrency(value);
    } catch (error) {
      console.error('Error formatting compact currency:', error);
      return '$0';
    }
  };
  
  /**
   * Validate a currency value against business rules
   * 
   * @param value - Value to validate
   * @param options - Validation options
   * @returns Validation result
   */
  export const validateCurrencyValue = (
    value: number,
    options: {
      minValue?: number;
      maxValue?: number;
      allowZero?: boolean;
    } = {}
  ): { isValid: boolean; error?: string } => {
    const { minValue = 0, maxValue, allowZero = false } = options;
  
    if (isNaN(value)) {
      return { isValid: false, error: 'Invalid currency value' };
    }
  
    if (!allowZero && value === 0) {
      return { isValid: false, error: 'Value cannot be zero' };
    }
  
    if (value < minValue) {
      return { isValid: false, error: `Value cannot be less than ${formatCurrency(minValue)}` };
    }
  
    if (maxValue !== undefined && value > maxValue) {
      return { isValid: false, error: `Value cannot exceed ${formatCurrency(maxValue)}` };
    }
  
    return { isValid: true };
  };