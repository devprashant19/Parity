export type DateFormatSetting = 'Auto' | 'DMY' | 'MDY';

export interface NormalizedDate {
  iso: string | null; // YYYY-MM-DD
  isAmbiguous: boolean;
  ambiguityReason?: string;
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

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/**
 * Normalizes date to canonical ISO string "YYYY-MM-DD".
 * Flags ambiguous numeric dates (where day and month are both <= 12) as isAmbiguous
 * unless day > 12, month is textual, or an explicit formatSetting (DMY/MDY) is provided.
 */
export function normalizeDate(
  rawInput: string | null,
  formatSetting: DateFormatSetting = 'Auto'
): NormalizedDate {
  if (!rawInput || !rawInput.trim()) {
    return { iso: null, isAmbiguous: true, ambiguityReason: 'Missing date string', raw: '' };
  }

  const clean = rawInput.trim();
  const lower = clean.toLowerCase();

  // Pattern 1: ISO YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = lower.match(/^(\d{4})[-\/\.](\d{2})[-\/\.](\d{2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { iso: `${year}-${pad(month)}-${pad(day)}`, isAmbiguous: false, raw: clean };
    }
  }

  // Pattern 2: DD Month YYYY (e.g. "12 Aug 2024", "15 July 2024", "12-Aug-2024")
  const ddMonthYyyy = lower.match(/^(\d{1,2})[\s\-\,\.\/]+([a-z]+)[\s\-\,\.\/]+(\d{4})$/);
  if (ddMonthYyyy) {
    const day = parseInt(ddMonthYyyy[1], 10);
    const monthStr = ddMonthYyyy[2];
    const year = parseInt(ddMonthYyyy[3], 10);
    const monthNum = MONTH_NAMES[monthStr];
    if (monthNum && day >= 1 && day <= 31 && year >= 1990 && year <= 2035) {
      return {
        iso: `${year}-${monthNum}-${pad(day)}`,
        isAmbiguous: false,
        raw: clean,
      };
    }
  }

  // Pattern 3: Month DD, YYYY (e.g. "Aug 12, 2024", "August 12, 2024")
  const monthDdYyyy = lower.match(/^([a-z]+)[\s\-\,\.\/]+(\d{1,2})[\s\-\,\.\/]+(\d{4})$/);
  if (monthDdYyyy) {
    const monthStr = monthDdYyyy[1];
    const day = parseInt(monthDdYyyy[2], 10);
    const year = parseInt(monthDdYyyy[3], 10);
    const monthNum = MONTH_NAMES[monthStr];
    if (monthNum && day >= 1 && day <= 31 && year >= 1990 && year <= 2035) {
      return {
        iso: `${year}-${monthNum}-${pad(day)}`,
        isAmbiguous: false,
        raw: clean,
      };
    }
  }

  // Pattern 4: Purely numeric: (Part1)/(Part2)/(YYYY) with /, -, or .
  const numericMatch = lower.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (numericMatch) {
    const p1 = parseInt(numericMatch[1], 10);
    const p2 = parseInt(numericMatch[2], 10);
    const year = parseInt(numericMatch[3], 10);

    // If day is unambiguously > 12: must be DD/MM/YYYY
    if (p1 > 12 && p1 <= 31 && p2 >= 1 && p2 <= 12) {
      return {
        iso: `${year}-${pad(p2)}-${pad(p1)}`,
        isAmbiguous: false,
        raw: clean,
      };
    }

    // If month is in p1 and p2 > 12: must be MM/DD/YYYY
    if (p2 > 12 && p2 <= 31 && p1 >= 1 && p1 <= 12) {
      return {
        iso: `${year}-${pad(p1)}-${pad(p2)}`,
        isAmbiguous: false,
        raw: clean,
      };
    }

    // Both p1 and p2 <= 12
    if (p1 >= 1 && p1 <= 12 && p2 >= 1 && p2 <= 12) {
      // If day == month (e.g. 05/05/2024): completely unambiguous
      if (p1 === p2) {
        return {
          iso: `${year}-${pad(p1)}-${pad(p2)}`,
          isAmbiguous: false,
          raw: clean,
        };
      }

      // If format setting explicitly resolves it
      if (formatSetting === 'DMY') {
        return {
          iso: `${year}-${pad(p2)}-${pad(p1)}`,
          isAmbiguous: false,
          raw: clean,
        };
      }
      if (formatSetting === 'MDY') {
        return {
          iso: `${year}-${pad(p1)}-${pad(p2)}`,
          isAmbiguous: false,
          raw: clean,
        };
      }

      // Setting is 'Auto': Ambiguous numeric date!
      // Provide tentative ISO assuming DD/MM/YYYY but flag as isAmbiguous
      return {
        iso: `${year}-${pad(p2)}-${pad(p1)}`,
        isAmbiguous: true,
        ambiguityReason: `Ambiguous date "${clean}": could be ${p1}/${p2} (DMY) or ${p2}/${p1} (MDY). Set date-format preference (DMY/MDY) or use written month.`,
        raw: clean,
      };
    }
  }

  return { iso: null, isAmbiguous: true, ambiguityReason: 'Unrecognized date format', raw: clean };
}

/**
 * Normalizes academic year notations to a canonical format (e.g. "2024-2025"):
 * Supports: "2024-25", "2024-2025", "AY 2024-25", "2024/25", "Academic Year 2024 - 2025", etc.
 */
export function normalizeAcademicYear(rawInput: string | null): string | null {
  if (!rawInput || !rawInput.trim()) return null;

  const clean = rawInput.trim();
  const lower = clean.toLowerCase();

  // Match 4-digit start year followed by delimiter (-, /, to) and 2 or 4 digit end year
  const rangeMatch = lower.match(/\b(19\d\d|20\d\d)\s*(?:[-–—\/]|to)\s*(\d{2,4})\b/);
  if (rangeMatch) {
    const startYear = parseInt(rangeMatch[1], 10);
    let endYearStr = rangeMatch[2];
    if (endYearStr.length === 2) {
      const century = Math.floor(startYear / 100) * 100;
      endYearStr = `${century + parseInt(endYearStr, 10)}`;
    }
    return `${startYear}-${endYearStr}`;
  }

  // Single year e.g. "2024" or "Class of 2024"
  const singleYearMatch = lower.match(/\b(19\d\d|20\d\d)\b/);
  if (singleYearMatch) {
    return singleYearMatch[1];
  }

  return clean.toLowerCase().replace(/\s+/g, ' ');
}

