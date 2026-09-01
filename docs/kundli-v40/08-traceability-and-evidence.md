# 08 — Traceability and Evidence

Invariant **KUNDLI_INV_006**: every printed conclusion can be walked back to
the birth input.

## The chain

```
interpretation  →  synthesis evidence  →  Jyotish relation
               →  calculated fact      →  canonical chart
               →  birth input + declared calculation settings
```

Appendix B10 prints this chain and a sample of resolved paths; the calculation
certificate (B1) closes it with the hashes.

## Evidence identifiers are canonical fact paths

An `evidenceId` is not an opaque token. It is a path into the canonical model,
resolvable by `resolveFactPath()` in
[`factPaths.ts`](../../src/lib/kundli/v40/factPaths.ts). Grammar: `a.b[key].c`.

| Example | Resolves to |
|---|---|
| `planets[Venus].sign.en` | `"Taurus"` |
| `planets[Venus].dignity` | `"OWN_SIGN"` |
| `houses[10].sign.id` | `2` |
| `ascendant.degreeInSign` | `12.096588` |
| `dashas.current.mahadasha` | `"Rahu"` |
| `yogas[YOGA_MALAVYA].status` | `"PRESENT"` |
| `divisionalCharts[9].lagnaSign` | `"Karka"` |
| `panchanga.tithi.paksha` | `"Krishna Paksha"` |

References to rules rather than facts use the `RULE:` prefix, e.g.
`RULE:DRISHTI_SPECIAL_SATURN`.

## The test that keeps it honest

`tests/kundli-v40/derived-model.spec.ts` collects **every** `evidenceIds` entry
emitted anywhere in the derived model — career claims of all polarities,
structural highlights, discussion points and all twelve bhava records — and
resolves each one against the canonical chart. Any path that resolves to
`undefined` or `null` fails the suite. The test also asserts that more than
twenty distinct paths are cited, so the check cannot pass by citing nothing.

## Determinism

`computeContentHashV2()` hashes the calculation config, ayanamsha value, Julian
day, ascendant, planets, houses, divisional charts, dashas, yogas, doshas,
panchanga, the derived-model version, the engine-version map, the aspect policy,
the report-model version and the source-registry version — and **excludes the
generation timestamp**. Two runs of the same birth data produce byte-identical
hashes; a test generates the report twice, a few milliseconds apart, and
asserts equal `contentHash` and `reportId` but different `generatedAt`.

For the golden chart: report ID `CT-KUNDLI-31346AC701E0CFD5`.

## Verification, and why there is no QR code

The certificate page states the four values a verifier compares: report ID,
content hash, calculation version, report-model version. No QR code is printed.
A verification endpoint `/verify/:reportId` has been specified but not built or
security-tested, and a code that resolves nowhere — or worse, that carries
birth details in a public URL — would be less trustworthy than no code at all.
When the endpoint exists, the QR may be added; the URL will carry the report id
only, never birth data.

## Source registry

`yogaSourceRegistry.ts` is canonical: a rule with no registry entry cannot be
reported at all. Each entry records the source work, the locator, the edition
held, whether the locator has actually been **verified against a held edition**
(mostly `no`, and the report says so), whether the edition is in this
repository, and the scholarly agreement level. Appendix B8 prints the whole
table once. Part A prints only the short status — this is the fix for defect
V40-D08, which had the full provenance statement repeated beside every rule.
