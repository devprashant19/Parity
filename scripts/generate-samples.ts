import fs from 'fs';
import path from 'path';

const SAMPLES_DIR = path.resolve(process.cwd(), 'public/samples');

if (!fs.existsSync(SAMPLES_DIR)) {
  fs.mkdirSync(SAMPLES_DIR, { recursive: true });
}

function createDocSvg(title: string, subtitle: string, fields: [string, string][], sealText: string, borderColor = '#3b82f6') {
  const fieldRows = fields
    .map(
      ([label, val], i) => `
    <g transform="translate(40, ${180 + i * 48})">
      <rect width="520" height="40" rx="4" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
      <text x="16" y="25" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#475569">${label}:</text>
      <text x="220" y="25" font-family="JetBrains Mono, monospace" font-size="14" font-weight="700" fill="#0f172a">${val}</text>
    </g>`
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 520" width="600" height="520">
  <defs>
    <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>
  <rect width="600" height="520" fill="#f1f5f9" />
  <g transform="translate(15, 15)">
    <rect width="570" height="490" rx="8" fill="url(#paperGrad)" stroke="#cbd5e1" stroke-width="2" />
    <rect x="8" y="8" width="554" height="474" rx="4" fill="none" stroke="${borderColor}" stroke-width="1.5" stroke-dasharray="4 2" />
    
    <!-- Header -->
    <text x="285" y="55" font-family="Georgia, serif" font-size="19" font-weight="bold" text-anchor="middle" fill="#0f172a">${title}</text>
    <text x="285" y="80" font-family="Inter, sans-serif" font-size="12" text-anchor="middle" fill="#64748b">${subtitle}</text>
    <line x1="40" y1="100" x2="530" y2="100" stroke="#e2e8f0" stroke-width="1.5" />
    
    <text x="40" y="140" font-family="Inter, sans-serif" font-size="12" font-style="italic" fill="#64748b">Verified Official Record Excerpt • Higher Education Application Portal</text>
    
    <!-- Fields -->
    ${fieldRows}
    
    <!-- Official Stamp -->
    <g transform="translate(380, 410)">
      <circle cx="50" cy="30" r="34" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="3 2" />
      <text x="50" y="27" font-family="Inter, sans-serif" font-size="9" font-weight="bold" text-anchor="middle" fill="#dc2626">${sealText}</text>
      <text x="50" y="39" font-family="Inter, sans-serif" font-size="8" text-anchor="middle" fill="#dc2626">OFFICIAL VERIFIED</text>
    </g>
    <text x="40" y="450" font-family="Inter, sans-serif" font-size="10" fill="#94a3b8">Document Security ID: SYNTHETIC-PARITY-POC-TEST-ONLY</text>
  </g>
</svg>`;
}

// Generate Clean Samples
const cleanForm = createDocSvg(
  'MERIT & FINANCIAL AID SCHOLARSHIP',
  'Candidate Application Form (Form ID: SCH-2024-8841)',
  [
    ['Applicant Name', 'Suresh Sharma'],
    ['Academic Year', '2024-25'],
    ['Qualifying Examination Marks', '92.4%'],
    ['Total Annual Family Income', '₹2,40,000 per annum'],
    ['Date of Declaration', '15/07/2024'],
  ],
  'SUBMITTED',
  '#2563eb'
);

const cleanMarksheet = createDocSvg(
  'BOARD OF HIGHER SECONDARY EDUCATION',
  'Senior Secondary Certificate Examination Marksheet',
  [
    ['Student Name', 'Suresh Sharma'],
    ['Session / Academic Year', '2024-25'],
    ['Aggregate Marks Obtained', '89.4%'],
    ['Result Status', 'PASS (First Division)'],
  ],
  'SEAL & SIGN',
  '#059669'
);

const cleanIncome = createDocSvg(
  'OFFICE OF THE REVENUE & TAX AUTHORITY',
  'Annual Family Income Certificate (Form No. 16-B)',
  [
    ['Certified Applicant Name', 'Suresh Sharma'],
    ['Assessed Annual Income', 'Rs. 1,80,000 per annum'],
    ['Certificate Issue Date', '12/08/2024'],
    ['Validity Period', '1 Year (FY 2024-2025)'],
  ],
  'REVENUE DEPT',
  '#d97706'
);

// Generate Messy Samples
const messyForm = createDocSvg(
  'MERIT & FINANCIAL AID SCHOLARSHIP',
  'Candidate Application Form (Form ID: SCH-2024-9104)',
  [
    ['Applicant Name', 'Suresh Sharma'],
    ['Academic Year', '2024-25'],
    ['Qualifying Examination Marks', '92.4%'],
    ['Total Annual Family Income', '₹1,80,000 per annum'],
    ['Date of Declaration', '15/07/2024'],
  ],
  'SUBMITTED',
  '#2563eb'
);

const messyMarksheet = createDocSvg(
  'BOARD OF HIGHER SECONDARY EDUCATION',
  'Senior Secondary Certificate Examination Marksheet',
  [
    ['Student Name', 'Suresh Sharma'],
    ['Session / Academic Year', '2024-25'],
    ['Aggregate Marks Obtained', '89.4%'],
    ['Result Status', 'PASS (First Division)'],
  ],
  'SEAL & SIGN',
  '#059669'
);

const messyIncome = createDocSvg(
  'OFFICE OF THE REVENUE & TAX AUTHORITY',
  'Annual Family Income Certificate (Form No. 16-B)',
  [
    ['Certified Applicant Name', 'S. Sharma'],
    ['Assessed Income', '₹15,000 per month'],
    ['Certificate Issue Date', '12/08/2024'],
    ['Validity Period', '1 Year (FY 2024-2025)'],
  ],
  'REVENUE DEPT',
  '#d97706'
);

// Write SVG files
fs.writeFileSync(path.join(SAMPLES_DIR, 'clean_form.svg'), cleanForm);
fs.writeFileSync(path.join(SAMPLES_DIR, 'clean_marksheet.svg'), cleanMarksheet);
fs.writeFileSync(path.join(SAMPLES_DIR, 'clean_income_cert.svg'), cleanIncome);

fs.writeFileSync(path.join(SAMPLES_DIR, 'messy_form.svg'), messyForm);
fs.writeFileSync(path.join(SAMPLES_DIR, 'messy_marksheet.svg'), messyMarksheet);
fs.writeFileSync(path.join(SAMPLES_DIR, 'messy_income_cert.svg'), messyIncome);

// Also copy or symlink/fallback to png naming for compatibility if needed
fs.writeFileSync(path.join(SAMPLES_DIR, 'clean_form.png'), cleanForm);
fs.writeFileSync(path.join(SAMPLES_DIR, 'clean_marksheet.png'), cleanMarksheet);
fs.writeFileSync(path.join(SAMPLES_DIR, 'clean_income_cert.png'), cleanIncome);
fs.writeFileSync(path.join(SAMPLES_DIR, 'messy_form.png'), messyForm);
fs.writeFileSync(path.join(SAMPLES_DIR, 'messy_marksheet.png'), messyMarksheet);
fs.writeFileSync(path.join(SAMPLES_DIR, 'messy_income_cert.png'), messyIncome);

console.log('Successfully generated synthetic sample document assets in public/samples/');
