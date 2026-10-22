import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, extractDocumentFacts } from '@/lib/gemini/client';
import { runVerification } from '@/lib/compare/engine';
import { DocumentExtraction, DocumentType } from '@/lib/compare/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Kill-switch check
    if (process.env.LIVE_CHECK_ENABLED === 'false') {
      return NextResponse.json(
        {
          error: 'live_disabled',
          message: 'Live extraction is currently disabled. Please use the instant sample packets.',
        },
        { status: 503 }
      );
    }

    // 2. Gemini API key check
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: 'api_key_missing',
          message: 'Live check is unavailable right now (API key not configured). Please test the instant sample packet.',
        },
        { status: 503 }
      );
    }

    // 3. Best-effort in-memory IP rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: 'rate_limited',
          message: 'Rate limit reached. Please wait a minute or try the instant sample packet.',
        },
        { status: 429 }
      );
    }

    // 4. Ingest FormData
    const formData = await req.formData();
    const formFile = formData.get('application_form') as File | null;
    const marksheetFile = formData.get('marksheet') as File | null;
    const incomeCertFile = formData.get('income_certificate') as File | null;

    if (!formFile || !marksheetFile || !incomeCertFile) {
      return NextResponse.json(
        {
          error: 'missing_documents',
          message: 'Please provide all 3 required documents: Application Form, Marksheet, and Income Certificate.',
        },
        { status: 400 }
      );
    }

    // 5. Size check (1.5MB per file cap)
    const MAX_SIZE = 1.5 * 1024 * 1024;
    if (formFile.size > MAX_SIZE || marksheetFile.size > MAX_SIZE || incomeCertFile.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error: 'file_too_large',
          message: 'One or more files exceed the 1.5MB per-file upload limit.',
        },
        { status: 413 }
      );
    }

    // Helper to buffer to base64
    const toBase64 = async (file: File) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return buffer.toString('base64');
    };

    const docsToExtract: {
      docType: DocumentType;
      docLabel: string;
      file: File;
    }[] = [
      { docType: 'application_form', docLabel: 'Application Form', file: formFile },
      { docType: 'marksheet', docLabel: 'Marksheet', file: marksheetFile },
      { docType: 'income_certificate', docLabel: 'Income Certificate', file: incomeCertFile },
    ];

    // 6. Parallel Gemini Extraction with zero PII logging
    const extractions: DocumentExtraction[] = await Promise.all(
      docsToExtract.map(async ({ docType, docLabel, file }) => {
        const base64Data = await toBase64(file);
        const mimeType = file.type || 'image/jpeg';
        return extractDocumentFacts({
          docType,
          docLabel,
          base64Data,
          mimeType,
        });
      })
    );

    // 7. Deterministic comparison engine execution
    const verificationResult = runVerification(extractions, 'live');

    return NextResponse.json(verificationResult);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error during document verification.';
    return NextResponse.json(
      {
        error: 'extraction_failed',
        message: `Live extraction failed: ${errorMsg}. You can test the instant sample packet below.`,
      },
      { status: 500 }
    );
  }
}
