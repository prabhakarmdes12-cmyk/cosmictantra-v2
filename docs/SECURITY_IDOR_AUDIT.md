# Security, IDOR & Ownership Audit

_TRUST-08 · PROGRAM 8 · Trust-First Product Completion Program_

## Scope

Audit of data ownership, cross-user access (IDOR), and birth-PII handling for the
persistent Living Kundli, Outcome Memory, and existing consultation/payment APIs.

## Threat: IDOR on `/kundli/{id}` (a user opens another user's Kundli by URL)

**Control.** Every Kundli record carries an `ownerKey`. `getKundli(id)`
(`src/lib/kundliStore.js`) returns:
- `{ ok:true }` only when `record.ownerKey === currentOwnerKey`,
- `FORBIDDEN` for a record owned by someone else,
- `NOT_FOUND` for a missing id.

`listKundlis()` filters to the current owner; `deleteKundli` and `saveKundli`
(on update) both re-check ownership and return `FORBIDDEN` otherwise.

**Verification.** `tests/trust02.spec.ts`:
- "changing the URL id to another owner is FORBIDDEN, not readable"
- "deleting another owner's record is refused"
- "a missing id yields NOT_FOUND (no data leak)"

The detail route (`KundliDetailClient`) renders a neutral guard screen for both
`FORBIDDEN` and `NOT_FOUND` — no record data is exposed in either case.

> Current tier is localStorage-first (per the DPDP-conscious design): the
> `ownerKey` is a per-device key. When phone-OTP accounts ship, `ownerKey` maps
> to the authenticated user id and the SAME ownership checks apply server-side —
> the storage contract is intentionally identical. **Action item (server):** the
> future DB read path MUST enforce `WHERE ownerKey = :authUserId`; never trust a
> client-supplied id alone.

## Threat: IDOR on Outcome Memory (reading/altering another user's predictions)

**Control.** `outcomeStore.js` scopes `listPredictions` to the owner and
`recordOutcome` returns `FORBIDDEN` for a prediction owned by someone else.
Predictions are immutable; only owner-authored outcomes are appended.

**Verification.** `tests/trust06.spec.ts` covers immutability and the audit
trail; ownership uses the same `getOwnerKey()` as kundliStore.

## Threat: silent birthplace / timezone remap (location integrity)

**Control.** `INV_LOCATION_001` — a place name is never silently resolved to a
city. Coordinates must be inspected and confirmed (`locationSource` state
machine) before calculation. `validateBirthContext` rejects `UNCONFIRMED`.

**Verification.** `tests/trust02.spec.ts` ("INV_LOCATION_001") and
`tests/trust08.spec.ts` (TRUST_002 → `PLACE_UNCONFIRMED`).

## Threat: birth PII in logs / analytics

**Policy.** No birth date/time/coordinates are written to application logs.
Analytics events (TRUST-09) carry only non-PII identifiers (event name, section,
anonymised counts). The deterministic core needs no network, so birth data never
leaves the device on the free tier.

**Status — RESOLVED (analytics PII).** The client analytics boundary
(`src/lib/analytics.ts`) now scrubs every event through `sanitizeEvent()`
(`src/lib/proAnalytics.js`) before it is stored in the local session OR POSTed to
`/api/astrology/analytics`. The server route applies the SAME whitelist as
defense-in-depth, so no birth PII or free-text (name, phone, email, birth
date/time/coordinates, question) is ever persisted to the audit log — even from a
crafted request. Verified by `tests/trust09.spec.ts` ("legitimate journey fields
survive; birth PII + free text never do").

**Remaining action items.**
- Server consultation APIs (`/api/astrology/*` other than analytics) still handle
  legitimate order PII; confirm their own logs record only order ids and status.
  (Follow-up for the API owner.)

## Threat: auth/authorization on admin & practitioner surfaces

**Existing controls (unchanged by this program).** `src/lib/auth.ts` is
fail-closed on missing secrets and provides `verifyAdminAuth`; practitioner
onboarding uses tokenised invites. Dev/diagnostic routes
(`/dev/jyotish-capabilities`, `/dev/trust-center`) are `robots: noindex` and
present no user PII.

## Deterministic-core resilience (availability)

`failureStates.js` guarantees the deterministic core keeps working when AI,
network or cloud are unavailable (degraded, not broken) — verified by TRUST_005.
This removes a class of "trust me it's down" failures where a user might
otherwise doubt the calculation itself.

## Residual risks / follow-ups

1. **Server-side ownership** must be enforced when the DB-backed model ships
   (client checks alone are insufficient against a crafted API call).
2. **Rate limiting / abuse** on public compute endpoints is out of scope for the
   offline core but should be added at the API edge.
3. **Analytics field whitelist** to be implemented with TRUST-09 observability.

## Verdict (this program's surfaces)

The client-side Living Kundli and Outcome Memory enforce owner isolation and
location integrity, verified by automated tests. No IDOR path exists in the
current localStorage-first model. The documented server action items must be
honoured before a multi-tenant DB launch.
