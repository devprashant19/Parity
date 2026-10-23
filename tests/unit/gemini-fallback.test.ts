import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isRetryableError, extractDocumentFacts } from '@/lib/gemini/client';
import { GoogleGenAI } from '@google/genai';

vi.mock('@google/genai');

describe('Gemini Fallback Model & Retry Strategy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test_key';
    process.env.GEMINI_MODEL = 'gemini-3.1-flash-lite';
    process.env.GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash';
  });

  it('identifies 503, 429, timeouts, and high-demand messages as retryable errors', () => {
    expect(isRetryableError({ status: 503 })).toBe(true);
    expect(isRetryableError({ status: 429 })).toBe(true);
    expect(isRetryableError(new Error('503 Service Unavailable: High demand'))).toBe(true);
    expect(isRetryableError(new Error('The model is overloaded. Please try again.'))).toBe(true);
    expect(isRetryableError(new Error('Resource has been exhausted (e.g. check quota).'))).toBe(true);
    expect(isRetryableError(new Error('Gemini API call timed out after 35 seconds.'))).toBe(true);
    expect(isRetryableError(new Error('Invalid argument: bad parameter'))).toBe(false);
  });

  it('retries on primary model 503 and switches to fallback model upon failure', async () => {
    const modelsCalled: string[] = [];
    const validJsonOutput = JSON.stringify({
      document_type: 'application_form',
      document_label: 'Application Form',
      fields: [
        { field_id: 'name', value: 'Alex Morgan', quote: 'Alex Morgan', page: 1, confidence: 0.95 },
        { field_id: 'academic_year', value: '2024-25', quote: '2024-25', page: 1, confidence: 0.95 },
        { field_id: 'marks', value: '3.82 GPA', quote: '3.82 GPA', page: 1, confidence: 0.95 },
        { field_id: 'income', value: '$65,000', quote: '$65,000', page: 1, confidence: 0.95 },
        { field_id: 'issue_date', value: '15/07/2024', quote: '15/07/2024', page: 1, confidence: 0.95 },
      ],
    });

    (GoogleGenAI as any).mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockImplementation(async ({ model }: { model: string }) => {
          modelsCalled.push(model);
          if (model === 'gemini-3.1-flash-lite') {
            const err = new Error('503 Service Unavailable: Model overloaded');
            (err as any).status = 503;
            throw err;
          }
          return { text: validJsonOutput };
        }),
      },
    }));

    const result = await extractDocumentFacts({
      docType: 'application_form',
      docLabel: 'Application Form',
      base64Data: 'dummy_base64',
      mimeType: 'image/png',
      maxRetries: 1,
      initialDelayMs: 10,
      primaryModel: 'gemini-3.1-flash-lite',
      fallbackModel: 'gemini-2.5-flash',
    });

    expect(result).toBeDefined();
    expect(result.fields.length).toBe(5);
    expect(result.fields[0].value).toBe('Alex Morgan');
    // Primary model failed and retried, then fallback model was called
    expect(modelsCalled).toContain('gemini-3.1-flash-lite');
    expect(modelsCalled).toContain('gemini-2.5-flash');
  });

  it('throws error when both primary and fallback models fail with 503', async () => {
    (GoogleGenAI as any).mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockImplementation(async () => {
          const err = new Error('503 Service Unavailable');
          (err as any).status = 503;
          throw err;
        }),
      },
    }));

    await expect(
      extractDocumentFacts({
        docType: 'application_form',
        docLabel: 'Application Form',
        base64Data: 'dummy_base64',
        mimeType: 'image/png',
        maxRetries: 1,
        initialDelayMs: 10,
        primaryModel: 'gemini-3.1-flash-lite',
        fallbackModel: 'gemini-2.5-flash',
      })
    ).rejects.toThrow('503 Service Unavailable');
  });
});
