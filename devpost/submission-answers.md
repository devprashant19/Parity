# Devpost Submission Answers — Parity

> **Form Fields & Submission Preparation Guide**  
> Hackathon: **Build With AI: Basics** on Devpost  
> Project: **Parity**  
> Public Repo: `https://github.com/devprashant19/Parity`  
> Live App: `https://parity-devpost.vercel.app`  

---

## 1. Required Field: "How did you use the Devpost Learn Skill Pack?"

*Paste the response below into the corresponding Devpost form textarea (Length: 201 words; requirement: 150–250 words).*

```text
We executed the Devpost Learn Skill Pack through the full 1-start to 6-ship workflow in .claude/skills/, locking skill integrity via pinned hashes in skills-lock.json. Rather than jumping straight into code, we strictly followed the planning progression—from scope.md through prd.md to spec.md—before touching the implementation.

Planning first established a vital scope boundary: restricting Parity to a focused 3-document scholarship packet verifier (Application Form, Academic Transcript, and Tax Statement) cross-referencing five essential fields, rather than sprawling into an unconstrained general-purpose document processor. This discipline defined our core architectural invariant: Gemini 3.1 Flash Lite handles multimodal perception only (extracting values, verbatim text quotes at most 200 characters, and coordinate bounding boxes), while an isolated, deterministic TypeScript engine handles all data normalization and tri-state classification (Conflict > Needs Review > Consistent).

We then executed development across sliced milestones in devpost/checklist.md, validating each slice with automated Vitest tests, client downscaling, and Playwright checks before advancing. When early evaluation revealed vertical row-drift on dense tabular scans, our locked spec framework allowed us to record the issue in dated revisions, re-engineer our crop pipeline to full-width bands with +/-1 row padding, and raise double-read agreement from 28.6% to 100% on clean international scans without compromising our zero-hallucination boundary.
```

---

## 2. Required Field: Age of Majority Checkbox

> **Action Required on Devpost Portal:**  
> On the Devpost submission form, you must **manually check the eligibility checkbox** confirming you have reached the age of majority in your jurisdiction (or have parental/guardian consent if applicable under the official hackathon rules).
>
> *(This is a manual user checkbox on the Devpost web interface and cannot be pre-filled via repository files).*

---

## 3. Required Field: "Try it out" Link

> **Action Required on Devpost Portal:**  
> In the **"Try it out"** input field on Devpost, paste your public GitHub repository URL:
>
> ```text
> https://github.com/devprashant19/Parity
> ```
>
> **Important Note on Live URL Placement:**  
> The "Try it out" field in this hackathon requires the public GitHub source repository link.  
> Your live Vercel deployment link:
>
> ```text
> https://parity-devpost.vercel.app
> ```
>
> belongs directly in the **Project Description** body text (at the top under "Try It Live"), NOT in the "Try it out" field.

---

## 4. Pre-Submit Verification Checklist

Complete and verify each step before hitting **Submit Project** on Devpost (Deadline: Mon Oct 26, 5:00 PM ET):

- [x] **Demo Walkthrough Video:**
  - [x] 2:48 screen recording completed following `devpost/video-script.md`.
  - [x] Video uploaded to YouTube: [https://youtu.be/H-xauc5ope0](https://youtu.be/H-xauc5ope0).
  - [x] Video link pasted into the Devpost submission form's video field.
  - [x] Video link pasted into `README.md` line 13 ([https://youtu.be/H-xauc5ope0](https://youtu.be/H-xauc5ope0)).
- [ ] **GitHub Repository:**
  - [ ] Repository is public at `https://github.com/devprashant19/Parity`.
  - [ ] Clean working tree with all final doc edits committed and pushed to `origin/main`.
  - [ ] MIT license file confirmed at repository root.
  - [ ] No API keys, secret tokens, or personal PII committed in git history.
- [ ] **Devpost Form Fields:**
  - [ ] "Try it out" field contains: `https://github.com/devprashant19/Parity`.
  - [ ] Live Vercel link (`https://parity-devpost.vercel.app`) included in the project description text.
  - [ ] "How did you use the Devpost Learn Skill Pack?" text pasted from Section 1 above.
  - [ ] Age of majority / hackathon eligibility checkbox ticked.
- [ ] **Local Verification Passed:**
  - [ ] `npm test` runs with 109/109 Vitest unit tests passing.
  - [ ] `npm run build` completes cleanly with zero TypeScript or bundler errors.
  - [ ] `npx playwright test` completes with 2/2 end-to-end browser tests passing.
