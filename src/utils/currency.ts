// Currency utilities for multi-currency support
export const SUPPORTED_CURRENCIES = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧'
  }
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode as CurrencyCode];
  return currency?.symbol || '€'; // Default to Euro if currency not found
}

export function getCurrencyName(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode as CurrencyCode];
  return currency?.name || 'Euro';
}

export function formatPrice(price: number, currencyCode: string = 'EUR'): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${price.toLocaleString()}`;
}

export function getCurrencyFlag(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode as CurrencyCode];
  return currency?.flag || '🇪🇺';
}

// Simple exchange rate for display purposes
// In a real application, you'd fetch this from an API
export const EXCHANGE_RATES = {
  EUR_TO_GBP: 0.85,
  GBP_TO_EUR: 1.18
};

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  
  if (fromCurrency === 'EUR' && toCurrency === 'GBP') {
    return Math.round(amount * EXCHANGE_RATES.EUR_TO_GBP);
  }
  
  if (fromCurrency === 'GBP' && toCurrency === 'EUR') {
    return Math.round(amount * EXCHANGE_RATES.GBP_TO_EUR);
  }
  
  return amount;
}