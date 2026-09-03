/**
 * YOGA SOURCE REGISTRY (versioned)
 *
 * Every yoga rule in `yogaEngine.ts` must have an entry here. The registry
 * records the classical source a rule is drawn from, the precise locator,
 * the exact interpretation this implementation adopted, the interpretive
 * variants it did NOT adopt, and its limitations.
 *
 * HONESTY NOTE — read before trusting any citation field:
 * this repository contains NO licensed Jyotish source text. No chapter or
 * verse locator below has been checked against an edition we hold. Every
 * entry therefore carries `verifiedInRepository: false` and
 * `locatorVerified: false`, and `scholarlyAgreement` states whether the
 * interpretation is generally accepted or contested. The only field that is
 * authoritative is `adoptedInterpretation` — it describes exactly what the
 * code does. Citations are provenance claims pending verification against a
 * licensed edition; they are not evidence that the implementation is
 * correct.
 *
 * A rule whose interpretation is contested and not adopted is registered
 * with `adoption: 'NOT_ADOPTED'` and evaluates to NOT_CALCULATED rather
 * than claiming PRESENT or ABSENT.
 */

export const YOGA_SOURCE_REGISTRY_VERSION = 'jyotish-source-registry-v2 (sprint I expansion)';

export type Adoption = 'ADOPTED' | 'NOT_ADOPTED';
export type ScholarlyAgreement = 'GENERAL' | 'CONTESTED' | 'UNVERIFIED';

export interface YogaSourceEntry {
  ruleId: string;
  /** Classical work the rule is drawn from (as commonly attributed). */
  sourceWork: string;
  /** Chapter/verse or other precise locator. */
  locator: string;
  /** Edition or translation this locator refers to, if any. */
  editionOrTranslation: string;
  /** True only when a licensed copy exists in this repository. */
  verifiedInRepository: boolean;
  /** True only when the locator has been checked against that copy. */
  locatorVerified: boolean;
  scholarlyAgreement: ScholarlyAgreement;
  /** The exact rule the code implements. This is the authoritative field. */
  adoptedInterpretation: string;
  /** Interpretive variants this implementation does NOT apply. */
  variants: string[];
  limitations: string[];
  adoption: Adoption;
}

const NOT_VERIFIED_LOCATOR =
  'NOT VERIFIED — no licensed edition exists in this repository; locator pending verification.';
const NO_EDITION = 'none — no licensed edition or translation is held in this repository';

export const YOGA_SOURCE_REGISTRY: Record<string, YogaSourceEntry> = {
  YOGA_GAJA_KESARI: {
    ruleId: 'YOGA_GAJA_KESARI',
    sourceWork: 'Gaja-Kesari Yoga — commonly attributed to the classical yoga corpus (widely cited in Brihat Parashara Hora Shastra commentaries); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: Jupiter occupies a kendra (1st, 4th, 7th or 10th) counted from the Moon, i.e. the bhava offset from Moon to Jupiter is 0, 3, 6 or 9. No other condition is applied.',
    variants: [
      'Some schools additionally require Jupiter to be free from debilitation or combustion for the yoga to be counted at all.',
      'Some schools count the kendra from the lagna as well as from the Moon.',
      'Some schools treat retrogression as a qualifier of strength rather than of existence.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: this implementation applies no cancellation and no qualification rule. Debilitation, combustion, retrogression, neecha-bhanga and war are NOT evaluated and do NOT change the status. They are understood here to affect strength only, not existence.',
      'Strength of the yoga is not quantified — the status is existence-only, not a measure of how strong the yoga is.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_BUDHADITYA: {
    ruleId: 'YOGA_BUDHADITYA',
    sourceWork: 'Budhaditya Yoga — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'The Sun and Mercury occupy the same sidereal sign. The angular separation is reported as evidence but no orb limit is applied to existence.',
    variants: [
      'Some schools require the two to be within a combustion orb (commonly about 14 degrees) rather than merely in the same sign.',
      'Some schools exclude the case where Mercury is fully combust in the same sign, or treat it as weakening rather than cancelling.',
    ],
    limitations: [
      'Combustion is computed elsewhere in the engine but is NOT applied here; it is treated as affecting strength, not existence.',
      'A sign-boundary case (Sun at 29° 59′ and Mercury at 0° 01′ of the next sign) counts as ABSENT under the same-sign rule.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_CHANDRA_MANGALA: {
    ruleId: 'YOGA_CHANDRA_MANGALA',
    sourceWork: 'Chandra-Mangala Yoga — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'CONTESTED',
    adoptedInterpretation:
      'CONJUNCTION ONLY: the Moon and Mars occupy the same sidereal sign. This implementation does NOT evaluate mutual aspect.',
    variants: [
      'Some schools count mutual aspect between Moon and Mars as forming the yoga, not only conjunction.',
      'Some schools apply an orb (commonly about 10 degrees) rather than same-sign occupancy.',
      'Some schools treat the conjunction in certain houses as a distinct wealth yoga rather than this one.',
    ],
    limitations: [
      'SCOPE: because the mutual-aspect variant is contested and no licensed source is held here, only conjunction is implemented. A chart where Moon and Mars merely aspect each other is reported ABSENT under this rule — that is a scope limit of the rule, not a claim that no yoga exists.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_DHARMA_KARMA_ADHIPATI: {
    ruleId: 'YOGA_DHARMA_KARMA_ADHIPATI',
    sourceWork: 'Dharma-Karmadhipati Raja Yoga — commonly attributed to the classical raja-yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'CONTESTED',
    adoptedInterpretation:
      'LIMITED ADOPTION — conjunction or parivartana only: the lord of the 9th house and the lord of the 10th house either occupy the same house (conjunction), or each occupies a sign owned by the other (parivartana). Generic mutual-kendra placement is NOT sufficient under this rule.',
    variants: [
      'Mutual kendra (the two lords in kendra to each other) is accepted by many popular sources but is not adopted here, because no licensed source in this repository supports treating it as sufficient on its own. It is registered separately as YOGA_DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA and evaluates to NOT_CALCULATED.',
      'Mutual aspect between the two lords is accepted by some schools and is NOT implemented here.',
      'Some schools also accept the 9th and 10th lords exchanging houses counted from the lagna rather than by sign ownership.',
    ],
    limitations: [
      'Only conjunction and parivartana are evaluated. A chart where the two lords are merely in mutual kendra is reported ABSENT by THIS rule and NOT_CALCULATED by the separate mutual-kendra registration — neither result claims the yoga is absent in the broader literature.',
      'Rahu and Ketu own no sign, so if a house cusp falls in a sign whose lord is a node the rule cannot arise; that cannot happen with the seven-sign-lord scheme used here.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA: {
    ruleId: 'YOGA_DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA',
    sourceWork: 'Dharma-Karmadhipati Raja Yoga, mutual-kendra variant — popular modern attribution; not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'CONTESTED',
    adoptedInterpretation:
      'NOT ADOPTED. The variant holds the yoga to exist when the 9th and 10th lords occupy kendra positions relative to each other (offset 0, 3, 6 or 9).',
    variants: [
      'Adopted by many popular sources as sufficient on its own.',
      'Not accepted by other schools without an additional conjunction, aspect or exchange.',
    ],
    limitations: [
      'No licensed source is held in this repository to settle the disagreement, so this variant is reported NOT_CALCULATED rather than PRESENT or ABSENT. The bhava offset is still computed and reported as evidence so a scholar can adjudicate it.',
    ],
    adoption: 'NOT_ADOPTED',
  },

  YOGA_RUCHAKA: {
    ruleId: 'YOGA_RUCHAKA',
    sourceWork: 'Pancha Mahapurusha yogas — commonly attributed to Brihat Parashara Hora Shastra and later classical works; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: Mars occupies a kendra (house 1, 4, 7 or 10 from the lagna) AND is in Aries or Scorpio (own sign) or Capricorn (exaltation).',
    variants: [
      'Some schools require the planet to be in its own or exaltation sign in the RASHI chart only; others also accept the same placement in the navamsha.',
      'Some schools require the planet to be strong by Shadbala for the yoga to be counted.',
    ],
    limitations: [
      'QUALIFICATION POLICY: combustion, retrogression, debilitation (which cannot co-occur with own/exaltation here), planetary war and Shadbala strength are NOT evaluated and do NOT change existence. They are treated as affecting strength only.',
      'Kendra is counted from the lagna only; kendra from the Moon is not evaluated for this rule.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_HAMSA: {
    ruleId: 'YOGA_HAMSA',
    sourceWork: 'Pancha Mahapurusha yogas — commonly attributed to Brihat Parashara Hora Shastra and later classical works; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: Jupiter occupies a kendra (house 1, 4, 7 or 10 from the lagna) AND is in Sagittarius or Pisces (own sign) or Cancer (exaltation).',
    variants: [
      'Some schools also accept the same placement judged from the navamsha.',
      'Some schools require Jupiter to be unafflicted for full results.',
    ],
    limitations: [
      'QUALIFICATION POLICY: combustion, retrogression, planetary war and Shadbala strength are NOT evaluated and do NOT change existence; they affect strength only.',
      'Kendra is counted from the lagna only.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_MALAVYA: {
    ruleId: 'YOGA_MALAVYA',
    sourceWork: 'Pancha Mahapurusha yogas — commonly attributed to Brihat Parashara Hora Shastra and later classical works; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: Venus occupies a kendra (house 1, 4, 7 or 10 from the lagna) AND is in Taurus or Libra (own sign) or Pisces (exaltation).',
    variants: [
      'Some schools also accept the same placement judged from the navamsha.',
      'Some schools treat Venus in its debilitation in a kendra as a distinct, weaker configuration.',
    ],
    limitations: [
      'QUALIFICATION POLICY: combustion, retrogression, planetary war and Shadbala strength are NOT evaluated and do NOT change existence; they affect strength only.',
      'Kendra is counted from the lagna only.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_SASA: {
    ruleId: 'YOGA_SASA',
    sourceWork: 'Pancha Mahapurusha yogas — commonly attributed to Brihat Parashara Hora Shastra and later classical works; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: Saturn occupies a kendra (house 1, 4, 7 or 10 from the lagna) AND is in Capricorn or Aquarius (own sign) or Libra (exaltation).',
    variants: [
      'Some schools also accept the same placement judged from the navamsha.',
      'Some schools distinguish Sasa from other Saturn-kendra configurations by additional conditions.',
    ],
    limitations: [
      'QUALIFICATION POLICY: combustion, retrogression, planetary war and Shadbala strength are NOT evaluated and do NOT change existence; they affect strength only.',
      'Kendra is counted from the lagna only.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_BHADRA: {
    ruleId: 'YOGA_BHADRA',
    sourceWork: 'Pancha Mahapurusha yogas — commonly attributed to Brihat Parashara Hora Shastra and later classical works; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'CONTESTED',
    adoptedInterpretation:
      'EXISTENCE ONLY: Mercury occupies a kendra (house 1, 4, 7 or 10 from the lagna) AND is in Gemini or Virgo (own sign) or Virgo (exaltation).',
    variants: [
      'Mercury’s exaltation sign is Virgo in most schools; a minority place it elsewhere, which would change the exaltation branch of this rule.',
      'Some schools require Mercury to be free from combustion, since Mercury is frequently close to the Sun.',
    ],
    limitations: [
      'QUALIFICATION POLICY: combustion is NOT applied, even though Mercury is the planet most often combust. This is a known weakness of the existence-only policy and is recorded as such.',
      'Kendra is counted from the lagna only.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_KEMADRUMA: {
    ruleId: 'YOGA_KEMADRUMA',
    sourceWork: 'Kemadruma Yoga — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'CONTESTED',
    adoptedInterpretation:
      'NOT IMPLEMENTED. No interpretation adopted.',
    variants: [
      'Whether the Sun counts as an occupant that neutralises the yoga is disputed.',
      'Whether Rahu and Ketu count as occupants is disputed.',
      'Whether the yoga is cancelled when the Moon is in a kendra from the lagna is disputed.',
    ],
    limitations: [
      'Reported NOT_CALCULATED. The engine does not guess between the disputed definitions.',
    ],
    adoption: 'NOT_ADOPTED',
  },

  /* ------------------------------------------------------------------ */
  /* Sprint I expansion — curated classical yoga catalog (charter §15).   */
  /* Same honesty policy as above: no licensed edition is held, locators  */
  /* are NOT VERIFIED, and the adopted interpretation is the only         */
  /* authoritative field. Existence and strength remain separate — the    */
  /* engine reports existence only.                                       */
  /* ------------------------------------------------------------------ */

  YOGA_SUNAPHA: {
    ruleId: 'YOGA_SUNAPHA',
    sourceWork: 'Sunapha Yoga — commonly attributed to the classical yoga corpus (Moon-based planet-in-2nd family); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: at least one of Mars, Mercury, Jupiter, Venus or Saturn occupies the 2nd house (rashi) counted from the Moon. The Sun, the nodes and the Moon itself are NOT counted as occupants.',
    variants: [
      'Some schools include the Sun as a qualifying occupant for Sunapha/Anapha.',
      'Some schools count Rahu/Ketu as occupants.',
      'The 2nd-from vs 12th-from naming is swapped in some compilations (Sunapha as 12th, Anapha as 2nd).',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied — dignity, combustion, retrogression and war affect strength only, not existence.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_ANAPHA: {
    ruleId: 'YOGA_ANAPHA',
    sourceWork: 'Anapha Yoga — commonly attributed to the classical yoga corpus (Moon-based planet-in-12th family); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: at least one of Mars, Mercury, Jupiter, Venus or Saturn occupies the 12th house (rashi) counted from the Moon. The Sun, the nodes and the Moon itself are NOT counted as occupants.',
    variants: [
      'Some schools include the Sun as a qualifying occupant.',
      'Some schools count Rahu/Ketu as occupants.',
      'The 2nd-from vs 12th-from naming is swapped in some compilations.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_DURUDHARA: {
    ruleId: 'YOGA_DURUDHARA',
    sourceWork: 'Durudhara Yoga — commonly attributed to the classical yoga corpus (planets on both sides of the Moon); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: at least one of the five taragrahas (Mars, Mercury, Jupiter, Venus, Saturn) occupies the 2nd from the Moon AND at least one occupies the 12th from the Moon. The Sun and the nodes are NOT counted.',
    variants: [
      'Some schools include the Sun and/or the nodes as occupants.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_ADHI: {
    ruleId: 'YOGA_ADHI',
    sourceWork: 'Adhi Yoga (from the Moon) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: ALL THREE natural benefics (Mercury, Jupiter, Venus) occupy houses 6th, 7th or 8th counted from the Moon (any distribution among the three houses).',
    variants: [
      'Some schools require only at least one benefic in those houses for a (weaker) Adhi yoga.',
      'Some schools require the three benefics to occupy the three houses distinctly (one each).',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_LAGNADHI: {
    ruleId: 'YOGA_LAGNADHI',
    sourceWork: 'Lagnadhi Yoga — commonly attributed to the classical yoga corpus (Adhi pattern from the lagna); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: ALL THREE natural benefics (Mercury, Jupiter, Venus) occupy bhavas 6th, 7th or 8th counted from the lagna (any distribution).',
    variants: [
      'Some schools require only one benefic; some require the 8th house to be additionally free of malefic occupation.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_SAKATA: {
    ruleId: 'YOGA_SAKATA',
    sourceWork: 'Sakata Yoga — commonly attributed to the classical yoga corpus (Moon-Jupiter 6/8/12 affliction pattern); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'CONTESTED',
    adoptedInterpretation:
      'EXISTENCE ONLY: the Moon occupies the 6th, 8th or 12th house counted from Jupiter.',
    variants: [
      'Some schools restrict Sakata to the 6th and 8th from Jupiter only.',
      'Some schools count the 6/8 from the Moon to Jupiter instead (direction of counting disputed).',
    ],
    limitations: [
      'This is registered as an affliction-pattern yoga; the engine reports existence only and draws no conclusions about fortune.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_AMALA: {
    ruleId: 'YOGA_AMALA',
    sourceWork: 'Amala Yoga — commonly attributed to the classical yoga corpus (benefic in the 10th); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: at least one natural benefic (Mercury, Jupiter or Venus) occupies the 10th bhava from the lagna OR the 10th house counted from the Moon.',
    variants: [
      'Some schools count the Amala only from the lagna.',
      'Some schools include a bright (waxing) Moon among the qualifying benefics.',
      'Some compilations describe a malefic in the 10th as a distinct (inauspicious Amala variant).',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_VESI: {
    ruleId: 'YOGA_VESI',
    sourceWork: 'Vesi Yoga — commonly attributed to the classical yoga corpus (planet in the 2nd from the Sun); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: at least one planet other than the Sun and Moon (Mars, Mercury, Jupiter, Venus, Saturn) occupies the 2nd house (rashi) counted from the Sun. The nodes are NOT counted.',
    variants: [
      'Some schools count Rahu/Ketu as occupants.',
      'Benefic-only and malefic-only sub-variants (Shubha Vesi / Papa Vesi) are described for effect differentiation.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_VASI: {
    ruleId: 'YOGA_VASI',
    sourceWork: 'Vasi Yoga — commonly attributed to the classical yoga corpus (planet in the 12th from the Sun); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: at least one planet other than the Sun and Moon (Mars, Mercury, Jupiter, Venus, Saturn) occupies the 12th house (rashi) counted from the Sun. The nodes are NOT counted.',
    variants: [
      'Some schools count Rahu/Ketu as occupants.',
      'Benefic-only and malefic-only sub-variants (Shubha Vasi / Papa Vasi) are described for effect differentiation.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_UBHAYACHARI: {
    ruleId: 'YOGA_UBHAYACHARI',
    sourceWork: 'Ubhayachari Yoga — commonly attributed to the classical yoga corpus (planets on both sides of the Sun); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: at least one of the five taragrahas occupies the 2nd from the Sun AND at least one occupies the 12th from the Sun. The Sun, Moon and nodes are NOT counted.',
    variants: [
      'Some schools include the Moon and/or the nodes as occupants.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_DHANA_LORDS_EXCHANGE: {
    ruleId: 'YOGA_DHANA_LORDS_EXCHANGE',
    sourceWork: 'Dhana Yoga (2nd-11th lords in Parivartana) — commonly attributed to the classical wealth-yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: the lord of the 2nd bhava and the lord of the 11th bhava occupy each other\'s signs (a Parivartana exchange between the 2nd and 11th lords).',
    variants: [
      'Some schools additionally accept mutual aspect between the 2nd and 11th lords as forming a (weaker) dhana association.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_DHANA_LORDS_CONJUNCT: {
    ruleId: 'YOGA_DHANA_LORDS_CONJUNCT',
    sourceWork: 'Dhana Yoga (2nd and 11th lords conjunct) — commonly attributed to the classical wealth-yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: the lord of the 2nd bhava and the lord of the 11th bhava occupy the same sign (whole-sign conjunction).',
    variants: [
      'Some schools require a tighter (degree-based) conjunction orb.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_DHANA_2L_IN_11TH: {
    ruleId: 'YOGA_DHANA_2L_IN_11TH',
    sourceWork: 'Dhana Yoga (2nd lord in the 11th) — commonly attributed to the classical wealth-yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: the lord of the 2nd bhava occupies the 11th bhava.',
    variants: [
      'Some schools give the same standing to the 2nd lord in the 5th or 9th (trikona) placements.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_DHANA_11L_IN_2ND: {
    ruleId: 'YOGA_DHANA_11L_IN_2ND',
    sourceWork: 'Dhana Yoga (11th lord in the 2nd) — commonly attributed to the classical wealth-yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: the lord of the 11th bhava occupies the 2nd bhava.',
    variants: [
      'Some schools give the same standing to the 11th lord in the 5th or 9th placements.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_LAKSHMI: {
    ruleId: 'YOGA_LAKSHMI',
    sourceWork: 'Lakshmi Yoga — commonly attributed to the classical yoga corpus (strong 9th lord in a kendra); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'CONTESTED',
    adoptedInterpretation:
      'EXISTENCE ONLY: the lord of the 9th bhava occupies its own sign or exaltation sign AND stands in a kendra bhava (1st, 4th, 7th or 10th) from the lagna.',
    variants: [
      'Most compilations additionally require Venus (the karaka of Lakshmi) to be strong; that strength condition is NOT applied here.',
      'Some texts require the 6th/8th to be free of occupation.',
    ],
    limitations: [
      'The Venus-strength qualifier is deliberately NOT applied (it is a strength concept, kept separate per charter §15).',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_VASUMATI: {
    ruleId: 'YOGA_VASUMATI',
    sourceWork: 'Vasumati Yoga — commonly attributed to the classical yoga corpus (benefics in upachayas); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: ALL THREE natural benefics (Mercury, Jupiter, Venus) occupy upachaya bhavas (3rd, 6th, 10th or 11th) counted from the lagna (any distribution).',
    variants: [
      'Some schools count the upachayas from the Moon (Chandra-lagna) instead.',
      'Some schools include a bright Moon among the benefics that must be in the upachayas.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_RAJA_SAMBANDHA: {
    ruleId: 'YOGA_RAJA_SAMBANDHA',
    sourceWork: 'Raja Yoga (kendra-lord / trikona-lord association, Raja Sambandha) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: some lord of a trikona bhava (1st, 5th, 9th) and some lord of a kendra bhava (1st, 4th, 7th, 10th) — two DIFFERENT grahas — are associated by whole-sign conjunction (same sign) or by sign exchange (Parivartana).',
    variants: [
      'Some schools accept mutual aspect between the two lords as association; mutual aspect is NOT adopted here.',
      'Stronger sub-forms (e.g. the 9th lord with the 10th lord) are described for effect grading.',
    ],
    limitations: [
      'The Lagna lord standing on both sides (kendra AND trikona) is handled: pairs must be distinct grahas, so a lone Lagna lord does not self-associate.',
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_VIPARITA_HARSHA: {
    ruleId: 'YOGA_VIPARITA_HARSHA',
    sourceWork: 'Viparita Raja Yoga — Harsha (6th lord in a dusthana) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: the lord of the 6th bhava occupies the 6th, 8th or 12th bhava.',
    variants: [
      'Some schools additionally require the dusthana to be free of other planet occupation.',
      'Some schools restrict the placement to the same house (6th lord in the 6th).',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_VIPARITA_SARALA: {
    ruleId: 'YOGA_VIPARITA_SARALA',
    sourceWork: 'Viparita Raja Yoga — Sarala (8th lord in a dusthana) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: the lord of the 8th bhava occupies the 6th, 8th or 12th bhava.',
    variants: [
      'Some schools additionally require the dusthana to be free of other planet occupation.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_VIPARITA_VIMALA: {
    ruleId: 'YOGA_VIPARITA_VIMALA',
    sourceWork: 'Viparita Raja Yoga — Vimala (12th lord in a dusthana) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: the lord of the 12th bhava occupies the 6th, 8th or 12th bhava.',
    variants: [
      'Some schools additionally require the dusthana to be free of other planet occupation.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_NEECHA_BHANGA: {
    ruleId: 'YOGA_NEECHA_BHANGA',
    sourceWork: 'Neecha Bhanga (cancellation of debilitation) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'CONTESTED',
    adoptedInterpretation:
      'EXISTENCE ONLY: at least one graha stands in its debilitation sign AND its dispositor (the lord of that sign) occupies a kendra bhava (1st, 4th, 7th or 10th) from the lagna OR from the Moon.',
    variants: [
      'The exaltation-lord of the debilitation sign standing in a kendra from the lagna or Moon is another classical cancellation condition — NOT adopted here.',
      'The debilitated planet being itself in a kendra from the lagna or Moon is another listed condition — NOT adopted here.',
      'Neecha Bhanga RAJA yoga (the cancellation rising to raja-yoga strength) is a further contested elevation — NOT adopted here.',
    ],
    limitations: [
      'This rule registers the cancellation event only, not its raja-yoga elevation.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_PARIVARTANA: {
    ruleId: 'YOGA_PARIVARTANA',
    sourceWork: 'Parivartana (sign exchange between grahas) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: at least two grahas (of the seven Sun..Saturn) occupy each other\'s signs. The observed pair(s) are reported as evidence.',
    variants: [
      'Sub-classifications (Maha/Yoga/Khala/Nainya Parivartana by the bhava classes of the exchanged signs) are described for effect grading — NOT evaluated here.',
      'Some schools include Rahu/Ketu exchanges; the nodes are NOT counted here.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_SHUBHA_KARTARI: {
    ruleId: 'YOGA_SHUBHA_KARTARI',
    sourceWork: 'Shubha Kartari Yoga — commonly attributed to the classical yoga corpus (benefics flanking); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: natural benefics (Mercury, Jupiter or Venus) occupy BOTH the 2nd and the 12th bhava from the lagna, flanking the ascendant.',
    variants: [
      'The same flank-pattern is applied around the Moon by some schools.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_PAPA_KARTARI: {
    ruleId: 'YOGA_PAPA_KARTARI',
    sourceWork: 'Papa Kartari Yoga — commonly attributed to the classical yoga corpus (malefics flanking); attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: malefics (Saturn or Mars) occupy BOTH the 2nd and the 12th bhava from the lagna. The Sun and the nodes are NOT counted as malefics for this rule.',
    variants: [
      'Some schools count the Sun and/or Rahu-Ketu among the flanking malefics.',
      'The Moon-flanked variant is described by some schools.',
    ],
    limitations: [
      'Registered as an affliction-pattern; the engine reports existence only and draws no conclusions about fortune.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_SARASWATI: {
    ruleId: 'YOGA_SARASWATI',
    sourceWork: 'Saraswati Yoga — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'CONTESTED',
    adoptedInterpretation:
      'EXISTENCE ONLY: Mercury, Jupiter and Venus EACH occupy a kendra (1/4/7/10), trikona (1/5/9) or the 2nd bhava, AND Jupiter additionally occupies its own sign or exaltation sign.',
    variants: [
      'Some schools allow Jupiter in a friendly sign instead of own/exaltation.',
      'Some schools do not require the Jupiter dignity condition at all.',
    ],
    limitations: [
      'The friendly-sign allowance is NOT adopted (own/exaltation only).',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_KALPADRUMA: {
    ruleId: 'YOGA_KALPADRUMA',
    sourceWork: 'Kalpadruma (Kalpavriksha) Yoga — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'CONTESTED',
    adoptedInterpretation: 'NOT IMPLEMENTED. No interpretation adopted.',
    variants: [
      'The definition is a long chained sequence (the lagna lord\'s exponent positions through multiple levels of dispositorship) whose exact formulation varies substantially between compilations.',
    ],
    limitations: [
      'Reported NOT_CALCULATED. The engine does not guess between the disputed chains.',
    ],
    adoption: 'NOT_ADOPTED',
  },

  YOGA_RAJJU: {
    ruleId: 'YOGA_RAJJU',
    sourceWork: 'Nabhasa Yoga — Rajju (all grahas in movable signs) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: ALL SEVEN grahas (Sun..Saturn; nodes excluded) occupy movable (chara) signs — Aries, Cancer, Libra or Capricorn.',
    variants: [
      'Some Nabhasa compilations classify the asraya group by dual vs movable mixing conditions rather than strict uniformity.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_MUSALA: {
    ruleId: 'YOGA_MUSALA',
    sourceWork: 'Nabhasa Yoga — Musala (all grahas in fixed signs) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: ALL SEVEN grahas (Sun..Saturn; nodes excluded) occupy fixed (sthira) signs — Taurus, Leo, Scorpio or Aquarius.',
    variants: [
      'See YOGA_RAJJU variant note on Nabhasa asraya classification.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_NALA: {
    ruleId: 'YOGA_NALA',
    sourceWork: 'Nabhasa Yoga — Nala (all grahas in dual signs) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: ALL SEVEN grahas (Sun..Saturn; nodes excluded) occupy dual (ubhaya) signs — Gemini, Virgo, Sagittarius or Pisces.',
    variants: [
      'See YOGA_RAJJU variant note on Nabhasa asraya classification.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_GOLA: {
    ruleId: 'YOGA_GOLA',
    sourceWork: 'Nabhasa Yoga — Gola (all grahas in one sign) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: ALL SEVEN grahas (Sun..Saturn) occupy ONE AND THE SAME sign.',
    variants: [
      'Some compilations group Gola under the Sankhya family by count of occupied signs (1).',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_YUGA: {
    ruleId: 'YOGA_YUGA',
    sourceWork: 'Nabhasa Yoga — Yuga (all grahas in two signs) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: ALL SEVEN grahas (Sun..Saturn) occupy exactly TWO distinct signs between them.',
    variants: [
      'Some compilations group Yuga under the Sankhya family by count of occupied signs (2).',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_SULA: {
    ruleId: 'YOGA_SULA',
    sourceWork: 'Nabhasa Yoga — Sula (all grahas in three signs) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: ALL SEVEN grahas (Sun..Saturn) occupy exactly THREE distinct signs between them.',
    variants: [
      'Some compilations group Sula under the Sankhya family by count of occupied signs (3).',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_KEDARA: {
    ruleId: 'YOGA_KEDARA',
    sourceWork: 'Nabhasa Yoga — Kedara (all grahas in four signs) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: ALL SEVEN grahas (Sun..Saturn) occupy exactly FOUR distinct signs between them.',
    variants: [
      'Some compilations group Kedara under the Sankhya family by count of occupied signs (4).',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },

  YOGA_KAMALA: {
    ruleId: 'YOGA_KAMALA',
    sourceWork: 'Nabhasa Yoga — Kamala/Padma (all grahas in kendras) — commonly attributed to the classical yoga corpus; attribution not verified here',
    locator: NOT_VERIFIED_LOCATOR,
    editionOrTranslation: NO_EDITION,
    verifiedInRepository: false,
    locatorVerified: false,
    scholarlyAgreement: 'GENERAL',
    adoptedInterpretation:
      'EXISTENCE ONLY: ALL SEVEN grahas (Sun..Saturn) occupy kendra bhavas (1st, 4th, 7th or 10th) counted from the lagna.',
    variants: [
      'Some compilations place Kamala in the Acala group and evaluate it by sign position relative to the lagna rather than bhava.',
    ],
    limitations: [
      'CANCELLATION / QUALIFICATION POLICY: none applied.',
      'Strength of the yoga is not quantified.',
    ],
    adoption: 'ADOPTED',
  },
};


export function sourceEntryFor(ruleId: string): YogaSourceEntry {
  const e = YOGA_SOURCE_REGISTRY[ruleId];
  if (!e) {
    throw new Error(
      `yoga source registry has no entry for ${ruleId} (registry ${YOGA_SOURCE_REGISTRY_VERSION})`,
    );
  }
  return e;
}
