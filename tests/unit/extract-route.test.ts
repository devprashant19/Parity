import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/extract/route';
import { checkRateLimit } from '@/lib/gemini/client';

describe('Live Extraction Route and Security Controls', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('blocks requests when LIVE_CHECK_ENABLED=false with 503', async () => {
    process.env.LIVE_CHECK_ENABLED = 'false';

    const req = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe('live_disabled');
    expect(data.message).toContain('Live extraction is currently disabled');
  });

  it('returns 503 when GEMINI_API_KEY is not configured', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.LIVE_CHECK_ENABLED;

    const req = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe('api_key_missing');
    expect(data.message).toContain('API key not configured');
  });

  it('returns 400 when documents are missing from FormData', async () => {
    process.env.GEMINI_API_KEY = 'test_key';
    delete process.env.LIVE_CHECK_ENABLED;

    const formData = new FormData();
    formData.append('application_form', new File(['content'], 'form.pdf', { type: 'application/pdf' }));
    // marksheet and income_cert omitted

    const req = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('missing_documents');
  });

  it('returns 413 when an uploaded file exceeds the 1.5MB serverless limit', async () => {
    process.env.GEMINI_API_KEY = 'test_key';
    delete process.env.LIVE_CHECK_ENABLED;

    // Create a mock oversized buffer (1.6 MB)
    const largeBuffer = new Uint8Array(1.6 * 1024 * 1024);
    const largeFile = new File([largeBuffer], 'large.jpg', { type: 'image/jpeg' });
    const normalFile = new File(['small'], 'small.jpg', { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('application_form', largeFile);
    formData.append('marksheet', normalFile);
    formData.append('income_certificate', normalFile);

    const req = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
    const data = await res.json();
    expect(data.error).toBe('file_too_large');
  });

  it('rate limits IP after 6 requests per minute', () => {
    const testIp = '192.168.1.100';
    for (let i = 0; i < 6; i++) {
      expect(checkRateLimit(testIp)).toBe(true);
    }
    // 7th request from same IP should be blocked
    expect(checkRateLimit(testIp)).toBe(false);
  });
});
