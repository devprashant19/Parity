import fs from 'fs';
import path from 'path';
import { extractDocumentFacts } from '../src/lib/gemini/client';
import { verifyQuoteContainment } from '../src/lib/compare/containment';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
      if (key && val) {
        process.env[key.trim()] = val;
      }
    }
  }
}
loadEnvLocal();

async function runPhonePhotoExtraction() {
  const imagePath = path.resolve(process.cwd(), 'tests/fixtures/unseen/phone_photo_income_cert.jpg');
  const buffer = fs.readFileSync(imagePath);
  const base64Data = buffer.toString('base64');

  console.log('Sending phone-photographed Income Certificate to Gemini...');
  const result = await extractDocumentFacts({
    docType: 'income_certificate',
    docLabel: 'Income Certificate',
    base64Data,
    mimeType: 'image/jpeg',
  });

  console.log('\n=== EXTRACTION RESULT (PHONE PHOTO AT ANGLE) ===');
  console.log('Document Type:', result.document_type);
  for (const f of result.fields) {
    const quoteOk = verifyQuoteContainment(f.value, f.quote);
    console.log(`  - [${f.field_id}]: "${f.value}" | Quote: "${f.quote}" | Containment: ${quoteOk ? 'YES' : 'NO'}`);
  }
}

runPhonePhotoExtraction().catch(console.error);
