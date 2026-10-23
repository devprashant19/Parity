import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCANS_DIR = path.resolve(process.cwd(), 'tests/fixtures/scans');

if (!fs.existsSync(SCANS_DIR)) {
  fs.mkdirSync(SCANS_DIR, { recursive: true });
}

export interface DocSpec {
  fileName: string;
  type: 'png' | 'jpeg';
  title: string;
  subtitle: string;
  docTypeBadge: string;
  fields: [string, string, string][]; // [label, value, quote_prefix]
  sealText: string;
  certNumber: string;
  styleModifier?: string;
}

export const docs: DocSpec[] = [
  {
    fileName: 'scan_01_clean_form.png',
    type: 'png',
    title: 'STATE HIGHER EDUCATION • SCHOLARSHIP PORTAL',
    subtitle: 'Academic Merit & Financial Aid (Higher Education) Application Form',
    docTypeBadge: 'CANDIDATE APPLICATION FORM • FORM ID: SCH-2024-8841',
    fields: [
      ['Candidate Full Name', 'Suresh Sharma', 'Applicant Name: '],
      ['Academic Session', '2024-25', 'Academic Year Applied: '],
      ['Qualifying Examination Marks', '92.4%', 'Aggregate 12th Board Marks: '],
      ['Total Annual Family Income', '₹2,40,000 per annum', 'Declared Annual Family Income: '],
      ['Application Submission Date', '15/07/2024', 'Date of Submission: '],
    ],
    sealText: 'DIRECTORATE OF HIGHER EDUCATION',
    certNumber: 'APP-REG-2024-884192',
  },
  {
    fileName: 'scan_02_clean_marksheet.png',
    type: 'png',
    title: 'HIGHER SECONDARY EDUCATION BOARD',
    subtitle: 'State Examination Authority • Senior Secondary Annual Examination Mark Statement',
    docTypeBadge: 'OFFICIAL STATEMENT OF MARKS • REGISTER NO: 24SEC98142',
    fields: [
      ['Student Name', 'Suresh Sharma', 'Name of Student: '],
      ['Academic Examination Year', '2024-25', 'Academic Year: '],
      ['Overall Percentage Obtained', '89.4%', 'Aggregate Percentage: '],
      ['Result Status', 'FIRST CLASS WITH DISTINCTION', 'Final Result: '],
    ],
    sealText: 'ACADEMIC BOARD • VERIFIED',
    certNumber: 'SEC-MS-2024-98142',
  },
  {
    fileName: 'scan_03_clean_income_cert.png',
    type: 'png',
    title: 'REVENUE & TAXATION DEPARTMENT • STATE GOVERNMENT',
    subtitle: 'Office of the Revenue Authority • Official Income Certificate',
    docTypeBadge: 'INCOME CERTIFICATE (UNDER SECTION 4 OF SCHOLARSHIP ACT)',
    fields: [
      ['Name of Person/Applicant', 'Suresh Sharma', 'This is to certify that '],
      ['Certified Annual Income', '₹1,80,000', 'Annual Family Income is '],
      ['Date of Certificate Issue', '12/08/2024', 'Issued under my hand and seal on '],
      ['Validity Period', '3 Years from date of issue', 'Validity: '],
    ],
    sealText: 'REVENUE AUTHORITY • OFFICIAL SEAL',
    certNumber: 'RD-00381948194',
  },
  {
    fileName: 'scan_04_blurry_marksheet.jpg',
    type: 'jpeg',
    title: 'HIGHER SECONDARY EDUCATION BOARD',
    subtitle: 'State Examination Authority • Senior Secondary Annual Examination Mark Statement',
    docTypeBadge: 'OFFICIAL STATEMENT OF MARKS (SCANNED COPY)',
    fields: [
      ['Student Name', 'Suresh Sharma', 'Name of Student: '],
      ['Academic Examination Year', '2024-25', 'Academic Year: '],
      ['Overall Percentage Obtained', '89.4%', 'Aggregate Percentage: '],
      ['Result Status', 'FIRST CLASS WITH DISTINCTION', 'Final Result: '],
    ],
    sealText: 'ACADEMIC BOARD • VERIFIED',
    certNumber: 'SEC-MS-2024-98142',
    styleModifier: 'filter: blur(1.3px);',
  },
  {
    fileName: 'scan_05_rotated_income_cert.jpg',
    type: 'jpeg',
    title: 'REVENUE & TAXATION DEPARTMENT • STATE GOVERNMENT',
    subtitle: 'Office of the Revenue Authority • Official Income Certificate',
    docTypeBadge: 'INCOME CERTIFICATE • OFFICIAL REVENUE RECORD',
    fields: [
      ['Name of Person/Applicant', 'Suresh Sharma', 'This is to certify that '],
      ['Certified Annual Income', '₹1,80,000 per year', 'Annual Family Income is '],
      ['Date of Certificate Issue', '12/08/2024', 'Issued under my hand and seal on '],
    ],
    sealText: 'REVENUE AUTHORITY • OFFICIAL SEAL',
    certNumber: 'RD-00381948194',
    styleModifier: 'transform: rotate(-2.2deg) scale(0.97); transform-origin: center center;',
  },
  {
    fileName: 'scan_06_messy_initials_marksheet.png',
    type: 'png',
    title: 'HIGHER SECONDARY EDUCATION BOARD',
    subtitle: 'State Examination Authority • Senior Secondary Annual Examination Mark Statement',
    docTypeBadge: 'OFFICIAL STATEMENT OF MARKS • REGISTER NO: 24SEC98142',
    fields: [
      ['Student Name', 'S. Sharma', 'Name of Student: '],
      ['Academic Examination Year', '2024-25', 'Academic Year: '],
      ['Overall Percentage Obtained', '89.4%', 'Aggregate Percentage: '],
      ['Result Status', 'FIRST CLASS WITH DISTINCTION', 'Final Result: '],
    ],
    sealText: 'ACADEMIC BOARD • VERIFIED',
    certNumber: 'SEC-MS-2024-98142',
  },
  {
    fileName: 'scan_07_monthly_income_cert.png',
    type: 'png',
    title: 'REVENUE & TAXATION DEPARTMENT • STATE GOVERNMENT',
    subtitle: 'Office of the Revenue Authority • Official Income Certificate',
    docTypeBadge: 'INCOME CERTIFICATE • MONTHLY REVENUE ASSESSMENT',
    fields: [
      ['Name of Person/Applicant', 'Suresh Sharma', 'This is to certify that '],
      ['Certified Monthly Income', '₹15,000 per month', 'Monthly Family Income is '],
      ['Date of Certificate Issue', '12/08/2024', 'Issued under my hand and seal on '],
    ],
    sealText: 'REVENUE AUTHORITY • OFFICIAL SEAL',
    certNumber: 'RD-00381948194',
  },
  {
    fileName: 'scan_08_honorific_form.png',
    type: 'png',
    title: 'STATE HIGHER EDUCATION • SCHOLARSHIP PORTAL',
    subtitle: 'Academic Merit & Financial Aid (Higher Education) Application Form',
    docTypeBadge: 'CANDIDATE APPLICATION FORM • FORM ID: SCH-2024-8841',
    fields: [
      ['Candidate Full Name', 'Shri Suresh Sharma', 'Applicant Name: '],
      ['Academic Session', '2024-25', 'Academic Year Applied: '],
      ['Qualifying Examination Marks', '92.4%', 'Aggregate 12th Board Marks: '],
      ['Total Annual Family Income', '₹2,40,000 per annum', 'Declared Annual Family Income: '],
      ['Application Submission Date', '15/07/2024', 'Date of Submission: '],
    ],
    sealText: 'DIRECTORATE OF HIGHER EDUCATION',
    certNumber: 'APP-REG-2024-884192',
  },
  {
    fileName: 'scan_09_low_contrast_income.jpg',
    type: 'jpeg',
    title: 'REVENUE & TAXATION DEPARTMENT • STATE GOVERNMENT',
    subtitle: 'Office of the Revenue Authority • Official Income Certificate',
    docTypeBadge: 'INCOME CERTIFICATE (FADED INK PHOTOCOPY)',
    fields: [
      ['Name of Person/Applicant', 'Suresh Sharma', 'This is to certify that '],
      ['Certified Annual Income', '₹1,80,000 per annum', 'Annual Family Income is '],
      ['Date of Certificate Issue', '12/08/2024', 'Issued under my hand and seal on '],
    ],
    sealText: 'REVENUE AUTHORITY • OFFICIAL SEAL',
    certNumber: 'RD-00381948194',
    styleModifier: 'filter: contrast(0.75) brightness(1.12);',
  },
  {
    fileName: 'scan_10_conflict_name_form.png',
    type: 'png',
    title: 'STATE HIGHER EDUCATION • SCHOLARSHIP PORTAL',
    subtitle: 'Academic Merit & Financial Aid (Higher Education) Application Form',
    docTypeBadge: 'CANDIDATE APPLICATION FORM • FORM ID: SCH-2024-8841',
    fields: [
      ['Candidate Full Name', 'Suresh Verma', 'Applicant Name: '],
      ['Academic Session', '2024-25', 'Academic Year Applied: '],
      ['Qualifying Examination Marks', '92.4%', 'Aggregate 12th Board Marks: '],
      ['Total Annual Family Income', '₹2,40,000 per annum', 'Declared Annual Family Income: '],
      ['Application Submission Date', '15/07/2024', 'Date of Submission: '],
    ],
    sealText: 'DIRECTORATE OF HIGHER EDUCATION',
    certNumber: 'APP-REG-2024-884192',
  },
  {
    fileName: 'scan_11_us_transcript.png',
    type: 'png',
    title: 'METROPOLITAN UNIVERSITY • OFFICE OF THE REGISTRAR',
    subtitle: 'Official Undergraduate Academic Transcript & Grade Record',
    docTypeBadge: 'ACADEMIC TRANSCRIPT • ACCREDITED RECORD',
    fields: [
      ['Student Full Name', 'Alex Morgan', 'Student Name: '],
      ['Academic Session', '2024-25', 'Academic Year: '],
      ['Cumulative Grade Point Average', '3.82 GPA', 'Cumulative GPA: '],
      ['Degree Program', 'B.S. in Computer Science', 'Major: '],
    ],
    sealText: 'UNIVERSITY REGISTRAR • SEAL',
    certNumber: 'US-TR-2024-91823',
  },
  {
    fileName: 'scan_12_us_payslip.png',
    type: 'png',
    title: 'GLOBAL LOGISTICS CORP • PAYROLL SERVICES',
    subtitle: 'Employee Earnings Statement & Biweekly Pay Advice',
    docTypeBadge: 'BIWEEKLY PAYROLL SLIP • PERIOD ENDING 12/08/2024',
    fields: [
      ['Employee Name', 'Alex Morgan', 'Employee Name: '],
      ['Pay Frequency', 'Biweekly', 'Frequency: '],
      ['Net Earnings', '$2,500 every two weeks', 'Net Pay: '],
      ['Payment Date', '12/08/2024', 'Pay Date: '],
    ],
    sealText: 'PAYROLL DISBURSEMENT • VALIDATED',
    certNumber: 'PAY-US-2024-7712',
  },
  {
    fileName: 'scan_13_tax_statement.png',
    type: 'png',
    title: 'INTERNAL REVENUE SERVICE • W-2 WAGE AND TAX STATEMENT',
    subtitle: 'Department of the Treasury • Official Tax Return Statement',
    docTypeBadge: 'FORM W-2 TAX STATEMENT • TAX YEAR 2024',
    fields: [
      ['Taxpayer Name', 'Alex Morgan', 'Taxpayer: '],
      ['Tax Year / Academic Period', '2024-25', 'Session: '],
      ['Annual Wages & Compensation', '$65,000 per year', 'Total Compensation: '],
      ['Filing Date', '15/07/2024', 'Date Filed: '],
    ],
    sealText: 'INTERNAL REVENUE • AUTHORIZED',
    certNumber: 'W2-2024-009182',
  },
  {
    fileName: 'scan_14_eur_income.png',
    type: 'png',
    title: 'RÉPUBLIQUE EUROPÉENNE • ATTESTATION DE SALAIRE',
    subtitle: 'Direction Générale des Finances Publiques • Déclaration de Revenus',
    docTypeBadge: 'ATTESTATION OFFICIELLE DE REVENUS • UNION EUROPÉENNE',
    fields: [
      ['Nom du Salarié', 'José Alvarez', 'Bénéficiaire: '],
      ['Année de Référence', '2024-25', 'Période: '],
      ['Rémunération Mensuelle Nette', '€3,500 per month', 'Revenu Mensuel Net: '],
      ['Date d\'Établissement', '12 Aug 2024', 'Fait le: '],
    ],
    sealText: 'MINISTÈRE DES FINANCES • OFFICIEL',
    certNumber: 'EUR-REV-2024-8831',
  },
];

export function buildHtml(doc: DocSpec): string {
  const rows = doc.fields
    .map(
      ([label, val, prefix]) => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; margin-bottom: 10px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px;">
        <span style="font-size: 13px; font-weight: 600; color: #525252; font-family: sans-serif;">${label}:</span>
        <span style="font-size: 15px; font-weight: 700; color: #171717; font-family: monospace;">${prefix}<mark style="background: transparent; color: #171717; font-weight: 700;">${val}</mark></span>
      </div>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 30px;
      background: #e5e7eb;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .sheet-wrapper {
      ${doc.styleModifier || ''}
      transition: all 0.2s ease;
    }
    .sheet {
      width: 720px;
      background: #ffffff;
      padding: 40px;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid #d4d4d8;
      box-sizing: border-box;
      position: relative;
    }
    .border-inner {
      border: 2px dashed #94a3b8;
      padding: 24px;
      border-radius: 4px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-family: Georgia, serif;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
      margin: 0 0 6px 0;
    }
    .header p {
      font-size: 12px;
      color: #64748b;
      margin: 0;
      font-weight: 500;
    }
    .badge {
      display: inline-block;
      margin-top: 10px;
      padding: 4px 10px;
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 700;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      letter-spacing: 0.5px;
    }
    .footer {
      margin-top: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .stamp {
      width: 120px;
      height: 60px;
      border: 2px dashed #dc2626;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #dc2626;
      font-size: 9px;
      font-weight: 800;
      transform: rotate(-4deg);
      text-align: center;
      padding: 4px;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div class="sheet-wrapper">
    <div class="sheet">
      <div class="border-inner">
        <div class="header">
          <h1>${doc.title}</h1>
          <p>${doc.subtitle}</p>
          <div class="badge">${doc.docTypeBadge}</div>
        </div>

        <div class="fields-container">
          ${rows}
        </div>

        <div class="footer">
          <div>
            <div style="font-size: 10px; color: #94a3b8; font-family: monospace;">CERTIFICATE ID: ${doc.certNumber}</div>
            <div style="font-size: 10px; color: #94a3b8; font-family: monospace;">DIGITALLY SECURED • PARITY BENCHMARK SCAN</div>
          </div>
          <div class="stamp">
            <div>${doc.sealText}</div>
            <div style="font-size: 8px; margin-top: 2px;">OFFICIALLY VERIFIED</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

async function generateAllScans() {
  console.log(`Generating 10 real raster scans in ${SCANS_DIR}...`);
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 900, height: 800 },
    deviceScaleFactor: 2, // High DPI raster
  });

  for (const doc of docs) {
    const html = buildHtml(doc);
    await page.setContent(html, { waitUntil: 'load' });
    const filePath = path.join(SCANS_DIR, doc.fileName);

    const sheetElement = page.locator('.sheet');
    await sheetElement.screenshot({
      path: filePath,
      type: doc.type,
      quality: doc.type === 'jpeg' ? 88 : undefined,
    });
    console.log(`✓ Created raster scan: ${doc.fileName} (${doc.type})`);
  }

  await browser.close();
  console.log('Done generating benchmark scans.');
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/generate-scans.ts')) {
  generateAllScans().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
