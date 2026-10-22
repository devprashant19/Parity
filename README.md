# Parity

> **Evidence-first, pre-submission packet verification for scholarship, financial aid, and admissions packets.**

Parity prevents clerical rejections in high-stakes multi-document applications—such as university admissions, merit scholarships, and financial aid grants—by cross-referencing the three core documents—**Candidate Application Form**, **Academic Transcript / Marksheet**, and **Financial / Income Certificate**—before submission.

---

## Architectural Philosophy: Perception vs. Decision

Most AI document tools delegate decisions to an LLM prompt. Parity enforces strict architectural boundaries:

1. **Multimodal Perception Only:** Google Gemini 3.1 Flash Lite is restricted strictly to document reading: extracting values alongside verbatim source text quotes ($\le 200$ characters) and page numbers.
2. **Deterministic Evaluation Core:** An isolated TypeScript engine executes universal normalization (global currencies `$` `€` `£` `₹`, frequency multipliers, ISO and DD/MM/YYYY dates, and name tokenization), quote containment checks, and tri-state classification:
   $$\mathbf{Conflict} > \mathbf{Needs\ Review} > \mathbf{Consistent}$$
3. **Human Decision Authority:** The software never auto-edits official credentials or guesses legal authority. The applicant inspects side-by-side evidence quotes and selects which document is authoritative, dynamically generating an ethical fix checklist.

---

## What is Verified vs. What Isn't

### What IS Verified
- **Deterministic Core Logic (50/50 Unit Tests Passing):** Full unit test coverage for international and regional currency parsing (`$45,000/yr`, `€3,000/mo`, `£28,000/yr`, `₹15,000 per month` $\rightarrow$ `₹1,80,000/year`), marks normalization (`92.4%`), ISO / DD/MM/YYYY date matching, name tokenization & initials handling (`S. Sharma` $\rightarrow$ `Needs Review`), quote containment checks, and status precedence.
- **Dual Sample Demonstration (Playwright Verified):**
  - **Clean Sample Packet:** Produces exactly **3 Conflicts**, **2 Consistent**, and **0 Needs Review** offline in $<2$ seconds.
  - **Messy Sample Packet:** Demonstrates the third state (**Needs Review** on initials match) and monthly-to-annual income normalization.
- **Side-by-Side Evidence Inspection:** Interactive slide-over drawer on desktop (bottom sheet on mobile) displaying side-by-side verbatim quotes, diff callouts, source scan previews, authoritative decision controls, and inline manual overrides.
- **Serverless & Upload Safety:** Client-side image downscaling (max 1600px JPEG, $\le 1.5$MB/file, $<4.0$MB total request payload), in-memory IP rate limiting, and zero-PII logging.

### What IS NOT Verified & Known Limitations
- **Quote Containment vs. Scan Pixel Grounding:** Quote containment verifies that each extracted value is contained verbatim within the model's returned quote excerpt ($\le 200$ chars). However, string containment confirms consistency between the value and the returned text excerpt—it does **not** independently prove the model read the raw pixels with 100% fidelity without human inspection of the source scan in the Evidence Drawer.
- **No Legal Genuineness or Fraud Detection:** Parity checks clerical text consistency across submitted pages. It does not authenticate watermarks, verify official seals with issuing authorities, or guarantee scholarship approval.
- **Benchmark Scope:** The included benchmark reference suite evaluates a 3-document packet (Application Form, Academic Marksheet/Transcript, Income Certificate) covering 5 cross-referenced fields.

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

| Metric | Offline Deterministic Benchmark | Live Multimodal Vision (Run 1: Initial) | Live Multimodal Vision (Run 2: Audit & Normalized) | Live Multimodal Vision (Run 3a: Deployed Model) | Live Multimodal Vision (Run 3b: Comparison Model) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Model Evaluated** | Baseline Fixtures | **Google Gemini 2.5 Flash** (`gemini-2.5-flash`) | **Google Gemini 2.5 Flash** (`gemini-2.5-flash`) | **Google Gemini 3.1 Flash Lite** (`gemini-3.1-flash-lite`, deployed) | **Google Gemini 2.5 Flash** (`gemini-2.5-flash`) |
| **Test Date** | 2026-10-22 | 2026-10-22 | 2026-10-22 | 2026-10-22 | 2026-10-22 |
| **Benchmark Scans** | 10 raster scans (PNG/JPEG) | 10 raster scans (PNG/JPEG) | 10 raster scans (PNG/JPEG) | 10 raster scans (PNG/JPEG, bug fixed) | 10 raster scans (PNG/JPEG, bug fixed) |
| **Total Fields Evaluated** | 36 fields | 36 fields | 36 fields | 36 fields | 36 fields |
| **Unextracted / Null Fields** | 0 | 0 | 0 | **0** | Quota blocked (20 req/day) |
| **Field Extraction Accuracy** | **Fixture baseline (36 / 36)** *(not a result)* | **72.2% (26 / 36)** *(affected by generator bug)* | **69.4% (25 / 36)** *(affected by generator bug)* | **100.0% (36 / 36)** *(see synthetic caveat below)* | Blocked by daily quota limit |
| **Quote Containment Rate** | 100.0% (36 / 36) | 100.0% (36 / 36) | 97.2% (35 / 36) *(observed: 1 quote lacked "per annum")* | **100.0% (36 / 36)** | Blocked by daily quota limit |
| **Cross-Document Field Pairs**| 15 pairs | 15 pairs | 15 pairs | **15 pairs** | — |
| **False-Consistent Metric** | **0 of 15 pairs in this test set** | **0 of 15 pairs in this test set** | **0 of 15 pairs in this test set** | **0 of 15 pairs in this test set** | — |

> [!IMPORTANT]
> **Synthetic Fixture Disclaimer & Generalization Boundary:**
> All 10 benchmark scans are synthetic documents generated by a single script (`scripts/generate-scans.ts`). A 100% extraction rate on these synthetic scans is **not representative of real-world scans** and is not a claim about real-world accuracy across diverse physical documents.

> [!NOTE]
> **Audit Trail & Observed Behavior across Runs:**
> - **Runs 1 & 2 Generator Bug:** Runs 1 and 2 were affected by a fixture-generation bug (string concatenation in `scripts/generate-scans.ts` that accidentally stamped duplicated field values directly into the raster image pixels of Income Certificates, such as `"₹1,80,000 per annum₹1,80,000 per annum"` and `"12/08/202412/08/2024"`). Gemini read the literal duplicated pixels, which lowered field accuracy against clean ground-truth values.
> - **Run 2 Containment Observation:** In Run 2, quote containment was 35/36 (97.2%). What was observed: on `scan_09_low_contrast_income.jpg`, the extracted quote snippet (`"Annual Family Income is ₹1,80,000₹1,80,000"`) lacked the trailing `"per annum"` present in the extracted value string (`"₹1,80,000 per annum₹1,80,000 per annum"`), causing substring containment to fail.
> - **Run 3a (Fixed Scans, Deployed Model `gemini-3.1-flash-lite`):** With the generator bug fixed and scans regenerated without altering `ground-truth.json`, Gemini 3.1 Flash Lite achieved **100.0% Field Accuracy (36/36)** and **100.0% Quote Containment (36/36)** on the synthetic test set.
> - **Run 3b (Comparison Model `gemini-2.5-flash`):** Re-running the 10 scans against `gemini-2.5-flash` was blocked because the 20 requests/day free-tier project quota ceiling for `gemini-2.5-flash` was consumed during Runs 1 and 2 (`HTTP 429: GenerateRequestsPerDayPerProjectPerModel-FreeTier exceeded`).
> - **Verified Packet Tri-State Counts (Run 3a):**
>   - **Clean Scholarship Packet:** Exactly **3 Conflicts, 2 Consistent, 0 Needs Review** (expected 3/2/0).
>   - **Messy Scholarship Packet:** Exactly **3 Conflicts, 1 Consistent, 1 Needs Review** for `"S. Sharma"` (expected 3/1/1).
>   - **Disjoint Name Packet:** Exactly **4 Conflicts, 1 Consistent, 0 Needs Review** (expected 4/1/0).
> - **Deterministic Guardrail:** Across all runs and conditions, **0 of 15 pairs in this test set** were falsely classified as Consistent.
> - **Different Layout Test (Same Author):** Evaluated live on a different layout generated by the same tool—a fictional "State Board of Secondary Education" marksheet with a tabular subject matrix and no real seals, logos, or stamps. Gemini extracted candidate name `"Rahul Sharma"`, aggregate marks `"89.6%"`, academic year `"2024-25"`, and date `"14/05/2024"` with 100% quote containment.
> - **Physical Camera Photo Test (Angled Capture):** Evaluated live on a physical camera photograph of an Income Certificate captured at a 14-degree angle on a desk surface with lighting gradients (`tests/fixtures/unseen/phone_photo_income_cert.jpg`). Measured result: Gemini extracted all 3 target fields (`"Suresh Sharma"`, `"₹1,80,000 per annum"`, and `"12/08/2024"`) with 100% quote containment.

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
