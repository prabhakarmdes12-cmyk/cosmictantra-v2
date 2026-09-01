# 06 — Bhava Intelligence

Implementation: [`src/lib/kundli/v40/bhavaIntelligence.ts`](../../src/lib/kundli/v40/bhavaIntelligence.ts)
(`bhava-intelligence-v1`).

## What a bhava record contains

For each of the twelve bhavas, in this order — which is also the column order
on page 7, because it is the order a Pandit reads:

1. `signId` / `signName` — the rashi on the bhava
2. `classes` — kendra / trikona / dusthana / upachaya
3. `lord` (bhavesha) and its `lordHouse`, `lordSignId`, `lordDignity`,
   `lordRetrograde` — **where the lord actually sits**
4. `occupants`
5. `aspectsReceived` — full Parashari drishti only, with the rule that produced
   each one
6. `karakas` — natural (naisargika) karakas
7. `structureStatement` — the same information as one readable sentence
8. `strength` — hardcoded `NOT_CALCULATED`

## Why bhava strength is not calculated

Bhava bala depends on shadbala, which is unvalidated (V40-D03). Publishing a
bhava strength derived from an unvalidated input would launder the uncertainty
into a number that looks authoritative. The field therefore says
`NOT_CALCULATED` and the page footnote says why.

## Karakas

`BHAVA_KARAKAS` covers all twelve bhavas. The 10th carries the four karmic
karakas (Sun, Mercury, Jupiter, Saturn). `KARAKA_SOURCE_NOTE` is printed under
the table: *natural karakas as commonly taught in the Parashari stream;
contested assignments are omitted rather than included silently.*

## Structural highlights

[`structuralHighlights.ts`](../../src/lib/kundli/v40/structuralHighlights.ts)
(`structural-highlights-v1`) selects what appears in the Kundli Saar. Ten
declared salience rules, priority-sorted, default limit 8 — so the selection is
reproducible and auditable, and is not a language model's taste:

`SALIENCE_CONCENTRATION_3_PLUS`, `SALIENCE_DIGNITY_EXTREME`,
`SALIENCE_LAGNESHA`, `SALIENCE_YOGAKARAKA`, `SALIENCE_MOON`,
`SALIENCE_ANGULAR`, `SALIENCE_RETROGRADE`, `SALIENCE_COMBUSTION`,
`SALIENCE_VARGOTTAMA`, `SALIENCE_NODE_AXIS`.

Every highlight carries the rule id that produced it and the evidence paths it
rests on.

## Consultation questions

[`consultationQuestions.ts`](../../src/lib/kundli/v40/consultationQuestions.ts)
(`consultation-questions-v1`) produces page 13. Nine declared rules, limit 8:

`QUESTION_CONCENTRATION`, `QUESTION_PRESENT_YOGA`, `QUESTION_MANGLIK`,
`QUESTION_CURRENT_PERIOD`, `QUESTION_CAREER_CONTRADICTION`,
`QUESTION_DUSTHANA_LORD_ANGULAR`, `QUESTION_RETROGRADE`,
`QUESTION_NEAR_COMBUSTION`, `QUESTION_BIRTH_TIME`.

Each question prints its basis beneath it. A question is a prompt for the
consultation; the engine never answers one, and none of them is phrased so that
it implies its own answer.

## Golden-chart output (Leo lagna)

The matrix is dense but the shape is easy to check by hand: the 10th is Taurus,
its lord Venus sits in the 10th in its own sign, the lagnesha Sun is in the
10th as well, and Mars — the yogakaraka — is in the 1st. Bhava 10 receives
drishti from Jupiter and Saturn. Bhava 4 receives drishti from Mars, Mercury,
Sun and Venus.
