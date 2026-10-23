# Parity

> **Make your documents agree before you submit.**

Parity prevents clerical rejections in high-stakes multi-document applications—such as university admissions, merit scholarships, and financial aid grants—by cross-referencing the three core documents—**Candidate Application Form**, **Official Academic Transcript**, and **Financial / Tax Statement**—before submission.

---

## Architectural Philosophy: Perception vs. Decision

Most AI document tools delegate decisions to an LLM prompt. Parity enforces strict architectural boundaries:

1. **Multimodal Perception Only:** Google Gemini 3.1 Flash Lite is restricted strictly to document reading: extracting values alongside verbatim source text quotes ($\le 200$ characters) and page numbers.
2. **Deterministic Evaluation Core:** An isolated TypeScript engine executes universal normalization (global currencies `$` `€` `£` `¥` `₹`, frequency multipliers, ISO and international dates, GPA and grade scales, and name tokenization), quote containment checks, and tri-state classification:
   $$\mathbf{Conflict} > \mathbf{Needs\ Review} > \mathbf{Consistent}$$
3. **Human Decision Authority:** The software never auto-edits official credentials or guesses legal authority. The applicant inspects side-by-side evidence quotes and selects which document is authoritative, dynamically generating an ethical fix checklist.

---

## What is Verified vs. What Isn't

### What IS Verified
- **Deterministic Core Logic:** Full unit test coverage for international currency parsing (`$45,000/yr`, `€3,000/mo`, `£28,000/yr`, `$3,500 per month` $\rightarrow$ `$42,000/year`), GPA and academic marks normalization (`3.8 / 4.0`, `89.4%`), international date matching (ISO, DD/MM/YYYY, MM/DD/YYYY, and textual dates like `12 Aug 2024`), cultural name tokenization, compound surnames, diacritics, quote containment checks, and status precedence.
- **Dual Sample Demonstration (Playwright & Vitest Verified):**
  - **Clean Sample Packet (USD):** Produces exactly **3 Conflicts**, **2 Consistent**, and **0 Needs Review** offline in $<2$ seconds.
  - **Messy Sample Packet (EUR/GBP):** Demonstrates **Needs Review** on compound/accented names (`Maria J. Alvarez` vs `Maria Alvarez`, `José` vs `Jose`) and per-month income normalization.
- **Side-by-Side Evidence Inspection:** Interactive slide-over drawer on desktop (bottom sheet on mobile) displaying side-by-side verbatim quotes, diff callouts, source scan previews, authoritative decision controls, and inline manual overrides.
- **Serverless & Upload Safety:** Client-side image downscaling (max 1600px JPEG, $\le 1.5$MB/file, $<4.0$MB total request payload), in-memory IP rate limiting, and zero-PII logging.

### What IS NOT Verified & Known Limitations
- **Quote Containment vs. Scan Pixel Grounding:** Quote containment verifies that each extracted value is contained verbatim within the model's returned quote excerpt ($\le 200$ chars). However, string containment confirms consistency between the value and the returned text excerpt—it does **not** independently prove the model read the raw pixels with 100% fidelity without human inspection of the source scan in the Evidence Drawer.
- **No Legal Genuineness or Fraud Detection:** Parity checks clerical text consistency across submitted pages. It does not authenticate watermarks, verify official seals with issuing authorities, or guarantee scholarship approval.
- **Benchmark Scope:** The included benchmark reference suite evaluates a 3-document packet (Application Form, Academic Transcript, Proof of Income / Tax Statement) covering cross-referenced fields.

---

## Benchmark Evaluation Harness (`npm run eval:scans`)

Parity includes an automated evaluation harness testing extraction accuracy and auditing for false-Consistent errors against 10 real raster benchmark scans (`tests/fixtures/scans/`) rendered with synthetic camera blur, tilt, and faded ink:

### 1. Offline Deterministic Benchmark
```bash
npm run eval:scans
```
Evaluates the deterministic comparison engine, normalization rules, and quote containment against the pre-extracted baseline. Confirms **0 of 15 pairs in this test set** falsely classified as Consistent across all cross-document field pairs.

### 2. Live Gemini Multimodal Vision Benchmark
```bash
npm run eval:scans:live
```
Calls the real Gemini Multimodal API on the 10 raster scan images (PNG/JPEG) using your configured API key in `.env.local`, measuring live extraction fidelity, missing/null fields, quote containment pass rate, and live False-Consistent safety.

### Measured Benchmark Results

| Metric | Fixture Baseline (Offline Verification) | Live Multimodal Vision (Initial Audit) | Live Multimodal Vision (Deployed `gemini-3.1-flash-lite`) | Live Multimodal Vision (Multi-Country & Multi-Locale Live Run) |
| :--- | :--- | :--- | :--- | :--- |
| **Model Evaluated** | Baseline Fixtures (0 API calls) | **Google Gemini 2.5 Flash** | **Google Gemini 3.1 Flash Lite** | **Google Gemini 3.1 Flash Lite** (live) |
| **Test Date** | 2026-10-23 | 2026-10-22 | 2026-10-22 | 2026-10-23 |
| **Benchmark Scans** | 10 raster scans (PNG/JPEG) | 10 raster scans (PNG/JPEG) | 10 raster scans (PNG/JPEG) | 10 raster scans (PNG/JPEG) |
| **Total Fields Evaluated** | 36 fields | 36 fields | 36 fields | 36 fields |
| **Unextracted / Null Fields** | 0 | 0 | 0 | **3** *(scan_05 upstream API timeout)* |
| **Field Extraction Accuracy** | **Fixture baseline (36 / 36)** *(deterministic)* | 72.2% (26 / 36) | 100.0% (36 / 36) | **88.9% (32 / 36)** *(1 text variance, 3 timeouts)* |
| **Quote Containment Rate** | 100.0% (36 / 36) | 100.0% (36 / 36) | 100.0% (36 / 36) | **100.0% (33 / 33 valid reads)** |
| **Cross-Document Field Pairs**| 35 pairs (7 packets) | 15 pairs (3 packets) | 15 pairs (3 packets) | **35 pairs (7 packets)** |
| **False-Consistent Metric** | **0 of 35 pairs (0.0%)** | **0 of 15 pairs (0.0%)** | **0 of 15 pairs (0.0%)** | **0 of 35 pairs (0.0%)** |

> [!IMPORTANT]
> **Synthetic Fixture Disclaimer & Generalization Boundary:**
> All 10 benchmark scans are synthetic documents generated by a single script (`scripts/generate-scans.ts`). An extraction rate on these synthetic scans is **not representative of all real-world documents** and is not a claim about universal OCR accuracy across arbitrary physical document layouts.

> [!NOTE]
> **Audit Trail & Observed Behavior across Runs:**
> - **Fixture Baseline (Offline Engine Verification):** Evaluates deterministic normalization, calendar logic, multi-locale currency/number rules, quote containment, and bounding box physical cropping without making remote network calls (0 API calls).
> - **Live Multimodal Vision (Multi-Country & Multi-Locale Run):** Evaluated live against Google Gemini multimodal API (`gemini-3.1-flash-lite`). Two honest real-world conditions observed:
>   - **Upstream Latency / API Timeout:** `scan_05_rotated_income_cert.jpg` hit the 35s timeout after multiple 503 high-demand retries, resulting in 3 unextracted fields (accurately recorded as 0/3 for that scan).
>   - **Extraction Nuance:** On `scan_07_monthly_income_cert.png`, Gemini extracted `"₹15,000"` (omitting the trailing `"per month"` in the value string, while capturing the full quote `"Monthly Family Income is ₹15,000 per month"`), resulting in an honest mismatch against ground-truth `"₹15,000 per month"`.
>   - **Deterministic Guardrail:** Across all 7 test packets and 35 cross-document field pairs, **0 of 35 pairs (0.0%)** were falsely classified as Consistent.

---

## Getting Started

### Prerequisites
- Node.js 22 LTS

### Installation
```bash
git clone <repository-url>
cd Parity
npm install
```

### Configuration (Optional for Instant Demo; Required for Live Uploads)
Copy the example environment template:
```bash
cp .env.example .env.local
```
Add your Google Gemini API key from [Google AI Studio](https://aistudio.google.com/):
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
LIVE_CHECK_ENABLED=true
```
*(If no API key is provided, the application runs fully offline with both precomputed sample packets and displays a clear fallback banner if live upload is attempted.)*

### Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Test Commands

| Command | Purpose |
| :--- | :--- |
| `npm test` | Runs 45 Vitest unit tests covering normalization, containment, precedence, and fix wording |
| `npx playwright test` | Runs Playwright end-to-end tests for the 60-second demo and evidence drawer flows |
| `npm run eval:scans` | Runs the offline benchmark evaluation harness across 10 raster scans |
| `npm run eval:scans:live` | Runs the live Gemini multimodal vision evaluation on all 10 raster scans |
| `npm run build` | Builds the optimized Next.js production bundle |
