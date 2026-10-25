# Devpost Submission Materials — Parity

> **Draft for Applicant Review & Customization**  
> *Review, adapt, and copy these materials directly into your Devpost hackathon project listing.*

---

## 1. Project Overview & Devpost Description

### Project Title
**Parity**

### Tagline
*Make your documents agree before you submit.*

- **Live Web Application:** [https://parity-devpost.vercel.app](https://parity-devpost.vercel.app)
- **Demo Walkthrough Video:** [https://youtu.be/H-xauc5ope0](https://youtu.be/H-xauc5ope0)

### Elevator Pitch / What It Does
Parity is an evidence-first, pre-submission packet verification tool that catches subtle data discrepancies across application forms and supporting certificates before submission. 

Instead of asking an AI to decide whether documents match, Parity splits verification into two strict layers:
1. **Multimodal Perception Only:** Google Gemini 3.1 Flash Lite reads document scans (PDF/PNG/JPEG) and extracts structured values alongside verbatim quoted text excerpts (at most 200 characters), page citations, and normalized coordinate bounding boxes.
2. **Deterministic Mathematical Judgment:** Pure TypeScript rules perform international data normalization (currencies, dates, income frequencies, name tokens, GPA scales), verify literal quote containment, and evaluate document consistency into a tri-state classification:
   `Conflict > Needs Review > Consistent`

The human applicant—never the AI—retains sole decision authority. An interactive side-by-side Evidence Drawer presents highlighted quotes and verified bounding-box scan overlays, empowering the student to select the authoritative document. Parity then generates an ethical, prioritized "Fix Before Submitting" remediation checklist, a downloadable PDF audit report, and a formal draft letter addressed to the issuing authority.

---

### Who It's For
Applicants preparing high-stakes multi-document packets under intense deadline pressure:
- **Scholarship Applicants** cross-checking candidate forms against academic transcripts and family income statements.
- **University Admissions Candidates** reconciling transcripts, grading scales (4.0 vs percentage), and passport name variations.
- **Visa & Loan Applicants** validating employment payslips, tax assessments, and sponsor identity records.

---

### Why It Matters
In high-stakes admissions and scholarship reviews, clerical inconsistencies lead to silent disqualification. An applicant might write `3.80 GPA` on their application while their official transcript records `3.50`, or state an annual household income of `$65,000` while their tax statement records `$48,000`. Bureaucratic systems rarely issue clarifying inquiries; they simply reject the packet.

Existing AI document tools frequently suffer from two fatal flaws:
1. **Hallucinated Equivalence:** LLMs casually declare two different numbers "close enough" or invent reasons why a missing document matches.
2. **Lack of Evidence Grounding:** Users are given a generic summary without inspectable proof of where the AI read the numbers.

Parity solves this by enforcing that **the model never decides whether values match**. Mathematical logic governs parity, and the applicant inspects side-by-side evidence before submitting.

---

### What I Learned
1. **The Bounding-Box Alignment Trap:** In our initial live multimodal runs, tight bounding-box crops suffered from vertical row-drift on dense tabular scans (e.g. capturing an adjacent taxpayer row rather than the income figure). Re-engineering the cropping pipeline to a full-width horizontal band (+/-1 row padding) and batching document crops into single API calls raised double-read crop agreement from **28.6%** to **100.0%** on clean international scans.
2. **Cultural & Global Data Realities:** Real applications cross national borders. What looks like a mismatch is often a cultural formatting standard: compound Hispanic surnames (`García Márquez`), accented spellings (`José` vs `Jose`), British hyphenated names, European dot-decimal grouping (`1.234,56 €`), and ambiguous numeric dates (`12/08/2024` where day and month are both 12 or less). Designing deterministic rules to gracefully elevate ambiguous forms to `Needs Review` rather than false errors is essential for student trust.
3. **The Power of Spec-Driven Agentic Engineering:** Starting with approved specification documents (`scope.md`, `prd.md`, `spec.md`) and tracking slices in a disciplined checklist prevented feature creep and kept the architecture grounded in zero-hallucination verification.

---

### Technologies Used
- **Frontend & App Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling & Design System:** Tailwind CSS v3 (editorial high-trust design palette, dark mode, responsive mobile bottom-sheet)
- **AI & Multimodal Vision:** Google Gemini 3.1 Flash Lite (`@google/genai`) with automatic fallback to Gemini 2.5 Flash
- **Image Processing & Cropping:** Sharp (server-side crop isolation and PNG generation)
- **PDF Generation & Export:** jsPDF, client-side CSV generator
- **Testing & Quality Harness:** Vitest (109 unit tests), Playwright (headless Chromium end-to-end testing), custom scan evaluation benchmark harness

---

### Measured Results & Honest Caveats
- **Live Multimodal Benchmark Run (Gemini 3.1 Flash Lite on 14 Raster Scans):**
  - **Critical Metric — False-Consistent Rate:** **0 of 31 differing pairs (0.0%)** across 9 distinct scan sets. Not once did differing documents get falsely approved.
  - **True-Consistent Recall:** **11 of 14 agreeing pairs (78.6%)** across all 9 sets, and **100.0% (14 / 14)** across clean international benchmark scans.
  - **Field Extraction Accuracy:** **88.0% (44 / 50 fields)** overall; **100.0% (14 / 14)** on clean international scans (Scans 11–14).
  - **Quote Containment Rate:** **100.0% (47 / 47 extracted fields)**.
  - **Batched Double-Read Agreement:** **93.6% (44 agreed / 47 checks)** across all scans; **100.0% (14 / 14 checks)** on international scans.
- **The Two True-Consistent Pairs Flagged as "Needs Review":**
  1. `scan_01` vs `scan_06` on `name`: Initial abbreviation (`"S. Sharma"` vs `"Suresh Sharma"`). Parity refuses to auto-match initials to protect applicants from bureaucratic name-spelling disqualifications.
  2. `scan_01` vs `scan_03` on `issue_date`: Ambiguous numeric date (`"12/08/2024"` vs `"12/08/2024"`) under `Auto` mode where day and month are both 12 or less.
- **Important Limitations & Caveats:**
  - *Synthetic Data Boundary:* All 14 benchmark scans are synthetic documents generated by automated scripts. High performance on these synthetic scans is **not a claim of universal OCR accuracy** across arbitrary unconstrained real-world paperwork.
  - *Clerical Parity vs. Fraud Authentication:* Parity checks clerical consistency across submitted pages; it does not authenticate government watermarks or detect fraudulent documents.
  - *Shared Quota Sensitivity:* Under high load, public Gemini endpoints may return HTTP 503; Parity handles this gracefully via exponential backoff retries, model fallback, and instant offline demo paths.

---

## 2. Response to "How did you use the Devpost Learn Skill Pack?"

> **Direct, Evidence-Based Answer based on repo and `devpost/` history:**

We utilized the **Devpost Learn Skill Pack** throughout the lifecycle of Parity to enforce disciplined, specification-driven development:

1. **Phase 1: Scope & Kernel Definition (`devpost/scope.md`):**  
   We formally articulated the "Unique Kernel" before writing code: strictly isolating AI to multimodal perception (reading text and extracting quotes) while assigning all matching decisions to deterministic TypeScript rules. We explicitly documented non-goals (e.g. no user accounts, no cloud database storage) to prevent scope creep.
2. **Phase 2: Product Requirements & Journey Mapping (`devpost/prd.md`):**  
   We documented user personas, core interaction loops, and specific UI states:
   - Primary instant path: Clean scholarship packet producing exactly 3 Conflicts and 2 Consistent.
   - Ambiguity test path: Messy packet testing `Needs Review` and income annualization.
   - Tri-state precedence: `Conflict > Needs Review > Consistent`.
3. **Phase 3: Technical Specification (`devpost/spec.md`):**  
   We established explicit schemas for Gemini extraction, quote containment boundaries (at most 200 characters), normalization tables for 5 countries/locales, and serverless constraint handling (client-side downscaling to 1600px JPEG or less, under 4.0 MB total payload).
4. **Phase 4: Sliced Execution & Verifiable Checkpoints (`devpost/checklist.md`):**  
   We structured the project into atomic slices. Each slice was verified with mechanical commands (`npm test`, `npm run build`, `npm run test:e2e`) and learner checks before proceeding.
5. **Phase 5: Real-World Iteration & Dated Revisions:**  
   When early evaluation revealed bounding-box row-drift on dense tables, we didn't quietly tweak numbers. We logged the finding in dated revision entries across `scope.md`, `prd.md`, and `spec.md`, re-engineered the cropping pipeline into a batched full-width band (+/-1 row), added a Strict verification toggle, and documented the before-and-after results honestly in `README.md`.

---

## 3. Video Walkthrough Script (Target Runtime: 2:15 &bull; Max 2:45)

> *Guidelines: Clear pacing, no background music, no third-party branding. Clean screen recording.*

| Timestamp | Visual Action (What to Click & Show) | Narration Script (Word-for-Word) |
| :--- | :--- | :--- |
| **0:00 - 0:20** | **Title Screen & Hero Workspace**<br>Show clean Parity workspace (`http://localhost:3000`). Hover over the 3 document dropzones and the tagline. | *"Every year, thousands of students are silently disqualified from scholarships, university admissions, and visas due to simple clerical typos across their paperwork. An application form says 3.80 GPA, but the transcript says 3.50. This is Parity: an evidence-first verification workstation that makes your documents agree before you submit."* |
| **0:20 - 0:45** | **Instant Sample Test Drive**<br>Click **"Load sample scholarship packet"**.<br>Click **"Run check"**.<br>Show summary counters animating to **3 Conflicts, 2 Consistent, 0 Needs Review**. | *"Parity requires no account or login. For this instant demo, clicking 'Load sample scholarship packet' ingests three synthetic documents: an application form, an academic transcript, and a tax statement. We click 'Run check'—and in under two seconds, with zero network calls, the deterministic engine catches three critical conflicts."* |
| **0:45 - 1:15** | **Evidence Drawer & Human Authority**<br>Click the **Academic Performance / GPA** row.<br>Slide-over drawer opens.<br>Show verbatim quotes, diff callout, and bounding-box overlay on the scan.<br>Click **"[ Transcript is correct ]"**.<br>Show fix plan updating live below. | *"Clicking the GPA row opens the Evidence Drawer. Notice our core philosophy: the AI never decides if documents match. It only reads. The deterministic engine compares the numbers and shows you side-by-side verbatim quotes: 3.80 GPA on the application form versus 3.50 GPA on the official transcript, complete with coordinate bounding boxes. The applicant holds sole authority: clicking 'Transcript is correct' instantly updates our prioritized remediation checklist."* |
| **1:15 - 1:35** | **Messy International Packet (Needs Review)**<br>Click **"Try a messy packet"**.<br>Click **"Run check"**.<br>Point to **Needs Review** on Student Name and Income. | *"Real applications are global. Switching to our European packet demonstrates Parity's multi-locale rules. When an application writes 'Maria J. Alvarez' but the transcript writes 'Maria Alvarez', or when income is stated monthly rather than annually, Parity avoids false alarms and marks them 'Needs Review', computing the exact twelve-times annualization factor for you."* |
| **1:35 - 1:55** | **Live Upload, Strict Verification & PDF Export**<br>Toggle **"Strict verification"**.<br>Click **"Export PDF Report"** and **"Draft Letter"**.<br>Show the formal issuing office draft disclaimer. | *"Parity supports live uploads of PDF and PNG scans via Google Gemini 3.1 Flash Lite with automatic fallback to Gemini 2.5 Flash. Under Strict Verification mode, secondary crop reads verify that extracted numbers actually reside inside the bounding box. Once resolved, applicants can download an offline PDF verification report or generate a formal draft correction letter for their registrar desk."* |
| **1:55 - 2:15** | **Honest Benchmark, Provenance & Closing**<br>Show terminal running `npm test` (109 passing) and `tests/eval/scan-eval.ts`.<br>Pan to `devpost/` planning docs in the repository. | *"We benchmarked Parity against 14 raster scans: our deterministic guard achieved a zero percent False-Consistent rate across 31 differing pairs. Every slice of Parity was engineered against our approved spec and checklist in the devpost directory. Parity: Make your documents agree before you submit."* |

---

## 4. Pre-Submission Checklist

Before finalizing your Devpost submission, verify each item:

- [ ] **Public Repository URL:** GitHub repository is public and accessible (e.g. `https://github.com/devprashant19/Parity`).
- [ ] **"Try It Out" Link:** Public Vercel URL added to Devpost project header ([https://parity-devpost.vercel.app](https://parity-devpost.vercel.app)).
- [ ] **Open Source License:** MIT License file ([LICENSE](file:///e:/Parity/LICENSE)) is present at the repository root and detected by GitHub.
- [x] **Video Link:** [https://youtu.be/H-xauc5ope0](https://youtu.be/H-xauc5ope0) — Walkthrough video is uploaded, public/unlisted on YouTube (2:48 runtime, strictly under the 3:00 minute limit).
- [ ] **Age of Majority:** Hackathon eligibility age checkbox confirmed.
- [ ] **Project Description:** Devpost markdown description copied from Section 1 above with accurate headings, honest limitations, and measured benchmark results.
- [ ] **Project Tags / Keywords:** `gemini-api`, `multimodal-vision`, `document-verification`, `nextjs`, `typescript`, `scholarships`, `admissions`, `zero-hallucination`.
