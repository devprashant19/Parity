import { FieldComparison } from '../compare/types';
import { generateFixPlan } from './generator';

function escapeCsv(val: string | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Converts verification results and student resolutions into a clean CSV string.
 */
export function exportToCsv(fields: FieldComparison[]): string {
  const fixPlan = generateFixPlan(fields);

  const headers = [
    'Category',
    'Field',
    'Status',
    'Application Form Value',
    'Supporting Document Value',
    'Action Required',
    'Details',
  ];

  const rows: string[][] = [];

  const addItems = (items: typeof fixPlan.fixBeforeSubmitting, categoryName: string) => {
    for (const item of items) {
      const field = fields.find((f) => f.field_id === item.field_id);
      const formVal = field?.documents[0]?.raw_value || 'N/A';
      const docVal = field?.documents[1]?.raw_value || 'N/A';

      rows.push([
        categoryName,
        item.field_label,
        item.status,
        formVal,
        docVal,
        item.instruction,
        item.detail,
      ]);
    }
  };

  addItems(fixPlan.fixBeforeSubmitting, 'Fix Before Submitting');
  addItems(fixPlan.needsManualReview, 'Needs Manual Review');
  addItems(fixPlan.consistent, 'Consistent');

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((r) => r.map(escapeCsv).join(',')),
  ].join('\r\n');

  return csvContent;
}
