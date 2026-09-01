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

export const YOGA_SOURCE_REGISTRY_VERSION = 'jyotish-source-registry-v1';

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
