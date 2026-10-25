# Parity — 2:30 Demo Walkthrough Video Script

> **Target Duration:** 2:30 (150 seconds)  
> **Format:** Clean screen capture at 1080p, 60 fps. No background music. Natural, unhurried voiceover pacing (~135–140 words per minute).  
> **Live Video Walkthrough:** [https://youtu.be/H-xauc5ope0](https://youtu.be/H-xauc5ope0)  
> **Source Flow:** Grounded directly in the *60-Second Instant Test Drive* from `README.md` and measured results from `SUBMISSION.md`.

---

| Timestamp | On-Screen Action | Voiceover Line |
| :--- | :--- | :--- |
| **0:00 – 0:20** | **Title Screen & Hero Workspace**<br>Display clean Parity workspace (`https://parity-devpost.vercel.app` or `http://localhost:3000`). Cursor hovers over the three document dropzones (Application Form, Academic Transcript, Tax Statement). | "Every year, qualified applicants lose scholarships and admissions to clerical typos. The application form says a 3.80 GPA; the official transcript says 3.50. Income is listed at $65,000; the tax statement says $48,000. Reviewers don't call to clarify. They just reject the packet." |
| **0:20 – 0:40** | **Instant Ingestion & Execution**<br>Click **"Load sample clean packet"** button.<br>Dropzones populate with precomputed benchmark documents.<br>Click **"Run Verification Check"**.<br>Summary counters animate to **3 Conflicts** and **2 Consistent** in under 2 seconds. | "No account, no login, no API key. 'Load sample clean packet' ingests three documents: an application form, an official transcript, and an income tax statement. We click 'Run Verification Check' — and in under two seconds, the deterministic engine finds three conflicts and two consistent fields." |
| **0:40 – 1:05** | **Evidence Drawer & Bounding-Box Scan Overlay**<br>Click the **Academic Performance / GPA** conflict row.<br>Side-over Evidence Drawer slides smoothly into view.<br>Highlight side-by-side verbatim quotes (`3.80 GPA` vs `3.50 GPA`).<br>Hover over coordinate bounding-box overlay highlighting the GPA line on the transcript scan. | "Clicking the GPA row opens the Evidence Drawer. Parity never asks you to trust a summary blindly. It presents side-by-side verbatim text quotes—3.80 GPA on the application form versus 3.50 GPA on the official transcript—paired with precise coordinate bounding-box overlays right on the document scan so you can verify exactly where the numbers came from." |
| **1:05 – 1:30** | **Human Decision Authority & Dynamic Fix Plan**<br>Cursor moves to decision buttons inside drawer.<br>Click **"Academic Transcript is correct"**.<br>Evidence Drawer records choice.<br>Scroll to prioritized **"Fix Before Submitting"** checklist below, showing the plan update live to: *"Update the application form to 3.50 GPA"*. | "Crucially, the AI never decides which document is right. The human applicant holds sole decision authority. Clicking 'Academic Transcript is correct' immediately updates our prioritized remediation checklist. Because the transcript is official, Parity instructs the applicant to update their application form, preserving the integrity of official credentials." |
| **1:30 – 1:50** | **Downloadable PDF Report & Formal Draft Letter**<br>Click the **"PDF Report"** button.<br>Open generated PDF preview showing full verification audit trail.<br>Click **"Draft Letter"** tab to show pre-formatted correction request letter addressed to the issuing authority. | "When verification is complete, applicants can export a clean, offline-verifiable PDF audit report to take to an administrative desk. And for discrepancies on official paperwork, Parity generates a formal draft correction letter ready to send to the registrar or issuing authority before the submission deadline." |
| **1:50 – 2:20** | **Architectural Rationale: Perception vs. Decision**<br>Switch to architecture diagram / `devpost/spec.md` slide highlighting the two distinct layers: Google Gemini perception layer vs isolated TypeScript deterministic engine.<br>Briefly show terminal with 109 passing Vitest tests. | "This works reliably because of an intentional architectural split. We restrict Google Gemini strictly to multimodal perception—reading document scans, extracting text quotes under 200 characters, and pinpointing coordinates. All matching decisions are handled by an isolated TypeScript engine using deterministic math and strict tri-state logic: Conflict, Needs Review, or Consistent. The AI cannot hallucinate equivalence, and differing values never slip through." |
| **2:20 – 2:30** | **Who It's For & Closing**<br>Return to the clean Parity dashboard.<br>Cursor rests on the tagline: *Make your documents agree before you submit.* | "Built for scholarship applicants, admissions candidates, and families facing high-stakes paperwork. Parity: make your documents agree before you submit." |

---

### Production Recording Notes

- **Browser Window:** Standard 16:9 ratio (1920x1080) at 100% zoom.
- **Audio:** Clear vocal track, speak at a calm, natural cadence (~135–140 words per minute).
- **Transitions:** Let each click settle for 1–2 seconds on screen so reviewers can clearly read the counters, quotes, and bounding-box overlays.
- **Honest Metrics Note:** All benchmark figures referenced in documentation (109 Vitest tests, 14 raster scans, 0.0% False-Consistent rate across 31 differing pairs) are verified and reproducible via `npm test` and `npm run eval:scans`.
