# Source verification — what is cited, and what that citation is worth

This document states, for every traditional rule this product evaluates, what
is claimed about its source and how much of that claim has been verified.

**The short version: no locator in this product has been verified against a
licensed edition, because this repository holds no licensed edition.** Every
citation below is a provenance claim pending verification. A citation is not
evidence that the implementation is correct.

Registry version: `jyotish-source-registry-v1`. Enforced by
`tests/kundli-pipeline/source-verification.spec.ts`, which fails if any entry
is quietly upgraded.

---

## 1. What one registry entry contains

| Field | Meaning | Authoritative? |
|---|---|---|
| `ruleId` | The engine rule this describes | Yes |
| `sourceWork` | The classical work the rule is drawn from, as commonly attributed | Attribution only — not verified here |
| `locator` | Chapter, verse or other precise location | **No** — every entry reads `NOT VERIFIED` |
| `editionOrTranslation` | The edition the locator refers to | **No** — every entry reads `none` |
| `verifiedInRepository` | Whether a licensed copy is in this repo | Yes, and `false` everywhere |
| `locatorVerified` | Whether the locator was checked against that copy | Yes, and `false` everywhere |
| `scholarlyAgreement` | `GENERAL`, `CONTESTED` or `UNVERIFIED` | Yes — a claim about the literature, not a verification |
| `adoptedInterpretation` | The exact rule the code implements | **Yes — this is the authoritative field** |
| `variants` | Readings this implementation did **not** adopt | Yes |
| `limitations` | What this rule does not do, and what is disputed | Yes |
| `adoption` | `ADOPTED` or `NOT_ADOPTED` | Yes |

Only one field describes what the product actually does:
`adoptedInterpretation`. Everything else is provenance or disclosure. When
reading a citation in a delivered report, that is the field that matters.

---

## 2. The registry

Every rule the engine evaluates has an entry, and every entry corresponds to a
rule the engine evaluates. Both directions are asserted by test.

| Rule | Attributed to | Agreement | Adoption | Limitations recorded |
|---|---|---|---|---|
| `YOGA_GAJA_KESARI` | Gaja-Kesari Yoga | GENERAL | ADOPTED | 2 |
| `YOGA_BUDHADITYA` | Budhaditya Yoga | GENERAL | ADOPTED | 2 |
| `YOGA_CHANDRA_MANGALA` | Chandra-Mangala Yoga | CONTESTED | ADOPTED | 2 |
| `YOGA_DHARMA_KARMA_ADHIPATI` | Dharma-Karmadhipati Raja Yoga | CONTESTED | ADOPTED | 3 |
| `YOGA_DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA` | Dharma-Karmadhipati Raja Yoga, mutual-kendra variant | CONTESTED | NOT_ADOPTED | 2 |
| `YOGA_RUCHAKA` | Pancha Mahapurusha yogas | GENERAL | ADOPTED | 2 |
| `YOGA_HAMSA` | Pancha Mahapurusha yogas | GENERAL | ADOPTED | 2 |
| `YOGA_MALAVYA` | Pancha Mahapurusha yogas | GENERAL | ADOPTED | 2 |
| `YOGA_SASA` | Pancha Mahapurusha yogas | GENERAL | ADOPTED | 2 |
| `YOGA_BHADRA` | Pancha Mahapurusha yogas | CONTESTED | ADOPTED | 2 |
| `YOGA_KEMADRUMA` | Kemadruma Yoga | CONTESTED | NOT_ADOPTED | 2 |

Eleven rules. Five are recorded as contested in the literature. Two are
registered as **not adopted** — the engine computes their conditions as
evidence but reports `NOT_CALCULATED`, never `PRESENT` or `ABSENT`, because
the repository holds nothing that could settle the disagreement.

---

## 3. What is verified, and what is not

**Verified — that is, checked here by this repository's own tests:**

- Every rule the engine evaluates is registered.
- `adoptedInterpretation` matches what the engine actually computes; this is
  what the existence-only yoga contract makes testable.
- Rules registered as not adopted never surface as `PRESENT` or `ABSENT`.
- Contested entries disclose that they are contested, in their own text.
- No entry claims a locator has been verified, and none claims a licensed
  edition exists here.

**Not verified — and not claimed to be:**

- **Every chapter-and-verse locator.** No edition is held, so none can be
  checked. A locator in a delivered report tells a reader where a rule is
  commonly said to come from. It does not certify that it does.
- **Attribution of any rule to a specific work.** `sourceWork` records the
  common attribution, using hedged language throughout.
- **`scholarlyAgreement`.** This states whether a reading is generally
  accepted or contested as understood by those who wrote the entries. It is
  not the result of a literature survey.
- **Completeness of the rule set.** Eleven rules are implemented. The classical
  corpus describes far more. This is a subset, not a survey.

---

## 4. The rule for changing a status

A status may be upgraded only when the thing it asserts has happened.

| Status | May become `true` only when |
|---|---|
| `verifiedInRepository` | A licensed edition or translation is committed to this repository |
| `locatorVerified` | That edition is in the repository **and** the locator has been checked against it by a named person, with the check recorded |

`set verifiedInRepository: true` because someone says a rule is well known, or
because a citation appears in a book, is falsification. The test suite blocks
it: `no entry claims its locator has been verified` fails the moment either
flag is set while no edition is held.

Upgrading a status is therefore a two-step change, never a one-step one:

1. Add the edition to the repository, with its licence recorded.
2. Have a named person check the locator against it, then change the flag and
   the test together, in one commit, naming the person and the edition.

Until then, the honest state is the current one: unverified, disclosed, and
stated as such everywhere a reader might rely on it.

---

## 5. Contested entries

Five rules are recorded as contested. Each now states, in its own limitations,
what the disagreement is and which side this implementation took — so a reader
is told the rule is disputed even if they never open this document.

| Rule | The disagreement | What this product does |
|---|---|---|
| `YOGA_CHANDRA_MANGALA` | Whether mutual aspect suffices, and whether an orb applies instead of same-sign occupancy | Implements same-sign conjunction only; states that another reading would report it where this reports absent |
| `YOGA_DHARMA_KARMA_ADHIPATI` | Whether mutual kendra alone qualifies, or conjunction/parivartana is required | Adopts the narrower conjunction-or-parivartana reading; registers the mutual-kendra variant separately |
| `YOGA_DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA` | Many popular sources accept it; other schools require more | Not adopted — reports `NOT_CALCULATED`, publishes the computed evidence so a scholar can adjudicate |
| `YOGA_BHADRA` | Mercury's exaltation sign, and whether combustion must be absent | Implements Virgo exaltation and applies no combustion rule; names both as reasons another source would differ |
| `YOGA_KEMADRUMA` | Whether the Sun, Rahu or Ketu neutralise it, and whether a kendra Moon cancels it | Not adopted — reports `NOT_CALCULATED` rather than choosing a side |

These five disclosures did not exist before this pass: the entries were marked
`CONTESTED` in their metadata but never said so in the text a reader sees. The
test that requires a contested entry to say it is contested found four of
them. That is the argument for testing the registry rather than trusting it.

---

## 6. What a delivered report says about this

Every interpretation in the Scholar Summary carries four things, one of which
is the source-registry entry. The certificate states separately which source
locators are unverified. So a reader who reads only the summary still
encounters the fact that the citation behind an interpretation has not been
checked against an edition.

What a report must never do:

- Present a citation as proof that an interpretation is correct.
- Upgrade a locator's status in the copy without upgrading the registry.
- Report a rule that is registered as not adopted as `PRESENT` or `ABSENT`.
- State or imply that a contested reading is settled.

---

## 7. What genuine scholarly verification would require

Recorded so it is not confused with what has been done:

1. Acquire licensed editions of the works cited, or replace citations with
   ones this repository actually holds.
2. Have a qualified reader check each locator against its edition and record
   the check: who, which edition, which page.
3. Reconcile `adoptedInterpretation` against the checked text, and correct the
   code where they disagree — not the other way round.
4. Re-examine `scholarlyAgreement` per rule against the literature, and record
   the basis for each judgement.
5. Only then set the two verification flags, per entry, with the evidence
   recorded.

None of that has happened. Every entry remains unverified, and the product
says so in every report it delivers.
