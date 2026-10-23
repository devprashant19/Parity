import { DocumentExtraction } from '../lib/compare/types';

export interface SamplePacketMetadata {
  id: 'clean_sample' | 'messy_sample';
  title: string;
  description: string;
  badgeText: string;
  documents: {
    type: 'application_form' | 'marksheet' | 'income_certificate';
    label: string;
    fileName: string;
    fileSize: string;
    previewUrl: string;
  }[];
}

export const CLEAN_SAMPLE_META: SamplePacketMetadata = {
  id: 'clean_sample',
  title: 'Merit & Financial Aid Scholarship Intake',
  description: 'Multi-document consistency check across applicant records: 3 clerical discrepancies, 2 verified matches.',
  badgeText: 'Active Verification Audit — Scholarship Intake Packet',
  documents: [
    {
      type: 'application_form',
      label: 'Application Form (Form No. SCH-2024)',
      fileName: 'application-form-alex.pdf',
      fileSize: '420 KB',
      previewUrl: '/samples/clean_form.svg',
    },
    {
      type: 'marksheet',
      label: 'Official Academic Transcript (GPA 4.0 Scale)',
      fileName: 'academic-transcript-alex.pdf',
      fileSize: '890 KB',
      previewUrl: '/samples/clean_marksheet.svg',
    },
    {
      type: 'income_certificate',
      label: 'Annual Household Tax Statement',
      fileName: 'irs-tax-statement-alex.pdf',
      fileSize: '650 KB',
      previewUrl: '/samples/clean_income_cert.svg',
    },
  ],
};

export const MESSY_SAMPLE_META: SamplePacketMetadata = {
  id: 'messy_sample',
  title: 'European Merit Scholarship Intake',
  description: 'Multi-document verification with name variation analysis, monthly income annualization, and clerical cross-check.',
  badgeText: 'Active Verification Audit — European Intake Packet',
  documents: [
    {
      type: 'application_form',
      label: 'Application Form (Form No. EUR-2024)',
      fileName: 'application-form-maria.pdf',
      fileSize: '420 KB',
      previewUrl: '/samples/messy_form.svg',
    },
    {
      type: 'marksheet',
      label: 'Official Academic Transcript of Records',
      fileName: 'transcript-maria-alvarez.pdf',
      fileSize: '890 KB',
      previewUrl: '/samples/messy_marksheet.svg',
    },
    {
      type: 'income_certificate',
      label: 'Household Income Certificate (Monthly Assessment)',
      fileName: 'tax-certificate-alvarez.pdf',
      fileSize: '610 KB',
      previewUrl: '/samples/messy_income_cert.svg',
    },
  ],
};

export const CLEAN_SAMPLE_PACKET: DocumentExtraction[] = [
  {
    document_type: 'application_form',
    document_label: 'Application Form',
    fields: [
      {
        field_id: 'name',
        value: 'Alex Morgan',
        quote: 'Applicant Name: Alex Morgan',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.375, width: 0.867, height: 0.077 },
        double_read: { agreed: true, crop_value: 'Alex Morgan' },
      },
      {
        field_id: 'academic_year',
        value: '2024-25',
        quote: 'Academic Year: 2024-25',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.467, width: 0.867, height: 0.077 },
        double_read: { agreed: true, crop_value: '2024-25' },
      },
      {
        field_id: 'marks',
        value: '3.80 GPA',
        quote: 'Cumulative GPA: 3.80 out of 4.0',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.560, width: 0.867, height: 0.077 },
        double_read: { agreed: true, crop_value: '3.80 GPA' },
      },
      {
        field_id: 'income',
        value: '$65,000',
        quote: 'Total Annual Household Income: $65,000 per year',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.652, width: 0.867, height: 0.077 },
        double_read: { agreed: true, crop_value: '$65,000' },
      },
      {
        field_id: 'issue_date',
        value: '12 Aug 2024',
        quote: 'Date of Submission: 12 Aug 2024',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.744, width: 0.867, height: 0.077 },
        double_read: { agreed: true, crop_value: '12 Aug 2024' },
      },
    ],
  },
  {
    document_type: 'marksheet',
    document_label: 'Academic Transcript',
    fields: [
      {
        field_id: 'name',
        value: 'Alex Morgan',
        quote: 'Student Name: Alex Morgan',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.375, width: 0.867, height: 0.077 },
        double_read: { agreed: true, crop_value: 'Alex Morgan' },
      },
      {
        field_id: 'academic_year',
        value: '2024-2025',
        quote: 'Academic Session: 2024-2025',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.467, width: 0.867, height: 0.077 },
        double_read: { agreed: true, crop_value: '2024-2025' },
      },
      {
        field_id: 'marks',
        value: '3.50 GPA',
        quote: 'Cumulative Grade Point Average: 3.50 / 4.0 GPA',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.560, width: 0.867, height: 0.077 },
        double_read: { agreed: true, crop_value: '3.50 GPA' },
      },
    ],
  },
  {
    document_type: 'income_certificate',
    document_label: 'Proof of Income',
    fields: [
      {
        field_id: 'name',
        value: 'Alex Morgan',
        quote: 'Taxpayer / Dependent: Alex Morgan',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.375, width: 0.867, height: 0.077 },
        double_read: { agreed: true, crop_value: 'Alex Morgan' },
      },
      {
        field_id: 'income',
        value: '$48,000',
        quote: 'Adjusted Gross Income: $48,000 per annum',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.467, width: 0.867, height: 0.077 },
        double_read: { agreed: true, crop_value: '$48,000' },
      },
      {
        field_id: 'issue_date',
        value: '18 Aug 2024',
        quote: 'Statement Issue Date: 18 Aug 2024',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.560, width: 0.867, height: 0.077 },
        double_read: { agreed: true, crop_value: '18 Aug 2024' },
      },
    ],
  },
];

export const MESSY_SAMPLE_PACKET: DocumentExtraction[] = [
  {
    document_type: 'application_form',
    document_label: 'Application Form',
    fields: [
      {
        field_id: 'name',
        value: 'Maria J. Alvarez',
        quote: 'Applicant Name: Maria J. Alvarez',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.375, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'academic_year',
        value: '2024-2025',
        quote: 'Academic Year: 2024-2025',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.467, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'marks',
        value: '3.90 GPA',
        quote: 'Cumulative GPA: 3.90 out of 4.0',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.560, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'income',
        value: '€36,000',
        quote: 'Total Annual Household Income: €36,000 per year',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.652, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'issue_date',
        value: '15 Sep 2024',
        quote: 'Application Date: 15 Sep 2024',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.744, width: 0.867, height: 0.077 },
      },
    ],
  },
  {
    document_type: 'marksheet',
    document_label: 'Academic Transcript',
    fields: [
      {
        field_id: 'name',
        value: 'Maria Alvarez',
        quote: 'Student Name: Maria Alvarez',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.375, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'academic_year',
        value: '2024-25',
        quote: 'Academic Session: 2024-25',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.467, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'marks',
        value: '3.65 GPA',
        quote: 'Cumulative GPA: 3.65 / 4.0 GPA',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.560, width: 0.867, height: 0.077 },
      },
    ],
  },
  {
    document_type: 'income_certificate',
    document_label: 'Proof of Income',
    fields: [
      {
        field_id: 'name',
        value: 'Maria Alvarez',
        quote: 'Certified Student: Maria Alvarez',
        page: 1,
        confidence: 0.95,
        highlight_bbox: { x: 0.092, y: 0.375, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'income',
        value: '€3,000 per month',
        quote: 'Assessed Income: €3,000 per month',
        page: 1,
        confidence: 0.95,
        highlight_bbox: { x: 0.092, y: 0.467, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'issue_date',
        value: '12 Oct 2024',
        quote: 'Certificate Issue Date: 12 Oct 2024',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.560, width: 0.867, height: 0.077 },
      },
    ],
  },
];

export const COLLEGE_ADMISSION_SAMPLE_PACKET: DocumentExtraction[] = [
  {
    document_type: 'application_form',
    document_label: 'Admission Application',
    fields: [
      {
        field_id: 'name',
        value: 'Priya Verma',
        quote: 'Candidate Name: Priya Verma',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.375, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'dob',
        value: '14 May 2006',
        quote: 'Date of Birth: 14 May 2006',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.467, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'id_number',
        value: 'APP-2024-8891',
        quote: 'Application Ref No: APP-2024-8891',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.560, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'marks',
        value: '3.92 GPA',
        quote: 'Qualifying GPA: 3.92 / 4.0',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.652, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'academic_year',
        value: '2024-25',
        quote: 'Admission Cycle: 2024-25',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.744, width: 0.867, height: 0.077 },
      },
    ],
  },
  {
    document_type: 'marksheet',
    document_label: 'Academic Transcript',
    fields: [
      {
        field_id: 'name',
        value: 'Priya Verma',
        quote: 'Student: Priya Verma',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.375, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'id_number',
        value: 'APP20248891',
        quote: 'Roll / Reg ID: APP20248891',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.467, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'marks',
        value: '3.75 GPA',
        quote: 'Final Cumulative GPA: 3.75 / 4.0',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.560, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'academic_year',
        value: '2024-25',
        quote: 'Year of Examination: 2024-25',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.652, width: 0.867, height: 0.077 },
      },
    ],
  },
  {
    document_type: 'income_certificate',
    document_label: 'Identity / Transfer Certificate',
    fields: [
      {
        field_id: 'name',
        value: 'Priya Verma',
        quote: 'This is to certify that Priya Verma',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.375, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'dob',
        value: '14 May 2006',
        quote: 'Recorded DOB: 14 May 2006',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.467, width: 0.867, height: 0.077 },
      },
    ],
  },
];

export const FINANCIAL_AID_SAMPLE_PACKET: DocumentExtraction[] = [
  {
    document_type: 'application_form',
    document_label: 'Aid Application Form',
    fields: [
      {
        field_id: 'name',
        value: 'Aman Patel',
        quote: 'Applicant Name: Aman Patel',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.375, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'tax_id',
        value: 'TAX98214US',
        quote: 'Tax Identification Number: TAX98214US',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.467, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'income',
        value: '$36,000',
        quote: 'Declared Family Income: $36,000 per year',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.560, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'issue_date',
        value: '10 Jun 2024',
        quote: 'Date: 10 Jun 2024',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.652, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'category',
        value: 'Grant Scheme A',
        quote: 'Aid Category: Grant Scheme A',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.744, width: 0.867, height: 0.077 },
      },
    ],
  },
  {
    document_type: 'income_certificate',
    document_label: 'Official Tax / Income Statement',
    fields: [
      {
        field_id: 'name',
        value: 'Aman Patel',
        quote: 'Name of Assessee: Aman Patel',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.375, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'tax_id',
        value: 'TAX-98214-US',
        quote: 'Tax Reference: TAX-98214-US',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.467, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'income',
        value: '$3,000 per month',
        quote: 'Monthly Assessed Income: $3,000 per month',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.560, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'issue_date',
        value: '10 Jun 2024',
        quote: 'Issue Date: 10 Jun 2024',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.652, width: 0.867, height: 0.077 },
      },
      {
        field_id: 'category',
        value: 'Grant Scheme B',
        quote: 'Eligible Category: Grant Scheme B',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.744, width: 0.867, height: 0.077 },
      },
    ],
  },
  {
    document_type: 'marksheet',
    document_label: 'Academic Record',
    fields: [
      {
        field_id: 'name',
        value: 'A. Patel',
        quote: 'Student Name: A. Patel',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 0.092, y: 0.375, width: 0.867, height: 0.077 },
      },
    ],
  },
];
