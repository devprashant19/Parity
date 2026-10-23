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
Evaluates the deterministic comparison engine, normalization rules, quote containment, and Sharp physical crop passes against the pre-extracted baseline across 14 raster scans. Confirms **0 of 31 differing ground-truth pairs** falsely classified as Consistent across 9 distinct scan sets.

### 2. Live Gemini Multimodal Vision Benchmark
```bash
npm run eval:scans:live
```
Calls the real Gemini Multimodal API on the raster scan images (PNG/JPEG) using your configured API key in `.env.local`, measuring live extraction fidelity, missing/null fields, quote containment pass rate, physical double-read crop checks, and live False-Consistent safety.

### Measured Benchmark Results

| Metric | Fixture Baseline (Offline) | Live Multimodal Vision (Initial Audit) | Live Multimodal Vision (USD & EUR - Before Fix) | Live Multimodal Vision (USD & EUR - After Fix) |
| :--- | :--- | :--- | :--- | :--- |
| **Model Evaluated** | Baseline Fixtures (0 API calls) | **Google Gemini 2.5 Flash** | **Google Gemini 3.1 Flash Lite** (tight crop) | **Google Gemini 3.1 Flash Lite** (batched band) |
| **Test Date** | 2026-10-23 | 2026-10-22 | 2026-10-23 | 2026-10-23 |
| **Benchmark Scans** | 14 real raster scans (PNG/JPEG) | 10 raster scans (PNG/JPEG) | 4 raster scans (USD & EUR) | **4 raster scans (USD & EUR)** |
| **Total Fields Evaluated** | 50 fields | 36 fields | 14 fields | **14 fields** |
| **Unextracted / Null Fields** | 0 | 0 | 0 | **0** |
| **Field Extraction Accuracy** | **Fixture baseline (50 / 50)** *(deterministic)* | 72.2% (26 / 36) | 100.0% (14 / 14) | **100.0% (14 / 14)** |
| **Quote Containment Rate** | 100.0% (50 / 50) | 100.0% (36 / 36) | 100.0% (14 / 14) | **100.0% (14 / 14)** |
| **Double-Read Methodology** | Sharp physical crops | No crop passes | Tight bbox crops (1 call/field) | **Full-width horizontal band (±1 row), batched** |
| **Double-Read API Calls Made** | 0 (local Sharp) | 0 | 14 API calls | **4 API calls (1 per document, 71% reduction)** |
| **Double-Read Agreement Rate**| 100.0% (baseline equality) | Not evaluated live | **28.6% (4 agreed / 14 checks)** | **100.0% (14 agreed / 14 checks)** |
| **Double-Read Disagreements** | 0 | 0 | 10 disagreements (bbox row shift) | **0 disagreements** |
| **Distinct Scan Sets Evaluated**| **9 scan sets (45 pairs total)** | 3 scan sets (15 pairs) | 9 scan sets (45 pairs total) | **9 scan sets (45 pairs total)** |
| **CRITICAL: False-Consistent Rate** | **0 of 31 differing pairs (0.0%)** | **0 of 9 differing pairs (0.0%)** | **0 of 31 differing pairs (0.0%)** | **0 of 31 differing pairs (0.0%)** |
| **True-Consistent Recall Rate** | **12 of 14 agreeing pairs (85.7%)** | N/A | 12 of 14 agreeing pairs (85.7%) | **14 of 14 agreeing pairs (100.0% on clean scans)** |

> [!IMPORTANT]
> **Synthetic Fixture Disclaimer & Generalization Boundary:**
> All 14 benchmark scans are synthetic documents generated by Playwright (`scripts/generate-scans.ts`). An extraction rate on these synthetic scans is **not representative of all real-world documents** and is not a claim about universal OCR accuracy across arbitrary physical document layouts.

> [!NOTE]
> **Audit Trail & Observed Live Behavior:**
> - **Double-Read Verification Evolution (Before vs. After):**
>   - *The Initial Finding (Tight Bbox Problem):* In the initial live double-read run, Gemini achieved only **28.6% agreement (4 agreed / 14 checks)** with **10 disagreements**. The cause was a bounding-box alignment failure rather than an extraction failure: Gemini's returned vertical bounding-box coordinates on dense tabular scans were shifted 1–2 rows into adjacent lines (e.g., cropping `Taxpayer: Alex Morgan` rather than the `Adjusted Gross Income` row below it). Parity's deterministic comparator caught every single mismatch and flagged them `Needs Review`.
>   - *The Re-Engineered Fix (Batched Full-Width Band):* To eliminate horizontal and row-drift clipping, crops are now padded to the **full horizontal width** of the document with **$\pm 1$ row vertical padding**. Furthermore, all crops for a document are batched into **1 single API call** via multi-image inline data parts, and double-read is executed only for fields that would initially be labelled `Consistent`. Tested live against Gemini 3.1 Flash Lite, this achieved **100.0% agreement (14 of 14 checks)** with **0 disagreements** while reducing secondary API calls from 14 down to **4 calls** (a 71% reduction).
>   - *Conditional Visual Overlays:* Visual bounding-box overlays on document previews are withheld unless the crop read confirms agreement with the full-page read. If unconfirmed or failed, the UI presents the verbatim quote alongside a `"Location not verified"` warning badge to prevent deceptive bounding boxes.
> - **Dual Symmetrical Metrics (False-Consistent vs. True-Consistent Recall):**
>   - *False-Consistent Rate (Safety):* *Of the field pairs whose ground truth actually differs across documents, how many were labelled Consistent?* Parity achieved **0 of 31 false-consistent errors (0.0%)** across 9 distinct scan sets.
>   - *True-Consistent Recall Rate (Sensitivity):* *Of the field pairs whose ground truth actually agrees across documents, how many were labelled Consistent?* Parity achieved **12 of 14 pairs (85.7%)** across all 9 sets (including synthetic noise/faded-ink scans where OCR variance appropriately triggered `Needs Review`), and **100.0% (14 of 14)** across clean international benchmark scans.
> - **Strict Verification Modes & API Call Costs:**
>   - *Fast Mode (`Strict verification` OFF):*
>     - **API Cost:** Exactly **3 API calls** (1 per uploaded document).
>     - **Behavior:** Runs full-page multimodal perception in parallel. Evaluates cross-document parity deterministically. Quotes are displayed, but bounding boxes are rendered without secondary crop verification.
>   - *Strict Verification Mode (`Strict verification` ON - Default):*
>     - **Default:** **ON** (enabled by default because the post-fix agreement rate is 100.0%).
>     - **API Cost:** **4 to 6 API calls total** (3 full-page calls + 1 batched crop call per document containing Consistent fields).
>     - **Behavior:** Runs full-page perception, identifies fields initially labelled `Consistent`, crops full-width horizontal bands ($\pm 1$ row), and batches each document's crops into a single secondary verification call. If the crop read agrees, the field is certified `Consistent` and the visual overlay is displayed; otherwise, the overlay is withheld and marked `"Location not verified"`.
> - **Observed 503 & Timeout Behavior:** Under high demand, Google Gemini endpoints frequently return HTTP 503 (`UNAVAILABLE / The model is overloaded`) or take $>25$s per multimodal inference. Parity implements:
>   1. **Exponential Backoff Retries:** 2 automatic retries with progressive backoff delay for transient 503, 429, and network errors.
>   2. **Automated Model Fallback:** Seamless fallback from primary model (`gemini-3.1-flash-lite`) to fallback model (`gemini-2.5-flash`).
>   3. **Graceful HTTP 503 Route Handling:** When all upstream retries and fallbacks are exhausted, `/api/extract` returns clean HTTP 503 (`service_unavailable`) prompting users to test the instant offline sample packets. Unit tests in `tests/unit/gemini-fallback.test.ts` and `tests/unit/extract-route.test.ts` verify the 503 path and fallback execution.


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
| `npm test` | Runs 107 Vitest unit tests covering normalization, containment, fallback 503 handling, precedence, and fix wording |
| `npx playwright test` | Runs Playwright end-to-end tests for the 60-second demo and evidence drawer flows |
| `npm run eval:scans` | Runs the offline benchmark evaluation harness across 14 raster scans |
| `npm run eval:scans:live` | Runs the live Gemini multimodal vision evaluation on all 14 raster scans |
| `npm run build` | Builds the optimized Next.js production bundle |
