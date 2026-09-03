# MISSION: COSMICTANTRA — REFERENCE-GRADE JYOTISHA ENGINE

You are acting as:

- Principal astronomical software engineer
- Senior TypeScript/backend architect
- Computational Jyotisha systems engineer
- Verification and test engineer
- Classical-source data architect
- Security/reliability engineer
- Product infrastructure engineer

You are working inside an EXISTING CosmicTantra codebase.

THIS IS NOT A GREENFIELD REWRITE.

Your first responsibility is to discover, preserve, test and qualify what already exists.

Do not replace working systems merely because you prefer another architecture.

Do not manufacture missing Jyotisha rules.
Do not invent classical citations.
Do not use an LLM as a calculator.
Do not silently change astronomical conventions.
Do not silently combine different Jyotisha traditions.
Do not call an internally computed result "validated".
Do not create fake precision, confidence percentages or predictions.

The goal is not maximum feature count.

The goal is:

              TRUSTWORTHY COMPUTATIONAL JYOTISHA

============================================================
0. NORTH STAR
============================================================

Build CosmicTantra into a reference-grade Jyotisha computation,
evidence and practitioner-support engine.

A consequential output should ultimately be traceable through:

USER ANSWER
   ↓
INTERPRETATION
   ↓
TRADITIONAL RULE
   ↓
ACTIVATION / DASHA / GOCHARA
   ↓
YOGA / BHAVA / GRAHA RELATIONSHIP
   ↓
PLANETARY CONDITION
   ↓
SIDEREAL COORDINATE
   ↓
ASTRONOMICAL COORDINATE
   ↓
EPHEMERIS PROVIDER
   ↓
BIRTH / EVENT INPUT

A user, Pandit or auditor should be able to ask:

"WHY?"

and continue drilling down until reaching the underlying
calculation, convention, rule and source.

============================================================
1. PRODUCT INVARIANTS
============================================================

Create these as explicit engineering invariants.

CT_INV_001 — CALCULATION BEFORE INTERPRETATION

No LLM may calculate planetary positions, houses, Vargas,
Panchanga, Dasha boundaries, Shadbala, Ashtakavarga or
other deterministic quantities.

CT_INV_002 — EVIDENCE BEFORE CLAIM

Every consequential statement must have machine-readable
evidence.

CT_INV_003 — NO SILENT TRADITION MIXING

Parashari, Jaimini, KP, Tajika and other systems must remain
explicitly separated unless a documented synthesis explicitly
combines them.

CT_INV_004 — DECLARED CONVENTIONS

Every chart declares relevant conventions including:

ayanamsha
node model
house model
ephemeris
coordinate mode
timezone source
calendar
sunrise convention
Dasha convention
Varga convention

CT_INV_005 — VALIDATION STATUS

Every capability must be assigned:

IMPLEMENTED
INTERNALLY_VERIFIED
EXTERNALLY_VERIFIED
SCHOLAR_VERIFIED

Only sufficiently qualified capabilities may feed authoritative
reports.

CT_INV_006 — FAIL CLOSED

If a required calculation fails or is unvalidated, return:

NOT_CALCULATED
VALIDATION_PENDING
REFERENCE_DIVERGENCE
SCHOLAR_JUDGEMENT_REQUIRED

Never fabricate a replacement.

CT_INV_007 — DETERMINISTIC CORE

Identical normalized input + calculation version + convention
set must produce identical deterministic output.

CT_INV_008 — VERSION EVERYTHING

Version:

calculation engine
rule engine
rule definitions
ephemeris provider
ayanamsha
Varga implementation
Dasha implementation
source registry
interpretation templates
report schema

CT_INV_009 — INTERPRETATION ≠ FACT

Maintain explicit distinction between:

CALCULATED_FACT
DERIVED_FACT
TRADITIONAL_RULE
READING
REFLECTION
NOT_CALCULATED
VALIDATION_PENDING

CT_INV_010 — NO FAKE PROBABILITY

Never transform traditional agreement or evidence coverage
into fabricated probabilities.

"3 of 4 registered traditions support this interpretation"

is acceptable.

"75% chance this Yoga will produce wealth"

is not.

============================================================
2. PHASE ZERO — FORENSIC DISCOVERY
============================================================

DO NOT IMPLEMENT NEW FEATURES FIRST.

Perform a complete forensic audit of the existing repository.

Find every implementation related to:

astronomical calculations
Swiss Ephemeris
planetary coordinates
ayanamsha
Lagna
houses
nodes
Panchanga
Nakshatra
Tithi
Karana
Yoga
Vara
Paksha
months
Vargas
D1
D9
D10
Shadbala
Bhava Bala
Ashtakavarga
Vimshottari
Antardasha
Pratyantardasha
graha dignity
combustion
retrogression
aspects
functional lordship
Yoga detection
Dosha detection
Manglik
Sade Sati
Gochara
career synthesis
evidence/provenance
report generation
Scholar report
AI interpretation

For every capability produce:

STATUS
IMPLEMENTATION LOCATION
INPUTS
OUTPUTS
CONVENTIONS
TEST COVERAGE
DEPENDENCIES
VALIDATION STATUS
KNOWN LIMITATIONS
REPORT EXPOSURE
INTERPRETATION EXPOSURE

Create:

docs/reference-grade/
    00-existing-system-inventory.md
    01-capability-matrix.md
    02-validation-gap-analysis.md
    03-convention-registry.md
    04-risk-register.md

Do not duplicate an existing engine.

============================================================
3. CANONICAL CHART MODEL
============================================================

Establish or strengthen one canonical immutable chart model.

Example conceptual structure:

Chart
 ├── metadata
 ├── input
 ├── normalizedInput
 ├── astronomy
 ├── coordinates
 ├── grahas
 ├── lagna
 ├── bhavas
 ├── panchanga
 ├── vargas
 ├── dashas
 ├── strengths
 ├── ashtakavarga
 ├── relationships
 ├── yogas
 ├── doshas
 ├── transits
 ├── derivedFacts
 ├── traditionalRules
 ├── evidence
 └── validation

Never allow report/UI code to independently recalculate
Jyotisha facts.

There must be one canonical truth pipeline.

============================================================
4. ASTRONOMY PROVIDER ABSTRACTION
============================================================

Create/verify:

AstronomyProvider

with replaceable implementations.

Target architecture:

SwissEphemerisProvider
JplReferenceProvider
FixtureProvider

Do NOT reverse-engineer proprietary Swiss Ephemeris
implementation.

If an independent astronomical provider is built, derive it
cleanly from public scientific standards and legally usable
JPL/NASA data/documentation.

Swiss may remain the production/reference provider.

The architecture must allow independent verification.

============================================================
5. MASS ASTRONOMICAL QUALIFICATION
============================================================

Build a deterministic qualification harness.

Generate at least:

100,000 reproducible test scenarios

covering:

1900–2100 minimum certified period
different latitudes
different longitudes
different timezones
DST boundaries
midnight boundaries
date boundaries
sign boundaries
Nakshatra boundaries
high latitudes
India-specific cases
historical timezone cases
leap years
node edge cases

Compare supported astronomical outputs against trusted
references.

Test:

Sun
Moon
Mercury
Venus
Mars
Jupiter
Saturn
Rahu
Ketu
Ascendant
MC

Define explicit tolerances.

Never hide discrepancies through rounding.

Generate:

qualification/astronomy-summary.json
qualification/astronomy-failures.json
qualification/astronomy-statistics.json
docs/reference-grade/astronomy-certification.md

Any unexplained divergence above tolerance blocks
qualification.

============================================================
6. PANCHANGA CERTIFICATION
============================================================

Certify:

Tithi
Nakshatra
Pada
Yoga
Karana
Vara
Paksha
sunrise
sunset
Amanta month

Implement/validate Purnimanta separately.

Then:

Rahu Kaal
Yamaganda
Gulika
Abhijit Muhurta
Hora
Choghadiya

where the adopted tradition and algorithm are explicitly
documented.

Boundary times are critical.

Do not merely compare labels.

Verify transition timestamps.

============================================================
7. VARGA ENGINE
============================================================

Build/validate a generic divisional-chart framework.

Target:

D1
D2
D3
D4
D7
D9
D10
D12
D16
D20
D24
D27
D30
D40
D45
D60

For every Varga create:

rule definition
mapping implementation
boundary fixtures
independent test implementation
reference comparison
validation status

Do not allow an unvalidated Varga to influence authoritative
interpretation.

D10 currently under internal verification must be handled
according to existing project evidence rather than assumed
valid.

============================================================
8. VIMSHOTTARI / TIME ENGINE
============================================================

Fully qualify Vimshottari.

Required hierarchy:

Mahadasha
Antardasha
Pratyantardasha

Design extensibly for deeper subdivisions without forcing
them into the public product.

Test:

birth Nakshatra
balance at birth
exact period boundaries
period nesting
boundary timestamps
long-range consistency

Freeze benchmark fixtures.

Only after Vimshottari is qualified consider additional
Dasha systems.

Do NOT combine multiple Dasha systems into one score.

============================================================
9. GOCHARA ENGINE
============================================================

Build a first-class transit engine.

A transit query MUST contain an explicit:

reference timestamp
timezone
location when relevant
ayanamsha
node convention

Calculate:

current grahas
transit Rashi
transit Nakshatra
transit-to-natal relationships
Parashari transit aspects
Saturn transit
Jupiter transit
Rahu/Ketu transit

Implement Sade Sati properly as a transit phenomenon.

Do not infer current Sade Sati merely from natal
Saturn/Moon positions.

Provide:

period start
phase transitions
period end
calculation evidence
adopted definition

If implementing Dhaiya/Kantaka/etc., maintain explicit
tradition definitions.

============================================================
10. SHADBALA ENGINE
============================================================

Audit the existing Shadbala implementation before changing
anything.

Validate all six major components and their relevant
subcomponents:

Sthana Bala
Dig Bala
Kala Bala
Cheshta Bala
Naisargika Bala
Drik Bala

Expose:

raw components
normalized values
units
required minimums if tradition defines them
source
calculation trace
validation state

Do not expose a synthetic "planet score" unless mathematically
and traditionally justified.

============================================================
11. BHAVA BALA
============================================================

Audit and externally validate existing Bhava Bala computation.

Every component must be inspectable.

Never let an unvalidated Bhava Bala silently feed:

career score
wealth score
relationship score
health score
or similar synthetic UX gauges.

============================================================
12. ASHTAKAVARGA
============================================================

Audit the existing implementation.

Validate:

Bhinna Ashtakavarga
Sarvashtakavarga
Prastara where supported
Trikona Shodhana
Ekadhipatya Shodhana
Pinda calculations where adopted

Maintain explicit provenance.

No Life Gauge or predictive score may claim to use
Ashtakavarga until the underlying implementation is
externally qualified.

============================================================
13. GRAHA CONDITION ENGINE
============================================================

Create/strengthen structured conditions for:

Rashi dignity
own sign
exaltation
debilitation
Moolatrikona
friend/enemy/neutral relationships
retrogression
combustion
planetary conjunction
graha aspects
functional lordship

Each condition must expose:

rule
inputs
result
adopted threshold
source
alternative thresholds where traditions disagree

Especially for combustion:

DO NOT pretend one orb is universally accepted.

============================================================
14. CLASSICAL RULE REGISTRY
============================================================

This becomes one of CosmicTantra's core assets.

Create structured rule objects.

Example:

Rule {
  id
  SanskritName
  EnglishName
  category
  tradition
  source
  sourceLocator
  sourceVerification
  originalText
  translation
  adoptedInterpretation
  alternateInterpretations[]
  prerequisites[]
  evaluator
  evidencePaths[]
  validationStatus
  scholarReviews[]
  version
}

Never invent source locators.

Allowed source statuses:

SOURCE_VERIFIED
SOURCE_SECONDARY
ATTRIBUTION_UNVERIFIED
SOURCE_PENDING

============================================================
15. YOGA ENGINE
============================================================

Preserve current registered rules.

Expand carefully toward a curated set of approximately
100 HIGH-VALUE rules rather than thousands of low-quality
internet rules.

Categories may include:

Sun/Mercury combinations
Moon/Jupiter relationships
Moon/Mars relationships
Pancha Mahapurusha
Dhana
Raja
Dharma/Karma
Viparita
Neecha Bhanga
Parivartana
Lagna-related
Moon-related
career-related
wealth-related
spirituality-related

Existence and strength MUST remain separate concepts.

Example:

Yoga existence: PRESENT
Strength: SCHOLAR_JUDGEMENT_REQUIRED

is valid.

============================================================
16. DOSHA ENGINE
============================================================

Represent Doshas using the same disciplined architecture.

Start with major commonly requested systems.

Manglik:
- detection reference
- house rule
- alternate traditions
- cancellation rules
- severity only when justified

Kalsarpa:
do not expose until definition and variants are formally
registered.

Sade Sati:
belongs primarily to transit/time computation.

Never use fear-oriented language.

============================================================
17. TRADITION CONSENSUS ENGINE
============================================================

Build the ability to represent disagreement.

Example:

RULE RESULT

Tradition A: PRESENT
Tradition B: PRESENT
Tradition C: NOT PRESENT
Tradition D: PRESENT

Output:

Traditional agreement:
3/4 registered interpretations recognize this condition.

Never convert this to:

75% probability.

Consensus measures rule agreement, not destiny.

============================================================
18. COSMICTANTRA EVIDENCE GRAPH
============================================================

Every consequential conclusion gets an evidence node.

Example:

career.statement.001
  ↓
dashaActivation.jupiterSaturn
  ↓
natal.jupiter.house
  ↓
graha.jupiter.longitude
  ↓
astronomyProvider
  ↓
normalizedBirthInput

Evidence nodes should support:

WHY?
SHOW CALCULATION
SHOW RULE
SHOW SOURCE
SHOW ALTERNATIVE TRADITION
SHOW VALIDATION STATUS

Implement an API capable of traversing this graph.

============================================================
19. SCHOLAR REVIEW SYSTEM
============================================================

Create a practitioner review layer.

A qualified Pandit can inspect a rule/result and record:

AGREE
DISAGREE
PARTIALLY_AGREE
ALTERNATIVE_INTERPRETATION
INSUFFICIENT_EVIDENCE

Record:

reviewer ID
timestamp
rule version
chart version
commentary
source/reference if supplied

Never overwrite computational truth with practitioner
opinion.

Store both.

============================================================
20. GOLDEN CHART CORPUS
============================================================

Create a permanent regression corpus.

Start with at least:

100 charts

designed to cover:

ordinary cases
sign boundaries
Nakshatra boundaries
Varga boundaries
Dasha boundaries
combustion edges
retrograde cases
unusual latitude
timezone complexity
Yoga examples
Dosha examples

Include the founder's already reviewed chart only as ONE
regression fixture, never as proof that the engine works
generally.

Each Golden Chart stores:

input
normalized input
expected astronomical facts
expected derived facts
source/reference
tolerance
validation state

============================================================
21. INDEPENDENT IMPLEMENTATION TESTS
============================================================

For especially consequential algorithms, build a small
independent reference implementation that does not call the
production function.

Examples:

Varga mapping
Vimshottari period boundaries
Rashi mapping
Nakshatra/Pada
Tithi
aspect relationships

Production implementation and independent implementation
must agree.

This protects against circular testing.

============================================================
22. ADVERSARIAL ASTROLOGY TESTING
============================================================

Create deliberately hostile test cases:

exact sign transition
exact Nakshatra transition
birth around midnight
DST transition
leap day
extreme longitude
extreme latitude
Moon near Tithi boundary
Varga boundary
Dasha boundary
planet exactly at combustion threshold
Rahu/Ketu convention changes
ayanamsha changes

The engine must either produce the correct answer or explicitly
state why it cannot.

============================================================
23. AI FIREWALL
============================================================

The conversational AI receives structured facts.

It may:

explain
translate
summarize
ask clarifying questions
compare registered traditions
prepare questions for a Pandit

It may NOT invent:

planet positions
houses
Dashas
Yogas
Doshas
transits
Panchanga
Muhurtas
Shadbala
Ashtakavarga
classical quotations
source citations

Create runtime guards.

If evidence is unavailable:

"I don't have a verified calculation for that yet."

is superior to hallucination.

============================================================
24. ANSWER CONTRACT
============================================================

Every astrology answer should internally carry:

answer
claimType
evidence[]
calculationVersion
ruleVersions[]
tradition
validationStatus
limitations[]
scholarJudgementRequired
generatedAt
referenceTime if time-sensitive

UI does not need to display all metadata initially.

The backend MUST retain it.

============================================================
25. "WHY?" UX
============================================================

Build an inspectable explanation interaction.

Example:

"You are currently in Jupiter–Saturn."

[Why?]

→ Moon Nakshatra at birth
→ balance calculation
→ Mahadasha sequence
→ Antardasha calculation
→ exact dates

[Show calculation]

[Ask Pandit]

This UX should become a signature CosmicTantra capability.

============================================================
26. SCHOLAR REPORT 2.0
============================================================

Upgrade the current report rather than replacing it.

Fix known conceptual contradictions.

In particular:

Do not expose synthetic Life Gauge scores derived from
unvalidated Shadbala/Bhava Bala/Ashtakavarga.

Do not label Manglik severity authoritatively when
cancellation traditions remain incomplete.

Do not call a natal Saturn/Moon positional check "current
Sade Sati."

Clearly distinguish:

Natal
Dasha
Transit
Traditional rule
Interpretation
Scholar judgement

Every section receives a validation badge.

============================================================
27. BIRTH-TIME SENSITIVITY
============================================================

Do NOT use generic claims such as:

"Lagna changes one degree every four minutes."

Calculate actual chart sensitivity.

Provide configurable simulations:

-2 minutes
+2 minutes
-5 minutes
+5 minutes
-10 minutes
+10 minutes

Report changes to:

Ascendant
Bhava boundaries
Vargas
Nakshatra/Pada if relevant
Dasha balance
sensitive conclusions

This becomes a proper birth-time confidence tool.

============================================================
28. OBSERVABILITY
============================================================

Every calculation request should record:

request ID
normalized input fingerprint
engine version
provider
convention set
calculation duration
warnings
divergence flags
validation state

Never log unnecessarily sensitive user information.

============================================================
29. PERFORMANCE
============================================================

Do not sacrifice correctness for premature optimization.

But benchmark:

single Kundli
Scholar report
Panchanga day
30-day Panchanga
transit query
Dasha timeline

Cache deterministic calculations by canonical fingerprint.

============================================================
30. SECURITY
============================================================

Treat birth information and consultation information as
personal user data.

Implement:

least privilege
encrypted transport
appropriate encryption at rest
audit trails
separation of practitioner/client access
safe logs
deletion/export mechanisms

AI providers should receive only information actually required
for the requested explanation.

============================================================
31. QUALIFICATION DASHBOARD
============================================================

Build an internal page:

/admin/engine-qualification

Show:

ASTRONOMY
D1
D9
D10
VARGAS
PANCHANGA
VIMSHOTTARI
GOCHARA
SHADBALA
BHAVA_BALA
ASHTAKAVARGA
GRAHA_CONDITIONS
YOGAS
DOSHAS
SOURCE_REGISTRY

For each:

IMPLEMENTED
INTERNALLY VERIFIED
EXTERNALLY VERIFIED
SCHOLAR VERIFIED

plus:

tests
pass rate
known divergences
last validation
engine version
blocking issues

This dashboard is internal truth.

Marketing claims must never exceed it.

============================================================
32. COMPETITOR BENCHMARK HARNESS
============================================================

Do not scrape or copy proprietary algorithms.

Create a manual/reference comparison framework.

For legally obtained comparison outputs from established
astrology products, record:

same birth input
same declared convention where possible
planet positions
Lagna
Nakshatra
Vargas
Dasha
Panchanga
Shadbala
Ashtakavarga
Yoga results

Classify differences:

ROUNDING
CONVENTION_DIFFERENCE
TRADITION_DIFFERENCE
REFERENCE_DIFFERENCE
COSMICTANTRA_DEFECT
COMPETITOR_DIFFERENCE
UNRESOLVED

Never assume the competitor is correct merely because it
disagrees.

============================================================
33. PUBLIC TRUST PAGE
============================================================

Prepare architecture for a public:

/how-cosmictantra-calculates

page.

Eventually it should explain:

astronomical source
ayanamsha
node convention
Dasha methodology
rule provenance
validation process
Pandit review process
version history
known limitations

Do not reveal secrets unnecessarily.

Reveal enough methodology to establish credibility.

============================================================
34. PUBLIC VERIFICATION MODE
============================================================

Design a potentially powerful acquisition tool:

"VERIFY MY KUNDLI"

A user enters birth details.

CosmicTantra calculates:

Lagna
Rashi
Nakshatra
planetary positions
Dasha

Then allows comparison against another Kundli.

If different:

CosmicTantra explains likely reasons:

ayanamsha
node model
birth-time difference
timezone
house convention
rounding
calculation error
unknown

Do NOT automatically claim CosmicTantra is correct.

This could become a major trust/SEO feature.

============================================================
35. ENGINE BENCHMARK PAGE
============================================================

Eventually expose sanitized qualification statistics:

X astronomical test cases
Y Golden Charts
Z verified rule definitions
N practitioner reviews
engine version
certified date range

ONLY publish numbers actually generated by the qualification
pipeline.

Never fabricate benchmark results.

============================================================
36. COMMERCIAL ARCHITECTURE
============================================================

Keep engine independent from applications.

Target:

                  COSMICTANTRA ENGINE
                         |
       --------------------------------------
       |             |            |          |
    KUNDLI       PANCHANGA    KASHI       SCHOLAR
                              SAHAYAK       CONSOLE
       |             |            |          |
       --------------------------------------
                         |
                   GUIDANCE LAYER
                         |
              ------------------------
              |                      |
           PANDIT                 DARSHAN
              |                      |
        CONSULTATION              TEMPLES
                                     |
                               PUJA BOOKING
                                     |
                              PRASAD/FULFILMENT

Do not put marketplace logic inside astronomical computation.

============================================================
37. API-FIRST ENGINE
============================================================

The core should eventually support stable APIs such as:

POST /engine/chart
POST /engine/panchanga
POST /engine/dasha
POST /engine/transit
POST /engine/compare
GET  /engine/evidence/:id
GET  /engine/rules/:id

Internally separate:

calculation
derived intelligence
traditional rules
interpretation
presentation

This makes future:

web
mobile
Pandit console
temple system
voice assistant
external API

all consume the same truth.

============================================================
38. ENGINE RELEASE STANDARD
============================================================

Do NOT declare REFERENCE-GRADE until all mandatory gates pass.

Target minimum:

100,000 astronomy test cases
100 Golden Charts
D1 externally verified
D9 externally verified
D10 externally verified
core Vargas externally verified
Vimshottari externally verified
Panchanga externally verified
Gochara externally verified
Shadbala externally verified
Bhava Bala externally verified
Ashtakavarga externally verified
100 high-value traditional rules
source status attached to every rule
no unresolved critical calculation defects
no authoritative output depending on validation-pending data
Pandit review completed on agreed benchmark set

============================================================
39. RELEASE ARTIFACT
============================================================

Generate:

COSMICTANTRA_REFERENCE_GRADE_REPORT.md

containing:

1. Executive summary
2. Existing architecture preserved
3. New architecture introduced
4. Calculation coverage
5. Convention registry
6. Test statistics
7. Reference comparison
8. Known divergences
9. Golden Chart results
10. Scholar validation
11. Source registry coverage
12. Security review
13. Performance benchmarks
14. Remaining limitations
15. Exact supported claims
16. Exact unsupported claims
17. Release recommendation

============================================================
40. MARKETING CLAIM FIREWALL
============================================================

At completion explicitly output:

SAFE_TO_CLAIM:
...

NOT_SAFE_TO_CLAIM:
...

Examples of acceptable future claims IF VERIFIED:

"100,000 automated astronomical reference checks passed."

"Every interpretation can be traced to its underlying
calculation and registered rule."

"CosmicTantra distinguishes calculation from traditional
interpretation."

"Reviewed with practicing Jyotish scholars."

Potentially unacceptable claims:

"World's most accurate astrology."

"Scientifically proven astrology."

"Predicts your future accurately."

"Better than every astrologer."

"100% accurate."

Do not allow engineering achievements to become deceptive
marketing.

============================================================
41. EXECUTION STRATEGY
============================================================

DO NOT attempt all 40 sections in one uncontrolled rewrite.

Execute sequentially:

SPRINT A
Forensic inventory + capability matrix

SPRINT B
Qualification framework + convention registry

SPRINT C
Astronomy mass verification

SPRINT D
D1/D9/D10 + Varga certification

SPRINT E
Vimshottari + Panchanga certification

SPRINT F
Shadbala + Bhava Bala + Ashtakavarga validation

SPRINT G
Gochara + correct Sade Sati

SPRINT H
Classical Rule Registry + source provenance

SPRINT I
Yoga/Dosha expansion

SPRINT J
Evidence Graph + WHY UX

SPRINT K
Scholar Console + practitioner verification

SPRINT L
Golden Corpus + adversarial qualification

SPRINT M
Scholar Report 2.0

SPRINT N
Public verification/trust architecture

After EACH sprint:

run full regression suite
run type checking
run lint
run relevant qualification suites
record changed files
record tests added
record assumptions
record unresolved problems

Never proceed through a failing critical gate.

============================================================
42. FIRST COMMAND
============================================================

START NOW WITH SPRINT A ONLY.

Do not begin implementing missing astrology features.

Inspect the repository.

Produce:

1. exact existing capability inventory
2. architecture map
3. calculation dependency graph
4. existing validation map
5. convention map
6. test coverage map
7. technical debt/risk map
8. gap against REFERENCE-GRADE target

Then propose the smallest safe implementation plan for
SPRINT B.

I will approve or modify the plan before major architecture
changes.

============================================================
43. FINAL PHILOSOPHY
============================================================

CosmicTantra does not win by producing more predictions.

It wins by making computational Jyotisha inspectable.

ASTRONOMY MUST BE COMPUTED.
JYOTISHA MUST BE EXPLICIT.
TRADITION MUST BE ATTRIBUTED.
DISAGREEMENT MUST BE PRESERVED.
AI MUST EXPLAIN, NOT INVENT.
PANDITS MUST BE EMPOWERED, NOT REPLACED.
UNCERTAINTY MUST BE VISIBLE.
EVERY IMPORTANT CLAIM MUST ANSWER:

                  "WHY?"
