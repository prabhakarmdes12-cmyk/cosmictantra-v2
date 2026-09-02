# 13 — Pandit Consultation Density

Implementation: [`src/lib/kundli/v40/consultationDensity.ts`](../../src/lib/kundli/v40/consultationDensity.ts)

The question asked of every element on every Part A page:

> **Would a practising Pandit want this visible during a consultation?**

Not "is it true", and not "is it useful somewhere" — the appendix exists for
that. The question is whether it earns space on a page someone is holding while
a client sits opposite them.

`applyConsultationDensity(report)` transforms the model **between** the report
builder and the renderer. It moves and shortens presentation; it never changes,
recomputes or removes a fact. Everything it takes out of Part A is preserved in
Part B, and each rule records where.

---

## The thirteen rules

| ID | Section | Action | Why |
|---|---|---|---|
| CD-01 | passport | SHORTEN | The timezone provenance essay becomes a two-word status. |
| CD-02 | passport | MOVE | Implementation hashes and engine version strings → B1. |
| CD-03 | saar | SHORTEN | Source-status boilerplate repeated per row → one line at the foot. |
| CD-04 | graha dossier | MOVE | Registry identifiers → B8. |
| CD-05 | bhava matrix | SHORTEN | Karaka attribution notes → short form, full text in B4. |
| CD-06 | vimshottari | SHORTEN | The derivation of the balance → one sentence. |
| CD-07 | career | STRIP | `(see docs/kundli-v40/*.md)` — repository paths are not consultation content. |
| CD-08 | career | DROP_DUPLICATE | The D10 quarantine sentence appeared **three times on one page**. Once is a limitation; three times is noise. |
| CD-09 | how-to-read | MOVE TO PART B | Reading instructions do not belong between the Dasha pages and the Pandit's own notes. |
| CD-10 | yoga dashboard | SHORTEN | A dashboard row carrying six lines of non-adoption reasoning stops being a dashboard. |
| CD-11 | discussion points | SHORTEN | Question provenance → B2. |
| CD-12 | pandit notes | SHORTEN | Debug identifiers removed. |
| CD-13 | D1 / D9 | REFLOW | The 12-row placement table folds to 6 × 6, so the chart and its table fit one page. |

CD-08 deserves its note. The duplication was not a bug — three different code
paths each correctly appended the same honest caveat. Correct three times over
is still unreadable.

### CD-08 and the brittleness that was fixed

The rule originally matched the quarantine sentence by a **hardcoded regex
copy** of the prose. When the D10 wording changed (see doc 14), the rule
silently stopped matching and the long paragraph came back onto the
consultation page three times. Only `densityUnmatched` caught it.

It now builds its pattern from `D10_PROMOTION.reason` itself, so the two cannot
drift. `renderer-v3.spec.ts` asserts `densityUnmatched` is empty — a rule that
matches nothing is a rule that has quietly stopped working.

---

## The residue gate

`auditPartADensity(report)` re-reads the transformed model and fails the
pipeline if any of these survive in Part A:

| ID | Pattern | What |
|---|---|---|
| PA-01 | `docs/…​.md` | repository documentation path |
| PA-02 | `[0-9a-f]{16,}` | implementation hash |
| PA-03 | `*-registry-v\d` | internal registry identifier |
| PA-04 | `language model` | a statement about our engineering process |
| PA-05 | `canonical adapter` | internal component name |
| PA-06 | `shadbala` | an unvalidated internal quantity |

`generateKundliV41Pdf` refuses to produce a PDF when this returns findings
(`KUNDLI_PART_A_DENSITY`).

The gate runs on the **model**, so `renderer-v3.spec.ts` also runs the same
patterns over the **extracted text of the rendered Part A pages**. A model-only
check can be defeated by a renderer that synthesises its own strings.

---

## Result

Part A is pages 1–15 of the qualified 38-page fixture: cover, passport, saar,
D1, D9, graha dossier, bhava matrix, yoga/dosha, Vimshottari, dasha activation,
career, discussion points and Pandit notes. Everything an implementation detail
— 23 pages of it — is behind the Part B divider, where a Pandit reaches it only
on purpose.

---

## What was NOT done

No interpretive content was removed. Density work is about *where* something is
printed and *how often*, never about whether a limitation is disclosed. Every
`NOT_CALCULATED`, every "verification pending" and every cautionary note that
was in V40's Part A is still in V40.1's Part A — shorter, and said once.
