---
doc: spec
status: approved
---

# Parity — Technical Specification

## How This Works, In Plain Language
Parity is a web application that helps students catch discrepancies across application forms and supporting certificates before submitting them to high-stakes portals.

The system is split into two strict layers:
1. **Perception (AI Extraction):** When a student uploads document scans or PDFs, a server-side Gemini multimodal API call reads the text and extracts five key fields (`name`, `academic_year`, `marks`, `income`, `issue_date`). For every field, the model must return the extracted value, a short verbatim quote (under 200 characters) containing that value and surrounding context, the page number, and a self-reported confidence score. If a field cannot be seen clearly, the model returns `null`.
2. **Judgment (Deterministic Engine):** The AI is never allowed to decide whether two documents match. A pure TypeScript comparison engine takes the extracted data, normalizes values (converting international and regional currency numbers, standardizing dates, and handling per-month vs per-annum conversions), and verifies that each extracted value literally appears within the quoted text. The engine then categorizes each field into one of three strict states using a clear precedence hierarchy: `Conflict` > `Needs Review` > `Consistent`.

The student interacts with an inspection dashboard. For precomputed demos, the system runs with zero network calls in $<2$ seconds using synthetic document assets. For flagged fields, a slide-over drawer shows side-by-side document quotes and previews. When the student indicates which document is correct, a prioritized "Fix before submitting" checklist generates ethical, actionable advice: telling the student to edit their application form if the form was wrong, or to request a re-issued document from the authority if an official certificate was wrong.

## The Core Journey Through the System
Implements `prd.md > The Core Journey`.

1. **User loads the app:** Browser requests `/` from the Next.js App Router server. React renders the single-page workspace with dropzones, sample triggers, empty summary counters, and an empty checklist.
2. **User clicks "Load sample packet" or "Try a messy packet":**
   - The client loads pre-extracted fixture data from `src/data/samples/`.
   - The client passes this data directly to `src/lib/compare/engine.ts`.
   - In $<2$s, the engine returns the evaluation results. Summary counters animate, and the checklist renders with badges (`Consistent`, `Conflict`, `Needs Review`).
3. **User runs "Live check" with uploaded files:**
   - Client validates file types (PDF, PNG, JPEG).
   - Client downscales images in the browser (max 1600px on the longest side, JPEG quality 0.85) to ensure each file is $\le 1.5$MB and total multipart payload is $<4.0$MB (safely beneath Vercel's 4.5MB serverless limit). PDFs $>1.5$MB are rejected before upload.
   - Client sends payload to `POST /api/extract`.
   - Route handler checks `LIVE_CHECK_ENABLED`, enforces in-memory rate limits, validates magic file signatures, converts files to base64 `inlineData`, and calls Gemini via `@google/genai` with a strict prompt and Zod schema.
   - Route handler runs the deterministic engine on the extracted facts and returns verified field comparisons.
4. **User clicks a field row:**
   - Active field state is set in client React state.
   - `EvidenceDrawer` slides in from the right (or bottom sheet on mobile).
   - Side-by-side cards render document names, page citations, verbatim quotes with highlighted values, diff badges, and thumbnail page previews.
5. **User clicks a resolution button or edits a value:**
   - User can click a decision button (`[ Marksheet is correct ]`, etc.) or use `ManualEntry` to override an unreadable field with a typed value (tagged `source: 'manual'`).
   - Action dispatches to `src/lib/fixplan/generator.ts`.
   - Prioritized fix list updates reactively into `Fix before submitting`, `Needs manual review`, or `Consistent`.
6. **User clicks "Export fix list":**
   - `src/lib/fixplan/exporter.ts` converts the current fix list state into a downloadable CSV blob.

## Field-to-Document Comparison Matrix
The deterministic engine evaluates each field strictly across its designated source documents:

### 1. Default Scholarship Packet Matrix
| Field ID | Field Label | Compared Source Documents | Primary Extraction Target |
| :--- | :--- | :--- | :--- |
| `name` | Student Name | **Application Form**, **Marksheet**, **Income Certificate** (Pairwise: Form vs Marksheet, Form vs Income Cert) | Full legal name, tokens, initials |
| `academic_year` | Academic Year | **Application Form**, **Marksheet** | Enrollment year string (e.g. "2024-25") |
| `marks` | Marks Percentage | **Application Form**, **Marksheet** | Overall percentage score (e.g. "89.4%") |
| `income` | Annual Family Income | **Application Form**, **Income Certificate** | Gross annual income in INR (supports monthly $\times 12$) |
| `issue_date` | Certificate Issue Date | **Application Form** (reported date), **Income Certificate** (official issue date) | Certificate issuance date (DD/MM/YYYY) |

### 2. Preset Packets Matrix
Parity includes pre-configured packet templates that adapt the comparison matrix across differing document sets:
- **Scholarship Verification Packet (Default):** Application Form, Academic Marksheet, Income Certificate (evaluates `name`, `academic_year`, `marks`, `income`, `issue_date`).
- **College Admission Packet:** Admission Application, High School Marksheet, Transfer Certificate / ID (evaluates `name`, `dob`, `id_number`, `marks`, `academic_year`).
- **Financial Aid Packet:** Aid Application Form, Tax / Income Affidavit, Bank Statement / Certificate (evaluates `name`, `pan_or_tax_id`, `annual_income`, `issue_date`).

### 3. Custom Field Deterministic Rules Matrix
When defining custom fields in the packet editor, fields map to one of five deterministic comparison engines:
| Field Type | Canonical Normalization | Matching & Comparison Logic | Classification Rules |
| :--- | :--- | :--- | :--- |
| `name` | Unicode normalization, title-casing, honorific stripping (Mr., Ms., Dr., Shri). | Pairwise token matching: full set equality, permutation invariance, single-initial compatibility. | Exact token match $\to$ `Consistent`; Initial mismatch or missing token $\to$ `Needs Review`; Disjoint token sets $\to$ `Conflict`. |
| `date` | Parse DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY, and textual dates (e.g., "15 July 2024"). | Calendar date comparison (year, month, day) independent of client timezone or formatting. | Identical date $\to$ `Consistent`; Ambiguous day/month (e.g. 05/06 vs 06/05) $\to$ `Needs Review`; Different calendar dates $\to$ `Conflict`. |
| `amount` | Strip currency symbols (`$`, `₹`, `€`), commas; regional numeral conversion; detect per-month vs per-annum. | Exact numerical comparison in base currency units; automatic $12\times$ monthly-to-annual scaling. | Equal numerical value $\to$ `Consistent`; Unclear frequency/period $\to$ `Needs Review`; Unequal value $\to$ `Conflict`. |
| `id` | Uppercase normalization, strip hyphens, spaces, and punctuation (e.g., Aadhaar, SSN, Roll No). | Exact alphanumeric string equality. | Identical sanitized string $\to$ `Consistent`; Missing characters or OCR noise $\to$ `Needs Review`; Mismatched alphanumeric string $\to$ `Conflict`. |
| `text` | Trim whitespace, lowercase/uppercase canonicalization, punctuation collapsing. | Deterministic normalized string equality and quote containment verification. | Equal text $\to$ `Consistent`; Confidence $<0.7$ or containment failure $\to$ `Needs Review`; Disjoint non-empty values $\to$ `Conflict`. |

## Stack
Implements `prd.md > Implementation Priorities`.

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript 5
  - *Rationale:* Single full-stack process, zero CORS issues, shared TypeScript types and comparison logic between browser and server, seamless Vercel deployment.
  - *Doc:* [Next.js Docs](https://nextjs.org/docs)
- **Styling:** Tailwind CSS v3 (`tailwindcss@^3.4`) + Vanilla CSS tokens
  - *Rationale:* Locked to Tailwind v3 for stability, custom warm editorial palette, dark mode class support.
  - *Doc:* [Tailwind CSS v3 Docs](https://v3.tailwindcss.com/docs)
- **AI SDK:** `@google/genai` (Official Google GenAI JavaScript SDK)
  - *Rationale:* Official Google GenAI SDK for Gemini vision models with native structured JSON schema enforcement (`responseSchema`).
  - *Doc:* [Google GenAI JS SDK](https://github.com/googleapis/js-genai) and [Gemini API Docs](https://ai.google.dev/gemini-api/docs/sdks)
- **Schema Validation:** Zod
  - *Rationale:* Runtime validation of structured JSON returned from Gemini before handing off to the deterministic engine.
  - *Doc:* [Zod Docs](https://zod.dev)
- **Testing:**
  - Vitest: Unit and integration tests for normalization, quote containment, name matching, and fix list generation.
  - Playwright: End-to-end browser test verifying the 60-second sample demo flow.
  - *Docs:* [Vitest](https://vitest.dev), [Playwright](https://playwright.dev)
- **Runtime:** Node.js 22 LTS
- **Deployment Target:** Vercel (optional, fully runnable locally with `npm run dev`).

## Where It Runs and How Someone Tries It
- **Local Environment:**
  - Prerequisites: Node.js 22+, `npm`
  - Environment Variables in `.env.local`:
    - `GEMINI_API_KEY`: API key from Google AI Studio.
    - `GEMINI_MODEL`: `gemini-2.5-flash` (or confirmed active flash model).
    - `LIVE_CHECK_ENABLED`: `true` (can be set to `false` to disable live route if quota expires).
- **Start Command:**
  ```bash
  npm install
  npm run dev
  ```
- **Demo Recording Workflow:**
  1. Open `http://localhost:3000`.
  2. Click **"Load sample scholarship packet"** (shows 3 synthetic documents).
  3. Click **"Run check"** (instant execution, animated counters show 3 Conflicts, 2 Consistent).
  4. Click the **Marks Percentage** row (opens side-by-side evidence drawer showing 92.4% vs 89.4%).
  5. Click **"Marksheet is correct"** (fix list updates immediately to "Update the application form to 89.4%").
  6. Click **"Try a messy packet"** (demonstrates "S. Sharma" `Needs Review` and normalized monthly income).
  7. Click **"Export fix list"** (downloads CSV).

## Look and Feel
Implements `prd.md > Look and Feel`.

- **Theme Palette:**
  - Light Mode (Default): Canvas `#F9F9FB`, Surface `#FFFFFF`, Border `#E2E2E8`, Text Ink `#1A1A1E`, Muted `#64748B`.
  - Dark Mode (Stretch): Canvas `#121316`, Surface `#1A1B20`, Border `#2A2C34`, Text `#ECECF1`, Muted `#94A3B8`.
  - Status Indicators (Color-blind accessible triple-encoding):
    - `Conflict`: `#DC2626` (Red-600) with alert icon `[!]`
    - `Consistent`: `#16A34A` (Green-600) with checkmark `[✓]`
    - `Needs Review`: `#2563EB` / `#475569` (Slate/Blue) with inspect icon `[?]`
  - Evidence Highlighter: `rgba(250, 204, 21, 0.25)` background with soft border accent.
- **Typography:**
  - Headings: Serif font stack (`Newsreader`, `Playfair Display`, `Georgia`, serif) for editorial authority.
  - Body/UI: Clean sans-serif stack (`Inter`, system-ui, sans-serif).
  - Values/Diffs: Monospace stack (`JetBrains Mono`, `Fira Code`, monospace).

## Components
Implements `prd.md > Screens and Layout`, `prd.md > Features and Behavior`.

### TopBar (`src/components/TopBar.tsx`)
- Displays app branding ("Parity"), subtitle ("Packet pre-submission verification"), and dark mode toggle.
- PRD ref: `prd.md > Screens and Layout`.

### IngestionZone (`src/components/IngestionZone.tsx`)
- Houses primary action buttons: `"Load sample scholarship packet"`, `"Try a messy packet"`, and `"Reset"`.
- Contains three `UploadSlot` components (Application Form, Marksheet, Income Certificate) with dropzone drag-and-drop, file type badges, and preview thumbnails.
- Client-side downscaling handler: Resizes images to max 1600px JPEG before upload; validates file size $\le 1.5$MB.
- Displays live upload privacy warning notice.
- PRD ref: `prd.md > Features and Behavior > 1. Ingestion & Dual Sample Presets`.

### SummaryCounters (`src/components/SummaryCounters.tsx`)
- Animated numerical counters displaying aggregate breakdown: `Conflicts`, `Consistent`, and `Needs Review`.
- PRD ref: `prd.md > The Core Journey > Step 4`.

### FieldChecklist (`src/components/FieldChecklist.tsx`)
- Interactive list of the five cross-referenced fields.
- Each row displays: Field title, status badge (`Consistent`, `Conflict`, `Needs Review`), compared document badges, and quick summary diff.
- Supports keyboard navigation (Arrow keys move selection, Enter opens drawer).
- PRD ref: `prd.md > The Core Journey > Step 4`.

### EvidenceDrawer (`src/components/EvidenceDrawer.tsx`)
- Desktop slide-over drawer from right / mobile bottom sheet.
- Displays:
  - Header with field name, status tag, and close button (Esc hotkey).
  - Pairwise document cards showing document name, page number, and verbatim quote with highlighted snippet (highlight boxes precomputed on sample assets only; live results display verbatim quoted text and source page).
  - Diff card showing normalized values and delta explanation.
  - Interactive decision buttons dynamically named after documents (`[ Marksheet is correct ]`, `[ Application form is correct ]`, `[ I'm not sure ]`).
  - `ManualEntry` component for user overrides.
  - Clickable document page preview modal (`DocumentModal.tsx`).
- PRD ref: `prd.md > Features and Behavior > 3. Side-by-Side Evidence Inspection Drawer`.

### ManualEntry (`src/components/ManualEntry.tsx`)
- Input form rendered inside `EvidenceDrawer` when a user wants to override an unreadable or contested value.
- Allows user to type the value, select which document it corresponds to, and click `"Save & Re-evaluate"`.
- Updates field record with `source: 'manual'` and re-runs `src/lib/compare/engine.ts` immediately.

### FixList (`src/components/FixList.tsx`)
- Sticky sidebar card organized strictly into three sections:
  1. **Fix before submitting**
  2. **Needs manual review**
  3. **Consistent**
- Primary action: `"Export fix list"` button triggering CSV download.
- Footer disclaimer: Discloses that Parity verifies legible data parity, not document genuineness or eligibility.
- PRD ref: `prd.md > Features and Behavior > 4. Human Decision Authority & Prioritized Fix List`.

## Gemini Prompt Contract & Extraction Schema

### Extraction Prompt Text (`src/lib/gemini/prompt.ts`)
```text
You are a precise forensic document transcription assistant.
Your task is to transcribe facts from the provided document image or PDF for pre-submission verification.

STRICT INSTRUCTIONS:
1. Transcribe EXACTLY as printed on the document. Do NOT correct typos, do NOT standardize spelling, and do NOT calculate or infer values.
2. If a field is not clearly visible or completely missing, return null for both "value" and "quote". Never guess.
3. For every non-null field, provide a verbatim "quote" of the exact text from the document containing the value.
   - The quote MUST be under 200 characters.
   - For income, the quote MUST include surrounding words indicating frequency or period (e.g., "per month", "p.m.", "per annum", "annual").
4. Return a self-reported confidence score between 0.0 and 1.0 reflecting OCR clarity.
5. Provide the 1-indexed page number where the fact was located.

Target fields to extract:
- name: The student's legal name.
- academic_year: The academic year (e.g., "2024-25").
- marks: The aggregate percentage or marks scored (e.g., "89.4%").
- income: The family or guardian annual/monthly income (e.g., "₹1,80,000", "15,000/month").
- issue_date: The certificate issue date (e.g., "12/08/2024").
```

### Zod Validation Schema (`src/lib/gemini/schema.ts`)
```typescript
import { z } from 'zod';

export const ExtractedFieldSchema = z.object({
  field_id: z.enum(['name', 'academic_year', 'marks', 'income', 'issue_date']),
  value: z.string().nullable(),
  quote: z.string().nullable(),
  page: z.number().int().default(1),
  confidence: z.number().min(0).max(1)
});

export const DocumentExtractionSchema = z.object({
  document_type: z.enum(['application_form', 'marksheet', 'income_certificate']),
  fields: z.array(ExtractedFieldSchema)
});

export type ExtractedField = z.infer<typeof ExtractedFieldSchema>;
export type DocumentExtraction = z.infer<typeof DocumentExtractionSchema>;
```

## Deterministic Rules & Algorithms (`src/lib/compare/`)

### 1. Confidence & Quote Containment Guard
```typescript
export const CONFIDENCE_THRESHOLD = 0.7;
export const MAX_QUOTE_LENGTH = 200;

export function verifyQuoteContainment(value: string | null, quote: string | null): boolean {
  if (!value || !quote) return false;
  if (quote.length > MAX_QUOTE_LENGTH) return false;
  
  // Clean whitespace and case on raw strings before numeric conversion
  const cleanVal = value.trim().toLowerCase().replace(/\s+/g, ' ');
  const cleanQuote = quote.trim().toLowerCase().replace(/\s+/g, ' ');
  
  return cleanQuote.includes(cleanVal);
}
```

### 2. Status Precedence & Tri-State Evaluation
When evaluating multiple pairwise comparisons or aggregation steps, status precedence is strictly:
$$\mathbf{Conflict} > \mathbf{Needs\ Review} > \mathbf{Consistent}$$

- If any pair evaluates to `Conflict`, the aggregated field is `Conflict`.
- If no pair is `Conflict`, but at least one pair is `Needs Review`, the field is `Needs Review`.
- Only if all required comparisons evaluate to `Consistent` is the field `Consistent`.

### 3. Name Matching Rules Table (`src/lib/normalize/name.ts`)
| Case | Document A | Document B | Normalized Comparison | Pair Status | Precedence Reason |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Exact Match | Suresh Sharma | Suresh Sharma | `["suresh", "sharma"]` == `["suresh", "sharma"]` | `Consistent` | Identical tokens |
| Title/Honorific | Shri Suresh Sharma | Suresh Sharma | Strips "Shri" $\rightarrow$ Identical | `Consistent` | Honorific ignored |
| Reordered | Sharma Suresh | Suresh Sharma | Identical set, different order | `Needs Review` | Possible match, reordered |
| Initials | S. Sharma | Suresh Sharma | Initial token "s" matches prefix "suresh" | `Needs Review` | Possible match, initials |
| Single Token | Suresh | Suresh Sharma | Single token vs full name | `Needs Review` | Incomplete name token |
| Same Surname, Diff Given | Ramesh Sharma | Suresh Sharma | Surname matches, given name disjoint | `Conflict` | Conflicting given names |
| Different Surname | Suresh Verma | Suresh Sharma | Surname disjoint | `Conflict` | Different family name |
| Missing/Null | null | Suresh Sharma | Missing extraction | `Needs Review` | Unextracted field |

### 4. Numeric & Income Normalization (`src/lib/normalize/numbers.ts`)
- **Number Grouping:** Converts strings with international standard or South Asian grouping (e.g. `"240,000"`, `"2,40,000"`, `"1,80,000"`) to raw integers `240000`, `180000`.
- **Currency & Frequency:**
  - Strips symbols & currency codes: `$`, `€`, `£`, `¥`, `₹`, `USD`, `EUR`, `GBP`, `CAD`, `AUD`, `INR`, `Rs.`, `/-`.
  - Detects period tokens: `"per month"`, `"/month"`, `"/mo"`, `"p.m."` $\rightarrow$ multiplies value by 12 to annualize.
  - Detects `"per annum"`, `"/year"`, `"/yr"`, `"annual"`, `"p.a."` $\rightarrow$ maintains annual value.
  - If period is ambiguous $\rightarrow$ flags `Needs Review`.
- **Marks Percentage:** Strips `%`, parses to `float` rounded to 1 decimal place (`92.4%` $\rightarrow$ `92.4`). If scale is detected as CGPA (e.g. `8.9/10`) without explicit conversion formula $\rightarrow$ flags `Needs Review`.

### 5. Date Normalization (`src/lib/normalize/dates.ts`)
- Parses dates using DD/MM/YYYY as primary default.
- Converts to canonical ISO date string `YYYY-MM-DD` for equality check.
- If date is ambiguous (e.g., cannot be parsed or invalid calendar date) $\rightarrow$ flags `Needs Review`.

## File Structure

```
e:\Parity/
├── devpost/                         # Hackathon learning docs & planning artifacts
│   ├── learner-profile.md           # Learner context & preferences
│   ├── scope.md                     # Approved POC scope
│   ├── prd.md                       # Approved product requirements
│   └── spec.md                      # Approved technical specification
├── public/
│   └── samples/                     # Synthetic documents for instant demo
│       ├── clean_form.png
│       ├── clean_marksheet.png
│       ├── clean_income_cert.png
│       ├── messy_form.png
│       ├── messy_marksheet.png
│       └── messy_income_cert.png
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── extract/
│   │   │       └── route.ts         # Server-side Gemini vision extraction handler
│   │   ├── globals.css              # Editorial Tailwind tokens & fonts
│   │   ├── layout.tsx               # Root layout with metadata
│   │   └── page.tsx                 # Main single-page application workspace
│   ├── components/
│   │   ├── TopBar.tsx               # Header, branding & dark mode toggle
│   │   ├── IngestionZone.tsx        # Upload dropzones, downscaling & sample preset triggers
│   │   ├── UploadSlot.tsx           # Individual document dropzone slot
│   │   ├── SummaryCounters.tsx      # Animated numerical state counters
│   │   ├── FieldChecklist.tsx       # 5-field comparison rows with badges
│   │   ├── EvidenceDrawer.tsx       # Slide-over evidence comparison & diff
│   │   ├── ManualEntry.tsx          # Inline value override control
│   │   ├── DecisionGroup.tsx        # Document authority selection buttons
│   │   ├── FixList.tsx              # Prioritized remediation checklist
│   │   └── DocumentModal.tsx        # Full-size document page preview modal
│   ├── data/
│   │   └── samples.ts               # Pre-extracted JSON fixtures for clean & messy packets
│   └── lib/
│       ├── compare/
│       │   ├── engine.ts            # Core comparison coordinator & status precedence
│       │   ├── name.ts              # Pairwise name evaluation logic
│       │   └── types.ts             # Comparison & verification TypeScript interfaces
│       ├── fixplan/
│       │   ├── generator.ts         # Generates ethical remediation instructions
│       │   └── exporter.ts          # CSV generation utility
│       ├── gemini/
│       │   ├── client.ts            # @google/genai client initializer & rate limiter
│       │   ├── prompt.ts            # Structured extraction prompt
│       │   └── schema.ts            # Zod validation schemas
│       └── normalize/
│           ├── dates.ts             # DD/MM/YYYY date parser
│           ├── image.ts             # Client-side image downscaling (max 1600px JPEG)
│           ├── name.ts              # Tokenizer, honorific stripper & initial matcher
│           └── numbers.ts           # International currency, marks & period normalizer
├── tests/
│   ├── unit/
│   │   ├── normalize.test.ts        # Unit tests for numbers, dates, and names
│   │   ├── compare.test.ts          # Unit tests for quote containment, precedence & classification
│   │   └── fixplan.test.ts          # Unit tests for remediation copy & CSV export
│   ├── eval/
│   │   └── scan-eval.ts             # Benchmark script measuring extraction accuracy & false-consistent rate
│   ├── fixtures/
│   │   └── scans/                   # 8–10 test scan images (clean, blurry, rotated) + ground-truth.json
│   └── e2e/
│       └── demo-flow.spec.ts        # Playwright test verifying 60-second sample demo
├── .env.example                     # Secret-free environment template
├── .gitignore                       # Ignores .env and personal devpost notes
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

## External Services and Dependencies
- **Google Gemini API (`@google/genai`):**
  - Model: Read dynamically from `process.env.GEMINI_MODEL` (e.g. `gemini-2.5-flash` or `gemini-1.5-flash`).
  - Endpoint: Multimodal `generateContent` passing Base64 inline image/PDF data.
  - Response Format: `responseMimeType: "application/json"`, validated with Zod.
  - Timeout: 20 seconds with 1 retry on 5xx or network timeout.
  - Documentation: [Google GenAI JS SDK](https://github.com/googleapis/js-genai) and [Gemini API Docs](https://ai.google.dev/gemini-api/docs/sdks)
  - Rate Limits & Serverless Protection: Best-effort in-memory per-instance rate limiter + `LIVE_CHECK_ENABLED` kill switch flag in `.env.local` to gracefully disable live extraction if API quotas expire.
  - Privacy Compliance: Route handler MUST NEVER log raw file contents, base64 data, or extracted PII to disk or server logs. Ephemeral memory processing only.

## Important Failure Modes & Fallbacks
1. **Payload Too Large for Vercel Serverless (HTTP 413):**
   - *Mitigation:* Client automatically downscales document images to max 1600px on the longest dimension (JPEG quality 0.85) before upload. Each file is capped at 1.5MB and total request is capped at $<4.0$MB. PDFs exceeding 1.5MB are rejected immediately on the client with message: *"PDF exceeds 1.5MB limit. Please compress or upload page images."*
2. **Gemini API Down / Key Expired / Rate Limited:**
   - *Behavior:* Server returns HTTP 503 with `{ error: "live_unavailable" }`. Client renders prominent top banner: *"Live check is unavailable right now. Test the instant sample packet below."* Precomputed sample buttons remain 100% operational.
3. **Unreadable Scan / Model Returns Null / Containment Fails:**
   - *Behavior:* Field transitions strictly to `Needs Review` with status reason *"Extracted value could not be confirmed in document text"*. Field displays `ManualEntry` input. Value typed by student is tagged `source: 'manual'` and compared deterministically.
4. **Invalid File Upload:**
   - *Behavior:* Client-side drag-and-drop rejects unsupported MIME types immediately with an accessible toast before any network transfer.

## What Was Simplified and Why
- **In-Memory Ephemeral Processing** instead of a cloud database (Postgres/Supabase): Eliminates database hosting, migration setup, and user account maintenance while guaranteeing student PII privacy.
- **Client-Side Image Downscaling** instead of server-side thumbnail generation: Keeps serverless compute lightweight and guarantees request payloads remain within Vercel's 4.5MB ceiling.
- **Precomputed Synthetic Samples** instead of requiring live API execution for demos: Guarantees a flawless, instant ($<2$s) 60-second video demo that never fails due to network latency, Wi-Fi drops, or API quotas.
- **Single Benchmark Packet Preset** instead of arbitrary schema builder: Focuses 100% of technical effort on the verification kernel, edge cases, and high-trust UI rather than generic form-builder complexity.

## Decisions and Open Issues

### Decisions Made
- **Status Precedence:** `Conflict` > `Needs Review` > `Consistent` universally applied across all pairwise evaluations and aggregations.
- **Confidence Cutoff:** Set at `0.7` as a named constant in `src/lib/compare/engine.ts`.
- **Quote Containment Rules:** Raw string whitespace/case substring containment checked before numerical conversion; maximum quote length capped at 200 characters.
- **Remediation Phrasing Policy:** Form errors instruct `"Update the application form to [Value]"`; certificate errors instruct `"Request a corrected document from the issuing office"` (never altering official documents).
- **Stack:** Unified Next.js (App Router) + TypeScript + Tailwind v3.

### Evaluation Harness & Quality Verification Plan
- **Primary Metric:** False-Consistent rate (must be 0.0%).
- **Harness:** `tests/eval/scan-eval.ts` evaluates Gemini extraction against `tests/fixtures/scans/` (8–10 diverse scans: clean, blurry, rotated) comparing against `ground-truth.json`.
- **Command:** `npm run eval:scans`
- **Stretch Goal:** Double extraction pass (running two parallel Gemini calls and flagging any field disagreement as `Needs Review`).

### Open Questions
- **Student Demand Validation:** The user's field interviews with 4–5 students remain pending to validate problem frequency before final Devpost submission.

## Revisions

### 2026-10-23 — Pre-Submission Scope Expansion (Slices A–D)
- **Slice A (Bounding-Box Evidence Architecture):**
  - Updated extraction contract to request normalized bounding boxes `[ymin, xmin, ymax, xmax]` (or `{ x, y, width, height }` normalized to $0.0 \dots 1.0$) with each extracted fact.
  - Implemented visual highlight bounding-box overlays across document previews in `EvidenceDrawer` and `DocumentModal`.
  - Added precomputed normalized bounding boxes for all sample packet fields in `src/data/samples.ts`.
  *Why:* Plain-text verbatim quotes prove the words exist, but students inspecting high-density multi-page forms need immediate visual localization directly overlaid on the scan.
- **Slice B (Double-Read Verification & Eval Harness):**
  - Added double-read verification pipeline: bounding-box crop isolation followed by independent value re-extraction restricted strictly to the crop.
  - If the full-page extraction and isolated crop extraction disagree, the field is deterministically marked `Needs Review` with a specific mismatch explanation.
  - Integrated double-read verification into `tests/eval/scan-eval.ts` and automated reporting to output true agreement and disagreement rates honestly without altering ground truth.
  *Why:* Protects against full-page context contamination, OCR hallucination, or reading from adjacent tabular lines.
- **Slice C (Packet Presets & Custom Field Editor):**
  - Introduced configurable packet presets (`scholarship`, `college_admission`, `financial_aid`) and custom field schema editor supporting 5 data types: `name`, `date`, `amount`, `id`, `text`.
  - Each field type reuses the strict deterministic comparison engine (token matching, date parsing, numeric/frequency scaling, alphanumeric sanitization).
  - Updated the field-to-document matrix to specify source mappings and normalization rules across presets.
  *Why:* Enables students and institutions to verify multi-variety document packets beyond the initial 5-field scholarship archetype while maintaining zero LLM judgment.
- **Slice D (Downloadable PDF Report & Issuing Office Correction Draft):**
  - Added formatted downloadable PDF verification summary capturing packet metadata, field statuses, source citations, and student resolutions.
  - Built an automated letter generator drafting formal correction request messages addressed to the issuing registrar or authority for flagged official certificate discrepancies.
  *Why:* Provides actionable, professional artifacts that students can physically print or email directly to college authorities to rectify certificate mismatches before deadlines.

