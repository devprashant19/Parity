import { describe, it, expect } from 'vitest';
import { CLEAN_SAMPLE_PACKET, MESSY_SAMPLE_PACKET } from '@/data/samples';
import { runVerification } from '@/lib/compare/engine';

describe('Sample Packets Ground Truth Verification', () => {
  it('Clean Sample packet produces exactly 3 Conflicts, 2 Consistent, and 0 Needs Review', () => {
    const result = runVerification(CLEAN_SAMPLE_PACKET, 'clean_sample');

    expect(result.conflicts_count).toBe(3);
    expect(result.consistent_count).toBe(2);
    expect(result.needs_review_count).toBe(0);

    const marks = result.fields.find((f) => f.field_id === 'marks');
    expect(marks?.status).toBe('Conflict');

    const income = result.fields.find((f) => f.field_id === 'income');
    expect(income?.status).toBe('Conflict');

    const issueDate = result.fields.find((f) => f.field_id === 'issue_date');
    expect(issueDate?.status).toBe('Conflict');

    const name = result.fields.find((f) => f.field_id === 'name');
    expect(name?.status).toBe('Consistent');

    const year = result.fields.find((f) => f.field_id === 'academic_year');
    expect(year?.status).toBe('Consistent');
  });

  it('Messy Sample packet demonstrates Needs Review ("S. Sharma") and Monthly Income Normalization', () => {
    const result = runVerification(MESSY_SAMPLE_PACKET, 'messy_sample');

    const name = result.fields.find((f) => f.field_id === 'name');
    expect(name?.status).toBe('Needs Review');
    expect(name?.status_reason).toContain('initials');

    const income = result.fields.find((f) => f.field_id === 'income');
    expect(income?.status).toBe('Consistent');
    expect(income?.status_reason).toContain('1,80,000');

    const marks = result.fields.find((f) => f.field_id === 'marks');
    expect(marks?.status).toBe('Conflict');

    const issueDate = result.fields.find((f) => f.field_id === 'issue_date');
    expect(issueDate?.status).toBe('Conflict');

    expect(result.needs_review_count).toBe(1);
    expect(result.conflicts_count).toBe(2);
    expect(result.consistent_count).toBe(2);
  });
});
