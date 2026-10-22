import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function generatePhonePhoto() {
  const outDir = path.resolve(process.cwd(), 'tests/fixtures/unseen');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'phone_photo_income_cert.jpg');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 1000px;
      height: 800px;
      background: radial-gradient(circle at 70% 20%, #4a453f 0%, #292524 60%, #1c1917 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      perspective: 1200px;
    }
    /* Simulated paper certificate photographed at an angle on a desk */
    .paper {
      width: 620px;
      background: #faf8f3;
      padding: 35px 30px;
      border: 1px solid #d6d3d1;
      border-radius: 2px;
      box-shadow: 
        15px 25px 35px rgba(0, 0, 0, 0.45),
        2px 5px 10px rgba(0, 0, 0, 0.25);
      transform: rotateX(14deg) rotateY(-10deg) rotateZ(3deg);
      font-family: "Times New Roman", Times, serif;
      position: relative;
    }
    /* Uneven room lighting gradient over the physical paper */
    .lighting-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.18) 100%);
      pointer-events: none;
    }
    .header {
      text-align: center;
      margin-bottom: 25px;
      border-bottom: 2px solid #78716c;
      padding-bottom: 12px;
    }
    h1 {
      margin: 0;
      font-size: 19px;
      letter-spacing: 1.5px;
      color: #1c1917;
      text-transform: uppercase;
    }
    h2 {
      margin: 4px 0 0;
      font-size: 13px;
      color: #57534e;
      font-style: italic;
      font-weight: normal;
    }
    .body-text {
      font-size: 14.5px;
      line-height: 1.8;
      color: #292524;
      margin-bottom: 25px;
    }
    .field-row {
      margin: 12px 0;
    }
    .label {
      font-weight: bold;
      color: #1c1917;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #e7e5e4;
      font-size: 12px;
      color: #57534e;
    }
    .officer-sig {
      text-align: right;
    }
    .sig-line {
      font-family: cursive;
      font-size: 15px;
      color: #1e3a8a;
      margin-bottom: 2px;
    }
  </style>
</head>
<body>
  <div class="paper">
    <div class="lighting-overlay"></div>
    <div class="header">
      <h1>Office of the Tahsildar & Revenue Officer</h1>
      <h2>Revenue Department • Government of State</h2>
    </div>

    <div class="body-text">
      This is to certify that upon due inquiry and verification of records, the annual household income from all sources is recorded as follows:

      <div class="field-row">
        <span class="label">Name of Applicant:</span> Suresh Sharma
      </div>
      <div class="field-row">
        <span class="label">Father / Guardian:</span> Omprakash Sharma
      </div>
      <div class="field-row">
        <span class="label">Annual Family Income:</span> ₹1,80,000 per annum
      </div>
      <div class="field-row">
        <span class="label">Date of Issue:</span> 12/08/2024
      </div>
      <div class="field-row">
        <span class="label">Certificate Number:</span> REV-INC-2024-884102
      </div>
    </div>

    <div class="footer">
      <div>Place: District Revenue Center</div>
      <div class="officer-sig">
        <div class="sig-line">R. K. Verma</div>
        <div>Tahsildar / Revenue Magistrate</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: outPath, type: 'jpeg', quality: 88 });
  await browser.close();
  console.log('✓ Created simulated phone photo at:', outPath);
}

generatePhonePhoto().catch(console.error);
