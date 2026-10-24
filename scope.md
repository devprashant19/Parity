---
doc: scope
status: approved
---

# Parity

An evidence-first, pre-submission packet verification tool that catches subtle data mismatches across application forms and supporting certificates before submission.

## The Unique Kernel
LLMs are restricted strictly to reading messy documents and extracting values with verbatim quoted evidence and page citations; deterministic code normalizes data, verifies quote containment, and evaluates matches into a unified tri-state classification (`Consistent`, `Conflict`, `Needs Review`). The human applicant—never the AI—decides which document is authoritative, producing an actionable "fix before submitting" checklist with inspectable side-by-side evidence.

## Who It's For
An applicant applying for a competitive scholarship, university admission, or financial aid grant. Today, they manually cross-reference numbers and names across multiple photocopies and PDFs under deadline stress, where a single typo (e.g., 92.4% vs 89.4% or annual vs monthly income) leads to silent application disqualification or bureaucratic delays.

## The Core Loop
1. **Open & Ingest:** Open the app and either click "Load sample scholarship packet" for a precomputed instant demo, or upload the 3 required documents (Application Form PDF, Marksheet scan, Income Certificate scan).
2. **Execute Check:** Run check (instant precomputed analysis for the sample packet, or live Gemini extraction for uploaded files).
3. **Inspect Overview:** View animated aggregate counters (Conflicts, Consistent, Needs Review) and a 5-field checklist using unified status tags.
4. **Inspect Evidence:** Click any flagged field to open a side-by-side comparison displaying both document snippets with highlighted evidence quotes and a diff card.
5. **Decide & Prioritize:** The student marks which document is correct ("Marksheet is correct" / "Application is correct" / "Not sure").
6. **Remediate & Export:** Review the live-updating prioritized "Fix before submitting" checklist and export as CSV/PDF.

## Inspiration & Identity
- **Aesthetic:** High-trust, editorial document-review workstation. Calm, precise, and quiet—resembling a careful forensic proofreader rather than a flashy AI wrapper.
- **Visuals:** Warm off-white background with crisp ink-dark typography, highlighter-style visual evidence callouts, and accessible tri-state status indicators (amber/red for Conflict, emerald green for Consistent, slate blue-grey for Needs Review) using distinct icons and clear text labels alongside color.
- **Typography:** Refined serif/semi-serif for headings, clean high-legibility sans-serif for UI/body, and monospaced font for extracted data values to ensure numbers and dates align visually.
- **Design References:** Linear (clarity, density, keyboard accessibility), Stripe documentation (restraint, typographic hierarchy), and standard version control diff / tracked-changes views.
- **Copy Tone:** Plain, honest, and accountable ("We found 3 things to check" instead of playful chatbot chatter). Explicitly reveals what was verified and what requires manual scrutiny.

## Why This Matters to the Learner
To demonstrate that practical, high-stakes AI applications succeed when AI is confined to perception (reading unstructured documents) while deterministic algorithms preserve truth, accountability, and inspectability. As a CS student, practicing a disciplined plan-first process to stress-test real-world extraction edge cases without relying on blind LLM trust.

## What "Working" Looks Like
In under 60 seconds without needing an API key:
- Opening the app reveals the product immediately (no generic marketing splash).
- Clicking "Load sample scholarship packet" populates 3 synthetic documents (form, marksheet, income cert).
- Clicking "Run check" executes precomputed analysis in <2s, displaying 3 conflicts (marks, income, issue date) and 2 consistent fields (name, academic year).
- Clicking the marks conflict opens a side-by-side view highlighting "92.4%" in the application form and "89.4%" in the marksheet with document excerpts.
- Selecting "Marksheet is correct" dynamically moves "Update the application form to 89.4%" to the top of the "Fix before submitting" checklist.
- Clicking "Export fix list" generates a clean, downloadable summary.
- Live mode allows providing a Gemini API key to run real multimodal extraction on custom uploads with equal transparency.

## The POC Boundary
- **In-Scope:**
  - One benchmark reference application packet: Academic & Financial Aid Scholarship.
  - Exactly 3 document inputs: Application Form (typed PDF), Marksheet (scanned image/PDF), Income Certificate (scanned image/PDF).
  - Exactly 5 cross-referenced fields:
    1. Student Name (Form, Marksheet, Income Certificate)
    2. Academic Year (Form, Marksheet)
    3. Marks Percentage (Form, Marksheet)
    4. Annual Family Income (Form, Income Certificate)
    5. Certificate Issue Date (Form entry vs Income Certificate)
  - Synthetic sample packet with 3 planted conflicts and 2 consistent fields for instant evaluation.
  - Unified status model across all UI and logic: strictly `Consistent`, `Conflict`, `Needs Review`. Failed or low-confidence extraction falls under `Needs Review` (never implied as safe).
  - Remediation phrasing rule:
    - If the application form is incorrect: fix is "Update the application form to [Value]".
    - If an official/government-issued document (marksheet, income certificate) is incorrect: fix is "Request a corrected document from the issuing office" (the app must never suggest altering official credentials). PRD will detail exact wording for each case.
  - Deterministic normalization (international and regional numbers e.g. 240,000 and 2,40,000, currency tokens $, €, £, ¥, ₹, per-month/annum conversions, date format parsing, case/honorific/punctuation trimming).
  - Deterministic name comparison (exact normalized match = Consistent; initials/transpositions = Needs Review; never silent pass).
  - Quote containment verification (verifies extracted value is literally present inside the returned excerpt).
  - Side-by-side diff modal/drawer with highlighted document quotes.
  - Student decision controls ("X is correct", "Y is correct", "Not sure").
  - Dynamic prioritized fix checklist and CSV export.
  - Responsive layout (mobile & desktop) with light mode default and dark mode toggle.

## Open Assumptions & Known Limitations
- **Unvalidated Demand:** Interviewing 4–5 students early to confirm they have experienced or observed mismatched details across documents during applications. If fewer than 3 recognize the problem as a real pain point, reconsider or pivot packet focus.
- **Known Verification Limitation:** Verifying that an extracted value appears verbatim in the model's quoted excerpt does not prove the quote itself is faithful to the raw scan, because no secondary independent OCR engine pass is performed. Both the in-app interface and README will transparently disclose this boundary.

## Later
- Additional application packet presets (study abroad visas, education loans, corporate internships).
- User-defined custom field and document schema builder.
- Multi-page document pagination and canvas-level bounding box snippet zooming.
- Independent secondary OCR verification pass.
- Direct integration or autofill into external scholarship portals.

## Explicitly Cut
- **User Accounts and Authentication:** Unnecessary friction for evaluating packet verification.
- **Persistent Database / Cloud Storage:** Ephemeral client/session processing guarantees student privacy and eliminates infra overhead.
- **Handwritten Document Support:** Scanned handwriting introduces extreme OCR variance outside the deterministic proof-of-concept scope.
- **LLM-Based Matching Decisions:** LLMs must never judge equivalence; equivalence is strictly evaluated by deterministic business logic.
- **Automated Submission:** Parity advises the human applicant; it never submits to third-party portals automatically.

## Revisions

### 2026-10-23 — International Generalization & Multi-Locale Verification
- **Positioning & Global Terminology:** Generalized the application from an India-specific context to an international audience. Replaced regional terms (e.g. "marksheet") with universal standards ("academic transcript") and adopted the global tagline: *"Make your documents agree before you submit."*
- **International Sample Packets:** Replaced regional fixtures with:
  1. A USD scholarship packet (Application Form, Academic Transcript with GPA out of 4.0, Tax Statement proof of income, textual dates like "12 Aug 2024") maintaining the 3 Conflicts / 2 Consistent benchmark.
  2. A EUR/GBP multi-locale packet featuring compound/accented names ("Maria J. Alvarez" vs "Maria Alvarez", "José" vs "Jose") and per-month income conversions producing `Needs Review`.
- **Locale-Aware Deterministic Engine:**
  - Ambiguous numeric dates flag `Needs Review` unless day > 12, month is textual, or date format setting resolves it.
  - Locale-aware number grouping: US (`1,234.56`), European (`1.234,56`), and space-separated (`1 234,56`).
  - Multi-currency disparity flags `Needs Review`.
  - Income frequency scaling (weekly $\times 52$, biweekly $\times 26$, monthly $\times 12$) showing multiplication factors in explanations.
  - Cultural name variance (accents, hyphenated surnames, particles like `de`/`van`, family-name-first) flags `Needs Review`.
  - GPA scale awareness (4.0, 5.0, percentage) flagging scale mismatches for human review.

### 2026-10-23 — Bounding-Box Double-Read Refinement & Strict Verification Mode
- **Batched Full-Width Band Cropping:** Double-read cropping expanded from narrow bounding boxes to full-width horizontal bands ($\pm 1$ row padding) to resolve narrow bounding-box vertical offsets into adjacent rows.
- **Document-Level Batching:** Secondary verification calls are batched per document into 1 single API call using multi-image inline data parts, cutting secondary calls from 14 down to 4.
- **Double-Read Scope:** Secondary verification is restricted strictly to fields initially classified as `Consistent` by the deterministic engine.
- **Conditional Visual Overlay Policy:** Preview bounding-box overlays are suppressed unless the secondary crop read confirms agreement with the primary full-page read; otherwise the verbatim quote is presented alongside a `"Location not verified"` warning badge.
- **Strict Verification Toggle:** UI toggle allowing users to choose between Fast Mode (3 API calls) and Strict Verification Mode (4–6 API calls). Default set to ON based on 100.0% post-fix agreement rate.
- **Unambiguous US Scan Dates:** Converted US scan dates to written months ("August 12, 2024" and "July 15, 2024").


