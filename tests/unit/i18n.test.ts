import { describe, it, expect } from 'vitest';
import { normalizeDate, normalizeAcademicYear } from '@/lib/normalize/dates';
import { parseLocaleNumber, extractCurrency, normalizeIncome, normalizeMarks } from '@/lib/normalize/numbers';
import { compareNames } from '@/lib/normalize/name';
import { runVerification } from '@/lib/compare/engine';
import { DocumentExtraction, CustomFieldDefinition } from '@/lib/compare/types';

describe('Internationalization & Multi-Locale Verification Rules', () => {
  // =========================================================================
  // Country 1: United States (US)
  // =========================================================================
  describe('Country 1: United States (US)', () => {
    it('handles US numeric and textual dates with MDY and Day > 12', () => {
      // Day > 12 is unambiguously MDY or DMY depending on which is > 12
      const oct24 = normalizeDate('10/24/2024', 'Auto');
      expect(oct24.isAmbiguous).toBe(false);
      expect(oct24.iso).toBe('2024-10-24');

      // Textual month format
      const aug12 = normalizeDate('August 12, 2024', 'Auto');
      expect(aug12.isAmbiguous).toBe(false);
      expect(aug12.iso).toBe('2024-08-12');

      // Ambiguous date resolved by explicit MDY setting
      const ambig = normalizeDate('04/05/2024', 'MDY');
      expect(ambig.isAmbiguous).toBe(false);
      expect(ambig.iso).toBe('2024-04-05'); // April 5th
    });

    it('parses US currency and biweekly paychecks with x26 annualization factor', () => {
      const pay = normalizeIncome('$2,500 every two weeks');
      expect(pay.currencySymbol).toBe('$');
      expect(pay.currency).toBe('USD');
      expect(pay.frequencyFactor).toBe(26);
      expect(pay.value).toBe(65000); // 2500 * 26
    });

    it('evaluates US 4.0 GPA scales and handles middle initials with Needs Review', () => {
      const gpa1 = normalizeMarks('3.85 GPA');
      const gpa2 = normalizeMarks('3.85 out of 4.0');
      expect(gpa1.scale).toBe('4.0');
      expect(gpa2.scale).toBe('4.0');
      expect(gpa1.value).toBe(gpa2.value);

      const nameCmp = compareNames('John Q. Public', 'John Public');
      expect(nameCmp.status).toBe('Needs Review');
      expect(nameCmp.reason).toContain('omitted');
    });
  });

  // =========================================================================
  // Country 2: United Kingdom (UK)
  // =========================================================================
  describe('Country 2: United Kingdom (UK)', () => {
    it('handles UK dates: written month is unambiguous, numeric resolved by DMY setting', () => {
      const written = normalizeDate('12 Aug 2024', 'Auto');
      expect(written.isAmbiguous).toBe(false);
      expect(written.iso).toBe('2024-08-12');

      const numericDMY = normalizeDate('04/05/2024', 'DMY');
      expect(numericDMY.isAmbiguous).toBe(false);
      expect(numericDMY.iso).toBe('2024-05-04'); // 4th of May
    });

    it('normalizes UK weekly income with x52 factor and £ symbol', () => {
      const weekly = normalizeIncome('£500 per week');
      expect(weekly.currencySymbol).toBe('£');
      expect(weekly.currency).toBe('GBP');
      expect(weekly.frequencyFactor).toBe(52);
      expect(weekly.value).toBe(26000); // 500 * 52
    });

    it('flags hyphenated / double-barrel British surnames as Needs Review', () => {
      const nameCmp = compareNames('Eleanor Smith-Jones', 'Eleanor Smith');
      expect(nameCmp.status).toBe('Needs Review');
      expect(nameCmp.reason).toContain('Hyphenated');
    });
  });

  // =========================================================================
  // Country 3: Spain & Latin America (ES / MX / CO)
  // =========================================================================
  describe('Country 3: Spain & Latin America (ES / MX / CO)', () => {
    it('folds accents between variants ("José" vs "Jose") and marks Needs Review', () => {
      const nameCmp = compareNames('José María Álvarez', 'Jose Maria Alvarez');
      expect(nameCmp.status).toBe('Needs Review');
      expect(nameCmp.reason).toContain('Accent');
    });

    it('evaluates compound Spanish maternal/paternal surnames as Needs Review', () => {
      const nameCmp = compareNames('Gabriel García Márquez', 'Gabriel García');
      expect(nameCmp.status).toBe('Needs Review');
      expect(nameCmp.reason).toContain('Compound');
    });

    it('parses European number grouping with period thousand and comma decimal', () => {
      const num = parseLocaleNumber('45.250,75');
      expect(num).toBeCloseTo(45250.75, 2);

      const income = normalizeIncome('€3.500 al mes');
      expect(income.currencySymbol).toBe('€');
      expect(income.currency).toBe('EUR');
      expect(income.frequencyFactor).toBe(12);
      expect(income.value).toBe(42000); // 3500 * 12
    });
  });

  // =========================================================================
  // Country 4: Germany & France (DE / FR)
  // =========================================================================
  describe('Country 4: Germany & France (DE / FR)', () => {
    it('detects noble/family surname particles ("van", "von", "de") as Needs Review', () => {
      const beethoven = compareNames('Ludwig van Beethoven', 'Ludwig Beethoven');
      expect(beethoven.status).toBe('Needs Review');
      expect(beethoven.reason).toContain('particle');

      const gaulle = compareNames('Charles de Gaulle', 'Charles Gaulle');
      expect(gaulle.status).toBe('Needs Review');
      expect(gaulle.reason).toContain('particle');
    });

    it('flags academic honorifics ("Dr.", "Prof.") as Needs Review', () => {
      const honorific = compareNames('Dr. Heinrich Mueller', 'Heinrich Mueller');
      expect(honorific.status).toBe('Needs Review');
      expect(honorific.reason).toContain('Honorific');
    });

    it('handles French/International space thousands grouping', () => {
      const num = parseLocaleNumber('12 500,50');
      expect(num).toBeCloseTo(12500.5, 2);

      const income = normalizeIncome('12 500 € per annum');
      expect(income.currencySymbol).toBe('€');
      expect(income.value).toBe(12500);
    });

    it('normalizes European academic years (e.g. 2024/2025, 2024/25)', () => {
      const ay1 = normalizeAcademicYear('2024/2025');
      const ay2 = normalizeAcademicYear('2024-25');
      const ay3 = normalizeAcademicYear('Academic Year 2024/25');
      expect(ay1).toBe('2024-2025');
      expect(ay2).toBe('2024-2025');
      expect(ay3).toBe('2024-2025');
    });
  });

  // =========================================================================
  // Country 5: Japan & China (JP / CN)
  // =========================================================================
  describe('Country 5: Japan & China (JP / CN)', () => {
    it('flags family-name-first reordering as Needs Review', () => {
      const chinese = compareNames('Wang Wei', 'Wei Wang');
      expect(chinese.status).toBe('Needs Review');
      expect(chinese.reason).toContain('order');

      const japanese = compareNames('Sato Haruto', 'Haruto Sato');
      expect(japanese.status).toBe('Needs Review');
      expect(japanese.reason).toContain('order');
    });

    it('flags currency mismatches (e.g. JPY vs USD) as Needs Review', () => {
      const extractions: DocumentExtraction[] = [
        {
          document_type: 'application_form',
          document_label: 'Application Form',
          fields: [
            {
              field_id: 'name',
              value: 'Haruto Sato',
              quote: 'Name: Haruto Sato',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'income',
              value: '¥4,500,000 per year',
              quote: 'Income: ¥4,500,000 per year',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'academic_year',
              value: '2024-2025',
              quote: 'Year: 2024-2025',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'marks',
              value: '3.90 GPA',
              quote: 'GPA: 3.90 GPA',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'issue_date',
              value: '15 Aug 2024',
              quote: 'Date: 15 Aug 2024',
              confidence: 0.99,
              page: 1,
            },
          ],
        },
        {
          document_type: 'income_certificate',
          document_label: 'Proof of Income',
          fields: [
            {
              field_id: 'name',
              value: 'Haruto Sato',
              quote: 'Name: Haruto Sato',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'income',
              value: '$30,000 per year',
              quote: 'Income: $30,000 per year',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'issue_date',
              value: '15 Aug 2024',
              quote: 'Date: 15 Aug 2024',
              confidence: 0.99,
              page: 1,
            },
          ],
        },
        {
          document_type: 'marksheet',
          document_label: 'Academic Transcript',
          fields: [
            {
              field_id: 'name',
              value: 'Haruto Sato',
              quote: 'Name: Haruto Sato',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'academic_year',
              value: '2024-2025',
              quote: 'Year: 2024-2025',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'marks',
              value: '3.90 GPA',
              quote: 'GPA: 3.90 GPA',
              confidence: 0.99,
              page: 1,
            },
          ],
        },
      ];

      const res = runVerification(extractions, 'live');
      const inc = res.fields.find((f) => f.field_id === 'income');
      expect(inc?.status).toBe('Needs Review');
      expect(inc?.status_reason).toContain('Different currencies');
    });

    it('flags grading scale mismatches (e.g. 4.0 GPA vs 95% percentage) as Needs Review', () => {
      const extractions: DocumentExtraction[] = [
        {
          document_type: 'application_form',
          document_label: 'Application Form',
          fields: [
            {
              field_id: 'name',
              value: 'Wei Wang',
              quote: 'Name: Wei Wang',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'academic_year',
              value: '2024-2025',
              quote: 'Year: 2024-2025',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'marks',
              value: '3.80 GPA',
              quote: 'GPA: 3.80 GPA',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'income',
              value: '$40,000',
              quote: 'Income: $40,000',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'issue_date',
              value: '15 Aug 2024',
              quote: 'Date: 15 Aug 2024',
              confidence: 0.99,
              page: 1,
            },
          ],
        },
        {
          document_type: 'marksheet',
          document_label: 'Academic Transcript',
          fields: [
            {
              field_id: 'name',
              value: 'Wei Wang',
              quote: 'Name: Wei Wang',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'academic_year',
              value: '2024-2025',
              quote: 'Year: 2024-2025',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'marks',
              value: '95%',
              quote: 'Percentage: 95%',
              confidence: 0.99,
              page: 1,
            },
          ],
        },
        {
          document_type: 'income_certificate',
          document_label: 'Proof of Income',
          fields: [
            {
              field_id: 'name',
              value: 'Wei Wang',
              quote: 'Name: Wei Wang',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'income',
              value: '$40,000',
              quote: 'Income: $40,000',
              confidence: 0.99,
              page: 1,
            },
            {
              field_id: 'issue_date',
              value: '15 Aug 2024',
              quote: 'Date: 15 Aug 2024',
              confidence: 0.99,
              page: 1,
            },
          ],
        },
      ];

      const res = runVerification(extractions, 'live');
      const marks = res.fields.find((f) => f.field_id === 'marks');
      expect(marks?.status).toBe('Needs Review');
      expect(marks?.status_reason).toContain('GPA scales differ');
    });
  });

  // =========================================================================
  // Country 6: India (Preserving Backward Compatibility)
  // =========================================================================
  describe('Country 6: India (Backward Compatibility)', () => {
    it('correctly parses Indian number grouping (lakh / ₹1,80,000)', () => {
      const num = parseLocaleNumber('1,80,000');
      expect(num).toBe(180000);

      const income = normalizeIncome('₹2,40,000 per annum');
      expect(income.currencySymbol).toBe('₹');
      expect(income.value).toBe(240000);
      expect(income.currency).toBe('INR');
    });
  });
});
