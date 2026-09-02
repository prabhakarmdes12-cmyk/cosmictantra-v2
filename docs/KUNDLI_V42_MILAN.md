# KUNDLI V42 — Kundli Milan (Ashtakoota / 36-Guna)

## What this is

A new classical Kundli Milan report that mirrors the Master Kundli flow:

- `/milan` — interactive client (`src/app/milan/MilanReportClient.tsx`)
- `POST /api/kundli/milan` — same CLIENT/PANDIT/SCHOLAR + `en`/`hi`/`hi-en`
  locale contract as `/api/kundli/pdf`, returns a real PDF
- `GET /api/kundli/milan` — advertises the contract, never generates
- `calculateMilan()` — deterministic pure engine, no ephemeris needed

Home page now links `/kundali-milan` (legacy v1 tool) to `/milan` (new report).
The legacy `/kundali-milan` route and `src/lib/kundaliMilan.js` are kept as the
regression reference; they are not deleted.

## Files

| Path | Purpose |
|---|---|
| `src/lib/kundli/v42/milan/milanData.ts` | The fixed classical tables (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi) + source labels. Tables are the canonical reference. |
| `src/lib/kundli/v42/milan/milanEngine.ts` | `calculateMilan`, per-koota scores, dosha flags + cancellation, verdict bands, explanatory prediction layer. Pure / testable. |
| `src/lib/kundli/v42/milan/milanPdf.ts` | PDF renderer on the same pdfkit/fontkit `PdfSurfaceV3` + `FontStack` as Master renderer v3, so Devanagari shaping comes from the font. |
| `src/app/api/kundli/milan/route.ts` | Public endpoint. Accepts either two Moon placements or two full birth profiles. `inspect:true` returns JSON only, never a document. |
| `src/app/milan/page.tsx` | Server page shell. |
| `src/app/milan/MilanReportClient.tsx` | The report UI: two-profile form, edition/language selectors, koota table, dosha summary, explanatory prediction layer, paid-consultation CTA. |
| `tests/kundli-v42/milan-engine.spec.ts` | Engine tests (10). |
| `tests/kundli-v42/milan-route.spec.ts` | Route/report gate tests (MR-01…MR-07). MR-07 is a real browser test; it needs Chromium (unavailable in some sandboxes) but is valid in CI. |

## Engine inputs / outputs

Input follows the canonical snapshot's Moon shape:
`{ rashiName, nakshatraName, pada?, rashiLord? }`.
The helper `milanInputFromSnapshot(snapshot)` reads
`snapshot.planets.Moon` / `snapshot.birthPanchang.nakshatra`.

Output `MilanCalculation`:
- `kootas` — 8 rows, each `{id, name, sanskrit, maxPoints, points, verdict, detail, detailHi}`
- `total` / `maxTotal` (36)
- `doshas` — Nadi and Bhakoot, each `{active, cancelled, weight, reason, reasonHi}`
- `nadiCancelled` / `bhakootCancelled` / `nadiDoshaActive` / `bhakootDoshaActive`
- `verdict` — `{totalBand, title, titleHi, summary, summaryHi}`
- `predictions` — 3 explanatory blocks, each with `traditionalClaim`,
  `explanation`, `motivation`, `caution`, `bestScenario`, `askAstrologer`
- `sources`

## Scoring summary (canonical, do not re-derive)

Eight kootas: Varna 1, Vashya 2, Tara 3, Yoni 4, Graha Maitri 5, Gana 6,
Bhakoot 7, Nadi 8 → 36. The exact grids are in `milanData.ts`; sources are
Brihat Parashara Hora Shastra (Ashtakoota doctrine), Phaladeepika and Muhurta
Chintamani as conventionally cited, cross-checked against current reference
sites (VedicMarga, AstroSight, IShvaram, AstroPal).

## Prediction-layer policy (user directive)

The prediction text is always:
1. explanation (what the classical rule says),
2. motivation (makes the reader feel positive),
3. caution (no false certainty — not a scientific promise),
4. best possible scenario,
5. "ask our astrologer" paid-consultation CTA.

Every block is framed as a traditional reading, not an absolute prediction.
The paid CTA routes to `/ask?focus=milan&mode=detailed`.

## What was added in the second increment

- **Supplemental Dosha layer** (`supplementalDoshas`): Mangal Dosha (from the
  canonical `yogasAndDoshas.manglik` plus Mars house from Lagna/Moon/Venus),
  Rajju (South-Indian / Porutham 5-body-zone table + sign/pada cancellations),
  Vedha (14 bidirectional nakshatra pairs), and Kala Sarpa (Rahu-Ketu axis
  side check from `planetsArray`).
- **Deeper-chart synthesis** (`synthesis`): D9 Navamsha Moon, 7th-house
  sign/lord, Venus/Jupiter marriage karakas, and the combined traditional
  verdict — displayed and printed, and always honest about what data was
  provided vs. not.
- **Full authored Hindi prediction prose** (`explanationHi`, `motivationHi`,
  `cautionHi`, `bestScenarioHi`, `askAstrologerHi`) for every prediction block;
  the UI and the PDF now render complete Hindi text in `hi`/`hi-en`.
- `milanInputFromSnapshot`/`milanContextFromSnapshot` now map canonical
  Sanskrit rashi names (`Mesha` etc.) to English (`Aries`) so the Milan tables
  are fed correctly, and they pull D9 / 7th-house / karaka context.

## Known limits / next steps (handoff)

1. **PDF page count header is still `0`.** The current renderer does not
   post-count pages; a soft gate could read the PDF with `inspectPdf` (as MR
   tests do) and emit the real count in `X-Milan-Pages`.
2. **Rajju uses the South-Indian/Porutham classification** (5 body zones) and
   is reported as a *supplemental* dosha, not part of the 36-guna score. A
   North-Indian variant / regional switcher would be a future option.
3. **Mangal Dosha cancellation is deliberately conservative.** The engine
   reads the canonical Manglik verdict; a full Mangal-dosha cancellation
   matrix (own/exaltation, Mars in certain signs/houses, D9, etc.) is a
   future increment.
4. **Client-side "print/preview" parity.** The report computes on the client
   for the interactive truth; the qualified PDF path is the server route. A
   whole-chart side-by-side Milan preview is the natural next step.
5. **Rate limit** is 24/min (higher than the Master PDF 12/min because Milan
   is lighter); revisit if the endpoint is exercised by bots.

## How to run

## How to run

```bash
npm run dev
npx tsc --noEmit
npx playwright test tests/kundli-v42/milan-engine.spec.ts tests/kundli-v42/milan-route.spec.ts
```
