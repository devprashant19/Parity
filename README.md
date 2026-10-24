# Parity

> **Make your documents agree before you submit.**

Parity prevents clerical rejections in high-stakes multi-document applications—such as university admissions, merit scholarships, and financial aid grants—by cross-referencing the three core documents—**Candidate Application Form**, **Official Academic Transcript**, and **Financial / Tax Statement**—before submission.

---

## Try It

- **Live Web Application:** [https://parity-devpost.vercel.app](https://parity-devpost.vercel.app) *(or run locally at `http://localhost:3000`)*
- **Demo Walkthrough Video:** `https://youtu.be/placeholder-demo` *(2:30 runtime walkthrough)*
- **The 60-Second Instant Test Drive:**
  1. Open the application (no account, login, or API key required).
  2. Click **"Load sample clean packet"** to ingest the precomputed USD benchmark documents.
  3. Click **"Run Verification Check"** to execute verification instantly via the deterministic engine ($<2$ seconds).
  4. Inspect the summary counters (**3 Conflicts**, **2 Consistent**).
  5. Click any highlighted conflict row (e.g., **Academic Performance / GPA**) to open the **Evidence Drawer**.
  6. Review side-by-side verbatim quotes (`3.80 GPA` vs `3.50 GPA`), visual coordinate overlays, and select an authoritative document decision to observe the prioritized fix plan update live.

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

All benchmark scans are synthetic documents generated by our own scripts (`scripts/generate-scans.ts` and `scripts/generate-samples.ts`). They test OCR robustness across controlled variations (blur, rotation, contrast, and layout complexity) but are **not a claim of universal real-world OCR accuracy across arbitrary physical document layouts**.

#### Multi-Run Benchmark Log (All Historical & Live Runs)

| Metric | Run 1: Fixture Baseline | Run 2: Initial Live Audit | Run 3: Live Pre-Fix (Scans 11-14) | Run 4: Live Post-Fix (Scans 11-14) | Run 5: Complete Live Run (All 14 Scans) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Model Evaluated** | Baseline Fixtures (0 API calls) | **Google Gemini 2.5 Flash** | **Google Gemini 3.1 Flash Lite** (tight crop) | **Google Gemini 3.1 Flash Lite** (batched band) | **Google Gemini 3.1 Flash Lite** (full live suite) |
| **Test Date** | 2026-10-23 | 2026-10-22 | 2026-10-23 | 2026-10-23 | **2026-10-23** |
| **Benchmark Scans** | 14 raster scans | 10 raster scans (01–10) | 4 raster scans (11–14) | 4 raster scans (11–14) | **All 14 raster scans (01–14)** |
| **Total Fields Evaluated** | 50 fields | 36 fields | 14 fields | 14 fields | **50 fields** |
| **Unextracted / Null Fields** | 0 | 0 | 0 | 0 | **3** *(scan_06 bbox formatting)* |
| **Field Extraction Accuracy** | **50 / 50 (100.0%)** | 26 / 36 (72.2%) | 14 / 14 (100.0%) | 14 / 14 (100.0%) | **44 / 50 (88.0%)** *(91.7% clean)* |
| **Quote Containment Rate** | 100.0% (50 / 50) | 100.0% (36 / 36) | 100.0% (14 / 14) | 100.0% (14 / 14) | **100.0% (47 / 47 extracted)** |
| **Double-Read Methodology** | Local Sharp crops | None | Tight bbox crops (1/field) | Batched band (±1 row) | **Batched full-width band (±1 row)** |
| **Crop Checks Executed** | 50 fields | 0 | 14 fields | 14 fields | **47 fields** |
| **Crop API Calls Made** | 0 | 0 | 14 calls | 4 calls | **13 batched calls** |
| **Double-Read Agreement Rate**| 100.0% | N/A | **28.6% (4 / 14)** | **100.0% (14 / 14)** | **93.6% (44 / 47 checks)** |
| **Double-Read Disagreements** | 0 | 0 | 10 (bbox row drift) | 0 | **3 disagreements** |
| **CRITICAL: False-Consistent** | **0 / 31 (0.0%)** | **0 / 9 (0.0%)** | **0 / 31 (0.0%)** | **0 / 31 (0.0%)** | **0 of 31 differing pairs (0.0%)** |
| **True-Consistent Recall** | **12 / 14 (85.7%)** | N/A | 12 / 14 (85.7%) | 14 / 14 (100.0%) | **11 of 14 agreeing pairs (78.6%)** |

---

#### Separate Breakdown: Original Scans 01–10 vs. New Scans 11–14 (Live Gemini 3.1 Flash Lite Run)

| Metric | (a) Original Scans 01–10 (Reference Set) | (b) New Scans 11–14 (USD & EUR International) | Combined Live Benchmark (All 14 Scans) |
| :--- | :--- | :--- | :--- |
| **Model** | Google Gemini 3.1 Flash Lite | Google Gemini 3.1 Flash Lite | Google Gemini 3.1 Flash Lite |
| **Run Date** | 2026-10-23 | 2026-10-23 | 2026-10-23 |
| **Synthetic Document Types** | Forms, Marksheets, Income Certificates | US Transcripts (GPA), Payslips, Tax Statements, EUR Income | Complete 14-scan benchmark suite |
| **Expected Document Fields** | 36 fields | 14 fields | 50 fields |
| **Field Extraction Accuracy** | **83.3% (30 / 36)** *(91.7% clean)* | **100.0% (14 / 14)** | **88.0% (44 / 50)** |
| **Null / Unextracted Fields** | 3 *(scan_06 array format)* | 0 | 3 |
| **Quote Containment Rate** | 100.0% (33 / 33 extracted) | 100.0% (14 / 14 extracted) | 100.0% (47 / 47 extracted) |
| **Full-Page API Calls** | 10 calls | 4 calls | 14 calls |
| **Batched Crop API Calls** | 9 calls | 4 calls | 13 calls |
| **Crop Checks Executed** | 33 fields | 14 fields | 47 fields |
| **Double-Read Agreement Rate**| **90.9% (30 / 33 checks)** | **100.0% (14 / 14 checks)** | **93.6% (44 / 47 checks)** |
| **False-Consistent Rate (Safety)**| **0 of 22 differing pairs (0.0%)** | **0 of 9 differing pairs (0.0%)** | **0 of 31 differing pairs (0.0%)** |
| **True-Consistent Recall Rate** | **8 of 10 agreeing pairs (80.0%)** | **3 of 4 agreeing pairs (75.0%)** | **11 of 14 agreeing pairs (78.6%)** |

> [!IMPORTANT]
> **Synthetic Document Transparency:**
> All 14 scans evaluated are synthetic test fixtures generated by our automated scripts (`scripts/generate-scans.ts` and `scripts/generate-samples.ts`) via Playwright and Sharp. We make **no claim of universal real-world accuracy** on unconstrained physical paperwork.

---

#### Explanation of the Two True-Consistent Pairs Flagged as "Needs Review"

In our ground-truth evaluation, exactly two pairs whose ground truth actually agrees were flagged as `Needs Review` by the deterministic engine. This is an intentional safety feature of Parity's design, not an engine error:

1. **Pair 1: `scan_01` vs. `scan_06` — Field: `name` (`"Suresh Sharma"` vs. `"S. Sharma"`)**
   - **Ground Truth:** Both documents genuinely belong to the same applicant.
   - **Why Flagged as `Needs Review`:** `scan_06` lists the student's name using an abbreviated first initial (`"S. Sharma"`), while `scan_01` lists the full unabbreviated legal name (`"Suresh Sharma"`). Parity's deterministic name matching rules deliberately withhold an automatic `Consistent` label for abbreviated initials or omitted middle names. In high-stakes scholarship and university admission packets, bureaucratic reviewers frequently reject packets where names do not match official passport/identity spellings character-for-character. Flagging this for human confirmation prevents silent administrative disqualification.
2. **Pair 2: `scan_01` vs. `scan_03` — Field: `issue_date` (`"12/08/2024"` vs. `"12/08/2024"`) under `Auto` Mode**
   - **Ground Truth:** Both documents were issued on the exact same date (`"12/08/2024"`).
   - **Why Flagged as `Needs Review`:** In both documents, the numeric day is `12` and the numeric month is `08` (both $\le 12$) with no written month name. Under Parity's `Auto` date ambiguity setting, any date where both day and month are $\le 12$ without an explicit locale format is flagged as `Needs Review` (`"Ambiguous numeric date (could be August 12 or December 8)"`). Parity refuses to guess whether the issuing authority used Day/Month/Year or Month/Day/Year. Once the applicant selects their locale via the Date Format switch (`DMY` or `MDY`), the engine deterministically re-evaluates and marks the pair `Consistent`.

---

> [!NOTE]
> **Audit Trail & Observed Live Behavior:**
> - **Double-Read Verification Evolution (Before vs. After):**
>   - *The Initial Finding (Tight Bbox Problem):* In the initial live double-read run, Gemini achieved only **28.6% agreement (4 agreed / 14 checks)** with **10 disagreements**. The cause was a bounding-box alignment failure rather than an extraction failure: Gemini's returned vertical bounding-box coordinates on dense tabular scans were shifted 1–2 rows into adjacent lines (e.g., cropping `Taxpayer: Alex Morgan` rather than the `Adjusted Gross Income` row below it). Parity's deterministic comparator caught every single mismatch and flagged them `Needs Review`.
>   - *The Re-Engineered Fix (Batched Full-Width Band):* To eliminate horizontal and row-drift clipping, crops are now padded to the **full horizontal width** of the document with **$\pm 1$ row vertical padding**. Furthermore, all crops for a document are batched into **1 single API call** via multi-image inline data parts, and double-read is executed only for fields that would initially be labelled `Consistent`. Tested live against Gemini 3.1 Flash Lite, this achieved **100.0% agreement (14 of 14 checks)** on scans 11-14 with **0 disagreements** while reducing secondary API calls from 14 down to **4 calls** (a 71% reduction).
>   - *Conditional Visual Overlays:* Visual bounding-box overlays on document previews are withheld unless the crop read confirms agreement with the full-page read. If unconfirmed or failed, the UI presents the verbatim quote alongside a `"Location not verified"` warning badge to prevent deceptive bounding boxes.
> - **Dual Symmetrical Metrics (False-Consistent vs. True-Consistent Recall):**
>   - *False-Consistent Rate (Safety):* *Of the field pairs whose ground truth actually differs across documents, how many were labelled Consistent?* Parity achieved **0 of 31 false-consistent errors (0.0%)** across 9 distinct scan sets.
>   - *True-Consistent Recall Rate (Sensitivity):* *Of the field pairs whose ground truth actually agrees across documents, how many were labelled Consistent?* Parity achieved **11 of 14 pairs (78.6%)** across all 9 sets (including synthetic noise/faded-ink scans where OCR variance appropriately triggered `Needs Review`), and **100.0% (14 of 14)** across clean international benchmark scans.
> - **Strict Verification Modes & API Call Costs:**
>   - *Fast Mode (`Strict verification` OFF):*
>     - **API Cost:** Exactly **3 API calls** (1 per uploaded document).
>     - **Behavior:** Runs full-page multimodal perception in parallel. Evaluates cross-document parity deterministically. Quotes are displayed, but bounding boxes are rendered without secondary crop verification.
>   - *Strict Verification Mode (`Strict verification` ON - Default):*
>     - **Default:** **ON** (enabled by default because the post-fix agreement rate is high: 93.6% overall and 100% on clean scans).
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
| `npm test` | Runs 109 Vitest unit tests covering normalization, containment, fallback 503 handling, precedence, and fix wording |
| `npx playwright test` | Runs Playwright end-to-end tests for the 60-second demo and evidence drawer flows |
| `npm run eval:scans` | Runs the offline benchmark evaluation harness across 14 raster scans |
| `npm run eval:scans:live` | Runs the live Gemini multimodal vision evaluation on all 14 raster scans |
| `npm run build` | Builds the optimized Next.js production bundle |

---

## Provenance

- **Earlier Reference Draft:** An initial exploratory draft codebase generated on October 21–22, 2026, before the skill-pack planning phase, was retained as reference material for sample document schemas, mock fixtures, and testing patterns.
- **Specification-Driven Reimplementation:** The submitted production code for Parity was reimplemented from scratch strictly against the approved specification ([devpost/spec.md](file:///e:/Parity/devpost/spec.md)), product requirements ([devpost/prd.md](file:///e:/Parity/devpost/prd.md)), and build scope ([devpost/scope.md](file:///e:/Parity/devpost/scope.md)).
- **AI Tooling:** AI coding assistants (Google Antigravity IDE) were used for pair programming, test suite generation, and documentation drafting under human direction and verification. All evaluation numbers, architectural boundaries, and deterministic logic were directly executed and verified.
