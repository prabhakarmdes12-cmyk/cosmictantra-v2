# COSMICTANTRA — CHART STATE MACHINE (Sprint C.1 §5)

Two independent axes. The UI derives everything from these; no other state
may drive presentation.

## Axis 1 — ChartStatus (what the engine/calculation holds)

```
DRAFT ──────────────┐
  │                 │
  ▼                 ▼
INPUT_INCOMPLETE   FAILED (terminal — no interpretation, nothing saved)
  │
  ▼
CALCULATING ───────► CALCULATED ────► VALIDATION_PENDING ──► READY (terminal)
  │                    │                   │
  └────────────────────┴───────────────────┴────► FAILED (terminal)
```

| Status | Consumer presentation |
|---|---|
| DRAFT | No chart shown — start form |
| INPUT_INCOMPLETE | Form resumes; explicit missing-field errors |
| CALCULATING | "Calculating your chart…" + only genuinely completed steps |
| CALCULATED | Preview allowed; labelled validation-pending |
| VALIDATION_PENDING | Full preview, clearly labelled; no authoritative claims |
| READY | Full consumer experience |
| FAILED | Calm failure card — **no interpretation, no persistence** |

## Axis 2 — PersistenceState (ownership in the user's space)

```
EPHEMERAL ──► SAVING ──► SAVED (terminal)
    │            │
    └──► SAVE_FAILED ──► SAVING (retry)
```

| State | Consumer wording |
|---|---|
| EPHEMERAL | "Your Kundli is ready" + [SAVE MY KUNDLI] |
| SAVING | "Saving…" (button disabled) |
| SAVED | "Saved to my space ✓" |
| SAVE_FAILED | Calm "Could not save — try again" (never "saved") |

## Allowed combinations (CT_UX_INV_004)

- `FAILED` ⇒ `EPHEMERAL` only (never `SAVED`/`SAVING`, never interpretation).
- `SAVED` ⇒ status `READY`/`VALIDATION_PENDING` only.
- `EPHEMERAL` + `READY` = "ready, not saved yet" — correct pre-save wording.
- `VALIDATION_PENDING` may be persisted (user saved an approximate-time chart)
  — the status chip must remain visible after save.

## Contradictions — forbidden

| Combination | Reason |
|---|---|
| FAILED + SAVED / SAVING | failed chart cannot belong to the user's space |
| EPHEMERAL + "saved" copy | false persistence claim |
| FAILED + full interpretation drawer | false authority |
| DRAFT + SAVED | nothing was calculated |

Implemented in `src/lib/kundli/chartStateMachine.ts`
(`combineChartStates`, `isStateCombinationValid`) and enforced by the
Sprint C.1 state-machine test suite.
