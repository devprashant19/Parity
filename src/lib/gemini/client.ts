import { GoogleGenAI } from '@google/genai';
import { DocumentExtractionSchema } from './schema';
import { EXTRACTION_SYSTEM_PROMPT } from './prompt';
import { DocumentType, DocumentExtraction, FieldId } from '../compare/types';

// Rate limiter: Max 6 requests per minute per IP (in-memory)
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 6;

  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}

export interface ExtractDocumentParams {
  docType: DocumentType;
  docLabel: string;
  base64Data: string;
  mimeType: string;
  maxRetries?: number;
  initialDelayMs?: number;
  primaryModel?: string;
  fallbackModel?: string;
}

export function isRetryableError(err: unknown): boolean {
  if (!err) return false;
  const msg = String((err as any)?.message || err).toLowerCase();
  const status = (err as any)?.status || (err as any)?.statusCode;
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 504 ||
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('timed out') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('fetch failed')
  );
}

/**
 * Extracts 5 fields from an uploaded document using Gemini Multimodal Vision API.
 * Uses @google/genai with structured JSON response schema and strict 35s timeout.
 * Includes automatic retry with exponential backoff and seamless model fallback (e.g. gemini-3.1-flash-lite -> gemini-2.5-flash)
 * for 503 / high-demand transient errors.
 * Zero-PII logging compliance: never logs student data or base64 buffers.
 */
export async function extractDocumentFacts({
  docType,
  docLabel,
  base64Data,
  mimeType,
  maxRetries = 2,
  initialDelayMs = 600,
  primaryModel,
  fallbackModel,
}: ExtractDocumentParams): Promise<DocumentExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  const modelPrimary = primaryModel || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  const modelFallback = fallbackModel || process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash';
  const ai = new GoogleGenAI({ apiKey });

  const promptText = `${EXTRACTION_SYSTEM_PROMPT}\n\nTarget document type: "${docType}" (${docLabel}). Return structured JSON matching the DocumentExtraction schema.`;

  const modelsToTry = [modelPrimary];
  if (modelFallback && modelFallback !== modelPrimary) {
    modelsToTry.push(modelFallback);
  }

  let textResponse: string | null = null;
  let lastError: unknown;

  for (let m = 0; m < modelsToTry.length; m++) {
    const currentModel = modelsToTry[m];
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Gemini API call timed out after 35 seconds.')), 35000);
        });

        const apiCall = ai.models.generateContent({
          model: currentModel,
          contents: [
            {
              role: 'user',
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const response = await Promise.race([apiCall, timeoutPromise]);
        textResponse = response.text || null;
        if (textResponse) {
          break; // Succeeded!
        }
      } catch (err: unknown) {
        lastError = err;
        const retryable = isRetryableError(err);
        if (!retryable || attempt === maxRetries) {
          // If not retryable or final retry for this model, break to attempt fallback model
          break;
        }
        const delay = initialDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    if (textResponse) {
      break;
    }
  }

  if (!textResponse) {
    if (lastError) {
      throw lastError;
    }
    throw new Error('Empty response received from Gemini.');
  }

  // Parse and validate with Zod
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(textResponse);
  } catch {
    throw new Error('Gemini did not return valid JSON.');
  }

  // Handle if model wrapped output or returned fields directly
  let structuredDoc: any = rawJson;
  if (Array.isArray(rawJson)) {
    structuredDoc = { document_type: docType, document_label: docLabel, fields: rawJson };
  } else if (rawJson && typeof rawJson === 'object' && !('document_type' in rawJson)) {
    structuredDoc = { document_type: docType, document_label: docLabel, ...rawJson };
  } else if (rawJson && typeof rawJson === 'object') {
    structuredDoc = { document_label: docLabel, ...rawJson };
  }

  // Normalize fields if model returned an object map or alternate key names
  if (structuredDoc && typeof structuredDoc === 'object' && 'fields' in structuredDoc) {
    const rawFields = structuredDoc.fields;
    if (rawFields && typeof rawFields === 'object' && !Array.isArray(rawFields)) {
      structuredDoc.fields = Object.entries(rawFields).map(([k, v]: [string, any]) => ({
        field_id: k,
        value: typeof v === 'object' ? v?.value ?? null : String(v),
        quote: typeof v === 'object' ? v?.quote ?? null : null,
        page: typeof v === 'object' ? v?.page ?? 1 : 1,
        confidence: typeof v === 'object' ? v?.confidence ?? 0.95 : 0.95,
      }));
    } else if (Array.isArray(rawFields)) {
      structuredDoc.fields = rawFields.map((item: any) => ({
        ...item,
        field_id: item.field_id || item.field || item.id,
        page: item.page ?? 1,
        confidence: item.confidence ?? 0.95,
      }));
    }
  }

  const validated = DocumentExtractionSchema.parse(structuredDoc);
  return {
    document_type: docType,
    document_label: docLabel,
    fields: validated.fields.map((f) => ({
      field_id: f.field_id as FieldId,
      value: f.value,
      quote: f.quote,
      page: f.page,
      confidence: f.confidence,
      source: 'extracted' as const,
      highlight_bbox: f.highlight_bbox ?? undefined,
    })),
  };
}
