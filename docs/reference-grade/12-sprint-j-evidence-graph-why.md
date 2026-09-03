# Sprint J — Evidence Graph + WHY (Mission §17–§18)

**Status: COMPLETE.** Every consequential conclusion now rests on a queryable
evidence node, every conclusion answers WHY / SHOW CALCULATION / SHOW RULE /
SHOW SOURCE / SHOW ALTERNATIVE TRADITION / SHOW VALIDATION STATUS through a
traversable API, and tradition disagreement is represented as **"k of n
registered readings"** — never a probability (CT_INV_010).

The pre-existing `evidenceGraph.ts` / `evidenceCompiler.ts` were **preserved
and extended, not rewritten** (charter rule): content-addressed nodes, frozen
payloads, the hash-chained PredictionLedger, and relation assessment all
survive; what Sprint J added is rule provenance, the WHY engine, tradition
consensus, and the qualification that the original infrastructure never had.

## 1. What was built

### 1.1 Rule provenance on the graph (`evidenceGraph.ts`)
- `EvidenceNode`/`NewEvidenceNode` gained an optional
  `ruleRef: { ruleId, ruleVersion }`.
- Deliberately **outside the content hash**: node identity answers "what was
  computed"; the rule ref answers "under which registered rule" and is stable
  provenance, not payload. Swapping a rule version must never silently change
  a node's identity.

### 1.2 Conclusion nodes (`evidenceCompiler.ts`)
The compiler now emits a CONVENTION node for every consequential conclusion,
each carrying `conditions: [{ id, satisfied }]` and dependencies on the fact
nodes it consumed:
- **44 yoga nodes** (`convention:yoga:{id}`) — dependencies are the exact
  planet-placement facts the evaluator consumed (`y.inputs.planets`).
- **9 combustion nodes** (`convention:combustion:{planet}`) — each depends on
  a GRAHA Sun-separation fact node; value carries `adoptedOrb`, `borderline`,
  `scholarJudgementRequired` (rule `RULE_COMBUSTION_ORBS`).
- **Sade Sati** (`convention:sadeSati`, rule `RULE_SADE_SATI_BAND`) —
  RSK_016 enforced in the graph shape itself: the verdict depends on the
  **TRANSIT Saturn fact node at the reference instant + the natal Moon
  anchor**, and *not* on natal Saturn.
- **Kalsarpa** (`convention:kalsarpa`, rule `RULE_KALSARPA_HEMISPHERE`) —
  variant-verdict value with the adopted variant declared, 9 graha deps.
- Plus rajYogas, manglik, avakhada conclusion nodes.
- Reference probe (Patna 1995-06-15): **172 nodes / 12 domains / 58
  conclusions** (44 yoga + 9 combustion + 5 others).

### 1.3 WHY engine (`whyEngine.ts`, `why-engine-1.0.0 (sprint J)`)
`explainNode(store, id)` returns the §18 capability set:
- `chain` — ordered dependency links with depths (cycle-safe traversal);
- `roots` — the dependency-free facts the conclusion ultimately rests on;
- `calculation` — the conclusion value plus its direct inputs;
- `rule`, `source`, `alternativeTraditions`, `validationStatus` — served from
  the **live rule registry only when the node carries a `ruleRef`**. A node
  without registry provenance gets a calculation-only report; the engine
  never invents a citation to fill the gap (CT_INV_002).
- `listConclusionNodes(store)` — every node a user may ask WHY of.

### 1.4 Tradition consensus (§17, `whyEngine.ts`)
`TraditionConsensus = { subject, adoptedVerdict, agreeing, total, readings[],
statement, guard: RULE_AGREEMENT_NOT_PROBABILITY }`:
- **Combustion**: the adopted orb + every declared alternative orb from
  `COMBUSTION_ORB_TABLE_V2`, evaluated at the actual separation —
  Mercury at 13°: direct **2 of 2**, retrograde **1 of 2** (the RSK_002
  disagreement is *visible*, not averaged away). Sun/nodes → null (rule does
  not apply).
- **Kalsarpa**: adopted variant + the four declared alternatives
  (direction-qualified, boundary-inclusive, Moon-excluded, Kala Amrita) as
  five readings; clean hemisphere 5/5 PRESENT; boundary charts keep honest
  INDETERMINATE with the disagreement shown; an inconsistent node axis
  returns **null** (fail closed), never a forced consensus.

### 1.5 One real infrastructure bug fixed
Stream A of the qualification caught that `traceDependencies` flagged every
**diamond** (a shared dependency reached via two paths — which the convention
graph legitimately contains) as a "cycle": it used global visitation instead
of the current DFS path. Fixed to path-based detection; the diamond shape and
true-cycle detection are both regression-pinned in the gate spec.

## 2. Qualification — `WHY_GRAPH_001` (`npm run qualify:why`, strict 800)

Runner `why-qualification-runner-1.0.0 (sprint J)`, seed `0xd00d`.
Fixture set `WHY_GRAPH_001`, sha256 `275095b790a47c4f5689fd360f9349806e5c6534
fb1f460c0e796547bdeacd71` (tamper-evident on load).

**Verdict PASS — 0 violations.**

| Stream | Checks / violations | What it proves |
|--------|---------------------|----------------|
| A Graph integrity | 87,620 / 0 | 12 domains per chart; every dependency resolves; no cycles in any WHY chain; content-address stability; distinct snapshots never collide |
| B Conclusion coverage | 15,400 / 0 | 58 conclusions per chart (44 yoga exact, 9 combustion with rule refs, kalsarpa variant declared); sadeSati = TRANSIT basis + reference instant + transit-Saturn fact + natal-Moon anchor + NO natal-Saturn dep (RSK_016) |
| C WHY traversal | 37,250 / 0 | per conclusion: chain starts at the node, roots are dependency-free, calculation carried, registry capabilities match the LIVE registry (incl. validation tier) |
| D Consensus identity | 502 / 0 | constructed combustion separations + 48 kalsarpa geometries vs independent reimplementations; integer "k of n" statements, never a `%` |
| Determinism | 1 / 0 | byte-equal recompiles |

Declared findings (NON_BLOCKING): `DECLARED_WHY_API_ENGINE_SIDE` (UI surfaces
wire onto this API in later slices), `DECLARED_CONSENSUS_SCOPE` (combustion +
kalsarpa only; other rules expose alternatives via WHY without per-chart
consensus yet), `DECLARED_LEDGER_CONSENT_GATE` (ledger persistence + D-1
consent is a later slice), `DECLARED_NATAL_SATURN_ABSENCE_PIN`.

**Scenario-generator note (honesty of the harness)**: the first strict run
failed 15/200 charts with "11 domains" — the generator was asking for the
*current* dasha at instants **before birth**, which legitimately yields no
current-window node. The generator was fixed (reference instant always
post-birth); the graph was correct. A pre-birth "now" question producing no
TIMELINE_OUTCOME conclusion is the engine behaving, not a defect.

## 3. Gate spec

`tests/why-qualification.spec.ts` — **17 tests**, all passing:
fixture tamper-evidence (CT_INV_008) + version pins; the diamond-is-not-a-cycle
fix and true-cycle detection; full WHY traversal + §18 honesty (calculation-only
reports state nothing they cannot back); the RSK_016 sade-sati chain shape;
§17 consensus identity with visible disagreement; committed-artifact pins.

## 4. Runner replay note (the reason §21 exists, again)

Both sprint bugs were caught by independent checks, not by eyeballing:
the cycle "detections" (diamonds) were reproduced on a minimal store before
the fix was trusted, and the 11-domain failures were traced to the harness
generator (pre-birth query) — not papered over by loosening stream A.

## 5. Artifacts

- `qualification/why-qualification-runner.ts` — streams A–D + CLI (`--scenarios`, `--seed`, `--gate`)
- `qualification/fixtures/why-graph-fixtures.json` — `WHY_GRAPH_001`
- `qualification/why-summary.json`, `qualification/why-failures.json` — committed run artifacts
- `src/lib/jyotish/whyEngine.ts` — WHY traversal + tradition consensus
- `tests/why-qualification.spec.ts` — gate spec (17/17)
- `tools/build-why-fixtures.ts` — fixture builder (deterministic)
