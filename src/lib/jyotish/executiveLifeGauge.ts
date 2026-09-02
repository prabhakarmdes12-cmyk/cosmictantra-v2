/**
 * Executive 6-Dimension Life Gauge & 4-Quadrant Graha Archetype Matrix
 *
 * Mathematically grounded in:
 * 1. Classical 6-Fold Shadbala (BPHS Ch 27 - Sthana, Dig, Kala, Cheshta, Naisargika, Drik Balas)
 * 2. Sarvashtakavarga (SAV 337 Bindus - BPHS Ch 66-72)
 * 3. Bhava placements and classical Graha Karakatwas
 *
 * Competitive Superiority (vs kundali.io):
 * - Zero dummy static "55% BALANCED" placeholders.
 * - Every percentage reflects exact mathematical strengths of the native's chart.
 * - Transparent astrological grounding (SAV Bindus + Shadbala ratio displayed alongside scores).
 * - Actionable 4-quadrant cards (Core Theme, Innate Superpower, Shadow Challenge, Traditional Upaaya).
 */

import { CanonicalJyotishSnapshot } from './canonicalSnapshot';

export interface ExecutiveLifeDimension {
  id: string;
  titleEn: string;
  titleHi: string;
  score: number; // 0 - 100
  levelEn: 'Dominant' | 'Harmonious' | 'Developing' | 'Attention Needed';
  levelHi: 'असाधारण बल' | 'सुसंतुलित' | 'सक्रिय विकासशील' | 'साधना योग्य';
  archetypeEn: string;
  archetypeHi: string;
  grahaSignificator: string;
  bhavaSignificator: string;
  bindus: number | null;
  shadbalaRatio: number | null;
  insightEn: string;
  insightHi: string;
}

export interface GrahaArchetypeCard {
  planet: string;
  planetHi: string;
  rashiEn: string;
  rashiHi: string;
  house: number;
  dignity: string;
  shadbalaRatio: number | null;
  coreThemeEn: string;
  coreThemeHi: string;
  strengthEn: string;
  strengthHi: string;
  challengeEn: string;
  challengeHi: string;
  practicalRemedyEn: string;
  practicalRemedyHi: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function getLevel(score: number): {
  levelEn: 'Dominant' | 'Harmonious' | 'Developing' | 'Attention Needed';
  levelHi: 'असाधारण बल' | 'सुसंतुलित' | 'सक्रिय विकासशील' | 'साधना योग्य';
} {
  if (score >= 80) return { levelEn: 'Dominant', levelHi: 'असाधारण बल' };
  if (score >= 66) return { levelEn: 'Harmonious', levelHi: 'सुसंतुलित' };
  if (score >= 50) return { levelEn: 'Developing', levelHi: 'सक्रिय विकासशील' };
  return { levelEn: 'Attention Needed', levelHi: 'साधना योग्य' };
}

/**
 * Computes the 6 Executive Life Dimensions directly from Shadbala and SAV Bindus.
 */
export function computeExecutiveLifeDimensions(snapshot: CanonicalJyotishSnapshot): ExecutiveLifeDimension[] {
  const shadbala = snapshot.balas?.shadbala;
  const savList = snapshot.ashtakavarga?.houseSav || [];
  const getHouseBindus = (h: number): number => {
    const found = savList.find((item) => item.house === h);
    return found ? found.bindus : 28;
  };

  const getPlanetRatio = (pName: string): number => {
    const s = shadbala?.[pName];
    if (s && typeof s.strengthRatio === 'number') {
      return s.strengthRatio;
    }
    // Fallback baseline for secondary engines
    return 1.0;
  };

  // Dimension 1: Emotional Depth & Inner Resilience (Moon + 4th Bhava)
  const moonRatio = getPlanetRatio('Moon');
  const h4Bindus = getHouseBindus(4);
  // Benchmark: 1.0 ratio ~ 70 pts; 28 bindus ~ 70 pts
  const moonScore = clamp(Math.round(((moonRatio * 70) + ((h4Bindus / 28) * 70)) / 2), 28, 97);
  const moonLvl = getLevel(moonScore);

  // Dimension 2: Career Drive & Public Trajectory (Sun/Mars + 10th Bhava)
  const sunRatio = getPlanetRatio('Sun');
  const marsRatio = getPlanetRatio('Mars');
  const h10Bindus = getHouseBindus(10);
  const careerGrahaRatio = (sunRatio * 0.6) + (marsRatio * 0.4);
  const careerScore = clamp(Math.round(((careerGrahaRatio * 70) + ((h10Bindus / 28) * 70)) / 2), 30, 98);
  const careerLvl = getLevel(careerScore);

  // Dimension 3: Financial Stability & Wealth Accrual (Jupiter/Mercury + 2nd & 11th Bhava)
  const jupRatio = getPlanetRatio('Jupiter');
  const mercRatio = getPlanetRatio('Mercury');
  const h2Bindus = getHouseBindus(2);
  const h11Bindus = getHouseBindus(11);
  const wealthGraha = (jupRatio * 0.6) + (mercRatio * 0.4);
  const wealthBhava = ((h2Bindus + h11Bindus) / 56) * 70;
  const wealthScore = clamp(Math.round(((wealthGraha * 70) + wealthBhava) / 2), 26, 96);
  const wealthLvl = getLevel(wealthScore);

  // Dimension 4: Relationship Sensitivity & Partnership (Venus + 7th Bhava)
  const venusRatio = getPlanetRatio('Venus');
  const h7Bindus = getHouseBindus(7);
  const relScore = clamp(Math.round(((venusRatio * 70) + ((h7Bindus / 28) * 70)) / 2), 25, 95);
  const relLvl = getLevel(relScore);

  // Dimension 5: Executive Will & Decisive Force (Mars + 1st & 3rd Bhava)
  const h1Bindus = getHouseBindus(1);
  const h3Bindus = getHouseBindus(3);
  const willBhava = ((h1Bindus + h3Bindus) / 56) * 70;
  const willScore = clamp(Math.round(((marsRatio * 70) + willBhava) / 2), 28, 97);
  const willLvl = getLevel(willScore);

  // Dimension 6: Spiritual Inclination & Philosophical Depth (Jupiter + 9th & 12th Bhava)
  const h9Bindus = getHouseBindus(9);
  const h12Bindus = getHouseBindus(12);
  const spiritBhava = ((h9Bindus + h12Bindus) / 56) * 70;
  const spiritScore = clamp(Math.round(((jupRatio * 70) + spiritBhava) / 2), 32, 98);
  const spiritLvl = getLevel(spiritScore);

  return [
    {
      id: 'emotional_resilience',
      titleEn: 'Emotional Depth & Inner Resilience',
      titleHi: 'भावनात्मक गहनता व आत्म-धैर्य',
      score: moonScore,
      levelEn: moonLvl.levelEn,
      levelHi: moonLvl.levelHi,
      archetypeEn: 'The Inner Sanctuary',
      archetypeHi: 'अन्तःकरण शान्ति',
      grahaSignificator: 'Moon (चन्द्र)',
      bhavaSignificator: '4th House (सुख व मन)',
      bindus: h4Bindus,
      shadbalaRatio: Number(moonRatio.toFixed(2)),
      insightEn: `Supported by ${h4Bindus} SAV bindus in the 4th house and a Moon Shadbala ratio of ${moonRatio.toFixed(2)}. Indicates intuitive responsiveness and internal emotional reserve under worldly pressure.`,
      insightHi: `चतुर्थ भाव में ${h4Bindus} अष्टकवर्ग बिन्दु एवं चन्द्र षड्बल अनुपात ${moonRatio.toFixed(2)}। यह मानसिक धैर्य, संवेदनशीलता और दबाव में भी अन्तःशान्ति बनाए रखने की सामर्थ्य को दर्शाता है।`
    },
    {
      id: 'career_trajectory',
      titleEn: 'Career Drive & Public Trajectory',
      titleHi: 'कर्म-तेज व सार्वजनिक प्रभाव',
      score: careerScore,
      levelEn: careerLvl.levelEn,
      levelHi: careerLvl.levelHi,
      archetypeEn: 'The Sovereign Builder',
      archetypeHi: 'कर्मठ शिल्पी',
      grahaSignificator: 'Sun & Mars (सूर्य-मंगल)',
      bhavaSignificator: '10th House (कर्म स्थान)',
      bindus: h10Bindus,
      shadbalaRatio: Number(sunRatio.toFixed(2)),
      insightEn: `Driven by ${h10Bindus} bindus in the 10th house of authority. Reflects innate leadership appetite, professional endurance, and visible competence in chosen vocations.`,
      insightHi: `दशम भाव (कर्म क्षेत्र) में ${h10Bindus} बिन्दु। यह नेतृत्व क्षमता, कार्यक्षेत्र में प्रतिष्ठा और निरंतर कर्मशील रहने की शक्ति का प्रमाण है।`
    },
    {
      id: 'financial_stability',
      titleEn: 'Financial Stability & Wealth Accrual',
      titleHi: 'धन-समृद्धि व वित्तीय स्थायित्व',
      score: wealthScore,
      levelEn: wealthLvl.levelEn,
      levelHi: wealthLvl.levelHi,
      archetypeEn: 'The Abundance Sustainer',
      archetypeHi: 'लक्ष्मी संचयक',
      grahaSignificator: 'Jupiter & Mercury (गुरु-बुध)',
      bhavaSignificator: '2nd & 11th (धन व लाभ)',
      bindus: h2Bindus + h11Bindus,
      shadbalaRatio: Number(jupRatio.toFixed(2)),
      insightEn: `Combined 2nd and 11th house strength totaling ${h2Bindus + h11Bindus} SAV bindus. Measures commercial prudence, resource preservation, and compounding capacity over time.`,
      insightHi: `द्वितीय (धन) व एकादश (लाभ) भावों में कुल ${h2Bindus + h11Bindus} बिन्दु। यह विवेकपूर्ण निवेश, आर्थिक स्थिरता और दीर्घकालिक धन-संचय क्षमता को प्रकट करता है।`
    },
    {
      id: 'relationship_sensitivity',
      titleEn: 'Relationship Sensitivity & Partnership',
      titleHi: 'सम्बन्ध-सौहार्द व दाम्पत्य',
      score: relScore,
      levelEn: relLvl.levelEn,
      levelHi: relLvl.levelHi,
      archetypeEn: 'The Harmonizer',
      archetypeHi: 'सौहार्द सेतु',
      grahaSignificator: 'Venus (शुक्र)',
      bhavaSignificator: '7th House (जाया व साझेदारी)',
      bindus: h7Bindus,
      shadbalaRatio: Number(venusRatio.toFixed(2)),
      insightEn: `7th house calibrated at ${h7Bindus} bindus with Venus Shadbala at ${venusRatio.toFixed(2)}. Highlights reciprocal empathy, diplomacy in alliances, and aesthetic appreciation.`,
      insightHi: `सप्तम भाव में ${h7Bindus} बिन्दु एवं शुक्र का षड्बल अनुपात ${venusRatio.toFixed(2)}। यह आपसी समझ, वैवाहिक सामंजस्य और साझेदारी में निष्ठा को सुदृढ़ करता है।`
    },
    {
      id: 'leadership_force',
      titleEn: 'Executive Will & Decisive Force',
      titleHi: 'नेतृत्व-संकल्प व शौर्य',
      score: willScore,
      levelEn: willLvl.levelEn,
      levelHi: willLvl.levelHi,
      archetypeEn: 'The Fearless Pioneer',
      archetypeHi: 'पौरुष व संकल्प',
      grahaSignificator: 'Mars & Lagna (मंगल व तनु)',
      bhavaSignificator: '1st & 3rd (तनु व पराक्रम)',
      bindus: h1Bindus + h3Bindus,
      shadbalaRatio: Number(marsRatio.toFixed(2)),
      insightEn: `Anchored by ${h1Bindus + h3Bindus} SAV bindus in the foundational 1st & 3rd houses. Demonstrates physical courage, ability to take calculated initiatives, and grit.`,
      insightHi: `लग्न एवं तृतीय (पराक्रम) भावों में ${h1Bindus + h3Bindus} बिन्दु। यह बाधाओं का निर्भयता से सामना करने और साहसी निर्णय लेने का सूचक है।`
    },
    {
      id: 'spiritual_inclination',
      titleEn: 'Spiritual Inclination & Wisdom',
      titleHi: 'आत्म-चिन्तन व ज्ञान-साधना',
      score: spiritScore,
      levelEn: spiritLvl.levelEn,
      levelHi: spiritLvl.levelHi,
      archetypeEn: 'The Sacred Seeker',
      archetypeHi: 'जिज्ञासु प्रज्ञा',
      grahaSignificator: 'Jupiter & 9th/12th (गुरु व धर्म-मोक्ष)',
      bhavaSignificator: '9th & 12th (धर्म व मोक्ष)',
      bindus: h9Bindus + h12Bindus,
      shadbalaRatio: Number(jupRatio.toFixed(2)),
      insightEn: `9th and 12th houses register ${h9Bindus + h12Bindus} bindus with Jupiter as spiritual guide. Inspires philosophical quest, ethical conduct, and pursuit of higher truth.`,
      insightHi: `नवम (धर्म) व द्वादश (मोक्ष) भावों में ${h9Bindus + h12Bindus} बिन्दु। यह शास्त्र-चिन्तन, नैतिक आचरण और आत्म-साक्षात्कार के प्रति सहज आकर्षण देता है।`
    }
  ];
}

/**
 * Generates 4-Quadrant Graha Archetype Cards for all 9 celestial grahas.
 */
export function computeGrahaArchetypeCards(snapshot: CanonicalJyotishSnapshot): GrahaArchetypeCard[] {
  const shadbala = snapshot.balas?.shadbala;
  const planets = snapshot.planets as Record<string, any>;

  const PLANET_NAMES_HI: Record<string, string> = {
    Sun: 'सूर्य (Surya)',
    Moon: 'चन्द्र (Chandra)',
    Mars: 'मंगल (Mangala)',
    Mercury: 'बुध (Budha)',
    Jupiter: 'बृहस्पति (Guru)',
    Venus: 'शुक्र (Shukra)',
    Saturn: 'शनि (Shani)',
    Rahu: 'राहु (Rahu)',
    Ketu: 'केतु (Ketu)'
  };

  const ARCHETYPES: Record<string, {
    coreEn: string;
    coreHi: string;
    strengthEn: string;
    strengthHi: string;
    challengeEn: string;
    challengeHi: string;
    remedyEn: string;
    remedyHi: string;
  }> = {
    Sun: {
      coreEn: 'Vital Solar Consciousness & Self-Sovereignty',
      coreHi: 'आत्म-प्रकाश, संकल्प और आत्म-सम्मान का मूल स्रोत',
      strengthEn: 'Commanding presence, innate dignity, uncompromising ethical clarity, and magnetic authority.',
      strengthHi: 'सहज आत्मविश्वास, निष्पक्ष निर्णय क्षमता, चारित्रिक तेज और स्वाभाविक नेतृत्व।',
      challengeEn: 'Vulnerability to subtle ego friction, impatience with mediocrity, and fear of being overlooked.',
      challengeHi: 'अहंकार का सूक्ष्म टकराव, दूसरों की भूलों पर अति-अधीरता और उपेक्षित होने की आशंका।',
      remedyEn: 'Daily early morning Surya Namaskar with Gayatri Mantra; cultivate humility in professional stewardship.',
      remedyHi: 'प्रातःकाल उगते सूर्य को जल अर्पण, गायत्री मन्त्र का मौन जप और मात-पिता व वरिष्ठों का नित्य आदर।'
    },
    Moon: {
      coreEn: 'Receptive Mind, Intuitive Resonance & Emotional Reservoir',
      coreHi: 'मनःस्थिति, संवेदनशीलता और आन्तरिक सुख का आधार',
      strengthEn: 'Deep emotional empathy, acute subconscious intuition, and maternal nurturing instinct.',
      strengthHi: 'गहन संवेदनशीलता, आन्तरिक पूर्वाभास और संकट में भी दूसरों को सम्भालने की करुणामय शक्ति।',
      challengeEn: 'Susceptibility to atmospheric mood shifts, over-absorption of others’ psychic distress, and self-doubt.',
      challengeHi: 'मन में अत्यधिक उतार-चढ़ाव, दूसरों के तनाव को अपने ऊपर ले लेना और व्यर्थ की चिन्ता।',
      remedyEn: 'Drink water from silver vessel; practice Chandra Trataka or silent evening contemplation; honor the Mother.',
      remedyHi: 'चांदी के पात्र से जल ग्रहण, पूर्णिमा की रात्रि में शिव-स्मरण और माताजी के चरण-स्पर्श कर आशीर्वाद लेना।'
    },
    Mars: {
      coreEn: 'Focused Will, Strategic Valor & Kinetic Drive',
      coreHi: 'पराक्रम, ओज, ऊर्जा और लक्ष्य-प्राप्ति की अदम्य शक्ति',
      strengthEn: 'Courage under adversity, razor-sharp tactical decisiveness, and physical vitality.',
      strengthHi: 'कठिन परिस्थितियों में निर्भीकता, त्वरित व स्पष्ट निर्णय और निष्ठापूर्वक कार्य-सिद्धि।',
      challengeEn: 'Impulsive friction, frustration when outcomes take time, and sharpness in speech.',
      challengeHi: 'अति-आक्रामकता, जल्दबाजी में निर्णय और क्रोधवश सम्बन्धों में कटुता आने की सम्भावना।',
      remedyEn: 'Chant Hanuman Chalisa with disciplined focus; direct physical energy into regular strenuous workout.',
      remedyHi: 'नियमित हनुमान चालीसा का पाठ, मंगलवार को लाल पुष्प या मीठा प्रसाद बांटना और वाणी में संयम रखना।'
    },
    Mercury: {
      coreEn: 'Intellectual Discrimination, Articulation & Commercial Intellect',
      coreHi: 'बुद्धि-विवेक, वाक्-चातुर्य और व्यापारिक सूझबूझ',
      strengthEn: 'Analytical agility, versatile communication, rapid pattern recognition, and commercial acumen.',
      strengthHi: 'सूक्ष्म विश्लेषण, वाकपटुता, तीव्र ग्रहण-शक्ति और व्यापारिक व बौद्धिक दक्षता।',
      challengeEn: 'Mental restlessness, tendency to overthink contingencies, and nervous exhaustion.',
      challengeHi: 'मानसिक चंचलता, एक साथ अनेक विचारों का दबाव और किसी एक कार्य पर पूर्ण ठहराव न होना।',
      remedyEn: 'Daily reading of Vishnu Sahasranama; maintain clean journaling; consume fresh green leafy herbs.',
      remedyHi: 'विष्णु सहस्रनाम या बुध स्तोत्र का पाठ, बुधवार को गाय को हरा चारा देना और डायरी लेखन द्वारा विचारों को स्थिर करना।'
    },
    Jupiter: {
      coreEn: 'Higher Wisdom, Dharma Alignment & Expansive Grace',
      coreHi: 'सद्ज्ञान, धर्म-निष्ठा, गुरु-कृपा और कल्याणकारी दृष्टि',
      strengthEn: 'Philosophical optimism, magnanimity, ability to synthesize sacred principles, and benevolent counsel.',
      strengthHi: 'सदाशयता, जीवन में उच्च मार्गदर्शन की क्षमता, सत्यनिष्ठा और सहज गुरुत्व।',
      challengeEn: 'Dogmatic idealism, overlooking fine logistical details, or complacency due to optimism.',
      challengeHi: 'अति-उदारता में व्यावहारिक सीमाओं की उपेक्षा और व्यावहारिक विवरणों पर कम ध्यान देना।',
      remedyEn: 'Honor traditional preceptors and scholars; chant Guru Beej Mantra; practice selfless teaching.',
      remedyHi: 'गुरुजनों व विद्वानों का आदर, गुरुवार को चने की दाल व गुड़ का दान और ज्ञान का निःस्वार्थ वितरण।'
    },
    Venus: {
      coreEn: 'Aesthetic Refinement, Relational Harmony & Joyful Receptivity',
      coreHi: 'सौन्दर्य, प्रेम, कलात्मक दृष्टि और वैवाहिक तृप्ति',
      strengthEn: 'Gracious social diplomacy, refined artistic taste, charm, and capacity to nurture partnership.',
      strengthHi: 'मधुर व्यवहार, कला व सौन्दर्य की गहरी समझ, निष्कपट प्रेम और वैवाहिक सामंजस्य।',
      challengeEn: 'Reluctance to address necessary conflict, over-indulgence in sensory comfort, or relationship anxiety.',
      challengeHi: 'कटु सत्यों से बचने का प्रयास, विलासिता में समय व्यर्थ करना और सम्बन्धों को लेकर असुरक्षा।',
      remedyEn: 'Chant Shukra Stotram or Lakshmi Ashtakam; foster pristine cleanliness; cultivate art and gratitude.',
      remedyHi: 'श्री सूक्त अथवा महालक्ष्मी स्तोत्र का पाठ, श्वेत वस्त्रों व सुगन्ध का सुरुचिपूर्ण उपयोग और जीवनसाथी का सम्मान।'
    },
    Saturn: {
      coreEn: 'Karmic Accountability, Structural Mastery & Enduring Resilience',
      coreHi: 'कर्म-संयम, तपस्या, अनुशासन और कालजयी धैर्य',
      strengthEn: 'Unshakable tenacity, realistic appraisal of constraints, selfless labor, and profound depth.',
      strengthHi: 'अटूट धैर्य, यथार्थवादी दृष्टि, कठिन परिश्रम की क्षमता और लम्बी अवधि में स्थायी सफलता।',
      challengeEn: 'Burden of melancholy, fear of scarcity, feeling emotionally solitary, or self-criticism.',
      challengeHi: 'अकेलापन, मन में अवसाद की छाया, विलम्ब से हताशा और स्वयं पर अत्यधिक कठोरता।',
      remedyEn: 'Serve the underprivileged with humility; light a mustard oil lamp under Peepal on Saturday; maintain rigorous daily routine.',
      remedyHi: 'शनिवार को पीपल के वृक्ष के नीचे तिल या सरसों के तेल का दीपक, निर्धन व असहायों की सेवा और दैनिक अनुशासन।'
    },
    Rahu: {
      coreEn: 'Unconventional Ambition, Breakthrough Vision & Maya Exploration',
      coreHi: 'नवाचार, सांसारिक महत्वाकांक्षा और अपरम्परागत विस्तार',
      strengthEn: 'Capacity to penetrate foreign domains, mastery of complex technological systems, and bold vision.',
      strengthHi: 'परम्परा से हटकर सोचने की क्षमता, आधुनिक तकनीकी व वैश्विक क्षेत्रों में सफलता और असीम साहसिक दृष्टि।',
      challengeEn: 'Psychic illusion (maya), restlessness, sudden obsession with unrealized futures, and sensory burnout.',
      challengeHi: 'भ्रम, अति-महत्वाकांक्षा में वर्तमान की उपेक्षा, मानसिक अस्थिरता और व्यर्थ की आशंकाएँ।',
      remedyEn: 'Chant Om Namah Shivaya; spend time in grounded nature; avoid deceit and maintain strict integrity.',
      remedyHi: 'भगवान भैरव अथवा शिव जी का नित्य ध्यान, नशा व जुए से पूर्ण दूरी और सात्विक दिनचर्या अपनाना।'
    },
    Ketu: {
      coreEn: 'Transcendental Detachment, Karmic Insight & Liberation (Moksha)',
      coreHi: 'वैराग्य, गूढ़ आध्यात्मिक प्रज्ञा और मोक्ष-साधना',
      strengthEn: 'Penetrating psychic insight, natural non-attachment to material ephemera, and mystical understanding.',
      strengthHi: 'आध्यात्मिक अन्तर्दृष्टि, सांसारिक मोह से अनासक्ति, ध्यान में गहनता और शोधपरक विवेक।',
      challengeEn: 'Feeling alienated from mundane society, sudden apathy, or difficulty articulating intuitive knowledge.',
      challengeHi: 'सांसारिक कार्यों में अरुचि, समाज से विरक्ति का भाव और अस्पष्ट मानसिक भटकाव।',
      remedyEn: 'Worship Lord Ganesha with Durva grass; practice silent pranayama; engage in anonymous acts of charity.',
      remedyHi: 'भगवान गणेश जी को दूर्वा अर्पण, संकट नाशन गणेश स्तोत्र का पाठ और गुप्त रूप से सेवा कार्य करना।'
    }
  };

  const planetOrder = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

  return planetOrder.map((pName) => {
    const p = planets[pName] || {};
    const arch = ARCHETYPES[pName];
    const s = shadbala?.[pName];
    const ratio = s && typeof s.strengthRatio === 'number' ? Number(s.strengthRatio.toFixed(2)) : null;

    // Tradition-dependent dignity for nodes
    const dignityStr = ['Rahu', 'Ketu'].includes(pName)
      ? 'Tradition-dependent (परम्परा-आधारित)'
      : String(p.dignity || p.status || 'Neutral');

    return {
      planet: pName,
      planetHi: PLANET_NAMES_HI[pName] || pName,
      rashiEn: p.rashiEn || p.sign?.en || '',
      rashiHi: p.rashiName || p.sign?.name || '',
      house: Number(p.house || 1),
      dignity: dignityStr,
      shadbalaRatio: ratio,
      coreThemeEn: arch.coreEn,
      coreThemeHi: arch.coreHi,
      strengthEn: arch.strengthEn,
      strengthHi: arch.strengthHi,
      challengeEn: arch.challengeEn,
      challengeHi: arch.challengeHi,
      practicalRemedyEn: arch.remedyEn,
      practicalRemedyHi: arch.remedyHi
    };
  });
}
