import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { docs, buildHtml } from '../../scripts/generate-scans';

describe('Fixture Sanity - Generator & Samples Duplication Checks', () => {
  it('no scan doc definition has a prefix containing the field value', () => {
    for (const doc of docs) {
      for (const [label, val, prefix] of doc.fields) {
        // Strip common non-letter/digit chars for robust comparison
        const cleanVal = val.replace(/[₹%,.\s]/g, '').trim();
        const cleanPrefix = prefix.replace(/[₹%,.\s]/g, '').trim();

        if (cleanVal.length >= 3) {
          expect(
            cleanPrefix.includes(cleanVal),
            `Doc "${doc.fileName}" field "${label}" has prefix "${prefix}" that contains value "${val}"!`
          ).toBe(false);
        }
      }
    }
  });

  it('no generated HTML contains immediately repeated field values (e.g., "XX" twice in a row)', () => {
    for (const doc of docs) {
      const html = buildHtml(doc);

      // Strip HTML tags to get pure text content
      const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

      for (const [label, val] of doc.fields) {
        const trimmedVal = val.trim();
        if (trimmedVal.length < 3) continue;

        // Check for immediate repetition: "val val" or "valval"
        const doubleDirect = trimmedVal + trimmedVal;
        const doubleSpaced = `${trimmedVal} ${trimmedVal}`;

        expect(
          textContent.includes(doubleDirect),
          `Doc "${doc.fileName}" field "${label}" has direct doubled value: "${doubleDirect}"`
        ).toBe(false);

        expect(
          textContent.includes(doubleSpaced),
          `Doc "${doc.fileName}" field "${label}" has spaced doubled value: "${doubleSpaced}"`
        ).toBe(false);
      }
    }
  });

  it('SVG sample files in public/samples have no duplicated text elements or values', () => {
    const samplesDir = path.resolve(process.cwd(), 'public/samples');
    if (!fs.existsSync(samplesDir)) return;

    const files = fs.readdirSync(samplesDir).filter((f) => f.endsWith('.svg'));
    expect(files.length).toBeGreaterThan(0);

    const valuesToCheck = [
      'Suresh Sharma',
      'S. Sharma',
      '1,80,000',
      '2,40,000',
      '15,000',
      '89.4%',
      '92.4%',
      '12/08/2024',
      '15/07/2024',
      'Alex Morgan',
      'Maria J. Alvarez',
      'Maria Alvarez',
      'José Alvarez',
      '3.80 GPA',
      '3.92 GPA',
      '65,000',
      '48,000',
    ];

    for (const file of files) {
      const content = fs.readFileSync(path.join(samplesDir, file), 'utf8');
      const textOnly = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

      for (const val of valuesToCheck) {
        const doubleDirect = val + val;
        const doubleSpaced = `${val} ${val}`;

        expect(
          textOnly.includes(doubleDirect),
          `Sample SVG "${file}" contains doubled value "${doubleDirect}"`
        ).toBe(false);

        expect(
          textOnly.includes(doubleSpaced),
          `Sample SVG "${file}" contains doubled value "${doubleSpaced}"`
        ).toBe(false);
      }
    }
  });

  it('ground-truth.json has no duplicated values inside expected quotes', () => {
    const gtPath = path.resolve(process.cwd(), 'tests/fixtures/scans/ground-truth.json');
    const groundTruth = JSON.parse(fs.readFileSync(gtPath, 'utf8'));

    for (const item of groundTruth) {
      for (const [fieldId, rawExpected] of Object.entries(item.expected_fields)) {
        const expected = rawExpected as { value?: string | null; quote?: string | null };
        if (!expected || !expected.value || !expected.quote) continue;

        const val = expected.value.trim();
        if (val.length < 3) continue;

        const doubleDirect = val + val;
        const doubleSpaced = `${val} ${val}`;

        expect(
          expected.quote.includes(doubleDirect),
          `Ground truth ${item.scan_id} field ${fieldId} quote contains doubled value: "${doubleDirect}"`
        ).toBe(false);

        expect(
          expected.quote.includes(doubleSpaced),
          `Ground truth ${item.scan_id} field ${fieldId} quote contains doubled value: "${doubleSpaced}"`
        ).toBe(false);
      }
    }
  });
});
