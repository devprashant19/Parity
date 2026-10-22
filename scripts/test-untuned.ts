import fs from 'fs';
import path from 'path';
import { extractDocumentFacts } from '../src/lib/gemini/client';

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

import { verifyQuoteContainment } from '../src/lib/compare/containment';

async function runUntunedExtraction() {
  const imagePath = path.resolve(process.cwd(), 'tests/fixtures/unseen/state_board_marksheet.jpg');
  const buffer = fs.readFileSync(imagePath);
  const base64 = buffer.toString('base64');

  console.log('Sending fictional State Board marksheet to Gemini...');
  const result = await extractDocumentFacts({
    docType: 'marksheet',
    docLabel: '12th Marksheet',
    base64Data: base64,
    mimeType: 'image/jpeg',
  });

  console.log('\n--- EXTRACTION RESULT ---');
  console.log('Document Type:', result.document_type);
  console.log('Fields Extracted:');
  for (const f of result.fields) {
    const quoteOk = verifyQuoteContainment(f.value, f.quote);
    console.log(`  - [${f.field_id}]: "${f.value}" | Quote: "${f.quote}" | Quote Containment: ${quoteOk ? 'YES' : 'NO'}`);
  }
}

runUntunedExtraction().catch(console.error);
