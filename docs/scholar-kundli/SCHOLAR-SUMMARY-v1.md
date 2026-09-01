# Scholar Summary v1

**Status:** implemented, two pages, measured.
**Position in the report:** immediately after the birth-data passport, before
the D1 chart.

---

## 1. Why two pages

A reader who has paid for a Kundli should not have to read nineteen pages to
find out what it says. The summary states what was calculated, in one place,
with an evidence id beside every value, and then separates — physically, on its
own page — what was *calculated*, what the *tradition says* about it, and what
the reader might *do* with it.

Mixing those three is how a chart reading turns into a prediction nobody can
support. They are kept apart on purpose.

## 2. Page 1 — "Your chart at a glance"

One line per fact, each carrying an evidence id that resolves in the detailed
sections:

| Line | Evidence id | Source |
|---|---|---|
| Lagna and its degree | `FACT-LAGNA` | `canonical.ascendant.sign` |
| Moon sign and house | `FACT-MOON-SIGN` | `canonical.planets[Moon].sign` |
| Janma nakshatra and pada | `FACT-NAKSHATRA` | `canonical.planets[Moon].nakshatra` |
| Sun sign and house | `FACT-SUN-SIGN` | `canonical.planets[Sun].sign` |
| Current mahadasha, with dates | `DASHA-MAHA-CURRENT` | `canonical.dashas.current` |
| Current antardasha, with dates | `DASHA-ANTAR-CURRENT` | `canonical.dashas.mahadashas[].antardashas[]` |
| Next period change | `DASHA-NEXT-TRANSITION` | same |
| D1 lagna sign | `CHART-D1-LAGNA` | `canonical.divisionalCharts[1].lagnaSign` |
| D9 lagna sign | `CHART-D9-LAGNA` | `canonical.divisionalCharts[9].lagnaSign` |
| Exalted / debilitated / moolatrikona / own-sign placements | `FACT-DIGNITY` | `canonical.planets[].dignity` |
| Yogas found **present** | `YOGA-PRESENT-COUNT` | `canonical.yogas[].status` |
| Material calculated doshas | `DOSHA-MATERIAL` | `canonical.doshas[]` |
| Count of what is not calculated | `FACT-NOT-CALCULATED` | declared list, §5 |

The antardasha line is shown **only when the canonical timeline actually dates
it**. When it does not, the line reads "not calculated — the antardasha dates
are not available for this chart". It is never guessed.

## 3. Page 2 — "What deserves attention"

### Level 1 — Calculated fact

The calculated facts the interpretations below rest on, one line each, keyed by
evidence id. It deliberately does not repeat page 1.

### Level 2 — Traditional interpretation

Each entry carries all four required links:

- **the canonical fact path** it rests on
- **the detailed section** holding the full working
- **the source-registry entry**, with its locator status (VERIFIED / UNVERIFIED)
- **that source's own stated limitation**

Only **PRESENT** yogas are summarised. A gate check fails delivery if an ABSENT
or INDETERMINATE yoga is named here. Statements quoted from the source registry
are shortened to fit; the unabridged text stays in the section named on the
same line.

The current dasha is interpreted only as a period emphasis: "It is a period
emphasis, not a forecast."

### Level 3 — Practical reflection

Prompts for the reader's own judgement. No forecast, and explicitly not
professional advice on health, legal or financial matters.

## 4. Language discipline

`scanBannedLanguage` runs over every generated sentence. The list includes
"definitely", "guaranteed", "will happen", "doomed", "incurable", "fatal", and
the deterministic marriage, death, disease, wealth and litigation phrasings
("you will get married", "you will win the case", "you will become rich", …).

It runs twice: in the test suite, and in the delivery gate as
`CG_SUMMARY_LANGUAGE`, which is critical. A summary containing a banned phrase
is not delivered. Current count on the reference chart: **0**.

The three levels are also a defence in depth here: a sentence that promises an
event is a Level-2 violation by construction, because Level 2 is defined as
traditional association and Level 3 as reflection.

## 5. What is not calculated, counted honestly

`NOT_CALCULATED_CAPABILITIES` in `scholarSummary.ts` declares, in one place,
everything a reader might reasonably expect that this engine does not compute:
thirteen vargas beyond D1/D9, Shadbala, Ashtakavarga, Jaimini, KP, Prashna and
Muhurta. The count on page 1 is derived from that list plus the model's own
NOT_CALCULATED yogas and doshas, so the number cannot drift away from the code
that produces it.

On the reference chart: **23 items** — 20 declared capabilities, 2 yogas known
but not evaluated, and 1 dosha (Kalsarpa) with no adopted rule.

This count is a feature. A report that does not say what it left out invites
the reader to assume it left nothing out.

## 6. Length

The summary occupies **exactly two pages** of the delivered PDF: page 1 holds
"Your chart at a glance", page 2 holds all three levels of "What deserves
attention", and the following section begins on page 3. This was measured on
the generated PDF, not estimated. It was also the hardest constraint to meet:
three earlier drafts spilled onto a third page, and each was cut rather than
allowed to overflow.

## 7. A false fact found while building this

The `FACT-DIGNITY` line reads "none of the nine grahas is exalted, debilitated,
in moolatrikona or in its own sign" for a chart that has Venus in Taurus —
Venus's own sign. The canonical model derived dignity from boolean flags
(`isInOwnSign`, `isExalted`, …) that **no snapshot this pipeline has produced
populates**, so every graha silently fell through to NEUTRAL.

The engine computed it correctly all along; only the adapter lost it. `dignityOf`
now reads the engine's own dignity string, and `MOOLATRIKONA` is a distinct
value rather than being folded into own sign.

A summary built on that field would have stated something untrue, in the most
trusted position in the report. Worth stating plainly: the summary is only as
honest as the fields it reads, which is why every fact it prints is checked
back against the detailed section that must also state it.

## 8. Bilingual status

Chart labels and the two placement tables carry Devanagari. Section headings,
prose and interpretation text remain English.

The consistency gate measures this rather than rounding it up:
`CG_BILINGUAL_PARTIAL` reports that Hindi covers **5 of 31 sections** and names
the 26 that do not. It is a warning, not a blocker, and it is recorded on every
Hindi delivery.

## 9. Limitations

- The summary is generated from the canonical model at generation time. The
  "current period" is therefore current as of the `generatedAt` instant on the
  certificate, not as of whenever the PDF is opened months later.
- Interpretations are the source registry's adopted readings, quoted with their
  stated limitations. Where the registry records no adopted interpretation, the
  summary says so rather than supplying one.
- Level 3 reflections are fixed text, not tailored to the chart. They are
  guidance, and they are the same for every reader.
