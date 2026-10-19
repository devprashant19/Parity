---
doc: prd
status: approved
---

# Parity — Product Requirements

An evidence-first, pre-submission packet verification tool that catches subtle data mismatches across application forms and supporting certificates before submission.
Source: `scope.md > # Parity`, `scope.md > The Unique Kernel`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. **Arrival & Workspace:** The user opens the app and lands directly on the verification workspace (no landing or splash page). They see three document dropzones alongside two prominent sample actions: **"Load sample scholarship packet"** (clean benchmark) and **"Try a messy packet"** (demonstrating ambiguity and format normalization).
2. **Packet Ingestion:**
   - *Primary Sample Path ("Load sample packet"):* Populates 3 synthetic documents (Application Form PDF, Marksheet scan, Income Certificate scan).
   - *Messy Sample Path ("Try a messy packet"):* Populates 3 synthetic documents containing realistic ambiguity: a name with initials ("S. Sharma" vs "Suresh Sharma") and an income stated per month ("₹15,000/month") to showcase `Needs Review` and normalization.
   - *Live Path:* User drops three files into the respective slots (PDF/PNG/JPEG). Client-side validation checks file types and file sizes before upload. A clear privacy notice is displayed:
     > *"Files you upload are sent to Google's Gemini API to read them. Don't upload real identity or financial documents; use synthetic or redacted samples. Parity doesn't store files."*
3. **Triggering Verification:**
   - *Sample Paths:* User clicks "Run check". Analysis runs in under 2 seconds from pre-extracted data using real deterministic comparison rules, with a clear badge labeled **"Sample result"**.
   - *Live Path:* User clicks "Live check". Documents are processed via server-side Gemini extraction and evaluated by the same deterministic rules.
4. **Summary & Field Checklist:**
   - An animated summary counter displays the breakdown:
     - Clean sample: `3 Conflicts`, `2 Consistent`, `0 Needs Review`.
     - Messy sample: showcases the `Needs Review` state alongside conflicts and matches.
   - A 5-field checklist displays below with unified status tags (`Consistent`, `Conflict`, `Needs Review`), field names, and source document badges.
5. **Side-by-Side Evidence Inspection:**
   - User clicks any checklist row to open a slide-over drawer from the right.
   - For two-document fields (Marks, Income, Issue Date, Academic Year), the drawer presents side-by-side evidence cards for the two relevant documents.
   - For three-document fields (Name), the comparison is evaluated and presented pairwise: Application Form vs Marksheet, and Application Form vs Income Certificate.
   - Each card displays the document name, page number, verbatim quoted snippet with the value highlighted, a diff comparison card, and clickable page previews.
6. **Student Decision & Real-Time Remediation:**
   - The student selects which document is authoritative using buttons dynamically labeled with the actual documents involved (e.g., `[ Marksheet is correct ]`, `[ Application form is correct ]`, `[ I'm not sure ]`), never generic "Document A/B".
   - The prioritized **"Fix before submitting"** list updates instantly:
     - If the application form is deemed incorrect: displays `"Update the application form to [Value]"`.
     - If an official certificate (marksheet/income cert) is deemed incorrect: displays `"Request a corrected document from the issuing office"` (explicitly never advising modifying official credentials).
     - If marked "I'm not sure" or extraction failed: categorized under `"Needs manual review"`.
7. **Export & Results Transparency:**
   - The student clicks **"Export fix list"** to download a clean, formatted CSV.
   - The results footer states:
     > *"Parity compares what it can read. It doesn't check whether your documents are genuine or whether you're eligible."*

## Screens and Layout
Source: `scope.md > Inspiration & Identity`.

Single-page responsive application with three primary layout areas:
- **Top Bar:** App title ("Parity"), concise one-line subtitle ("Packet pre-submission verification"), and Light/Dark mode toggle (stretch).
- **Main Workspace (Two-Column Desktop, Stacked Mobile):**
  - *Zone A — Ingestion & Controls:*
    - Primary buttons: "Load sample scholarship packet" and "Try a messy packet", with a "Reset" action.
    - Three upload dropzones:
      1. Application Form (PDF)
      2. Academic Marksheet (PDF/Image)
      3. Income Certificate (PDF/Image)
    - Live upload privacy notice banner.
  - *Zone B — Verification Overview:* Summary bar with animated numerical badges (`Conflicts`, `Consistent`, `Needs Review`), followed by the 5-field checklist.
  - *Zone C — Prioritized Fix List:* Sticky sidebar card showing real-time action items grouped strictly into three categories:
    - **Fix before submitting** (actionable corrections where application form is wrong or official document needs re-issuance)
    - **Needs manual review** (ambiguous items, "I'm not sure" decisions, unreadable extractions)
    - **Consistent** (fields verified across documents)
    - Action button: "Export fix list" (CSV download).
  - *Results Footer:* Disclaimer regarding document genuineness and eligibility limits.
- **Slide-Over Evidence Drawer (Desktop Right Drawer / Mobile Bottom Sheet):**
  - Slides out smoothly without concealing the checklist rows.
  - Header: Field name, current status badge, and close button.
  - Evidence Body: Document cards side by side with verbatim quoted excerpts and highlighted values. For Name, displays pairwise comparisons (Form vs Marksheet, Form vs Income Certificate).
  - Diff Card: Monospaced values with clear difference callouts and plain-English explanation.
  - Decision Group: Specific document buttons (`[ Marksheet is correct ]`, `[ Application form is correct ]`, `[ I'm not sure ]`).
  - Source Preview: Expandable document page view.

## Look and Feel
Source: `scope.md > Inspiration & Identity`.

- **Aesthetic Tone:** Editorial, calm, high-trust document review workstation. Clean, quiet, and precise—inspired by Linear's density and Stripe's typographic discipline.
- **Color Palette:**
  - *Light Mode (Default):* Warm paper/off-white background (`#F9F9FB` / `#F4F4F6`), crisp ink-dark text (`#1A1A1E`), subtle slate borders (`#E2E2E8`).
  - *Dark Mode (Stretch):* Deep charcoal background (`#121316`), muted text (`#ECECF1`), discreet borders (`#26282E`).
  - *Status Indicators (Triple-coded for color-blind accessibility with icon + color + text):*
    - **Conflict:** Amber/Crimson (`#D9383A` light / `#F87171` dark) with warning alert icon `[!]`.
    - **Consistent:** Emerald Green (`#16A34A` light / `#34D399` dark) with checkmark icon `[✓]`.
    - **Needs Review:** Slate / Denim Blue (`#475569` light / `#94A3B8` dark) with inspect icon `[?]`.
  - *Evidence Highlighting:* Soft highlighter yellow/amber tint (`rgba(250, 204, 21, 0.25)`) surrounding quoted text.
- **Typography:**
  - Headings: Editorial serif / semi-serif (e.g., Newsreader, Playfair Display, or Merriweather) for high-trust authority.
  - UI & Body: Clean, highly legible sans-serif (Inter or system sans) for clarity and scannability.
  - Values & Diffs: Crisp monospace (JetBrains Mono, Roboto Mono, or Fira Code) so numeric data, percentages, and dates align visually.
- **Motion & Accessibility:**
  - Subtle, purposeful micro-transitions on drawer open, counter increments, and evidence selection.
  - Keyboard navigation (stretch): Arrow keys move between rows, Enter opens drawer, Esc closes drawer.

## Features and Behavior

### 1. Ingestion & Dual Sample Presets
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

- **Sample 1: Clean Benchmark ("Load sample scholarship packet"):**
  - Executes in $<2$ seconds using pre-extracted data with the real deterministic engine.
  - Produces exactly: `3 Conflicts`, `2 Consistent`, `0 Needs Review`.
  - Planted values:
    1. Marks Percentage: Application Form `92.4%` vs Marksheet `89.4%` $\rightarrow$ **`Conflict`**
    2. Annual Income: Application Form `₹2,40,000/year` vs Income Certificate `₹1,80,000/year` $\rightarrow$ **`Conflict`**
    3. Issue Date: Application Form `15/07/2024` vs Income Certificate `12/08/2024` $\rightarrow$ **`Conflict`**
    4. Student Name: "Suresh Sharma" identical in all 3 documents $\rightarrow$ **`Consistent`**
    5. Academic Year: "2024-25" on Form and Marksheet $\rightarrow$ **`Consistent`**
- **Sample 2: Messy Preset ("Try a messy packet"):**
  - Demonstrates ambiguity and format normalization via the real comparison engine.
  - Includes:
    - Name on Income Certificate written as "S. Sharma" while Form has "Suresh Sharma" $\rightarrow$ **`Needs Review`** ("Possible match, needs review").
    - Income on Income Certificate stated as "₹15,000 per month" while Form has "₹1,80,000 per annum" $\rightarrow$ normalizes monthly to annual ($\times 12 = ₹1,80,000$) $\rightarrow$ **`Consistent`**.
- **Live Upload Mode:**
  - Rejects files $>10$MB or unsupported formats before upload.
  - Displays privacy notice clearly.
  - Uses server-side `GEMINI_API_KEY` with rate-limit and error fallback banner: *"Live check is unavailable right now. Try again shortly or test the instant sample packet."*

### 2. Deterministic Comparison & Tri-State Classification
Source: `scope.md > The Unique Kernel`, `scope.md > The POC Boundary`.

- The LLM performs text extraction only, returning:
  `{ value: string, quote: string, page: number, confidence: number }`
- Deterministic engine enforces:
  1. **Quote Containment:** The extracted value must literally appear inside the returned `quote`. If not, field transitions to `Needs Review` with message: *"Extracted value could not be confirmed in document text."*
  2. **Confidence Threshold:** High confidence requires meeting a numeric threshold (defined in `4-spec`). Below threshold transitions to `Needs Review`.
  3. **Normalization:**
     - Number formatting (handles both standard international grouping `240,000` and South Asian grouping `2,40,000` $\rightarrow$ `240000`).
     - Currency and unit normalization (`$3,000/mo` $\rightarrow$ `$36,000/yr`, `₹15,000/month` $\rightarrow$ `₹1,80,000/year`).
     - Date parsing supporting ISO (`YYYY-MM-DD`), DD/MM/YYYY, and DD-Month-YYYY.
     - Name cleaning (trim whitespace, lowercase, remove honorifics like "Shri", "Mr.", "Ms.", punctuation).
  4. **Pairwise 3-Document Matching (Name):**
     - Form vs Marksheet, and Form vs Income Certificate.
     - Both pairs must match for overall Name to be `Consistent`. If one pair has initials (e.g., "S. Sharma"), that comparison flags `Needs Review`.
  5. **Classification Rules:**
     - `Consistent`: Normalized values match exactly and quotes pass containment.
     - `Conflict`: Both values extracted with high confidence, passed containment, but differ after normalization.
     - `Needs Review`: Ambiguity (initials, unreadable dates, missing quotes, low confidence, failed extraction). A failure is NEVER classified as Consistent.

### 3. Side-by-Side Evidence Inspection Drawer
Source: `scope.md > The Core Loop`.

- Opening a field shows side-by-side cards comparing the relevant documents.
- For Name: displays pairwise tabs or cards comparing Form vs Marksheet and Form vs Income Certificate.
- Each card shows: Document Name, Page Number, and Quoted Text with the value highlighted.
- Diff banner highlights exact delta: e.g., `Application: 92.4% ≠ Marksheet: 89.4%` (`Δ = -3.0%`).
- One-line human-readable explanation: *"Application claims 92.4%, but Marksheet records 89.4%."*

### 4. Human Decision Authority & Prioritized Fix List
Source: `scope.md > The Unique Kernel`, `scope.md > The POC Boundary`.

- Student decision buttons dynamically name the actual documents involved:
  - `[ Marksheet is correct ]`
  - `[ Application form is correct ]`
  - `[ I'm not sure ]`
- Dynamic fix list updates into three strict sections:
  1. **Fix before submitting:**
     - If application form is wrong: `"Update the application form to [Value]"` (e.g., *"Update the application form to 89.4%"*).
     - If official certificate is wrong: `"Request a corrected document from the issuing office"` with note: *"Official credentials cannot be edited; request a re-issued certificate if erroneous."*
  2. **Needs manual review:**
     - "I'm not sure" decisions, unverified extractions, and initial discrepancies ("S. Sharma" vs "Suresh Sharma").
  3. **Consistent:**
     - Verified matching fields ready for submission.
- **Manual Entry Override:** For unreadable or failed extractions, the student can click **"Enter value manually"**. The value is tagged **"Entered by you"** and compared deterministically.

### 5. Export Remediation Summary
Source: `scope.md > What "Working" Looks Like`.

- Clicking "Export fix list" downloads a structured CSV file with columns: Field, Status, Detected Values & Citations, Student Resolution, and Fix Action.

## States and Boundaries

- **Empty / Initial State:** Dropzones ready, sample buttons highlighted.
- **Sample Loaded State:** 3 synthetic document cards visible. Run check button active.
- **Analyzing State:** Progress spinner, completes in $<2$s for sample.
- **Results State:** Counters show breakdown. 5-field checklist populated. Results disclaimer footer visible.
- **Evidence Drawer Open:** Drawer visible on right side; checklist active on left. Active field highlighted. Close button or Esc dismisses.
- **Manual Entry State:** Inline input on evidence card with "Save & Re-evaluate" button. Result tagged "Entered by you".
- **API Error / Rate Limit State:** Inline warning banner shown: *"Live check unavailable. Try again shortly or test the instant sample packet."*
- **Persistence Boundary:** Strictly ephemeral in-memory processing. Zero database storage. Data clears on page refresh.

## Product Decisions
Source: `learner-profile.md > Collaboration and Communication Preferences`, `scope.md > POC Boundary`.

- **Precomputed Dual Samples with Real Comparison:** Clean sample (3 conflicts, 2 consistent) and messy sample (needs review + monthly normalization) run real deterministic comparison logic with zero latency.
- **Server-Side API Key & Privacy Notice:** No client key prompts. Prominent privacy notice explicitly instructing users not to upload sensitive identity documents.
- **Dynamic Decision Buttons:** Buttons name the actual documents involved instead of generic letters.
- **Honesty Disclaimers:** Explicitly states Parity does not verify document genuineness or applicant eligibility.
- **Ethical Fix Wording:** Distinguishes editable application forms from non-editable official certificates.

## Implementation Priorities

### Must-Have (Core POC)
- [ ] 3-document upload interface + dual sample presets ("Load sample packet" and "Try a messy packet").
- [ ] Synthetic data bundle (document images/PDFs with ground-truth values and highlight bounding boxes).
- [ ] Deterministic parser & normalization engine (international and regional numbers, monthly/annual income, dates, name cleaning).
- [ ] Verification engine enforcing quote containment, pairwise name checks, and tri-state classification.
- [ ] Responsive dashboard with animated counters and 5-field checklist.
- [ ] Slide-over evidence drawer with side-by-side quotes, diff card, and document previews.
- [ ] Dynamic document-specific decision controls (`[ Marksheet is correct ]`, etc.).
- [ ] Prioritized fix list grouped into *Fix before submitting*, *Needs manual review*, and *Consistent*.
- [ ] "Enter value manually" override for unreadable or disputed fields.
- [ ] CSV fix list export.
- [ ] Live Gemini check with rate-limit/failure fallback banner.
- [ ] Visible privacy and honesty notices.

### Stretch (Polish & Enhancements)
- [ ] Dark mode toggle.
- [ ] Printable PDF/print stylesheet export styling.
- [ ] Mobile bottom sheet gesture animations.
- [ ] Keyboard arrow-key navigation between checklist rows.

## Deferred From the POC
- **Custom Schema Builder:** Allowing users to define arbitrary packets and field lists.
- **Interactive Multi-Page Canvas Zoom:** Pan/zoom for multi-page PDF documents.
- **Secondary Independent OCR Pass:** Offline OCR engine cross-validation.
- **Additional Presets:** Visas, education loans, and job applications.

## Non-Goals
- **User Accounts and Login:** No user auth or profiles.
- **Database / Cloud Document Storage:** No files or student PII stored on servers.
- **Handwritten Document Processing:** Handwriting OCR noise is excluded from the POC.
- **LLM Matching Decisions:** LLMs are never permitted to declare fields consistent or conflicted.
- **Automated Submission:** Parity will never auto-submit applications to university or government portals.

## Open Questions
- **Student Demand Validation:** The student-demand check (interviewing 4–5 students, requiring at least 3 to confirm document mismatch pain) is still pending execution.
