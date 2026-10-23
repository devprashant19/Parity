---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Scaffolding and deterministic comparison engine with unit tests**
  Becomes usable: A runnable Next.js TypeScript project containing the complete, isolated deterministic verification core (normalization for international and regional numbers, currency, dates, and names; quote containment validation; status precedence; pairwise evaluation; and ethical remediation copy generation) verified by automated Vitest tests.
  Why now: The unique kernel of Parity is that deterministic code—not an LLM—decides whether values match. Building and testing this first guarantees our mathematical and logical truth is airtight before touching UI or external APIs.
  PRD ref: `prd.md > Features and Behavior > 2. Deterministic Comparison & Tri-State Classification`, `prd.md > Features and Behavior > 4. Human Decision Authority & Prioritized Fix List`
  Spec ref: `spec.md > Stack`, `spec.md > Data Model & Interfaces`, `spec.md > Deterministic Rules & Algorithms`, `spec.md > File Structure`
  Build: Initialize Next.js 15 (App Router) + TypeScript + Tailwind CSS v3 project scaffold with Node 22 LTS. Configure Vitest. Implement `src/lib/normalize/` (international and regional numbers, currency/frequency, dates, name tokenization & honorifics). Implement `src/lib/compare/` (quote containment $\le 200$ chars, status precedence $\mathbf{Conflict} > \mathbf{Needs\ Review} > \mathbf{Consistent}$, pairwise name comparison, field-to-document matrix). Implement `src/lib/fixplan/` (ethical wording rules: form error vs official document error, and CSV exporter). Write comprehensive Vitest unit tests covering all edge cases.
  Verify (mechanical): Run `npm test` via Vitest and verify all unit tests pass (100% pass rate for normalization, quote containment, name matching precedence, and fix list wording).
  Learner check: Run `npm test` in the terminal to inspect test output and confirm the deterministic matching rules and ethical fix wording pass all test cases.
  Commit: `Initialize project and build deterministic verification engine`

- [x] **2. Synthetic sample asset generator, dual sample presets, and interactive dashboard**
  Becomes usable: A running web interface on `localhost:3000` where clicking "Load sample scholarship packet" or "Try a messy packet" populates synthetic document cards and executes checks in $<2$s from real comparison logic on fixture data, displaying animated summary counters (clean sample showing exactly 3 Conflicts, 2 Consistent, 0 Needs Review), a 5-field checklist with triple-coded status badges, and an initial prioritized fix list with CSV export.
  Why now: Proves the complete user journey and visual foundation for the 60-second instant demo without needing an API key.
  PRD ref: `prd.md > The Core Journey` (steps 1–4), `prd.md > Screens and Layout`, `prd.md > Look and Feel`, `prd.md > Features and Behavior > 1. Ingestion & Dual Sample Presets`
  Spec ref: `spec.md > Components > TopBar`, `spec.md > Components > IngestionZone`, `spec.md > Components > SummaryCounters`, `spec.md > Components > FieldChecklist`, `spec.md > Components > FixList`, `spec.md > Look and Feel`
  Build: Write a node script `scripts/generate-samples.ts` to generate high-fidelity synthetic document images (clean and messy sets) in `public/samples/` showing exact values (Suresh Sharma / S. Sharma, 2024-25, 92.4% vs 89.4%, ₹2,40,000 vs ₹1,80,000 per year / ₹15,000 per month, 15/07/2024 vs 12/08/2024). Implement `src/data/samples.ts` with clean and messy pre-extracted fixtures. Build `TopBar`, `IngestionZone` (with dual sample triggers and 3 dropzones), `SummaryCounters`, `FieldChecklist`, and `FixList`. Write a test asserting that running the engine on `samples.ts` clean packet produces exactly 3 Conflicts and 2 Consistent.
  Verify (mechanical): Run `npm test` to verify sample fixture engine test passes (exactly 3 Conflicts, 2 Consistent on clean sample), run `npm run build` to verify type safety, and verify dev server starts cleanly.
  Learner check: Open `http://localhost:3000` in the browser, click "Load sample scholarship packet" and "Run check", confirm animated counters show 3 Conflicts and 2 Consistent, click "Try a messy packet" to confirm "Needs Review" appears, and test CSV export.
  Commit: `Add synthetic sample presets and interactive verification dashboard`

- [x] **3. Side-by-side evidence drawer, student decision controls, manual entry, and visual polish pass**
  Becomes usable: Clicking any field row opens a slide-over drawer (or mobile bottom sheet) displaying side-by-side verbatim quotes with highlighted values, diff callouts, document preview modals, dynamic decision buttons (`[ Marksheet is correct ]`, etc.), and `ManualEntry` inline overrides that reactively re-evaluate the field and update the fix list in real-time. Also includes visual design polish (warm editorial theme, typography, contrast, spacing, focus states, and browser screenshot verification).
  Why now: Delivers the core human-directed remediation loop and establishes the calm, high-trust document review look and feel defined in the PRD before tackling backend live APIs.
  PRD ref: `prd.md > Features and Behavior > 3. Side-by-Side Evidence Inspection Drawer`, `prd.md > Features and Behavior > 4. Human Decision Authority & Prioritized Fix List`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Components > EvidenceDrawer`, `spec.md > Components > ManualEntry`, `spec.md > Components > FixList`, `spec.md > Look and Feel`
  Build: Implement `EvidenceDrawer` with slide-over CSS transitions and keyboard accessibility (Esc dismiss). Add pairwise comparison tabs/cards for Name. Implement highlighted text quotes and diff cards. Implement dynamic document decision buttons. Build `ManualEntry` inside drawer allowing user to type a value, marking it `source: 'manual'`, and triggering re-evaluation. Build `DocumentModal` for full document preview. Connect student decisions to reactive updates in `FixList`. Polish editorial styling (warm paper canvas, ink text, typography hierarchy, dark mode and mobile sheet stretch). Verify layout across desktop and mobile widths.
  Verify (mechanical): Run Playwright test verifying drawer opens on checklist click, selecting "Marksheet is correct" updates the fix list text to "Update the application form to 89.4%", and manual entry re-runs evaluation.
  Learner check: In the browser, click the Marks Percentage row to open the evidence drawer, review the 92.4% vs 89.4% quote diff, click "Marksheet is correct", and confirm the fix list updates live.
  Commit: `Add side-by-side evidence drawer, decision controls, and visual polish`

- [x] **4. Client image downscaling, live Gemini extraction pipeline, fallback banner, and privacy notices**
  Becomes usable: Real document upload capability supporting PDF, PNG, and JPEG with client-side image downscaling (max 1600px JPEG, $\le 1.5$MB/file, $<4.0$MB total request payload), server-side Route Handler `POST /api/extract` calling Gemini vision via `@google/genai` (reading `GEMINI_MODEL`, `GEMINI_API_KEY`, `LIVE_CHECK_ENABLED`), in-memory rate limiting, zero-PII logging, and graceful error/quota fallback banner with privacy notices.
  Why now: Provides the live extraction engine for real uploaded scans while safeguarding Vercel serverless request limits and handling API unavailability safely.
  PRD ref: `prd.md > Features and Behavior > 1. Ingestion & Dual Sample Presets` (Live Upload Mode), `prd.md > States and Boundaries` (API Error/Rate Limit State)
  Spec ref: `spec.md > Stack`, `spec.md > Gemini Prompt Contract & Extraction Schema`, `spec.md > Important Failure Modes & Fallbacks`
  Build: Implement client-side image downscaling in `src/lib/normalize/image.ts`. Implement server Route Handler `src/app/api/extract/route.ts` using `@google/genai` with `GEMINI_MODEL`, `GEMINI_API_KEY`, `LIVE_CHECK_ENABLED`, and Zod validation. Implement rate limiting and error fallback banner ("Live check is unavailable right now"). Add visible privacy notice ("Files are sent to Gemini; use synthetic/redacted samples; Parity doesn't store files") and results footer disclaimer.
  Verify (mechanical): Run integration test verifying route handler validates schemas and handles mocked Gemini responses; verify client downscaling respects size ceilings; verify live check handles fallback when `LIVE_CHECK_ENABLED=false` or API fails.
  Learner check: Drop an image file into the upload dropzones to observe client downscaling and size validation, view the privacy disclaimer, and test live extraction (or fallback banner if key absent).
  Commit: `Add live Gemini extraction pipeline, client downscaling, and fallback handling`

- [x] **5. Scan evaluation harness, benchmark fixtures, and Playwright demo test**
  Becomes usable: A repeatable quality harness (`npm run eval:scans`) evaluating Gemini extraction against 8–10 diverse test scans (clean, blurry, rotated) in `tests/fixtures/scans/` compared against `ground-truth.json`, reporting true field-level accuracy and the real false-Consistent rate without artificial tuning. Plus a Playwright end-to-end test verifying the 60-second sample demo flow.
  Why now: Resolves our stated learning uncertainty regarding scan OCR fidelity and provides automated regression protection for the final submission.
  PRD ref: `prd.md > Implementation Priorities`, `prd.md > Open Questions`
  Spec ref: `spec.md > Evaluation Harness & Quality Verification Plan`
  Build: Create 8–10 synthetic test scans in `tests/fixtures/scans/` (clean, blurry, rotated) and write corresponding `ground-truth.json`. Implement evaluation script `tests/eval/scan-eval.ts` and add `eval:scans` script to `package.json`. Write Playwright test `tests/e2e/demo-flow.spec.ts` testing the complete sample demo path.
  Verify (mechanical): Run `npm run eval:scans` and inspect the true accuracy and false-Consistent rate report. Run `npm run test:e2e` to verify Playwright demo-flow passes.
  Learner check: Run `npm run eval:scans` in the terminal to inspect field-level accuracy and false-Consistent metrics across benchmark scans.
  Commit: `Add scan evaluation harness, benchmark fixtures, and Playwright demo test`

## Hands-on Checkpoints

- [x] Early usable behavior explored — Slice 2 (dual sample demo, animated counters, checklist, and fix list on running dev server)
- [ ] Final kick-the-tires exploration and feedback completed — Slice 5 (complete live upload, drawer, manual entry, eval harness, and export)

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: 
Route and stops: 
Edit outcome: 
Reflection: 
Activity mode: 

## Revisions

### Earlier Approved Revisions
- **Unresolved conflict fix wording:** Prompted decision ("Choose which document is correct") instead of presuming an action fix before student selection.
- **Persistent sample label:** Added permanent results banner `Sample Result — Synthetic Scholarship Packet` so judges never confuse offline demo samples with live AI extraction.
- **Client downscaling for Vercel limits:** Capped each uploaded image at max 1600px JPEG and $\le 1.5$MB with total request $<4$MB, rejecting oversized PDFs client-side with actionable feedback.
- **Live fallback error banner:** Implemented prominent top banner with a 1-click fallback button to load the instant sample packet whenever Gemini API quota, key, or network fails.
- **Raster benchmark scans:** Generated 10 real raster PNG/JPEG scans (`tests/fixtures/scans/`) rendered via Playwright Chromium headless with subtle blur, rotation, and faded ink to test OCR vision without SVG shortcuts. Verified with `npm run eval:scans` achieving 0.0% False-Consistent rate.

### 2026-10-23 — Pre-Submission Scope Expansion (Slices A–D)
- **Slice A (Bounding-box evidence):** Request normalized bounding boxes with each extracted field (`ymin, xmin, ymax, xmax` or `{x, y, width, height}` normalized); render overlays on document previews in the evidence drawer and document preview modals; provide precomputed boxes for sample packets.
  *Why:* Plain text quote excerpts require manual visual scanning; direct bounding-box highlight overlays localize the exact coordinate region on the document image instantly.
- **Slice B (Double-read verification & eval harness):** Crop the image to the box, re-extract the value from the crop only, and mark `Needs Review` if the reads disagree. Add double-read metrics to the eval harness and report live numbers honestly (including any disagreements).
  *Why:* Protects against hallucinated full-page values and ensures the extracted text exists within the cropped bounding box.
- **Slice C (Packet presets and custom field editor):** Packet presets (Scholarship, College Admission, Financial Aid) and a custom field editor supporting 5 field types (`name`, `date`, `amount`, `id`, `text`), reusing the deterministic comparison rules. Updated the field-to-document matrix in the spec.
  *Why:* Enables students to verify multi-variety document packets beyond the initial 5-field scholarship archetype while maintaining zero LLM judgment.
- **Slice D (Downloadable PDF report & issuing office message):** Downloadable verification report (PDF) and drafted correction request message to the issuing office for corrected documents.
  *Why:* Students need authoritative, offline-shareable documentation to present to college administrative desks and issuing authorities to dispute errors before deadlines.

## Pre-Submission Expansion Slices

- [x] **Slice A: Bounding-box evidence**
  - Extract normalized bounding boxes with Gemini schema.
  - Render overlays on document previews in evidence drawer and modal.
  - Precompute bounding boxes in sample packets (`samples.ts`).
  - Unit tests & commit.

- [x] **Slice B: Double-read verification**
  - Crop image to box and re-extract value from crop only.
  - Mark `Needs Review` if reads disagree with explicit diff explanation.
  - Integrate into eval harness and report live figures honestly.
  - Unit tests & commit.

- [x] **Slice C: Packet presets and custom field editor**
  - Add preset selector (`scholarship`, `college_admission`, `financial_aid`).
  - Build custom field editor supporting 5 field types (`name`, `date`, `amount`, `id`, `text`).
  - Reuse deterministic comparison engine rules across all custom types.
  - Update field-to-document matrix in spec.
  - Unit tests & commit.

- [x] **Slice D: Downloadable report (PDF) & issuing office draft**
  - Build downloadable PDF verification report.
  - Draft polite, formal correction request message for issuing authority.
  - Unit tests & commit.

### 2026-10-23 — International Generalization & Multi-Locale Verification
- **Positioning & Global Copy:** Generalized UI copy, README, and documentation for global audiences. Replaced "marksheet" with "transcript", removed regional institutions and honorifics, and adopted tagline: *"Make your documents agree before you submit."*
- **International Fixtures & Samples:** Created USD scholarship packet (GPA out of 4.0, tax statement, textual dates) keeping 3 Conflicts / 2 Consistent, and EUR/GBP multi-locale packet (compound/accented names, monthly income) producing `Needs Review`.
- **Locale-Aware Engine Rules:** Ambiguous numeric dates, US/EU/space number grouping, currency mismatches, weekly/biweekly/monthly annualization factors, cultural name forms, GPA scale awareness.
- **Multi-Country Tests & Honest Eval:** Unit tests with examples from $\ge 5$ countries; preserved fixture sanity; updated ground truth only for newly generated fixtures with honest live evaluation reporting.
- **Repository-Wide Sanitization:** Searched and generalized remaining India-specific text across code, fixtures, and docs.

## International Generalization Slices

- [x] **1. Positioning & Copy Rewrite**
  - Rewrite UI copy, topbar, hero, checklist, and README for global audience.
  - Replace "marksheet" with "transcript".
  - Update tagline to "Make your documents agree before you submit."
  - Unit tests & commit.

- [x] **2. International Sample Packets & Synthetic Fixtures**
  - Regenerate USD scholarship sample packet (form, transcript with 4.0 GPA, tax statement; dates like "12 Aug 2024").
  - Regenerate EUR/GBP messy packet (compound names, accented variants, monthly income).
  - Ensure clean packet produces 3 Conflicts / 2 Consistent and messy packet produces Needs Review via real engine.
  - Unit tests & commit.

- [x] **3. Locale-Aware Verification Engine Rules**
  - Ambiguous numeric dates $\rightarrow$ Needs Review (unless day > 12, written month, or explicit format setting).
  - EU/US/Indian/space number grouping normalization.
  - Different currencies $\rightarrow$ Needs Review.
  - Weekly ($\times 52$), biweekly ($\times 26$), monthly ($\times 12$) annualization with factor in diff explanation.
  - Cultural name normalization (accents, particles, double/hyphenated surnames, family-name-first) $\rightarrow$ Needs Review.
  - GPA scales (4.0, 5.0, percentage) with Needs Review when scales differ.
  - Expanded academic-year formats.
  - Unit tests & commit.

- [x] **4. Multi-Country Test Suite & Honest Eval Harness**
  - Comprehensive unit tests covering $\ge 5$ countries.
  - Retain fixture sanity tests.
  - Update eval ground truth to match regenerated fixtures and run live eval reporting honestly.
  - Unit tests & commit.

- [x] **5. Repository-Wide India-Specific Terminology Sanitization**
  - Search repository for remaining regional terms (`₹`, `lakh`, `Aadhaar`, `Shri`, `tehsildar`, `marksheet`).
  - Generalize to international equivalents.
  - Verify all tests pass and commit.

- [x] **6. Fallback Model, 503 Retry Strategy, Honest Double-Read Crop Reporting, and Redefined False-Consistent Metric (2026-10-23)**
  - Model fallback (`gemini-3.1-flash-lite` -> `gemini-2.5-flash`) and exponential backoff retry loop for 503/429/timeout upstream errors.
  - Test and verify the HTTP 503 route handling in `tests/unit/extract-route.test.ts` and `tests/unit/gemini-fallback.test.ts`.
  - Fix income period detection to inspect both `value` and verbatim `quote`, verified with unit test (`15,000` with quote `"...15,000 per month"`).
  - Generate 4 new USD and EUR raster scans (`scan_11_us_transcript`, `scan_12_us_payslip`, `scan_13_tax_statement`, `scan_14_eur_income`) and append ground truth.
  - Run physical double-read crop checks live with Gemini on real PNGs; report real results honestly (14 crop passes, 4 agreed, 10 real disagreements detected due to bounding box row offsets).
  - Redefine false-consistent metric strictly over differing ground-truth pairs: **0 of 31 differing pairs across 9 distinct scan sets (0.0% false-consistent rate)**.
  - Update `README.md` to document observed 503 and timeout behavior, model fallback, and live double-read evaluation.

- [x] **7. Batched Full-Width Band Double-Read, Strict Verification Mode, and Unambiguous US Scan Dates (2026-10-23)**
  - Re-engineered double-read cropping: pad crop to full-width horizontal band ($\pm 1$ row padding) to resolve narrow bounding-box vertical offsets into adjacent rows.
  - Batched document-level verification: all crops for each document are bundled into 1 single secondary API call using multi-image inline data parts, reducing secondary calls from 14 down to 4.
  - Run double-read only for fields that would initially be labelled Consistent.
  - Conditional visual overlays: withhold visual overlays unless the crop read confirms agreement with the full-page read; otherwise display the verbatim quote with a "Location not verified" badge.
  - Strict verification UI toggle: added interactive pill switch (default ON since post-fix agreement rate is 100.0%) and documented Fast vs Strict modes and API call costs.
  - Regenerate US scans with unambiguous textual dates ("August 12, 2024" and "July 15, 2024").
  - Symmetrical eval metrics: reported False-Consistent Rate (0 / 31 = 0.0%) alongside True-Consistent Recall Rate (12 / 14 = 85.7% across noisy scans, 100% on clean scans).
  - Unit tests in `tests/unit/batched-doubleread.test.ts` (109 tests passing).




