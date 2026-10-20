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
  title: 'Academic & Financial Aid Scholarship (Benchmark)',
  description: 'Synthetic applicant packet with 3 planted clerical conflicts and 2 consistent fields.',
  badgeText: 'Sample Result — Synthetic Scholarship Packet',
  documents: [
    {
      type: 'application_form',
      label: 'Application Form (Form No. SCH-2024)',
      fileName: 'application-form-suresh.pdf',
      fileSize: '420 KB',
      previewUrl: '/samples/clean_form.svg',
    },
    {
      type: 'marksheet',
      label: 'Senior Secondary Marksheet / Transcript',
      fileName: 'marksheet-12th-board.png',
      fileSize: '890 KB',
      previewUrl: '/samples/clean_marksheet.svg',
    },
    {
      type: 'income_certificate',
      label: 'Annual Income / Tax Certificate',
      fileName: 'tahsildar-income-cert.png',
      fileSize: '650 KB',
      previewUrl: '/samples/clean_income_cert.svg',
    },
  ],
};

export const MESSY_SAMPLE_META: SamplePacketMetadata = {
  id: 'messy_sample',
  title: 'Financial Aid Application (Messy Scans & Initial Variation)',
  description: 'Synthetic packet demonstrating Needs Review ("S. Sharma" initial) and format normalization ("₹15,000 per month").',
  badgeText: 'Sample Result — Messy Scans Preset',
  documents: [
    {
      type: 'application_form',
      label: 'Application Form (Form No. SCH-2024)',
      fileName: 'application-form-suresh.pdf',
      fileSize: '420 KB',
      previewUrl: '/samples/messy_form.svg',
    },
    {
      type: 'marksheet',
      label: 'Senior Secondary Marksheet',
      fileName: 'marksheet-12th-board.png',
      fileSize: '890 KB',
      previewUrl: '/samples/messy_marksheet.svg',
    },
    {
      type: 'income_certificate',
      label: 'Income Certificate (Monthly Notation & Initials)',
      fileName: 'revenue-cert-initials.png',
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
        value: 'Suresh Sharma',
        quote: 'Applicant Name: Suresh Sharma',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 180, width: 520, height: 40 },
      },
      {
        field_id: 'academic_year',
        value: '2024-25',
        quote: 'Academic Year: 2024-25',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 228, width: 520, height: 40 },
      },
      {
        field_id: 'marks',
        value: '92.4%',
        quote: 'Qualifying Examination Marks: 92.4%',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 276, width: 520, height: 40 },
      },
      {
        field_id: 'income',
        value: '₹2,40,000',
        quote: 'Total Annual Family Income: ₹2,40,000 per annum',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 324, width: 520, height: 40 },
      },
      {
        field_id: 'issue_date',
        value: '15/07/2024',
        quote: 'Date of Declaration: 15/07/2024',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 372, width: 520, height: 40 },
      },
    ],
  },
  {
    document_type: 'marksheet',
    document_label: 'Marksheet',
    fields: [
      {
        field_id: 'name',
        value: 'Suresh Sharma',
        quote: 'Student Name: Suresh Sharma',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 180, width: 520, height: 40 },
      },
      {
        field_id: 'academic_year',
        value: '2024-25',
        quote: 'Session / Academic Year: 2024-25',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 228, width: 520, height: 40 },
      },
      {
        field_id: 'marks',
        value: '89.4%',
        quote: 'Aggregate Marks Obtained: 89.4%',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 276, width: 520, height: 40 },
      },
    ],
  },
  {
    document_type: 'income_certificate',
    document_label: 'Income Certificate',
    fields: [
      {
        field_id: 'name',
        value: 'Suresh Sharma',
        quote: 'Certified Applicant Name: Suresh Sharma',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 180, width: 520, height: 40 },
      },
      {
        field_id: 'income',
        value: '₹1,80,000',
        quote: 'Assessed Annual Income: Rs. 1,80,000 per annum',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 228, width: 520, height: 40 },
      },
      {
        field_id: 'issue_date',
        value: '12/08/2024',
        quote: 'Certificate Issue Date: 12/08/2024',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 276, width: 520, height: 40 },
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
        value: 'Suresh Sharma',
        quote: 'Applicant Name: Suresh Sharma',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 180, width: 520, height: 40 },
      },
      {
        field_id: 'academic_year',
        value: '2024-25',
        quote: 'Academic Year: 2024-25',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 228, width: 520, height: 40 },
      },
      {
        field_id: 'marks',
        value: '92.4%',
        quote: 'Qualifying Examination Marks: 92.4%',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 276, width: 520, height: 40 },
      },
      {
        field_id: 'income',
        value: '₹1,80,000',
        quote: 'Total Annual Family Income: ₹1,80,000 per annum',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 324, width: 520, height: 40 },
      },
      {
        field_id: 'issue_date',
        value: '15/07/2024',
        quote: 'Date of Declaration: 15/07/2024',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 372, width: 520, height: 40 },
      },
    ],
  },
  {
    document_type: 'marksheet',
    document_label: 'Marksheet',
    fields: [
      {
        field_id: 'name',
        value: 'Suresh Sharma',
        quote: 'Student Name: Suresh Sharma',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 180, width: 520, height: 40 },
      },
      {
        field_id: 'academic_year',
        value: '2024-25',
        quote: 'Session / Academic Year: 2024-25',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 228, width: 520, height: 40 },
      },
      {
        field_id: 'marks',
        value: '89.4%',
        quote: 'Aggregate Marks Obtained: 89.4%',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 276, width: 520, height: 40 },
      },
    ],
  },
  {
    document_type: 'income_certificate',
    document_label: 'Income Certificate',
    fields: [
      {
        field_id: 'name',
        value: 'S. Sharma', // Needs Review against Suresh Sharma
        quote: 'Certified Applicant Name: S. Sharma',
        page: 1,
        confidence: 0.95,
        highlight_bbox: { x: 40, y: 180, width: 520, height: 40 },
      },
      {
        field_id: 'income',
        value: '₹15,000 per month', // 15,000 * 12 = 180,000 -> Consistent with 1,80,000
        quote: 'Assessed Income: ₹15,000 per month',
        page: 1,
        confidence: 0.95,
        highlight_bbox: { x: 40, y: 228, width: 520, height: 40 },
      },
      {
        field_id: 'issue_date',
        value: '12/08/2024', // 12/08/2024 vs 15/07/2024 -> Conflict
        quote: 'Certificate Issue Date: 12/08/2024',
        page: 1,
        confidence: 0.98,
        highlight_bbox: { x: 40, y: 276, width: 520, height: 40 },
      },
    ],
  },
];
