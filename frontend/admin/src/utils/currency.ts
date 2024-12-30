// frontend/admin/src/utils/currency.ts

/**
 * Format a number as currency with proper localization
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  /**
   * Parse a currency string back to a number
   */
  export const parseCurrency = (value: string): number => {
    // Remove currency symbol and commas, then parse
    return parseFloat(value.replace(/[$,]/g, ''));
  };
  
  /**
   * Format large numbers with K/M/B suffixes
   */
  export const formatCompactNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };