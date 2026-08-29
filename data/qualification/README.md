# Jyotish Qualification — external reference intake

This folder is how CosmicTantra becomes **externally qualified** instead of only
internally verified. It is the one thing the automated build cannot do for you:
it requires genuine external reference values that a human has recorded.

## The honesty rule

A reference `expected` value must come from **outside** CosmicTantra:
- a named external product (record its name, version and settings), **or**
- a practising Pandit's own hand/independent computation.

**Never** paste CosmicTantra's own output back in as the expected value — that is
circular and proves nothing. An empty `expected` keeps the subject honestly
`PENDING_EXTERNAL_REFERENCE`; it is never scored as a pass.

## Supported `capabilityId`s

`lagna.sign`, `lagna.longitude`, `moon.sign`, `moon.nakshatra`, `sun.sign`,
`sun.longitude`, `ayanamsha`, `ashtakavarga.sav`, `vimshottari.mahadashaLord`.
(Add more accessors in `src/lib/pro/qualificationLab.js` as needed.)

## Workflow

1. Copy `references.template.json` to `references.json`.
2. For each subject, enter the exact birth input and one `references[]` entry per
   capability you compared. Fill `expected` with the external value; record
   `product`/`productVersion`/`settings` (or `recordedBy` for a Pandit value).
3. Run the lab:

   ```bash
   node scripts/qualify.mjs data/qualification/references.json
   ```

4. Read the classification breakdown. `MATCH` / `WITHIN_TOLERANCE` are wins;
   `CONVENTION_DIFFERENCE` explains a benign settings mismatch; `COSMICTANTRA_DEFECT`
   or `UNRESOLVED` are real findings that fail the run (non-zero exit).

Results are written to `last-run.json`. Once a meaningful corpus is externally
compared with an acceptable distribution, the release verdict in
`docs/TRUST_PROGRAM_ACCEPTANCE_REPORT.md` can move above `CONTROLLED_PILOT`.

> `references.json` and `last-run.json` are git-ignored — reference data may
> contain third-party report screenshots/URLs and real birth data, so it stays
> local until the owner decides to commit a curated, shareable subset.
