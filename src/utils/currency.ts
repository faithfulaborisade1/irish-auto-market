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

// Format fuel type for display
export function formatFuelType(fuelType: string | null | undefined): string {
  if (!fuelType) return 'N/A';

  const fuelTypeMap: { [key: string]: string } = {
    'PETROL': 'Petrol',
    'DIESEL': 'Diesel',
    'ELECTRIC': 'Electric',
    'HYBRID': 'Hybrid',
    'PETROL_HYBRID': 'Petrol Hybrid',
    'DIESEL_HYBRID': 'Diesel Hybrid',
    'PLUGIN_HYBRID': 'Plug-in Hybrid',
    'PETROL_PLUGIN_HYBRID': 'Petrol Plug-in Hybrid',
    'DIESEL_PLUGIN_HYBRID': 'Diesel Plug-in Hybrid',
    'LPG': 'LPG',
    'CNG': 'CNG'
  };

  return fuelTypeMap[fuelType] || fuelType;
}

// Format car description for better readability
export function formatDescription(description: string | null | undefined): string {
  if (!description) return 'No description available.';

  // If description already has line breaks, return as-is
  if (description.includes('\n')) {
    return description;
  }

  let formatted = description;

  // Split into paragraphs at sentences (. followed by space and capital letter)
  formatted = formatted.replace(/\. ([A-Z])/g, '.\n\n$1');

  // Detect "Features include" or similar patterns and add proper formatting
  formatted = formatted.replace(/(Features include|Features|Key features|Specification|Equipment includes?)/gi, '\n\n$1');

  // For long feature lists (text with many commas), convert to bullet points
  if (formatted.length > 300) {
    // Split the text into sections
    const sections = formatted.split('\n\n');

    formatted = sections.map(section => {
      // Count commas in this section
      const commaCount = (section.match(/,/g) || []).length;

      // If section has 5+ commas, it's likely a feature list - convert to bullets
      if (commaCount >= 5) {
        // Split by commas and create bullet points
        const items = section.split(/,\s+/).map((item, index, array) => {
          // Clean up the item
          item = item.trim();
          // Remove trailing period from last item
          if (index === array.length - 1) {
            item = item.replace(/\.\s*$/, '');
          }
          return item;
        }).filter(item => item.length > 0);

        // Check if first item is a header like "Features include:"
        const firstItem = items[0];
        if (firstItem && (firstItem.toLowerCase().includes('feature') ||
                         firstItem.toLowerCase().includes('specification') ||
                         firstItem.toLowerCase().includes('equipment'))) {
          const header = items.shift();
          return `${header}\n${items.map(item => `• ${item}`).join('\n')}`;
        }

        return items.map(item => `• ${item}`).join('\n');
      }

      return section;
    }).join('\n\n');
  }

  return formatted;
}