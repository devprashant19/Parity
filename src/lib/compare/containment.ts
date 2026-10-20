import { CONFIDENCE_THRESHOLD, MAX_QUOTE_LENGTH } from './types';

/**
 * Checks if raw value literally appears within the quoted snippet.
 * Enforces quote length <= 200 chars.
 * Handles whitespace, case, and currency symbol prefixes (₹, Rs., INR).
 */
export function verifyQuoteContainment(value: string | null, quote: string | null): boolean {
  if (!value || !quote) return false;
  if (quote.length > MAX_QUOTE_LENGTH) return false;

  const cleanVal = value.trim().toLowerCase().replace(/\s+/g, ' ');
  const cleanQuote = quote.trim().toLowerCase().replace(/\s+/g, ' ');

  // Exact verbatim match
  if (cleanQuote.includes(cleanVal)) {
    return true;
  }

  // Strip currency prefixes (e.g. ₹, Rs., INR) while keeping commas and digits (e.g. "2,40,000")
  const strippedCurrency = cleanVal
    .replace(/^(₹|rs\.?|inr|\$|\€)\s*/i, '')
    .replace(/\s*(per\s*year|per\s*annum|\/year|per\s*month|\/month)$/i, '')
    .trim();

  if (strippedCurrency.length >= 2 && cleanQuote.includes(strippedCurrency)) {
    return true;
  }

  // Also check without currency symbols or % in case model formatted value
  const digitsOnly = cleanVal.replace(/[₹\$\€\,%]/g, '').trim();
  if (digitsOnly.length >= 2 && cleanQuote.includes(digitsOnly)) {
    return true;
  }

  return false;
}

export function isConfident(confidence: number | null | undefined): boolean {
  if (typeof confidence !== 'number') return false;
  return confidence >= CONFIDENCE_THRESHOLD;
}
