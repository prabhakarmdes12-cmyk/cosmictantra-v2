# 05 — Graha Condition Engine

Implementation: [`src/lib/kundli/v40/grahaCondition.ts`](../../src/lib/kundli/v40/grahaCondition.ts)
(`graha-condition-v1`), with
[`functionalLordship.ts`](../../src/lib/kundli/v40/functionalLordship.ts)
(`functional-lordship-v1`) and
[`aspectEngine.ts`](../../src/lib/kundli/v40/aspectEngine.ts)
(`parashari-drishti-v1`).

One record per graha, assembled from the canonical chart only. Fields that
cannot be resolved honestly are marked, not filled.

## Fields

| Field | Source | Notes |
|---|---|---|
| `longitudeDeg`, `degreeInSign`, `signId`, `house`, `nakshatra`, `pada` | canonical | six-decimal longitude retained; DMS is a display choice |
| `dignity` | canonical | exalted / moolatrikona / own / friend / neutral / enemy / debilitated |
| `motion.retrograde` | canonical | Rahu/Ketu flagged retrograde by the **mean-node convention**, not observed motion — stated in the report |
| `combustion` | `COMBUSTION_ORB_TABLE_V1` | orb from `relationshipEngine.COMBUSTION_ORBS`; a separate `nearCombust` flag at orb + 2° |
| `planetaryWar` | `GRAHA_YUDDHA_1DEG_V1` | detected at < 1° between two non-luminaries; **victor NOT_CALCULATED** (needs celestial latitude the canonical model does not carry) |
| `vargottama` | canonical D1 vs D9 | same sign in both |
| `functionalLordship` | functional lordship engine | see below |
| `conjunctions` | canonical | same bhava |
| `aspectsGiven` / `aspectsReceived` | aspect engine | full drishti only |
| `shadbala` | — | **not exposed**; see B7 and `forensic/shadbala-validation.md` |
| compound relationship | — | **not filled**; the kernel collapses neutral/enemy, so GREAT_FRIEND / GREAT_ENEMY cannot be recovered without an unverified second derivation (V40-D05) |

## Functional lordship — natural character kept separate

The single most common source of misleading Jyotish software output is
conflating *what a graha is* with *what it does for this lagna*. The engine
keeps them in different fields and prints both:

- `naturalCharacter`: `BENEFIC | MALEFIC | CONDITIONAL`, with a stated basis.
  The Moon's benefic/malefic character is rated by paksha — for the golden
  chart (Krishna Paksha Tritiya) the natal Moon is rated malefic, and the basis
  says so.
- `functionalStatement`: what the graha rules **for this lagna**, and what that
  position is called — kendra lord, trikona lord, dusthana lord, yogakaraka,
  maraka *candidate*.

For a Leo lagna the engine produces: Sun → H1 (trikona lord); Moon → H12
(dusthana lord); **Mars → H4 + H9, yogakaraka**; Mercury → H2 + H11 (maraka
candidate); Jupiter → H5 + H8 (trikona *and* dusthana — flagged as a mixed
position a scholar must weigh); Venus → H3 + H10; Saturn → H6 + H7 (maraka
candidate).

**No maraka verdict is issued anywhere.** The legacy
`relationships.functionalRoles` flatly labels Moon and Jupiter "malefic" and
Mercury "maraka" for this lagna; V40 deliberately does not repeat that, and an
acceptance test asserts the string "no maraka verdict is issued" is present
while "will cause" / "death of" are not.

## Aspect engine — declared policy

Full Parashari graha drishti only:

| Rule ID | Rule |
|---|---|
| `DRISHTI_UNIVERSAL_7` | every graha aspects the 7th from itself |
| `DRISHTI_SPECIAL_MARS` | Mars additionally aspects the 4th and 8th |
| `DRISHTI_SPECIAL_JUPITER` | Jupiter additionally aspects the 5th and 9th |
| `DRISHTI_SPECIAL_SATURN` | Saturn additionally aspects the 3rd and 10th |

Declared and **not adopted**, recorded so the omission is visible:

| Rule ID | Variant |
|---|---|
| `DRISHTI_NODE_5_9_VARIANT` | Rahu/Ketu aspecting the 5th and 9th |
| `DRISHTI_PARTIAL_SHASHTIAMSHA` | graded partial drishti (¼, ½, ¾) |

Node policy is explicit: `DEFAULT_ASPECT_POLICY.nodes = 'SEVENTH_ONLY'`. The
policy sentence is printed in the Passport and in full in appendix B5, so a
reader who follows a different school knows exactly what to re-derive.

## Golden-chart sanity results

Mercury sits 13.68° from the Sun against a retrograde orb of 12° — **not
combust**, but inside the 14° near-combustion band, so it is reported as near
combustion with both numbers shown. Venus is 18.14° away against a 10° orb:
safe. Sun, Rahu and Ketu carry the sentinel and are marked not applicable.
