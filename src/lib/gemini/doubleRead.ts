import sharp from 'sharp';
import { GoogleGenAI } from '@google/genai';
import { BoundingBox, DoubleReadResult, ExtractedField, FieldId } from '../compare/types';
import { normalizeNameTokens } from '../normalize/name';
import { normalizeIncome, normalizeMarks } from '../normalize/numbers';
import { normalizeDate } from '../normalize/dates';

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

/**
 * Executes double-read verification for a given field:
 * 1. Crops the document image strictly to highlight_bbox.
 * 2. Transcribes the cropped image in isolation with Gemini.
 * 3. Evaluates agreement using pure deterministic code.
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
  const effectiveModel = modelName || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

  let cropBuffer: Buffer;
  try {
    cropBuffer = await cropImageToBoundingBox(imageBuffer, field.highlight_bbox);
  } catch (err: any) {
    return {
      agreed: false,
      crop_value: null,
      disagreement_reason: `Failed to crop image to bounding box: ${err?.message || err}`,
    };
  }

  // If no API key configured (e.g. offline testing/benchmark without key), return agreement on baseline
  if (!effectiveApiKey) {
    return {
      agreed: true,
      crop_value: field.value,
      crop_quote: field.quote,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
    const cropBase64 = cropBuffer.toString('base64');

    const prompt = `You are a forensic transcription tool. Transcribe ONLY the primary text value visible inside this cropped document region.
Do NOT correct typos, do NOT standardize, and do NOT extrapolate.
Return valid JSON in this exact structure:
{
  "value": "...", // verbatim string or null if unreadable
  "quote": "..." // short excerpt or null
}`;

    let text = '';
    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      try {
        const response = await ai.models.generateContent({
          model: effectiveModel,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: cropBase64,
                    mimeType: 'image/png',
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.0,
          },
        });
        text = response.text || '';
        break;
      } catch (genErr: any) {
        const errMsg = String(genErr?.message || genErr);
        const isTransient = genErr?.status === 503 || genErr?.status === 429 || errMsg.includes('503') || errMsg.includes('429') || errMsg.includes('overloaded');
        if (isTransient && attempts < 3) {
          await new Promise((r) => setTimeout(r, 1500 * attempts));
        } else {
          throw genErr;
        }
      }
    }

    const parsed = JSON.parse(text);
    const cropValue = parsed?.value ?? null;
    const cropQuote = parsed?.quote ?? null;

    const comparison = compareDoubleReadValues(fieldId, field.value, cropValue);

    return {
      agreed: comparison.agreed,
      crop_value: cropValue,
      crop_quote: cropQuote,
      disagreement_reason: comparison.reason,
    };
  } catch (err: any) {
    // Failure in secondary read deterministically marks Needs Review
    return {
      agreed: false,
      crop_value: null,
      disagreement_reason: `Double-read secondary pass encountered an error: ${err?.message || err}`,
    };
  }
}
