export type FieldStatus = 'Consistent' | 'Conflict' | 'Needs Review';

export type ResolutionChoice =
  | 'document_a_correct'
  | 'document_b_correct'
  | 'not_sure'
  | 'unresolved';

export type FieldId = 'name' | 'academic_year' | 'marks' | 'income' | 'issue_date';

export type DocumentType = 'application_form' | 'marksheet' | 'income_certificate';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DoubleReadResult {
  agreed: boolean;
  crop_value: string | null;
  crop_quote?: string | null;
  disagreement_reason?: string;
}

export interface ExtractedField {
  field_id: FieldId;
  value: string | null;
  quote: string | null;
  page: number;
  confidence: number;
  source?: 'extracted' | 'manual';
  highlight_bbox?: BoundingBox;
  double_read?: DoubleReadResult;
}

export interface DocumentExtraction {
  document_type: DocumentType;
  document_label: string;
  fields: ExtractedField[];
}

export interface DocumentComparisonEntry {
  doc_type: DocumentType;
  doc_label: string;
  raw_value: string | null;
  normalized_value: string | number | null;
  quote: string | null;
  page: number;
  confidence: number;
  source: 'extracted' | 'manual';
  preview_url?: string;
  highlight_bbox?: BoundingBox;
  double_read?: DoubleReadResult;
}

export interface PairwiseComparison {
  doc_a_label: string;
  doc_b_label: string;
  doc_a_value: string | null;
  doc_b_value: string | null;
  status: FieldStatus;
  reason: string;
}

export interface FieldComparison {
  field_id: FieldId;
  field_label: string;
  status: FieldStatus;
  status_reason: string;
  documents: DocumentComparisonEntry[];
  pairwise_details?: PairwiseComparison[];
  diff_explanation: string;
  resolution: ResolutionChoice;
  remediation_action?: string;
}

export interface VerificationResult {
  packet_type: 'clean_sample' | 'messy_sample' | 'live';
  total_fields: number;
  conflicts_count: number;
  consistent_count: number;
  needs_review_count: number;
  fields: FieldComparison[];
}

export const CONFIDENCE_THRESHOLD = 0.7;
export const MAX_QUOTE_LENGTH = 200;
