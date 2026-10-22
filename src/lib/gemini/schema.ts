import { z } from 'zod';

export const ExtractedFieldSchema = z.object({
  field_id: z.enum(['name', 'academic_year', 'marks', 'income', 'issue_date']),
  value: z.string().nullable(),
  quote: z.string().nullable(),
  page: z.number().int().default(1),
  confidence: z.number().min(0).max(1),
});

export const DocumentExtractionSchema = z.object({
  document_type: z.enum(['application_form', 'marksheet', 'income_certificate']),
  document_label: z.string().default(''),
  fields: z.array(ExtractedFieldSchema),
});

export type ExtractedField = z.infer<typeof ExtractedFieldSchema>;
export type DocumentExtraction = z.infer<typeof DocumentExtractionSchema>;
