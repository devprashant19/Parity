import fs from 'fs';
import path from 'path';
import { extractDocumentFacts } from '../../src/lib/gemini/client';
import { verifyQuoteContainment } from '../../src/lib/compare/containment';
import { runVerification } from '../../src/lib/compare/engine';
import { DocumentExtraction, ExtractedField, DocumentType, BoundingBox, FieldId, DoubleReadResult } from '../../src/lib/compare/types';
import { normalizeNameTokens } from '../../src/lib/normalize/name';
import { normalizeIncome, normalizeMarks } from '../../src/lib/normalize/numbers';
import { normalizeDate } from '../../src/lib/normalize/dates';
import {
  cropImageToBoundingBox,
  cropImageToFullWidthBand,
  compareDoubleReadValues,
  verifyFieldDoubleRead,
  verifyDocumentCropsBatch,
  FieldToVerify,
} from '../../src/lib/gemini/doubleRead';
import { CLEAN_SAMPLE_PACKET, MESSY_SAMPLE_PACKET } from '../../src/data/samples';

interface GroundTruthItem {
  scan_id: string;
  file: string;
  document_type: DocumentType;
  document_label: string;
  difficulty: string;
  expected_fields: Record<string, { value: string | null; quote: string | null } | null>;
}

// Automatically load .env.local if present
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

async function runEvaluation() {
  loadEnvLocal();

  const isLiveRequested = process.argv.includes('--live');
  const scansDir = path.resolve(process.cwd(), 'tests/fixtures/scans');
  const groundTruthPath = path.join(scansDir, 'ground-truth.json');

  if (!fs.existsSync(groundTruthPath)) {
    console.error('Error: ground-truth.json not found in tests/fixtures/scans');
    process.exit(1);
  }

  const groundTruth: GroundTruthItem[] = JSON.parse(fs.readFileSync(groundTruthPath, 'utf8'));
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

  if (isLiveRequested && (!apiKey || apiKey === 'placeholder' || apiKey === 'your_gemini_api_key_here')) {
    console.error('='.repeat(78));
    console.error('❌ LIVE EVALUATION ERROR: GEMINI_API_KEY is not configured.');
    console.error('='.repeat(78));
    console.error('Live mode (--live) requires a valid Google Gemini API key to read scan pixels.');
    console.error('\nTo run live evaluation against Gemini:');
    console.error('  1. Create a .env.local file in the project root:');
    console.error('     GEMINI_API_KEY=AIzaSy...');
    console.error('     GEMINI_MODEL=gemini-2.5-flash');
    console.error('  2. Re-run: npm run eval:scans:live\n');
    process.exit(1);
  }

  const executionMode = isLiveRequested ? 'LIVE' : 'OFFLINE';

  console.log('='.repeat(78));
  console.log('PARITY VISION EXTRACTION & DETERMINISTIC VERIFICATION BENCHMARK');
  console.log('='.repeat(78));
  console.log(`Benchmark Scans:    ${groundTruth.length} real raster scans (PNG/JPEG)`);
  if (executionMode === 'LIVE') {
    console.log(`Execution Mode:     LIVE GEMINI VISION API (reading real scan pixels)`);
    console.log(`Model Evaluated:    ${modelName}`);
  } else {
    console.log(`Execution Mode:     OFFLINE BENCHMARK (Deterministic engine on fixture baseline)`);
    console.log(`Note:               Tests normalization, quote containment & tri-state logic.`);
    console.log(`                    To evaluate Gemini vision live on scans: npm run eval:scans:live`);
  }
  console.log('-'.repeat(78));

  let totalExpectedFields = 0;
  let correctExtractions = 0;
  let quoteContainmentChecks = 0;
  let quoteContainmentPassed = 0;
  let nullOrMissingFields = 0;
  let doubleReadsAttempted = 0;
  let doubleReadsAgreed = 0;
  let doubleReadsDisagreed = 0;
  let batchedCropCallsMade = 0;

  const extractionsByScanId = new Map<string, DocumentExtraction>();
  const freshExtractions: Record<string, DocumentExtraction> = {};

  for (const item of groundTruth) {
    const filePath = path.join(scansDir, item.file);
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = item.file.endsWith('.jpg') || item.file.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';

    let extraction: DocumentExtraction = {
      document_type: item.document_type,
      document_label: item.document_label,
      fields: [],
    };

    if (executionMode === 'LIVE') {
      const cacheFile = path.join(scansDir, 'live-extractions.json');
      let attempts = 0;
      let success = false;
      while (attempts < 5 && !success) {
        attempts++;
        try {
          console.log(`  -> [${item.scan_id}] Extracting facts via ${modelName} (${item.file})...`);
          extraction = await extractDocumentFacts({
            docType: item.document_type,
            docLabel: item.document_label,
            base64Data,
            mimeType,
          });
          freshExtractions[item.scan_id] = extraction;
          fs.writeFileSync(cacheFile, JSON.stringify(freshExtractions, null, 2));
          success = true;
        } catch (err: any) {
          const errMsg = String(err?.message || err);
          const isDailyQuota = errMsg.includes('PerDay') || errMsg.includes('GenerateRequestsPerDay') || errMsg.includes('retry in 20h');
          const is429 = err?.status === 429 || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED');
          const isTransient = err?.status === 503 || errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('demand') || errMsg.includes('timed out');

          if (isDailyQuota && fs.existsSync(cacheFile)) {
            const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
            if (cached[item.scan_id]) {
              console.log(`  ℹ️  [${item.scan_id}] Gemini free-tier daily quota limit reached (20 req/day); using recorded live Gemini extraction.`);
              extraction = cached[item.scan_id];
              success = true;
              break;
            }
          }

          if (isTransient && attempts < 5) {
            const waitSec = attempts * 5;
            console.log(`     ⏳ Model busy (503 / high demand). Pausing ${waitSec}s before retry ${attempts}/5...`);
            await new Promise((r) => setTimeout(r, waitSec * 1000));
          } else if (is429 && attempts < 5 && !isDailyQuota) {
            console.log(`     ⏳ Per-minute rate limit reached. Pausing 15s before retry ${attempts}/5...`);
            await new Promise((r) => setTimeout(r, 15000));
          } else {
            console.error(`  ❌ Failed live extraction for ${item.file}:`, err?.message || err);
            extraction = {
              document_type: item.document_type,
              document_label: item.document_label,
              fields: [],
            };
            break;
          }
        }
      }
      // Pacing delay between scans to respect free-tier ceiling
      await new Promise((r) => setTimeout(r, 4000));
    } else {
      extraction = createFixtureExtraction(item);
    }

    extractionsByScanId.set(item.scan_id, extraction);

    // Evaluate fields for this scan
    let scanFields = 0;
    let scanCorrect = 0;

    // Batch all crops for this document into full-width horizontal bands
    const fieldsToBatch: FieldToVerify[] = [];
    for (const [fieldId, expected] of Object.entries(item.expected_fields)) {
      if (!expected) continue;
      const extractedField = extraction.fields.find((f) => f.field_id === fieldId);
      const bbox = extractedField?.highlight_bbox || DEFAULT_BBOXES[item.document_type]?.[fieldId];
      if (extractedField && extractedField.value && bbox) {
        try {
          const cropBuffer = await cropImageToFullWidthBand(fileBuffer, bbox);
          fieldsToBatch.push({
            fieldId: fieldId as any,
            field: { ...extractedField, highlight_bbox: bbox },
            cropBuffer,
          });
        } catch {
          // ignore crop packaging error
        }
      }
    }

    let batchResults = new Map<FieldId, DoubleReadResult>();
    if (fieldsToBatch.length > 0) {
      if (executionMode === 'LIVE') {
        batchedCropCallsMade++;
        batchResults = await verifyDocumentCropsBatch({
          documentLabel: item.document_label,
          fieldsToVerify: fieldsToBatch,
          apiKey,
          modelName,
        });
      } else {
        for (const fb of fieldsToBatch) {
          batchResults.set(fb.fieldId, {
            agreed: true,
            crop_value: fb.field.value,
            crop_quote: fb.field.quote,
          });
        }
      }
    }

    console.log(`\n📄 Scan: ${item.scan_id} (${item.file}) [${item.document_label} | Diff: ${item.difficulty}]`);
    console.log(' '.padEnd(4) + 'Field'.padEnd(16) + 'GT Value'.padEnd(26) + 'Gemini Value'.padEnd(26) + 'Quote OK'.padEnd(10) + 'Classification');
    console.log(' '.padEnd(4) + '-'.repeat(105));

    for (const [fieldId, expected] of Object.entries(item.expected_fields)) {
      if (!expected) continue;
      scanFields++;
      totalExpectedFields++;

      const extractedField = extraction.fields.find((f) => f.field_id === fieldId);
      const gemVal = extractedField?.value ?? '<NULL>';
      const gemQuote = extractedField?.quote ?? '<NULL>';

      if (!extractedField || !extractedField.value) {
        nullOrMissingFields++;
        console.log(' '.padEnd(4) + fieldId.padEnd(16) + String(expected.value).padEnd(26) + '<NULL>'.padEnd(26) + 'NO'.padEnd(10) + 'MISMATCH (Missing field)');
        continue;
      }

      // Test quote containment
      quoteContainmentChecks++;
      const containsQuote = verifyQuoteContainment(extractedField.value, extractedField.quote);
      if (containsQuote) {
        quoteContainmentPassed++;
      }

      // Evaluate double-read from batched verification result
      let doubleReadOk = true;
      if (batchResults.has(fieldId as any)) {
        const dr = batchResults.get(fieldId as any)!;
        extractedField.double_read = dr;
        doubleReadsAttempted++;
        if (dr.agreed) {
          doubleReadsAgreed++;
        } else {
          doubleReadsDisagreed++;
          doubleReadOk = false;
          console.log(
            ' '.padEnd(8) +
              `↳ Double-read DISAGREED on ${fieldId}: full "${extractedField.value}" vs crop "${dr.crop_value}" (${dr.disagreement_reason})`
          );
        }
      }

      // Compare values
      const isMatch = compareFieldValues(fieldId, extractedField.value, expected.value);
      let classification = '';

      if (isMatch && containsQuote && doubleReadOk) {
        scanCorrect++;
        correctExtractions++;
        classification = 'MATCH (Normalized match)';
      } else if (!doubleReadOk) {
        classification = 'NEEDS REVIEW (Double-read crop mismatch)';
      } else if (!containsQuote) {
        classification = 'MISMATCH (Quote containment failed)';
      } else if (gemVal !== expected.value && isMatch) {
        classification = 'MATCH (Scoring normalized match)';
      } else {
        // Real difference: check if it's due to document text artifact
        const expStr = expected.value || '';
        const isConcatArtifact = expStr ? (gemVal.includes(expStr + expStr) || gemVal.length > expStr.length * 1.5) : false;
        classification = isConcatArtifact
          ? 'MISMATCH (Real reading of scan layout artifact)'
          : 'MISMATCH (Real extraction difference)';
      }

      console.log(
        ' '.padEnd(4) +
          fieldId.padEnd(16) +
          String(expected.value).padEnd(26) +
          String(gemVal).slice(0, 24).padEnd(26) +
          (containsQuote ? 'YES' : 'NO').padEnd(10) +
          classification
      );
      if (classification.startsWith('MISMATCH')) {
        console.log(' '.padEnd(8) + `↳ Gemini Quote: "${gemQuote}"`);
      }
    }

    const accuracyPct = scanFields > 0 ? ((scanCorrect / scanFields) * 100).toFixed(0) : '100';
    console.log(' '.padEnd(4) + `Result: ${scanCorrect}/${scanFields} fields matching (${accuracyPct}%)`);
  }

  console.log('-'.repeat(78));

  // Cross-packet verification to test for False-Consistent rate
  console.log('\nPACKET TRI-STATE VERIFICATION & FALSE-CONSISTENT AUDIT:');
  console.log('-'.repeat(78));

  const testPackets = [
    {
      name: 'International USD Clean Scholarship Sample Packet',
      presetDocs: CLEAN_SAMPLE_PACKET,
      packetType: 'clean_sample' as const,
      dateFormat: 'Auto' as const,
      differingFields: ['marks', 'income', 'issue_date'],
      expectedConflicts: 3,
      expectedConsistent: 2,
      expectedNeedsReview: 0,
    },
    {
      name: 'International EUR Messy Scholarship Sample Packet',
      presetDocs: MESSY_SAMPLE_PACKET,
      packetType: 'messy_sample' as const,
      dateFormat: 'Auto' as const,
      differingFields: ['marks', 'issue_date', 'name'],
      expectedConflicts: 2,
      expectedConsistent: 2,
      expectedNeedsReview: 1,
    },
    {
      name: 'Regional Scan Packet (DMY Date Setting)',
      scanIds: ['scan_01_clean_form', 'scan_02_clean_marksheet', 'scan_03_clean_income_cert'],
      dateFormat: 'DMY' as const,
      differingFields: ['marks', 'income', 'issue_date'],
      expectedConflicts: 3,
      expectedConsistent: 2,
      expectedNeedsReview: 0,
    },
    {
      name: 'Regional Scan Packet (Auto Date Setting - Ambiguous Numeric Date)',
      scanIds: ['scan_01_clean_form', 'scan_02_clean_marksheet', 'scan_03_clean_income_cert'],
      dateFormat: 'Auto' as const,
      differingFields: ['marks', 'income', 'issue_date'],
      expectedConflicts: 2,
      expectedConsistent: 2,
      expectedNeedsReview: 1,
    },
    {
      name: 'Messy Scan Packet (Initials + Monthly, DMY Date Setting)',
      scanIds: ['scan_01_clean_form', 'scan_06_messy_initials_marksheet', 'scan_07_monthly_income_cert'],
      dateFormat: 'DMY' as const,
      differingFields: ['name', 'marks', 'income', 'issue_date'],
      expectedConflicts: 3,
      expectedConsistent: 1,
      expectedNeedsReview: 1,
    },
    {
      name: 'Disjoint Name Scan Packet (Conflicting Surname, DMY Date Setting)',
      scanIds: ['scan_10_conflict_name_form', 'scan_02_clean_marksheet', 'scan_03_clean_income_cert'],
      dateFormat: 'DMY' as const,
      differingFields: ['name', 'marks', 'income', 'issue_date'],
      expectedConflicts: 4,
      expectedConsistent: 1,
      expectedNeedsReview: 0,
    },
    {
      name: 'Double-Read Disagreement Packet (Simulated OCR Crop Mismatch)',
      scanIds: ['scan_01_clean_form', 'scan_02_clean_marksheet', 'scan_03_clean_income_cert'],
      dateFormat: 'DMY' as const,
      differingFields: ['name', 'marks', 'income', 'issue_date'],
      expectedConflicts: 3,
      expectedConsistent: 1,
      expectedNeedsReview: 1,
      injectDisagreement: true,
    },
    {
      name: 'International US Academic & Payroll Scan Set',
      scanIds: ['scan_01_clean_form', 'scan_11_us_transcript', 'scan_12_us_payslip'],
      dateFormat: 'Auto' as const,
      differingFields: ['name', 'marks', 'income', 'issue_date'],
      expectedConflicts: 4,
      expectedConsistent: 1,
      expectedNeedsReview: 0,
    },
    {
      name: 'International Tax Statement & European Revenue Scan Set',
      scanIds: ['scan_01_clean_form', 'scan_13_tax_statement', 'scan_14_eur_income'],
      dateFormat: 'Auto' as const,
      differingFields: ['name', 'income', 'issue_date'],
      expectedConflicts: 3,
      expectedConsistent: 1,
      expectedNeedsReview: 0,
    },
  ];

  let totalDifferingGroundTruthPairs = 0;
  let falseConsistentCount = 0;
  let totalAgreeingGroundTruthPairs = 0;
  let trueConsistentCount = 0;
  let totalFieldPairsChecked = 0;

  for (const pkt of testPackets) {
    let docs: DocumentExtraction[];
    if ((pkt as any).presetDocs) {
      docs = (pkt as any).presetDocs;
    } else {
      docs = pkt.scanIds!.map((id) => extractionsByScanId.get(id)!);
    }

    if ((pkt as any).injectDisagreement) {
      docs = docs.map((doc) => {
        if (doc.document_type === 'application_form') {
          return {
            ...doc,
            fields: doc.fields.map((f) => {
              if (f.field_id === 'name') {
                return {
                  ...f,
                  double_read: {
                    agreed: false,
                    crop_value: 'Unreadable or Mismatched Glyphs',
                    disagreement_reason:
                      'Double-read mismatch on Application Form: full-page read disagrees with isolated bounding-box crop read.',
                  },
                };
              }
              return f;
            }),
          };
        }
        return doc;
      });
    }

    const pktType = (pkt as any).packetType || 'live';
    const dateFormat = (pkt as any).dateFormat || 'Auto';
    const result = runVerification(docs, pktType, undefined, dateFormat);

    totalFieldPairsChecked += result.fields.length;

    // Evaluate both metrics:
    // 1. False-Consistent: Of field pairs whose ground truth differs, how many were labelled Consistent?
    // 2. True-Consistent Recall: Of field pairs whose ground truth agrees, how many were labelled Consistent?
    for (const f of result.fields) {
      const isDifferingGroundTruth = pkt.differingFields.includes(f.field_id);
      if (isDifferingGroundTruth) {
        totalDifferingGroundTruthPairs++;
        if (f.status === 'Consistent') {
          falseConsistentCount++;
          console.error(`🚨 False-Consistent detected on packet "${pkt.name}" field "${f.field_id}"!`);
        }
      } else {
        totalAgreeingGroundTruthPairs++;
        if (f.status === 'Consistent') {
          trueConsistentCount++;
        }
      }
    }

    console.log(
      `Packet: ${pkt.name}\n` +
        `  -> Conflicts:    ${result.conflicts_count} (expected ${pkt.expectedConflicts})\n` +
        `  -> Consistent:   ${result.consistent_count} (expected ${pkt.expectedConsistent})\n` +
        `  -> Needs Review: ${result.needs_review_count} (expected ${pkt.expectedNeedsReview})`
    );
  }

  const overallAccuracy = ((correctExtractions / totalExpectedFields) * 100).toFixed(1);
  const quotePassRate =
    quoteContainmentChecks > 0 ? ((quoteContainmentPassed / quoteContainmentChecks) * 100).toFixed(1) : '0.0';
  const falseConsistentRate =
    totalDifferingGroundTruthPairs > 0
      ? ((falseConsistentCount / totalDifferingGroundTruthPairs) * 100).toFixed(1)
      : '0.0';
  const trueConsistentRate =
    totalAgreeingGroundTruthPairs > 0
      ? ((trueConsistentCount / totalAgreeingGroundTruthPairs) * 100).toFixed(1)
      : '100.0';
  const doubleReadRate =
    doubleReadsAttempted > 0 ? ((doubleReadsAgreed / doubleReadsAttempted) * 100).toFixed(1) : '100.0';

  console.log('='.repeat(78));
  console.log(`BENCHMARK EVALUATION SUMMARY (${executionMode} MODE)`);
  console.log('='.repeat(78));
  if (executionMode === 'LIVE') {
    console.log(`Multimodal Model Evaluated:           ${modelName}`);
  }
  console.log(`Total Document Fields Checked:        ${totalExpectedFields}`);
  console.log(`Unextracted / Null Fields:            ${nullOrMissingFields}`);
  console.log(`Field-Level Extraction Accuracy:      ${overallAccuracy}% (${correctExtractions}/${totalExpectedFields})`);
  console.log(`Quote Containment Integrity Rate:     ${quotePassRate}% (${quoteContainmentPassed}/${quoteContainmentChecks})`);
  console.log(`Batched Crop API Calls Made:          ${batchedCropCallsMade} document calls (${doubleReadsAttempted} fields verified across batches)`);
  console.log(`Double-Read Agreement Rate:           ${doubleReadRate}% (${doubleReadsAgreed}/${doubleReadsAttempted})`);
  console.log(`Double-Read Disagreements Detected:   ${doubleReadsDisagreed}`);
  console.log(`Total Distinct Scan Sets Evaluated:   ${testPackets.length} scan sets (${totalFieldPairsChecked} total pairs)`);
  console.log(`CRITICAL METRIC - False-Consistent:   ${falseConsistentCount} of ${totalDifferingGroundTruthPairs} differing ground-truth pairs (${falseConsistentRate}%)`);
  console.log(`RECALL METRIC   - True-Consistent:    ${trueConsistentCount} of ${totalAgreeingGroundTruthPairs} agreeing ground-truth pairs (${trueConsistentRate}%)`);
  if (executionMode === 'LIVE' && Object.keys(freshExtractions).length === groundTruth.length) {
    fs.writeFileSync(path.join(scansDir, 'live-extractions.json'), JSON.stringify(freshExtractions, null, 2));
    console.log(`\n💾 Saved all ${groundTruth.length} fresh live extractions to tests/fixtures/scans/live-extractions.json`);
  }

  console.log('='.repeat(78));

  if (falseConsistentCount > 0) {
    console.error('❌ SAFETY ALERT: False-Consistent rate > 0%! Conflicting documents were marked consistent.');
    process.exit(1);
  } else {
    console.log('✅ BENCHMARK PASSED: Zero False-Consistent errors. Deterministic guard intact.\n');
  }
}

function compareFieldValues(fieldId: string, actual: string | null, expected: string | null): boolean {
  if (!actual || !expected) return false;

  if (fieldId === 'name') {
    const tokensActual = normalizeNameTokens(actual).join(' ');
    const tokensExp = normalizeNameTokens(expected).join(' ');
    return tokensActual === tokensExp;
  }

  if (fieldId === 'marks') {
    const normActual = normalizeMarks(actual);
    const normExp = normalizeMarks(expected);
    return normActual.value === normExp.value;
  }

  if (fieldId === 'income') {
    const normActual = normalizeIncome(actual);
    const normExp = normalizeIncome(expected);
    return normActual.value === normExp.value;
  }

  if (fieldId === 'issue_date') {
    const normActual = normalizeDate(actual);
    const normExp = normalizeDate(expected);
    return normActual.iso === normExp.iso;
  }

  return actual.trim().toLowerCase() === expected.trim().toLowerCase();
}

const DEFAULT_BBOXES: Record<string, Record<string, BoundingBox>> = {
  application_form: {
    name: { x: 0.067, y: 0.346, width: 0.867, height: 0.077 },
    academic_year: { x: 0.067, y: 0.438, width: 0.867, height: 0.077 },
    marks: { x: 0.067, y: 0.531, width: 0.867, height: 0.077 },
    income: { x: 0.067, y: 0.623, width: 0.867, height: 0.077 },
    issue_date: { x: 0.067, y: 0.715, width: 0.867, height: 0.077 },
  },
  marksheet: {
    name: { x: 0.067, y: 0.346, width: 0.867, height: 0.077 },
    academic_year: { x: 0.067, y: 0.438, width: 0.867, height: 0.077 },
    marks: { x: 0.067, y: 0.531, width: 0.867, height: 0.077 },
  },
  income_certificate: {
    name: { x: 0.067, y: 0.346, width: 0.867, height: 0.077 },
    academic_year: { x: 0.067, y: 0.438, width: 0.867, height: 0.077 },
    income: { x: 0.067, y: 0.531, width: 0.867, height: 0.077 },
    issue_date: { x: 0.067, y: 0.623, width: 0.867, height: 0.077 },
  },
};

function createFixtureExtraction(item: GroundTruthItem): DocumentExtraction {
  const fields: ExtractedField[] = [];

  for (const [fieldId, expected] of Object.entries(item.expected_fields)) {
    if (expected) {
      const bbox =
        DEFAULT_BBOXES[item.document_type]?.[fieldId] || {
          x: 0.05,
          y: 0.2,
          width: 0.9,
          height: 0.1,
        };

      fields.push({
        field_id: fieldId as any,
        value: expected.value,
        quote: expected.quote,
        page: 1,
        confidence: 0.95,
        highlight_bbox: bbox,
      });
    }
  }

  return {
    document_type: item.document_type,
    document_label: item.document_label,
    fields,
  };
}

runEvaluation().catch((err) => {
  console.error(err);
  process.exit(1);
});
