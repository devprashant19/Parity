export interface NormalizedDate {
  iso: string | null; // YYYY-MM-DD
  isAmbiguous: boolean;
  raw: string;
}

const MONTH_NAMES: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

/**
 * Normalizes date with DD/MM/YYYY as primary default.
 * Converts to canonical ISO string "YYYY-MM-DD".
 */
export function normalizeDate(rawInput: string | null): NormalizedDate {
  if (!rawInput || !rawInput.trim()) {
    return { iso: null, isAmbiguous: true, raw: '' };
  }

  const clean = rawInput.trim();
  const lower = clean.toLowerCase();

  // Pattern 1: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const numericMatch = lower.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (numericMatch) {
    const day = parseInt(numericMatch[1], 10);
    const month = parseInt(numericMatch[2], 10);
    const year = parseInt(numericMatch[3], 10);

    // Validate DD/MM/YYYY
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1990 && year <= 2030) {
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      return {
        iso: `${year}-${pad(month)}-${pad(day)}`,
        isAmbiguous: false,
        raw: clean,
      };
    }
  }

  // Pattern 2: DD Month YYYY (e.g. "15 July 2024" or "12-Aug-2024")
  const wordMatch = lower.match(/^(\d{1,2})[\s\-\,\.]*([a-z]+)[\s\-\,\.]*(\d{4})$/);
  if (wordMatch) {
    const day = parseInt(wordMatch[1], 10);
    const monthStr = wordMatch[2].toLowerCase();
    const year = parseInt(wordMatch[3], 10);

    const monthNum = MONTH_NAMES[monthStr];
    if (monthNum && day >= 1 && day <= 31 && year >= 1990 && year <= 2030) {
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      return {
        iso: `${year}-${monthNum}-${pad(day)}`,
        isAmbiguous: false,
        raw: clean,
      };
    }
  }

  // Pattern 3: YYYY-MM-DD (ISO)
  const isoMatch = lower.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return { iso: isoMatch[0], isAmbiguous: false, raw: clean };
  }

  return { iso: null, isAmbiguous: true, raw: clean };
}
