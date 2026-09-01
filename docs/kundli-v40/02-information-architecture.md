# 02 — Information Architecture

V40 splits one document into two, because the three readers it serves want
different things and the v1 report tried to satisfy all three on every page.

| Reader | Wants | Gets |
|---|---|---|
| Client | To understand their chart in five minutes | Cover, Passport, Saar, the two charts |
| Practising Pandit | To consult without opening another app | Pages 2–14: every placement, bhava, yoga, dasha, plus prompts and note space |
| Scholar / auditor | To break a claim | Part B: rule → evidence → fact → canonical path → birth input |

## Part A — Consultation Kundli (pages 1–16)

Each section starts on its own page, so a Pandit can find a page by its
position rather than by scanning.

| Page | Section | Content type of the page |
|---|---|---|
| 1 | Cover | CALCULATED FACT |
| 2 | Kundli Passport | CALCULATED FACT — inputs and declared settings only |
| 3 | Kundli Saar | CALCULATED FACT + TRADITIONAL RULE verdicts |
| 4 | D1 Rashi chart (hero) | CALCULATED FACT |
| 5 | D9 Navamsha | CALCULATED FACT |
| 6 | Graha dossier | CALCULATED FACT |
| 7 | Bhava Intelligence Matrix | DERIVED JYOTISH FACT |
| 8 | Yoga and Dosha dashboard | TRADITIONAL RULE |
| 9 | Vimshottari timeline | CALCULATED FACT + DERIVED FACT (balance) |
| 10 | Current dasha activation | DERIVED JYOTISH FACT |
| 11–12 | Career — reference synthesis | INTERPRETIVE SYNTHESIS, evidence-linked |
| 13 | Pandit discussion points | PRACTICAL REFLECTION |
| 14 | Pandit notes | blank ruled areas |
| 15 | How to read this report | legend, limits, disclaimer |

(Page 16 is the Part B divider. Career runs to two pages on charts with many
resolved factors; the acceptance test asserts Part A ends by page 16.)

## Part B — Scholar Appendix

| Ref | Section |
|---|---|
| B1 | Calculation certificate, lineage and hashes |
| B2 | Yoga evidence — rule, requirement, observation, verdict, source |
| B3 | Dosha evidence |
| B4 | Graha condition — full record, six-decimal longitudes |
| B5 | Aspect ledger and the declared aspect policy |
| B6 | D10 Dashamsha validation |
| B7 | Shadbala and other unvalidated capabilities |
| B8 | Source registry and provenance |
| B9 | NOT CALCULATED inventory |
| B10 | Evidence lineage and verification |

## Cross-referencing

Part A never repeats Part B. Where a Part A line has supporting material, it
carries a short reference — `See Appendix Y-03`, `See Appendix D-01` — and
nothing more. This is the mechanism that removed the source-status boilerplate
that used to sit beside every rule (defect V40-D08).

## Ordering rule inside a section

Facts first, rules second, reasoning third, reflection last. The Bhava matrix
is the clearest instance: sign, then lord, then where the lord sits, then
occupants, then drishti, then karakas — and only then, below the table, the
prose statement per bhava.

## What is deliberately absent

- No QR code. A verification endpoint is specified but not built or
  security-tested, and a code that resolves nowhere — or that carries birth
  details in a URL — is worse than no code. `/verify/:reportId` is future work;
  the certificate page states the four values a verifier compares instead.
- No page of "about us", no marketing copy, no filler.
- No decorative astrology imagery. The only ornament is a thin geometric motif
  on the cover and the part divider.
