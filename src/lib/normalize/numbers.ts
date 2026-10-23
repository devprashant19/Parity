export interface NormalizedIncome {
  value: number | null; // Annualized integer
  baseValue: number | null; // Raw extracted numeric figure before annualization
  period: 'annual' | 'monthly' | 'biweekly' | 'weekly' | 'unknown';
  frequencyFactor: number; // 1 for annual, 12 for monthly, 26 for biweekly, 52 for weekly
  currency: string; // 'USD', 'EUR', 'GBP', 'INR', etc.
  currencySymbol: string; // '$', '€', '£', '₹', etc.
  isAmbiguous: boolean;
  raw: string;
}

export type MarksScale = '4.0' | '5.0' | '10.0' | 'percentage' | 'unknown';

export interface NormalizedMarks {
  value: number | null;
  scale: MarksScale;
  isCgpa: boolean;
  raw: string;
}

/**
 * Extracts currency code and canonical symbol from raw string.
 */
export function extractCurrency(text: string): { code: string; symbol: string } {
  const lower = text.toLowerCase();

  if (/[€]|(\beur\b)|(\beuros?\b)/i.test(lower)) {
    return { code: 'EUR', symbol: '€' };
  }
  if (/[£]|(\bgbp\b)|(\bpounds?\b)/i.test(lower)) {
    return { code: 'GBP', symbol: '£' };
  }
  if (/[₹]|(\binr\b)|(\brupees?\b)|(\brs\.?\b)/i.test(lower)) {
    return { code: 'INR', symbol: '₹' };
  }
  if (/[¥]|(\bjpy\b)|(\byen\b)|(\bcny\b)|(\byuan\b)/i.test(lower)) {
    return { code: 'JPY', symbol: '¥' };
  }
  if (/[c][$]|(\bcad\b)/i.test(lower)) {
    return { code: 'CAD', symbol: 'C$' };
  }
  if (/[a][$]|(\baud\b)/i.test(lower)) {
    return { code: 'AUD', symbol: 'A$' };
  }
  if (/[$]|(\busd\b)|(\bdollars?\b)/i.test(lower)) {
    return { code: 'USD', symbol: '$' };
  }
  if (/(\bchf\b)|(\bfrancs?\b)/i.test(lower)) {
    return { code: 'CHF', symbol: 'CHF' };
  }

  return { code: 'UNKNOWN', symbol: '' };
}

/**
 * Parses numeric string taking into account European (1.234,56), US/UK (1,234.56),
 * French/space (1 234,56 or 1 234.56), and South Asian (1,20,000) number grouping.
 */
export function parseLocaleNumber(rawNum: string): number | null {
  let cleaned = rawNum.trim();
  if (!cleaned) return null;

  // Remove whitespace thousands separators: "1 234,56" -> "1234,56"
  cleaned = cleaned.replace(/\s+/g, '');

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // European format: 1.234,56 -> remove dot, replace comma with dot
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US/UK format: 1,234.56 -> remove comma
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Only comma present: could be 1,234 (thousands) or 12,34 (decimal)
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      // Multiple commas: 1,200,000 or 1,20,000 -> thousands separators
      cleaned = cleaned.replace(/,/g, '');
    } else if (parts[1] && parts[1].length === 3) {
      // Single comma with 3 digits after: 1,000 or 240,000 -> thousands separator
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Single comma with 1 or 2 digits after: 12,5 or 1234,50 -> decimal separator
      cleaned = cleaned.replace(',', '.');
    }
  } else if (hasDot) {
    // Only dot present: could be 1.234 (EU thousands) or 12.34 (US decimal)
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      // Multiple dots: 1.200.000 -> European thousands separators
      cleaned = cleaned.replace(/\./g, '');
    } else if (parts[1] && parts[1].length === 3 && parts[0].length <= 3) {
      // Single dot with exactly 3 digits after in an integer context (e.g., 3.500 or 36.000 for income)
      const candidateInt = parseInt(parts[0], 10);
      if (candidateInt >= 1) {
        cleaned = cleaned.replace(/\./g, '');
      }
    }
  }

  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

/**
 * Normalizes international currency string (e.g. "$65,000/yr", "€3.000 per month", "£2,500/biweekly")
 * to canonical annual integer, extracting currency and frequency factor.
 */
export function normalizeIncome(rawInput: string | null, quote?: string | null): NormalizedIncome {
  if (!rawInput || !rawInput.trim()) {
    return {
      value: null,
      baseValue: null,
      period: 'unknown',
      frequencyFactor: 1,
      currency: 'UNKNOWN',
      currencySymbol: '',
      isAmbiguous: true,
      raw: '',
    };
  }

  const clean = rawInput.trim();
  const lower = clean.toLowerCase();

  // If input contains GPA or percentage, it is an academic score, not an income figure
  if (/%|\bgpa\b/i.test(lower)) {
    return {
      value: null,
      baseValue: null,
      period: 'unknown',
      frequencyFactor: 1,
      currency: 'UNKNOWN',
      currencySymbol: '',
      isAmbiguous: true,
      raw: clean,
    };
  }

  let currencyInfo = extractCurrency(clean);
  if (currencyInfo.code === 'UNKNOWN' && quote && quote.trim()) {
    const quoteCurrency = extractCurrency(quote);
    if (quoteCurrency.code !== 'UNKNOWN') {
      currencyInfo = quoteCurrency;
    }
  }

  // Detect frequency from raw value first
  let period: 'annual' | 'monthly' | 'biweekly' | 'weekly' | 'unknown' = 'unknown';
  let factor = 1;

  const weeklyRegex = /(\bper\s*week|\s*\/\s*week|\bweekly|\s*\/\s*wk\b|\bpor\s*semana\b|\bsemanal\b|\bpar\s*semaine\b|\bpro\s*woche\b)/i;
  const biweeklyRegex = /(\bbiweekly|\bbi-weekly|\bfortnightly|\bevery\s*two\s*weeks|\s*\/\s*biweekly\b)/i;
  const monthlyRegex = /(\bper\s*month|\s*\/\s*month|\bp\.?m\.?|\bmonthly|\s*\/\s*mo\b|\bal\s*mes\b|\bpor\s*mes\b|\bmensual\b|\bpar\s*mois\b|\bpro\s*monat\b|\bmonatlich\b)/i;
  const annualRegex = /(\bper\s*annum|\s*\/\s*year|\bp\.?a\.?|\bannual|\bannually|\bper\s*year|\s*\/\s*yr\b|\bal\s*a[ñn]o\b|\bpor\s*a[ñn]o\b|\banual\b|\bpar\s*an\b|\bpro\s*jahr\b|\bj[äa]hrlich\b)/i;

  let weeklyMatch = weeklyRegex.test(lower);
  let biweeklyMatch = biweeklyRegex.test(lower);
  let monthlyMatch = monthlyRegex.test(lower);
  let annualMatch = annualRegex.test(lower);

  // If value lacks explicit frequency indicators, inspect quote if available
  if (!weeklyMatch && !biweeklyMatch && !monthlyMatch && !annualMatch && quote && quote.trim()) {
    const qLower = quote.toLowerCase();
    weeklyMatch = weeklyRegex.test(qLower);
    biweeklyMatch = biweeklyRegex.test(qLower);
    monthlyMatch = monthlyRegex.test(qLower);
    annualMatch = annualRegex.test(qLower);
  }

  if (weeklyMatch) {
    period = 'weekly';
    factor = 52;
  } else if (biweeklyMatch) {
    period = 'biweekly';
    factor = 26;
  } else if (monthlyMatch && !annualMatch) {
    period = 'monthly';
    factor = 12;
  } else if (annualMatch && !monthlyMatch) {
    period = 'annual';
    factor = 1;
  } else if (!monthlyMatch && !annualMatch && !weeklyMatch && !biweeklyMatch) {
    // If no frequency token specified in value or quote, default to annual
    period = 'annual';
    factor = 1;
  } else {
    // Conflicting period tokens
    period = 'unknown';
    factor = 1;
  }

  // Extract number candidate substring
  // Strip currency words/symbols and frequency words
  const stripped = clean
    .replace(/[$€£¥₹]/g, ' ')
    .replace(/\b(usd|eur|gbp|inr|cad|aud|chf|jpy|cny|rs|dollars?|euros?|pounds?|rupees?)\b/gi, ' ')
    .replace(/\b(per\s*month|\/month|p\.?m\.?|monthly|\/mo|per\s*annum|\/year|p\.?a\.?|annual|annually|per\s*year|\/yr|weekly|per\s*week|\/wk|biweekly|bi-weekly|fortnightly)\b/gi, ' ')
    .replace(/\/-/g, ' ')
    .trim();

  // Find the number token in stripped string
  const numTokenMatch = stripped.match(/[0-9]+([\.,\s][0-9]+)*/);
  if (!numTokenMatch) {
    return {
      value: null,
      baseValue: null,
      period: 'unknown',
      frequencyFactor: factor,
      currency: currencyInfo.code,
      currencySymbol: currencyInfo.symbol,
      isAmbiguous: true,
      raw: clean,
    };
  }

  const baseNum = parseLocaleNumber(numTokenMatch[0]);
  if (baseNum === null) {
    return {
      value: null,
      baseValue: null,
      period: 'unknown',
      frequencyFactor: factor,
      currency: currencyInfo.code,
      currencySymbol: currencyInfo.symbol,
      isAmbiguous: true,
      raw: clean,
    };
  }

  const annualized = Math.round(baseNum * factor);

  return {
    value: annualized,
    baseValue: baseNum,
    period,
    frequencyFactor: factor,
    currency: currencyInfo.code,
    currencySymbol: currencyInfo.symbol,
    isAmbiguous: period === 'unknown',
    raw: clean,
  };
}

/**
 * Normalizes marks percentage or GPA string (e.g. "3.80", "3.5 out of 4.0", "92.4%").
 * Detects whether score is 4.0 GPA, 5.0 GPA, 10.0 CGPA, or percentage scale.
 */
export function normalizeMarks(rawInput: string | null): NormalizedMarks {
  if (!rawInput || !rawInput.trim()) {
    return { value: null, scale: 'unknown', isCgpa: false, raw: '' };
  }

  const clean = rawInput.trim();
  const lower = clean.toLowerCase();

  // Check explicit scale denominators
  let explicitScale: MarksScale = 'unknown';
  if (/(\/4\.0|\/4\b|out of 4(\.0)?|scale 4(\.0)?)/i.test(lower)) {
    explicitScale = '4.0';
  } else if (/(\/5\.0|\/5\b|out of 5(\.0)?|scale 5(\.0)?)/i.test(lower)) {
    explicitScale = '5.0';
  } else if (/(\/10(\.0)?|out of 10(\.0)?|scale 10(\.0)?)/i.test(lower)) {
    explicitScale = '10.0';
  } else if (/%|percent|percentage/.test(lower)) {
    explicitScale = 'percentage';
  }

  // Extract first floating-point number
  const numMatch = lower.replace(/[%]/g, '').match(/\d+(\.\d+)?/);
  if (!numMatch) {
    return { value: null, scale: 'unknown', isCgpa: false, raw: clean };
  }

  const parsed = parseFloat(numMatch[0]);
  if (isNaN(parsed)) {
    return { value: null, scale: 'unknown', isCgpa: false, raw: clean };
  }

  // Infer scale if not explicitly stated
  let scale = explicitScale;
  if (scale === 'unknown') {
    if (parsed <= 4.0) {
      scale = '4.0';
    } else if (parsed <= 5.0) {
      scale = '5.0';
    } else if (parsed <= 10.0) {
      scale = '10.0';
    } else {
      scale = 'percentage';
    }
  }

  const isCgpa = scale === '4.0' || scale === '5.0' || scale === '10.0' || /cgpa|gpa/.test(lower);

  // Round GPA to 2 decimals, percentage to 1 decimal
  const rounded = scale === '4.0' || scale === '5.0'
    ? Math.round(parsed * 100) / 100
    : Math.round(parsed * 10) / 10;

  return {
    value: rounded,
    scale,
    isCgpa,
    raw: clean,
  };
}
