import { describe, it, expect } from 'vitest';
import { normalizeIncome, normalizeMarks } from '@/lib/normalize/numbers';
import { normalizeDate } from '@/lib/normalize/dates';
import { compareNames } from '@/lib/normalize/name';

describe('normalizeIncome', () => {
  it('normalizes regional comma grouping with per annum', () => {
    const result = normalizeIncome('₹2,40,000 per year');
    expect(result.value).toBe(240000);
    expect(result.period).toBe('annual');
    expect(result.isAmbiguous).toBe(false);
  });

  it('normalizes monthly income to annual by multiplying by 12', () => {
    const result = normalizeIncome('₹15,000 per month');
    expect(result.value).toBe(180000);
    expect(result.period).toBe('monthly');
    expect(result.isAmbiguous).toBe(false);
  });

  it('handles p.m. abbreviation for monthly', () => {
    const result = normalizeIncome('Rs. 20000 p.m.');
    expect(result.value).toBe(240000);
    expect(result.period).toBe('monthly');
  });

  it('handles plain number with regional commas defaulting to annual for large amounts', () => {
    const result = normalizeIncome('1,80,000');
    expect(result.value).toBe(180000);
    expect(result.period).toBe('annual');
  });

  it('handles international currency symbols (USD, EUR, GBP)', () => {
    const usd = normalizeIncome('$45,000/yr');
    expect(usd.value).toBe(45000);
    expect(usd.period).toBe('annual');

    const eurMonthly = normalizeIncome('€3,000 / month');
    expect(eurMonthly.value).toBe(36000);
    expect(eurMonthly.period).toBe('monthly');

    const gbpAnnual = normalizeIncome('£28,000 annually');
    expect(gbpAnnual.value).toBe(28000);
    expect(gbpAnnual.period).toBe('annual');
  });

  it('flags empty or unparseable income as ambiguous', () => {
    const result = normalizeIncome('N/A');
    expect(result.value).toBeNull();
    expect(result.isAmbiguous).toBe(true);
  });
});

describe('normalizeMarks', () => {
  it('parses percentage with symbol to 1 decimal place', () => {
    expect(normalizeMarks('92.4%').value).toBe(92.4);
    expect(normalizeMarks('89.4 %').value).toBe(89.4);
    expect(normalizeMarks('89.42%').value).toBe(89.4);
  });

  it('flags CGPA scale as requiring review', () => {
    const result = normalizeMarks('CGPA: 8.9 / 10');
    expect(result.isCgpa).toBe(true);
  });
});

describe('normalizeDate', () => {
  it('parses DD/MM/YYYY format as primary default', () => {
    expect(normalizeDate('15/07/2024').iso).toBe('2024-07-15');
    expect(normalizeDate('12/08/2024').iso).toBe('2024-08-12');
    expect(normalizeDate('05-03-2023').iso).toBe('2023-03-05');
  });

  it('parses written month names in DD Month YYYY format', () => {
    expect(normalizeDate('15 July 2024').iso).toBe('2024-07-15');
    expect(normalizeDate('12-Aug-2024').iso).toBe('2024-08-12');
  });

  it('flags invalid dates as ambiguous', () => {
    expect(normalizeDate('35/13/2024').iso).toBeNull();
    expect(normalizeDate('unreadable').isAmbiguous).toBe(true);
  });
});

describe('compareNames - Spec Table Verification', () => {
  it('Exact match -> Consistent', () => {
    const res = compareNames('Suresh Sharma', 'Suresh Sharma');
    expect(res.status).toBe('Consistent');
  });

  it('Title/Honorific ignored -> Consistent', () => {
    const res = compareNames('Shri Suresh Sharma', 'Suresh Sharma');
    expect(res.status).toBe('Consistent');
  });

  it('Reordered tokens -> Needs Review', () => {
    const res = compareNames('Sharma Suresh', 'Suresh Sharma');
    expect(res.status).toBe('Needs Review');
    expect(res.reason).toContain('reordered');
  });

  it('Initials -> Needs Review', () => {
    const res = compareNames('S. Sharma', 'Suresh Sharma');
    expect(res.status).toBe('Needs Review');
    expect(res.reason).toContain('initials');
  });

  it('Single token vs full name -> Needs Review', () => {
    const res = compareNames('Suresh', 'Suresh Sharma');
    expect(res.status).toBe('Needs Review');
  });

  it('Same surname with different given name -> Conflict', () => {
    const res = compareNames('Ramesh Sharma', 'Suresh Sharma');
    expect(res.status).toBe('Conflict');
    expect(res.reason).toContain('Conflicting given names');
  });

  it('Different surname -> Conflict', () => {
    const res = compareNames('Suresh Verma', 'Suresh Sharma');
    expect(res.status).toBe('Conflict');
  });

  it('Missing/null name -> Needs Review', () => {
    const res = compareNames(null, 'Suresh Sharma');
    expect(res.status).toBe('Needs Review');
  });
});
