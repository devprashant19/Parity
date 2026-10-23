# Deployment Guide for Parity

Parity is a Next.js 15 (App Router) application designed for zero-config deployment on Vercel or any standard Node.js serverless runtime.

---

## 1. Prerequisites
- **Node.js**: 22.x LTS recommended
- **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/) (free tier or pay-as-you-go). Note: If no API key is provided, the application automatically runs in offline demo mode using precomputed sample packets.

---

## 2. Deploy to Vercel

### Option A: Via Vercel Web Dashboard (Recommended)
1. Push this repository to GitHub (ensure branch is `main`).
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository (`Parity`).
4. Keep the default **Framework Preset: Next.js**.
5. Under **Environment Variables**, add the required variables (listed below).
6. Click **Deploy**.

### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```
When prompted:
- Link to existing project? **No**
- Project name: **parity**
- Directory: **`./`**
- Want to modify settings? **No**

---

## 3. Environment Variables Reference

Configure these in the Vercel Dashboard under **Project Settings → Environment Variables**:

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional* | *None* | Google Gemini API key from AI Studio. *If omitted, the app runs all offline sample packets and displays a clear fallback banner if live upload is attempted.* |
| `GEMINI_MODEL` | Optional | `gemini-3.1-flash-lite` | Primary multimodal vision model for reading document scans. |
| `GEMINI_FALLBACK_MODEL` | Optional | `gemini-2.5-flash` | Automatic fallback model used if the primary model returns HTTP 503 or is overloaded. |
| `LIVE_CHECK_ENABLED` | Optional | `true` | Kill-switch. Set to `false` to disable live extraction under quota exhaustion. |
| `DOUBLE_READ_ENABLED`| Optional | `true` | Set to `false` to disable secondary crop pass double-reading. |

> [!TIP]
> **Build Safety:** `npm run build` succeeds cleanly with **zero** environment variables set. You can deploy first and configure API keys later.

---

## 4. Serverless Timeout & Payload Boundaries

- **Route Timeout (`maxDuration = 60`)**: The live extraction endpoint (`/api/extract`) explicitly exports `maxDuration = 60` to configure Vercel's Serverless Function execution ceiling to 60 seconds (Hobby max: 60s, Pro: up to 300s).
- **Client-Side Image Downscaling**: All uploaded scan images are resized client-side in the browser to max 1600px JPEG ($\le 1.5$MB per file), ensuring total multipart payload stays $<4.0$MB, well within Vercel's 4.5MB request limit.
- **Zero-PII Policy**: No file contents, applicant names, or extracted values are ever written to server logs.

---

## 5. Post-Deployment Verification Checklist

Once deployed to your production URL (`https://<your-project>.vercel.app`):

1. **Test Instant Offline Sample Path (Zero Network Calls):**
   - Click **"Load sample clean packet"** and **"Run Verification Check"**.
   - Verify summary counters show **3 Conflicts, 2 Consistent, 0 Needs Review** in $<2$ seconds.
   - Click the **Marks Percentage** row to verify the Evidence Drawer opens with side-by-side verbatim quotes (`92.4%` vs `89.4%`).
2. **Test Messy Sample Path:**
   - Click **"Try messy packet"** and run check.
   - Verify **Needs Review** is displayed for name ambiguity and monthly income normalization.
3. **Test Live Upload Path (if `GEMINI_API_KEY` configured):**
   - Upload 3 sample documents (e.g. from `tests/fixtures/scans/`).
   - Run verification and verify fields are extracted and cross-referenced.
4. **Test Quota / Fallback Handling:**
   - If quota is exceeded or `LIVE_CHECK_ENABLED=false`, verify that a clear amber banner appears: *"Live check is unavailable right now"* with a one-click button to load the instant sample packet.
5. **Verify Mobile Responsiveness:**
   - Open on a mobile device or inspect at 390px viewport: verify the Evidence Drawer transforms into an accessible bottom sheet, counters wrap cleanly, and touch targets meet minimum 44px standards.
