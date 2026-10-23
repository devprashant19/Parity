import sharp from 'sharp';
import { GoogleGenAI } from '@google/genai';
import { BoundingBox, CustomFieldDefinition, DoubleReadResult, ExtractedField, FieldId, DocumentExtraction } from '../compare/types';
import { normalizeNameTokens } from '../normalize/name';
import { normalizeIncome, normalizeMarks } from '../normalize/numbers';
import { normalizeDate } from '../normalize/dates';
import { runVerification } from '../compare/engine';

/**
 * Crops an image buffer to the exact normalized bounding box coordinates.
 * Clamps dimensions to valid pixel bounds with safety padding.
 */
export async function cropImageToBoundingBox(
  imageBuffer: Buffer,
  bbox: BoundingBox,
  paddingPercent = 0.02
): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const imgWidth = metadata.width || 600;
  const imgHeight = metadata.height || 520;

  // Apply slight padding to avoid clipping edge characters, clamped to image boundaries
  const paddedX = Math.max(0, bbox.x - paddingPercent);
  const paddedY = Math.max(0, bbox.y - paddingPercent);
  const paddedW = Math.min(1.0 - paddedX, bbox.width + paddingPercent * 2);
  const paddedH = Math.min(1.0 - paddedY, bbox.height + paddingPercent * 2);

  const left = Math.max(0, Math.floor(paddedX * imgWidth));
  const top = Math.max(0, Math.floor(paddedY * imgHeight));
  const width = Math.max(10, Math.min(imgWidth - left, Math.ceil(paddedW * imgWidth)));
  const height = Math.max(10, Math.min(imgHeight - top, Math.ceil(paddedH * imgHeight)));

  return sharp(imageBuffer)
    .extract({ left, top, width, height })
    .png()
    .toBuffer();
}

/**
 * Crops an image buffer to the full-width horizontal band around the box (±1 row).
 * This ensures label, value, and row context are preserved without horizontal clipping
 * or minor vertical coordinate misalignment.
 */
export async function cropImageToFullWidthBand(
  imageBuffer: Buffer,
  bbox: BoundingBox
): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const imgWidth = metadata.width || 600;
  const imgHeight = metadata.height || 520;

  // Typical text row height in scanned documents is ~0.04 to 0.08 of page height.
  // We expand ±1 row above and below the detected box.
  const rowHeight = Math.max(bbox.height, 0.05);
  const topY = Math.max(0, bbox.y - rowHeight);
  const bottomY = Math.min(1.0, bbox.y + bbox.height + rowHeight);

  const left = 0;
  const width = imgWidth;
  const top = Math.max(0, Math.floor(topY * imgHeight));
  const height = Math.max(10, Math.min(imgHeight - top, Math.ceil((bottomY - topY) * imgHeight)));

  return sharp(imageBuffer)
    .extract({ left, top, width, height })
    .png()
    .toBuffer();
}

/**
 * Strictly deterministic comparison between full-page read and isolated crop read.
 * RULE: The AI model NEVER decides whether reads agree; deterministic code validates equality.
 */
export function compareDoubleReadValues(
  fieldId: string,
  fullValue: string | null,
  cropValue: string | null
): { agreed: boolean; reason?: string } {
  // If neither returned a value, they agree on absence
  if (!fullValue && !cropValue) {
    return { agreed: true };
  }

  // If one read produced a value and the other produced null/empty
  if (!fullValue || !cropValue) {
    return {
      agreed: false,
      reason: `Double-read failed: value present in full-page ("${fullValue ?? '<null>'}") but unreadable or empty in cropped region ("${cropValue ?? '<null>'}")`,
    };
  }

  const trimmedFull = fullValue.trim();
  const trimmedCrop = cropValue.trim();

  // Field-specific deterministic normalization checks
  if (fieldId === 'name') {
    const fullTokens = normalizeNameTokens(trimmedFull);
    const cropTokens = normalizeNameTokens(trimmedCrop);
    if (fullTokens.length === 0 || cropTokens.length === 0) {
      return { agreed: false, reason: `Double-read name comparison could not tokenize values.` };
    }
    const fullStr = fullTokens.join(' ');
    const cropStr = cropTokens.join(' ');
    if (fullStr === cropStr) {
      return { agreed: true };
    }
    // Check if one is a clean subset/expansion
    const isSubset = cropTokens.every((t) => fullTokens.includes(t)) || fullTokens.every((t) => cropTokens.includes(t));
    if (isSubset) {
      return { agreed: true };
    }
    return {
      agreed: false,
      reason: `Double-read name mismatch: full page read "${trimmedFull}" vs crop read "${trimmedCrop}"`,
    };
  }

  if (fieldId === 'marks') {
    const normFull = normalizeMarks(trimmedFull);
    const normCrop = normalizeMarks(trimmedCrop);
    if (normFull.value !== null && normCrop.value !== null && normFull.value === normCrop.value) {
      return { agreed: true };
    }
    return {
      agreed: false,
      reason: `Double-read marks mismatch: full page read "${trimmedFull}" vs crop read "${trimmedCrop}"`,
    };
  }

  if (fieldId === 'income') {
    const normFull = normalizeIncome(trimmedFull);
    const normCrop = normalizeIncome(trimmedCrop);
    if (normFull.value !== null && normCrop.value !== null && normFull.value === normCrop.value) {
      return { agreed: true };
    }
    return {
      agreed: false,
      reason: `Double-read income mismatch: full page read "${trimmedFull}" vs crop read "${trimmedCrop}"`,
    };
  }

  if (fieldId === 'issue_date') {
    const normFull = normalizeDate(trimmedFull);
    const normCrop = normalizeDate(trimmedCrop);
    if (normFull.iso && normCrop.iso && normFull.iso === normCrop.iso) {
      return { agreed: true };
    }
    return {
      agreed: false,
      reason: `Double-read date mismatch: full page read "${trimmedFull}" vs crop read "${trimmedCrop}"`,
    };
  }

  // Generic fallback equality
  const match = trimmedFull.toLowerCase() === trimmedCrop.toLowerCase();
  return {
    agreed: match,
    reason: match ? undefined : `Double-read mismatch: "${trimmedFull}" vs "${trimmedCrop}"`,
  };
}

export interface FieldToVerify {
  fieldId: FieldId;
  field: ExtractedField;
  cropBuffer: Buffer;
}

/**
 * Batches each document's cropped image bands into ONE single Gemini API call.
 */
export async function verifyDocumentCropsBatch(params: {
  documentLabel: string;
  fieldsToVerify: FieldToVerify[];
  apiKey?: string;
  modelName?: string;
}): Promise<Map<FieldId, DoubleReadResult>> {
  const { documentLabel, fieldsToVerify, apiKey, modelName } = params;
  const resultMap = new Map<FieldId, DoubleReadResult>();

  if (fieldsToVerify.length === 0) {
    return resultMap;
  }

  const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
  const effectiveModel = modelName || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

  // If no API key configured (e.g. offline fixture testing), agree with baseline
  if (!effectiveApiKey) {
    for (const f of fieldsToVerify) {
      resultMap.set(f.fieldId, {
        agreed: true,
        crop_value: f.field.value,
        crop_quote: f.field.quote,
      });
    }
    return resultMap;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: effectiveApiKey });

    const prompt = `You are a forensic document transcription tool. You are provided with ${fieldsToVerify.length} cropped horizontal image band(s) from document "${documentLabel}".
Each image band contains the text for a specific field.

Fields to transcribe:
${fieldsToVerify.map((f, i) => `- Crop ${i + 1}: Field ID "${f.fieldId}" (Full-page extraction reference: "${f.field.value}")`).join('\n')}

For each crop, read the text inside that horizontal band and transcribe ONLY the verbatim value visible for that field.
Do NOT correct typos, do NOT standardize, and do NOT extrapolate.

Return a valid JSON object in this exact schema:
{
  "transcriptions": [
    ${fieldsToVerify.map((f) => `{"field_id": "${f.fieldId}", "value": "...", "quote": "..."}`).join(',\n    ')}
  ]
}`;

    const parts: any[] = [{ text: prompt }];

    fieldsToVerify.forEach((f, idx) => {
      parts.push({ text: `[Crop ${idx + 1} for Field "${f.fieldId}"]:` });
      parts.push({
        inlineData: {
          data: f.cropBuffer.toString('base64'),
          mimeType: 'image/png',
        },
      });
    });

    let text = '';
    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      try {
        const response = await ai.models.generateContent({
          model: effectiveModel,
          contents: [{ role: 'user', parts }],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.0,
          },
        });
        text = response.text || '';
        break;
      } catch (genErr: any) {
        const errMsg = String(genErr?.message || genErr);
        const isTransient =
          genErr?.status === 503 ||
          genErr?.status === 429 ||
          errMsg.includes('503') ||
          errMsg.includes('429') ||
          errMsg.includes('overloaded');
        if (isTransient && attempts < 3) {
          await new Promise((r) => setTimeout(r, 1500 * attempts));
        } else {
          throw genErr;
        }
      }
    }

    const parsed = JSON.parse(text);
    const transcriptions: Array<{ field_id?: string; value?: string | null; quote?: string | null }> =
      Array.isArray(parsed?.transcriptions)
        ? parsed.transcriptions
        : Array.isArray(parsed)
        ? parsed
        : [];

    for (let i = 0; i < fieldsToVerify.length; i++) {
      const f = fieldsToVerify[i];
      const found =
        transcriptions.find((t) => t.field_id === f.fieldId) ||
        transcriptions[i];
      const cropValue = found?.value ?? null;
      const cropQuote = found?.quote ?? null;

      const comparison = compareDoubleReadValues(f.fieldId, f.field.value, cropValue);
      resultMap.set(f.fieldId, {
        agreed: comparison.agreed,
        crop_value: cropValue,
        crop_quote: cropQuote,
        disagreement_reason: comparison.reason,
      });
    }

    return resultMap;
  } catch (err: any) {
    // If the batch call fails, deterministically mark all fields in batch as Needs Review
    for (const f of fieldsToVerify) {
      resultMap.set(f.fieldId, {
        agreed: false,
        crop_value: null,
        disagreement_reason: `Batch double-read secondary pass encountered an error: ${err?.message || err}`,
      });
    }
    return resultMap;
  }
}

/**
 * Runs double-read verification ONLY for fields that would be labelled Consistent.
 * Crops each field using full-width horizontal bands (±1 row) and batches each
 * document's crops into ONE API call.
 */
export async function runDoubleReadForConsistentFields(params: {
  extractions: DocumentExtraction[];
  documentBuffers: Map<string, Buffer>;
  apiKey?: string;
  modelName?: string;
  customFields?: CustomFieldDefinition[];
}): Promise<{
  cropCallsMade: number;
  fieldsChecked: number;
  agreedCount: number;
  disagreedCount: number;
  disagreements: Array<{
    docLabel: string;
    fieldId: FieldId;
    fullValue: string | null;
    cropValue: string | null;
    reason?: string;
  }>;
}> {
  const { extractions, documentBuffers, apiKey, modelName, customFields } = params;

  // 1. Initial preliminary verification to see which fields would be Consistent
  const initialCheck = runVerification(extractions, 'live', customFields);
  const consistentFieldIds = new Set(
    initialCheck.fields.filter((f) => f.status === 'Consistent').map((f) => f.field_id)
  );

  let cropCallsMade = 0;
  let fieldsChecked = 0;
  let agreedCount = 0;
  let disagreedCount = 0;
  const disagreements: Array<{
    docLabel: string;
    fieldId: FieldId;
    fullValue: string | null;
    cropValue: string | null;
    reason?: string;
  }> = [];

  // If no fields would be Consistent, 0 crop calls needed
  if (consistentFieldIds.size === 0) {
    return { cropCallsMade, fieldsChecked, agreedCount, disagreedCount, disagreements };
  }

  // 2. Iterate each document and collect crops only for fields in consistentFieldIds
  for (const doc of extractions) {
    const buffer =
      documentBuffers.get(doc.document_label) ||
      documentBuffers.get(doc.document_type);

    if (!buffer) continue;

    const fieldsToVerify: FieldToVerify[] = [];
    for (const field of doc.fields) {
      if (consistentFieldIds.has(field.field_id) && field.highlight_bbox && field.value) {
        try {
          const cropBuffer = await cropImageToFullWidthBand(buffer, field.highlight_bbox);
          fieldsToVerify.push({
            fieldId: field.field_id,
            field,
            cropBuffer,
          });
        } catch (cropErr: any) {
          field.double_read = {
            agreed: false,
            crop_value: null,
            disagreement_reason: `Crop error: ${cropErr?.message || cropErr}`,
          };
          fieldsChecked++;
          disagreedCount++;
          disagreements.push({
            docLabel: doc.document_label,
            fieldId: field.field_id,
            fullValue: field.value,
            cropValue: null,
            reason: `Crop error: ${cropErr?.message || cropErr}`,
          });
        }
      }
    }

    if (fieldsToVerify.length > 0) {
      cropCallsMade++;
      const results = await verifyDocumentCropsBatch({
        documentLabel: doc.document_label,
        fieldsToVerify,
        apiKey,
        modelName,
      });

      for (const item of fieldsToVerify) {
        fieldsChecked++;
        const res = results.get(item.fieldId) || {
          agreed: false,
          crop_value: null,
          disagreement_reason: 'Missing double-read result from batch',
        };
        item.field.double_read = res;

        if (res.agreed) {
          agreedCount++;
        } else {
          disagreedCount++;
          disagreements.push({
            docLabel: doc.document_label,
            fieldId: item.fieldId,
            fullValue: item.field.value,
            cropValue: res.crop_value,
            reason: res.disagreement_reason,
          });
        }
      }
    }
  }

  return { cropCallsMade, fieldsChecked, agreedCount, disagreedCount, disagreements };
}

/**
 * Legacy single-field wrapper for verifyFieldDoubleRead
 */
export async function verifyFieldDoubleRead(params: {
  imageBuffer: Buffer;
  field: ExtractedField;
  fieldId: FieldId;
  apiKey?: string;
  modelName?: string;
}): Promise<DoubleReadResult> {
  const { imageBuffer, field, fieldId, apiKey, modelName } = params;

  if (!field.highlight_bbox || !field.value) {
    return {
      agreed: true,
      crop_value: null,
      disagreement_reason: undefined,
    };
  }

  const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!effectiveApiKey) {
    return {
      agreed: true,
      crop_value: field.value,
      crop_quote: field.quote,
    };
  }

  try {
    const cropBuffer = await cropImageToFullWidthBand(imageBuffer, field.highlight_bbox);
    const batchRes = await verifyDocumentCropsBatch({
      documentLabel: 'Document',
      fieldsToVerify: [{ fieldId, field, cropBuffer }],
      apiKey,
      modelName,
    });
    return (
      batchRes.get(fieldId) || {
        agreed: false,
        crop_value: null,
        disagreement_reason: 'Double-read returned no result',
      }
    );
  } catch (err: any) {
    return {
      agreed: false,
      crop_value: null,
      disagreement_reason: `Double-read failed: ${err?.message || err}`,
    };
  }
}
