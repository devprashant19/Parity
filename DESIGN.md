# Parity — Design System & Art Direction Specification

This document defines the core art direction, concept model, and motion vocabulary for Parity, built following Awwwards Site of the Day design and evaluation standards.

---

## 1. Concept Card

| Dimension | Specification |
|---|---|
| **Idea** | A deterministic, evidence-first pre-submission verification instrument that catches cross-document discrepancies before scholarship and college application reviewers do. |
| **Metaphor** | **The Precision Optical Comparator:** Just as industrial comparators overlay blueprints onto manufactured parts with optical light to detect microscopic tolerance variances, Parity overlays student application claims onto official marksheets and certificates to detect identity, grade, date, and income mismatches. |
| **Signature Moment** | **The Synchronized Split-View Evidence Drawer:** Instant side-by-side verification placing the applicant's typed claim directly beside the high-resolution source document scan, with verbatim cited quote containment and bounding highlight overlays. |
| **Emotion** | Calm, rigorous, mathematical trust. Gives first-generation and scholarship applicants absolute confidence before submitting life-changing applications. |
| **Motion Verb** | **Snap like calibrated calipers:** Every transition settles with rapid, damped mechanical precision (`cubic-bezier(0.16, 1, 0.3, 1)`), line-drawing borders, and zero gratuitous floating blobs. |
| **Screenshot Frame** | The split-view Evidence Drawer open beside the Field Checklist, highlighting the conflicting ₹2,40,000 typed income vs ₹15,000/month certified certificate with active review resolution controls. |

---

## 2. Palette Architecture by Role

All colors are strictly mapped to semantic roles rather than generic Tailwind utility palettes:

| Role | Light Theme (Default) | Dark Theme (Obsidian) | Contrast Ratio | Usage |
|---|---|---|---|---|
| `ground` | `#F8FAFC` | `#080A0F` | — | Root canvas backdrop |
| `surface` | `#FFFFFF` | `#10141E` | — | Card containers, modals, drawers |
| `surface-raised` | `#F1F5F9` | `#182030` | — | Hover states, table rows, code wells |
| `ink` | `#0F172A` | `#F8FAFC` | 16.2:1 | Primary text headings and active labels |
| `muted` | `#475569` | `#94A3B8` | 6.5:1 (WCAG AA) | Secondary metadata, dates, help notes |
| `line` | `#E2E8F0` | `#1F293D` | — | Structural hair lines, table rules |
| `accent` | `#2563EB` | `#3B82F6` | 5.2:1 | Primary verification actions, active tabs |
| `signal-conflict` | `#E11D48` | `#FB7185` | 5.4:1 | Discrepancy counter, red status pill |
| `signal-consistent` | `#059669` | `#34D399` | 5.3:1 | Verified match counter, green status pill |
| `signal-review` | `#D97706` | `#FBBF24` | 5.0:1 | Ambiguous normalization review indicator |

---

## 3. Typographic Hierarchy

Parity employs a three-family typographic triad:

1. **Editorial Display Voice (`font-serif-heading` / Newsreader):**
   - Evokes academic credentials, institutional trust, and certificate authority.
   - Used for the primary brand mark, section titles, and modal headers.
2. **Interface Voice (`font-sans` / Inter):**
   - High x-height, clear apertures, optimized for small-screen density and rapid scanability.
   - Used for navigation, action buttons, table columns, and form labels.
3. **Telemetry & Data Voice (`font-mono` / JetBrains Mono):**
   - Tabular figures (`tnum`) for currency (`₹2,40,000`), percentages (`89.4%`), dates, and verbatim quotes.
   - Ensures vertical alignment when comparing values across documents.

---

## 4. Interaction Patterns & Motion Vocabulary

- **Static Poster Standard:** Every viewport state (empty state, loaded state, drawer open, modal view) holds visual balance as a composed editorial poster.
- **Continuous State Continuity:** Drawer opening slides smoothly from the right with a blurred backdrop veil (`backdrop-blur-md`), preserving scroll position on the main checklist.
- **Tactile Button Feedback:** All interactive buttons compress slightly on click (`:active:scale-[0.98]`) with clear, high-contrast focus rings (`focus-visible:ring-2 focus-visible:ring-blue-500`).
- **Telemetry Indicators:** The TopBar status badge maintains an active, low-frequency pulse (`animate-pulse`) representing active deterministic engine readiness.
