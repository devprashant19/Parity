export interface NormalizedIncome {
  value: number | null;
  period: 'annual' | 'monthly' | 'unknown';
  isAmbiguous: boolean;
  raw: string;
}

export interface NormalizedMarks {
  value: number | null;
  isCgpa: boolean;
  raw: string;
}

/**
 * Normalizes international & regional currency string (e.g., "$45,000/yr", "€3,000/month", "₹2,40,000 per year") to canonical annual integer.
 */
export function normalizeIncome(rawInput: string | null): NormalizedIncome {
  if (!rawInput || !rawInput.trim()) {
    return { value: null, period: 'unknown', isAmbiguous: true, raw: '' };
  }

  const clean = rawInput.trim();
  const lower = clean.toLowerCase();

  // Detect frequency (supports international and regional standards)
  let period: 'annual' | 'monthly' | 'unknown' = 'unknown';
  const monthlyMatch = /(\bper\s*month|\s*\/\s*month|\bp\.?m\.?|\bmonthly|\s*\/\s*mo\b)/i.test(lower);
  const annualMatch = /(\bper\s*annum|\s*\/\s*year|\bp\.?a\.?|\bannual|\bannually|\bper\s*year|\s*\/\s*yr\b)/i.test(lower);

  if (monthlyMatch && !annualMatch) {
    period = 'monthly';
  } else if (annualMatch && !monthlyMatch) {
    period = 'annual';
  } else if (!monthlyMatch && !annualMatch) {
    // If no frequency token specified, default to annual
    period = 'annual';
  } else {
    // Conflicting period tokens
    period = 'unknown';
  }

  // Extract numeric part: handles international grouping (240,000 or 15,000.00) & South Asian grouping (2,40,000)
  // Strip currency prefixes and suffixes: $, €, £, ¥, ₹, USD, EUR, GBP, CAD, AUD, INR
  let numStr = lower
    .replace(/[$€£¥₹\s]|usd|eur|gbp|cad|aud|inr|rs\.?|\/-/gi, '')
    .replace(/(per\s*month|\/month|p\.?m\.?|monthly|\/mo|per\s*annum|\/year|p\.?a\.?|annual|annually|per\s*year|\/yr)/gi, '')
    .trim();

  // Remove commas (international standard or South Asian grouping)
  numStr = numStr.replace(/,/g, '');

  const match = numStr.match(/\d+(\.\d+)?/);
  if (!match) {
    return { value: null, period: 'unknown', isAmbiguous: true, raw: clean };
  }

  let numVal = parseFloat(match[0]);
  if (isNaN(numVal)) {
    return { value: null, period: 'unknown', isAmbiguous: true, raw: clean };
  }

  if (period === 'monthly') {
    numVal = Math.round(numVal * 12);
  }

  return {
    value: Math.round(numVal),
    period,
    isAmbiguous: period === 'unknown',
    raw: clean,
  };
}

/**
 * Normalizes marks percentage string (e.g. "92.4%", "89.4 %") to 1-decimal number.
 * Flags CGPA formats without clear % mapping.
 */
export function normalizeMarks(rawInput: string | null): NormalizedMarks {
  if (!rawInput || !rawInput.trim()) {
    return { value: null, isCgpa: false, raw: '' };
  }

  const clean = rawInput.trim();
  const lower = clean.toLowerCase();

  // Check if explicitly CGPA or out of 10
  const isCgpa = /\b(cgpa|gpa|\/10)\b/i.test(lower) && !/%/.test(lower);

  // Extract percentage number
  const numStr = lower.replace(/[%]/g, '').trim();
  const match = numStr.match(/\d+(\.\d+)?/);

  if (!match) {
    return { value: null, isCgpa, raw: clean };
  }

  const parsed = parseFloat(match[0]);
  if (isNaN(parsed)) {
    return { value: null, isCgpa, raw: clean };
  }

  // Round to 1 decimal place
  const rounded = Math.round(parsed * 10) / 10;

  return {
    value: rounded,
    isCgpa,
    raw: clean,
  };
}
