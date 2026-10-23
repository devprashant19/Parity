import { FieldComparison } from '../compare/types';

export interface OfficeMessageParams {
  field: FieldComparison;
  studentName?: string;
  referenceId?: string;
  issuingAuthority?: string;
  studentEmail?: string;
  studentPhone?: string;
}

export interface DraftedOfficeMessage {
  subject: string;
  recipient: string;
  body: string;
  enclosures: string[];
}

/**
 * Drafts a polite, formal correction letter/email to the issuing office
 * detailing the clerical discrepancy and quoting verbatim evidence.
 */
export function draftIssuingOfficeMessage(params: OfficeMessageParams): DraftedOfficeMessage {
  const { field, studentName, referenceId, issuingAuthority, studentEmail, studentPhone } = params;

  // Determine likely authority if not specified
  let targetAuthority = issuingAuthority;
  if (!targetAuthority) {
    if (field.field_id === 'marks' || field.field_id === 'academic_year') {
      targetAuthority = 'The Controller of Examinations / Board of Secondary Education';
    } else if (field.field_id === 'income') {
      targetAuthority = 'The Tahsildar / Sub-Divisional Magistrate (Revenue Department)';
    } else if (field.field_id === 'issue_date') {
      targetAuthority = 'The Certificate Issuing Authority / Revenue Office';
    } else {
      targetAuthority = 'The Competent Issuing Authority / Administrative Registrar';
    }
  }

  const applicant = studentName || 'Applicant / Student';
  const refText = referenceId ? ` [Ref / Roll No: ${referenceId}]` : '';
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const subject = `Urgent: Request for Clerical Correction in ${field.field_label}${refText}`;

  // Identify doc with the error
  const docs = field.documents;
  const docA = docs[0];
  const docB = docs[1] || docs[0];

  const valueA = docA?.raw_value || '<Not Recorded>';
  const valueB = docB?.raw_value || '<Not Recorded>';
  const quoteB = docB?.quote ? ` (verbatim excerpt: "${docB.quote}")` : '';

  const body = `Date: ${dateStr}

To,
${targetAuthority}

Subject: ${subject}

Respected Sir / Madam,

I am writing to respectfully bring to your attention a clerical discrepancy identified during the pre-submission consistency audit of my document packet for my upcoming academic / portal application.

Details of the discrepancy are as follows:
----------------------------------------------------------------------
1. Field in Discrepancy: ${field.field_label}
2. Primary Application Record (${docA.doc_label}): "${valueA}"
3. Issued Certificate Record (${docB.doc_label}): "${valueB}"${quoteB}
4. Nature of Inconsistency: ${field.status_reason}
----------------------------------------------------------------------

As verified from the primary records, the intended and correct value is "${valueA}". The discrepancy in the issued ${docB.doc_label} appears to be an unintentional administrative or transcription variance.

Because high-stakes submission portals enforce strict deterministic document validation, any mismatch between my application declaration and supporting certificates may result in summary rejection or disqualification.

Therefore, I humbly request that your office review the attached supporting documents and kindly issue a corrected certificate, corrigendum, or clarification letter at your earliest convenience.

Enclosures Attached:
1. Self-attested copy of the issued ${docB.doc_label} highlighting the discrepancy.
2. Verified copy of primary records / Application Form (${docA.doc_label}).
3. Valid government photo identification proof.

Thank you for your prompt attention and assistance in resolving this matter.

Yours faithfully,

${applicant}
${studentEmail ? `Email: ${studentEmail}` : ''}
${studentPhone ? `Phone: ${studentPhone}` : ''}`;

  return {
    subject,
    recipient: targetAuthority,
    body,
    enclosures: [
      `Copy of issued ${docB.doc_label}`,
      `Copy of supporting primary record (${docA.doc_label})`,
      'Valid Government Photo ID Proof',
    ],
  };
}
