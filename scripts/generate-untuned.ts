import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function createStateBoardDoc() {
  const outDir = path.resolve(process.cwd(), 'tests/fixtures/unseen');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Remove legacy CBSE file if present
  const oldPath = path.join(outDir, 'realworld_cbse_marksheet.jpg');
  if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

  const outPath = path.join(outDir, 'state_board_marksheet.jpg');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #71717a;
      font-family: "Times New Roman", Times, serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .diploma {
      width: 760px;
      background: #fdfbf7;
      padding: 30px;
      border: 4px solid #3f3f46;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      box-sizing: border-box;
      position: relative;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #52525b;
      padding-bottom: 12px;
    }
    h1 {
      margin: 0;
      font-size: 20px;
      letter-spacing: 2px;
      color: #18181b;
      text-transform: uppercase;
    }
    h2 {
      margin: 6px 0 0;
      font-size: 13px;
      font-style: italic;
      color: #52525b;
      font-weight: normal;
    }
    .cert-body {
      font-size: 14px;
      line-height: 1.6;
      color: #27272a;
      margin-bottom: 20px;
    }
    .table-marks {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 13px;
    }
    .table-marks th, .table-marks td {
      border: 1px solid #a1a1aa;
      padding: 6px 10px;
      text-align: left;
    }
    .table-marks th {
      background: #f4f4f5;
      font-weight: bold;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #d4d4d8;
    }
  </style>
</head>
<body>
  <div class="diploma">
    <div class="header">
      <h1>State Board of Secondary Education</h1>
      <h2>Senior Secondary Certificate Examination (Class XII) • Academic Year 2024-25</h2>
    </div>

    <div class="cert-body">
      This is to certify that candidate <strong>Rahul Sharma</strong>, Roll No. <strong>24619402</strong>,
      Mother's Name <strong>Sunita Sharma</strong>, Father's Name <strong>Ramesh Sharma</strong>,
      has appeared in the Senior Secondary Certificate Examination and achieved the following performance:
    </div>

    <table class="table-marks">
      <thead>
        <tr>
          <th>Subject Code</th>
          <th>Subject Description</th>
          <th>Maximum Marks</th>
          <th>Marks Obtained</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>301</td><td>English Core</td><td>100</td><td>86</td></tr>
        <tr><td>041</td><td>Mathematics</td><td>100</td><td>91</td></tr>
        <tr><td>042</td><td>Physics (Theory + Practical)</td><td>100</td><td>88</td></tr>
        <tr><td>043</td><td>Chemistry (Theory + Practical)</td><td>100</td><td>89</td></tr>
        <tr><td>083</td><td>Computer Science</td><td>100</td><td>94</td></tr>
        <tr style="background: #fbfbfb; font-weight: bold;">
          <td colspan="3">Cumulative Aggregate / Percentage Obtained</td>
          <td>448 / 500 (89.6%)</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div>
        <div style="font-size: 11px; color: #71717a;">Date of Result Declaration: <strong>14/05/2024</strong></div>
        <div style="font-size: 10px; color: #a1a1aa; margin-top: 4px;">Certificate Sl. No: SBSE-STATE-2024-918239</div>
      </div>
      <div style="text-align: right;">
        <div style="font-family: cursive; font-size: 16px; color: #1e3a8a;">K. S. Narayanan</div>
        <div style="font-size: 11px; color: #71717a; border-top: 1px solid #71717a; padding-top: 2px;">Controller of Examinations</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  const sheet = page.locator('.diploma');
  await sheet.screenshot({ path: outPath, type: 'jpeg', quality: 90 });
  await browser.close();
  console.log('✓ Created fictional State Board marksheet at:', outPath);
}

createStateBoardDoc().catch(console.error);
