# 17 — V42 identity: anonymous-first, claim-on-value, merge-safe

Implements the identity design from `16-v42-product-packaging-and-identity.md`
§5, including the channel-merge gap that document flagged as "cheap now,
expensive later".

Status: **domain layer complete and tested; HTTP routes not yet wired.**

---

## 1. What was wrong

`PjosAccount` carried the credential directly:

```prisma
authChannel PjosAuthChannel
authSubject String
@@unique([authChannel, authSubject])
```

with the comment *"Replaceable auth transport: the credential channel never
owns the Person."* The comment was right and the schema contradicted it. One
human signing in by phone in September and by email in October became **two
accounts**, each holding its own copy of the same `PjosPerson`, with no
representable relationship between them. Nothing in the schema could express
"these are the same person", so no amount of application code could repair it
after the fact.

This is invisible until there are real users, and then it is a data-repair
project conducted under time pressure against live customer data.

## 2. The fix

Credentials moved to their own model:

```prisma
model PjosAuthIdentity {
  accountId String
  channel   PjosAuthChannel
  subject   String
  verifiedAt DateTime?
  @@unique([channel, subject])   // GLOBAL
}
```

The global unique on `(channel, subject)` is the whole mechanism. A phone
number can only ever point at one account, so discovering it on a *different*
account is a detectable event rather than a silent fork — and that event is
what triggers a merge.

Three models added:

| model | purpose |
|---|---|
| `PjosAuthIdentity` | one way of proving you are an account; a human may hold several |
| `PjosAnonymousSession` | a chart entered before anyone signed in, held against a hashed device cookie |
| `PjosAccountMerge` | append-only audit; `@@unique([absorbedAccountId])` so an account can only be absorbed once |

`PjosAccount` gained `mergedIntoId` (self-relation, `onDelete: SetNull`).

## 3. Anonymous-first, claim-on-value

```
1. Visitor types birth details
   -> PjosPerson created immediately, held against a hashed cookie
   -> no account, no consent prompt, no interruption
   -> an abandoned funnel still leaves a recoverable chart

2. First moment of real value (download / save / WhatsApp / pay)
   -> ask for phone or email, CLAIM the session
   -> account created or found, PjosPersonRelationship(SELF) written,
      PjosConsentRecord written, session marked claimed
   -> nothing is retyped
```

The user experiences "it remembered me", never "please register" — which is
the conversion property kundali.io gets from having no accounts at all, without
giving up the ability to have accounts.

## 4. Decisions worth knowing about

**Survivor selection is deterministic and caller-order independent.** The
older account wins, ties broken by id. Two concurrent merges of the same pair
therefore agree instead of pointing at each other.

**A merge moves mutable associations, not history.** Moved: auth identities,
person relationships (de-duplicated against the survivor's existing set), and
`PjosAccessGrant.grantedById`. **Not moved: `PjosConsentRecord`.** A consent is
a historical fact about who agreed to what and when; rewriting whose it was in
order to tidy up a merge would falsify a DPDP record. The absorbed account is
retained with `mergedIntoId` set, and `PjosAccountMerge` is how a reader walks
from the old account to the survivor.

**Merges chain, and every read resolves.** `resolveAccount()` follows
`mergedIntoId` to the live account with a hop limit — a cycle fails loudly
rather than hanging a request thread.

**Verification gates the merge.** An unverified credential may create a brand
new account, but it may never attach to an existing one. Otherwise typing a
stranger's phone number would hand you their charts. Same rule on
`linkChannel`: merging two accounts requires a proven channel.

**Normalisation runs on the read path, not just the write path.**
`+91 98765 43210` and `+919876543210` are one credential; `User@Example.COM`
and `user@example.com` are one credential. Normalising only on write leaves
lookups able to miss, which forks the user just as effectively as having no
merge at all.

**One Person per human.** `claimSession` de-duplicates: if the account already
holds a SELF person with the same birth details, the session's newly created
Person is discarded and the session repointed. Otherwise generating your own
chart on a phone and again on a laptop makes you two people inside one
account, which is the same bug one level down.

## 5. Layering

```
identityService.ts        all policy; no persistence, no Prisma
  types.ts                rows + the IdentityRepository port
  inMemoryIdentityStore   test double AND reference semantics
  prismaIdentityStore     thin translation
```

Follows the pattern `ownershipGuard.ts` already set: domain types mirror the
Prisma enums without importing `@prisma/client`, because the engine download
is blocked in some environments and this logic is worth writing and testing
before a client can be generated. Where the Prisma adapter disagrees with the
in-memory store, **the adapter is wrong** — the in-memory store is what the
tests describe.

## 6. Tests

`tests/pjos/identity.spec.ts` — 29 tests. The load-bearing ones:

- **ID-14** is the bug, end to end: phone Monday, email Tuesday, link
  Wednesday; asserts both charts survive on one account and both credentials
  resolve to the survivor.
- ID-15 survivor determinism · ID-16 merge idempotence · ID-17 chain
  `A→B→C` with no chart lost · ID-18 cycle detection · ID-23 a stale
  reference to an absorbed account still lands on the survivor.
- ID-12 / ID-19 the verification gate · ID-21 consent stays put.
- ID-10 one Person across two devices · ID-11 a *different* chart is kept.
- ID-06 the raw cookie value is never persisted.

`tests/pjos/schema-invariants.spec.ts` — 12 tests, and worth explaining.
`prisma validate` and `prisma format` both need an engine binary from
`binaries.prisma.sh`, which is unreachable here (the same TLS block that fails
`prisma generate` in postinstall). **A schema edit can currently reach a branch
with nobody having checked that it parses.** These tests check the class of
mistake that is easy to make by hand — a relation with no opposite side, a
named relation with the wrong number of ends, a reference to a model that does
not exist — plus the V42 invariants a well-meaning future edit could undo
(PS-06 credentials must not go back on the account, PS-10 no raw token field,
PS-11 nothing cascades into deleting a Person). Verified non-vacuous by
deleting a back-relation and watching PS-03 fail.

## 7. Applying the schema

There is no `prisma/migrations` directory; this repo uses `prisma db push`.
Run it from an environment with network access:

```bash
npx prisma db push && npx prisma generate
```

**Data note.** PJOS is currently schema-only — `grep` finds no code that reads
or writes any `Pjos*` table, so there should be no rows and `db push` is safe.
If any `PjosAccount` rows do exist in an environment, back-fill before pushing,
because the drop of `authChannel`/`authSubject` is destructive:

```sql
INSERT INTO "PjosAuthIdentity" (id, "accountId", channel, subject, "verifiedAt", "createdAt")
SELECT gen_random_uuid(), id, "authChannel", "authSubject", now(), "createdAt"
FROM "PjosAccount";
```

## 8. Not done yet

- **HTTP routes.** `POST /api/pjos/session` (begin + record birth details) and
  `POST /api/pjos/claim` (verify OTP, claim). These need the OTP transport
  decision — the repo already has an `OtpVerification` model and a WhatsApp-
  first audience.
- **Cookie plumbing.** Signed, `HttpOnly`, `SameSite=Lax`; the service already
  takes only the SHA-256, so the route owns the raw value and nothing else
  sees it.
- **Reconciling `AstrologyCustomerProfile`.** Decided: PJOS is canonical, and
  that model becomes an adapter for the existing consultation flow. Both
  models still exist today.
- **Rate limiting on claim**, reusing the limiter already on the render route.
