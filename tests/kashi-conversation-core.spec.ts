/**
 * KASHI V3 CONVERSATION CORE — deterministic, no-LLM dialogue contract.
 *
 * Pins the plan's pipeline: Utterance → LanguageNormalizer → Weighted
 * IntentMatcher → EntityExtractor → ConversationState & FlowStack →
 * MissingSlotResolver → Deterministic Router → NextBestActions, plus the two
 * promises that matter most to a seeker:
 *   1. An interruption NEVER loses the prior flow ("आज राहुकाल?" mid
 *      birth-time intake must answer fully and still offer वापस).
 *   2. A life concern gets an empathic acknowledgement FIRST and the six
 *      humane pathways — never forced Jyotish.
 * Also contracts the ScholarHandoverPacket (Module 4) and the silent
 * network-error darshan catch (Module 6) at the source level.
 * Node-runnable: no browser, no server.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  createConversationState, normalizeUtterance, matchIntent, extractEntities, applyEntities,
  suspendFlow, resumeFlow, resumePromptHi, nextMissingSlot, INTAKE_SLOT_ORDER, INTAKE_SLOT_QUESTION_HI,
  routeFollowUp, recordFact, detectLifeConcern, lifeConcernReply, LIFE_PATHWAY_CHIPS,
  nextBestActions, INTERRUPTING_INTENTS, MATCH_THRESHOLD,
  normalizeBirthDateInput, normalizeBirthTimeInput,
  type ConversationState, type FlowFrame,
} from '../src/lib/kashi/conversationCore';
import { buildScholarHandoverPacket } from '../src/lib/kashi/scholarHandover';

const COMPONENT = path.join(process.cwd(), 'src/components/consultation/FloatingAIGuruAvatar.tsx');
const DARSHAN = path.join(process.cwd(), 'src/app/darshan/page.tsx');
const componentSource = fs.readFileSync(COMPONENT, 'utf8');
const darshanSource = fs.readFileSync(DARSHAN, 'utf8');

const intentOf = (utterance: string) => matchIntent(normalizeUtterance(utterance))?.intent ?? null;

/* ------------------------------------------------------------------ */
/* 1. LanguageNormalizer                                               */
/* ------------------------------------------------------------------ */

test.describe('KC1 — LanguageNormalizer', () => {
  test('folds synonyms, whitespace and case without touching the raw text', () => {
    const n = normalizeUtterance('  Aaj  ka   RAHU KAAL   kya hai? ');
    expect(n.text).toBe('Aaj ka RAHU KAAL kya hai?'.replace('RAHU KAAL', 'राहुकाल'));
    expect(n.lower).toContain('राहुकाल');
    expect(n.raw).toBe('  Aaj  ka   RAHU KAAL   kya hai? ');
    expect(n.lang).toBe('hi'); // folded synonym brings Devanagari in
    expect(normalizeUtterance('what is the tithi today').lang).toBe('hi'); // folded term ⇒ Hindi voice
    expect(normalizeUtterance('when is a good time to start the new work').lang).toBe('en');
    expect(normalizeUtterance('panchangam बताओ').text).toContain('पंचांग');
    expect(normalizeUtterance('kundali banana hai').text).toContain('कुंडली');
  });
});

/* ------------------------------------------------------------------ */
/* 2. WeightedIntentMatcher                                            */
/* ------------------------------------------------------------------ */

test.describe('KC2 — WeightedIntentMatcher', () => {
  test('matches every follow-up the plan names explicitly', () => {
    expect(intentOf('क्यों?')).toBe('FOLLOWUP_WHY');
    expect(intentOf('मतलब?')).toBe('FOLLOWUP_MEANING');
    expect(intentOf('कब तक?')).toBe('FOLLOWUP_UNTIL');
    expect(intentOf('उस दिन?')).toBe('FOLLOWUP_THAT_DAY');
    expect(intentOf('कल वाला?')).toBe('FOLLOWUP_THAT_DAY');
    expect(intentOf('उसकी राशि?')).toBe('FOLLOWUP_SUBJECT_RASHI');
    expect(intentOf('वापस')).toBe('RESUME_FLOW');
  });

  test('weights keep matching when the seeker wraps the cue in a sentence', () => {
    expect(intentOf('कल वाला पंचांग फिर से बताओगे?')).toBe('FOLLOWUP_THAT_DAY');
    expect(intentOf('जरा विस्तार से समझाओ')).toBe('DETAIL_PANDIT');
    expect(intentOf('संक्षेप में बताओ')).toBe('DETAIL_SHORT');
    expect(intentOf('आगे बढ़ो, रुका काम जारी रखो')).toBe('RESUME_FLOW');
  });

  test('life concerns are recognised as concerns, not as chart questions', () => {
    expect(intentOf('मेरी नौकरी छूट गई है, बहुत डर लग रहा है')).toBe('LIFE_CONCERN_JOB');
    expect(intentOf('ब्रेक अप हो गया, दिल टूट गया है')).toBe('LIFE_CONCERN_HEARTBREAK');
    expect(intentOf('बहुत तनाव है, रात को नींद नहीं आती')).toBe('LIFE_CONCERN_STRESS');
  });

  test('factual panchang questions are NOT conversational intents — the deterministic engine answers them', () => {
    // matchIntent must return null so the router falls through to
    // resolveDeterministicKashiIntent instead of inventing an answer.
    expect(intentOf('आज राहुकाल क्या है?')).toBeNull();
    expect(intentOf('आज की तिथि')).toBeNull();
    expect(intentOf('नमस्ते')).toBeNull();
  });

  test('threshold guards against weak accidental matches', () => {
    expect(MATCH_THRESHOLD).toBe(0.6);
    const m = matchIntent(normalizeUtterance('यह reason से होगा क्या'));
    expect(m === null || m.score >= MATCH_THRESHOLD).toBe(true);
  });

  test('every follow-up and life concern intent is declared interrupting', () => {
    for (const i of ['FOLLOWUP_WHY', 'FOLLOWUP_MEANING', 'FOLLOWUP_UNTIL', 'FOLLOWUP_THAT_DAY',
      'FOLLOWUP_SUBJECT_RASHI', 'RESUME_FLOW', 'LIFE_CONCERN_JOB', 'LIFE_CONCERN_HEARTBREAK', 'LIFE_CONCERN_STRESS']) {
      expect(INTERRUPTING_INTENTS.has(i as never), i).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ */
/* 3. EntityExtractor + ConversationState                              */
/* ------------------------------------------------------------------ */

test.describe('KC3 — EntityExtractor and ConversationState', () => {
  test('initial state carries the plan\'s full context envelope', () => {
    const s = createConversationState();
    expect(s.activeSubject).toBe('SELF');
    expect(s.activeDate).toBeNull();
    expect(s.activeLocation).toBeNull();
    expect(s.activeDomain).toBeNull();
    expect(s.activeIntent).toBeNull();
    expect(s.activeFact).toBeNull();
    expect(s.pendingFlow).toBeNull();
    expect(s.stack).toEqual([]);
    expect(s.detailLevel).toBe('NORMAL');
  });

  test('subject, date words, city cues and detail level are extracted', () => {
    const patch = extractEntities(normalizeUtterance('पत्नी की कुंडली — कल पटना में'));
    expect(patch.subject).toBe('PARTNER');
    expect(patch.dateShift).toBe('+1');
    expect(patch.dateLabelHi).toBe('कल');
    expect(patch.location).toBe('पटना');

    const s1 = applyEntities(createConversationState(), extractEntities(normalizeUtterance('बेटे के लिए')));
    expect(s1.activeSubject).toBe('CHILD');
    const s2 = applyEntities(createConversationState(), extractEntities(normalizeUtterance('पिता की सेहत')));
    expect(s2.activeSubject).toBe('PARENT');
    const s3 = applyEntities(createConversationState(), extractEntities(normalizeUtterance('बहन का विवाह')));
    expect(s3.activeSubject).toBe('SIBLING');

    const s4 = applyEntities(createConversationState(), extractEntities(normalizeUtterance('आज का राहुकाल')));
    expect(s4.activeDate).toBe(new Date().toISOString().slice(0, 10));
    expect(s4.activeDateLabelHi).toBe('आज');
    const s5 = applyEntities(createConversationState(), extractEntities(normalizeUtterance('परसों की एकादशी')));
    const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2);
    expect(s5.activeDate).toBe(dayAfter.toISOString().slice(0, 10));

    const s6 = applyEntities(createConversationState(), extractEntities(normalizeUtterance('विस्तार से बताओ')));
    expect(s6.detailLevel).toBe('PANDIT');

    for (const [utter, city] of [['वाराणसी', 'वाराणसी'], ['banaras', 'वाराणसी'], ['दिल्ली', 'दिल्ली'],
      ['मुंबई', 'मुंबई'], ['bengaluru', 'बेंगलुरु'], ['कोलकाता', 'कोलकाता'], ['लखनऊ', 'लखनऊ'], ['इलाहाबाद', 'प्रयागराज']] as Array<[string, string]>) {
      const s = applyEntities(createConversationState(), extractEntities(normalizeUtterance(utter)));
      expect(s.activeLocation, utter).toBe(city);
    }
  });

  test('life domains are extracted from free text and stored as activeDomain', () => {
    const cases: Array<[string, string]> = [
      ['करियर में प्रगति कब होगी', 'CAREER'],
      ['व्यापार में घाटा हो रहा है', 'CAREER'],
      ['विवाह कब होगा', 'MARRIAGE'],
      ['रिश्ता तय हो गया है', 'MARRIAGE'],
      ['सेहत ठीक नहीं रहती', 'HEALTH'],
      ['कालसर्प दोष का उपाय बताइए', 'REMEDY'],
      ['विदेश यात्रा के योग हैं?', 'PROPERTY'],
    ];
    for (const [utter, dom] of cases) {
      const st = applyEntities(createConversationState(), extractEntities(normalizeUtterance(utter)));
      expect(st.activeDomain, utter).toBe(dom);
    }
  });

  test('"उस दिन" rebinds to the already-active date instead of shifting it', () => {
    let s = applyEntities(createConversationState(), extractEntities(normalizeUtterance('कल का पंचांग')));
    const kalsDate = s.activeDate;
    s = applyEntities(s, extractEntities(normalizeUtterance('उस दिन शुभ समय?')));
    expect(s.activeDate).toBe(kalsDate);
    expect(s.activeDateLabelHi).toBe('उसी दिन');
  });
});

/* ------------------------------------------------------------------ */
/* 3b. Birth-input normalizers — the canonical kernel only eats ISO     */
/* ------------------------------------------------------------------ */

test.describe('KC3b — birth-input normalizers', () => {
  test('dates: DD/MM/YYYY, dotted, dashed and ISO all normalize; garbage is null', () => {
    expect(normalizeBirthDateInput('15/06/1995')).toBe('1995-06-15');
    expect(normalizeBirthDateInput('15.06.1995')).toBe('1995-06-15');
    expect(normalizeBirthDateInput('15-6-1995')).toBe('1995-06-15');
    expect(normalizeBirthDateInput('1995-06-15')).toBe('1995-06-15');
    expect(normalizeBirthDateInput('  01/01/2001 ')).toBe('2001-01-01');
    expect(normalizeBirthDateInput('15/13/1995')).toBeNull();
    expect(normalizeBirthDateInput('जून में')).toBeNull();
    expect(normalizeBirthDateInput('')).toBeNull();
  });

  test('times: 12-hour with AM/PM folds to 24-hour HH:mm; garbage is null', () => {
    expect(normalizeBirthTimeInput('10:30 AM')).toBe('10:30');
    expect(normalizeBirthTimeInput('10:30 pm')).toBe('22:30');
    expect(normalizeBirthTimeInput('22:30')).toBe('22:30');
    expect(normalizeBirthTimeInput('12:15 AM')).toBe('00:15');
    expect(normalizeBirthTimeInput('12:00 PM')).toBe('12:00');
    expect(normalizeBirthTimeInput('10.30')).toBe('10:30');
    expect(normalizeBirthTimeInput('25:00')).toBeNull();
    expect(normalizeBirthTimeInput('सुबह')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* 4. FlowStack — interruption NEVER loses the prior flow              */
/* ------------------------------------------------------------------ */

test.describe('KC4 — FlowStack suspend/resume', () => {
  const intakeFrame: FlowFrame = {
    kind: 'INTAKE', step: 'ASK_BIRTH_TIME',
    slots: { name: 'राम', birthDate: '15/06/1995', birthTime: '', birthCity: '', question: '' },
    labelHi: 'कुंडली इन्टेक',
  };

  test('suspend preserves the exact frame; resume restores it and re-promises', () => {
    let s = createConversationState();
    s = suspendFlow(s, intakeFrame);
    expect(s.pendingFlow?.step).toBe('ASK_BIRTH_TIME');
    expect(s.pendingFlow?.slots.birthDate).toBe('15/06/1995');
    const r = resumeFlow(s);
    expect(r).not.toBeNull();
    expect(r!.frame.step).toBe('ASK_BIRTH_TIME');
    expect(r!.state.pendingFlow).toBeNull();
    expect(resumePromptHi(intakeFrame)).toContain('जन्म समय');
    expect(resumePromptHi(intakeFrame)).toContain('कुंडली इन्टेक');
    // MissingSlotResolver picks up exactly where the interruption happened
    expect(nextMissingSlot(r!.frame.slots)).toBe('birthTime');
  });

  test('nested interruptions stack; resume unwinds LIFO', () => {
    let s = createConversationState();
    const granth: FlowFrame = { kind: 'GRANTH_RECITAL', step: 'PASSAGE_2', slots: {}, labelHi: 'हनुमान चालीसा पाठ' };
    s = suspendFlow(s, granth);
    s = suspendFlow(s, intakeFrame);
    expect(s.stack.map((f) => f.kind)).toEqual(['GRANTH_RECITAL']);
    const r1 = resumeFlow(s);
    expect(r1!.frame.kind).toBe('INTAKE');
    expect(r1!.state.pendingFlow?.kind).toBe('GRANTH_RECITAL');
    const r2 = resumeFlow(r1!.state);
    expect(r2!.frame.kind).toBe('GRANTH_RECITAL');
    expect(r2!.state.pendingFlow).toBeNull();
    expect(r2!.state.stack).toEqual([]);
  });

  test('resume with nothing pending is a clean null, not a crash', () => {
    expect(resumeFlow(createConversationState())).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* 5. MissingSlotResolver                                              */
/* ------------------------------------------------------------------ */

test.describe('KC5 — MissingSlotResolver', () => {
  test('slot order is name → birthDate → birthTime → birthCity → question', () => {
    expect([...INTAKE_SLOT_ORDER]).toEqual(['name', 'birthDate', 'birthTime', 'birthCity', 'question']);
    expect(nextMissingSlot({})).toBe('name');
    expect(nextMissingSlot({ name: 'राम' })).toBe('birthDate');
    expect(nextMissingSlot({ name: 'राम', birthDate: '15/06/1995', birthTime: '  ' })).toBe('birthTime');
    expect(nextMissingSlot({ name: 'राम', birthDate: 'd', birthTime: 't', birthCity: 'c', question: 'q' })).toBeNull();
    for (const slot of INTAKE_SLOT_ORDER) expect(INTAKE_SLOT_QUESTION_HI[slot].length).toBeGreaterThan(5);
  });
});

/* ------------------------------------------------------------------ */
/* 6. Deterministic Router — follow-ups and fact memory                */
/* ------------------------------------------------------------------ */

const withRahuFact = (): ConversationState => {
  const s = recordFact(createConversationState(), {
    intent: 'GET_RAHUKAAL',
    labelHi: 'राहुकाल',
    valueHi: 'आज राहुकाल 12:45 PM से 2:23 PM तक रहेगा।',
    dateIso: '2026-09-03',
    locationHi: 'पटना',
  });
  return s;
};

test.describe('KC6 — Deterministic Router', () => {
  test('recordFact captures the value and mines the "…तक" validity window', () => {
    const s = withRahuFact();
    expect(s.activeFact?.intent).toBe('GET_RAHUKAAL');
    expect(s.activeFact?.untilHi).toContain('2:23 PM तक');
    expect(s.activeIntent).toBe('GET_RAHUKAAL');
  });

  test('क्यों? after a raahu-kaal answer gives the authored family explanation', () => {
    const r = routeFollowUp('FOLLOWUP_WHY', withRahuFact());
    expect(r?.kind).toBe('WHY');
    expect(r!.text).toContain('कारण');
    expect(r!.text.length).toBeGreaterThan(40);
    expect(r!.speakText.length).toBeGreaterThan(20);
  });

  test('मतलब? restates the family meaning AND the original value', () => {
    const r = routeFollowUp('FOLLOWUP_MEANING', withRahuFact());
    expect(r?.kind).toBe('MEANING');
    expect(r!.text).toContain('12:45 PM');
  });

  test('कब तक? answers from the mined until window', () => {
    const r = routeFollowUp('FOLLOWUP_UNTIL', withRahuFact());
    expect(r?.kind).toBe('UNTIL');
    expect(r!.text).toContain('2:23 PM तक');
  });

  test('follow-ups without a recorded fact never bluff — they ask for the question first', () => {
    for (const i of ['FOLLOWUP_WHY', 'FOLLOWUP_MEANING', 'FOLLOWUP_UNTIL'] as const) {
      const r = routeFollowUp(i, createConversationState());
      expect(r, i).not.toBeNull();
      expect(r!.text).toContain('कोई गणना-उत्तर नहीं');
    }
  });

  test('उस दिन? with a bound date defers to the engine (null); without a date it asks which day', () => {
    let s = applyEntities(createConversationState(), extractEntities(normalizeUtterance('कल का राहुकाल')));
    expect(routeFollowUp('FOLLOWUP_THAT_DAY', s)).toBeNull();
    s = createConversationState();
    const r = routeFollowUp('FOLLOWUP_THAT_DAY', s);
    expect(r?.kind).toBe('THAT_DAY');
    expect(r!.text).toContain('किस दिन');
  });

  test('उसकी राशि? refuses to invent a sign — with or without a fact', () => {
    const fresh = routeFollowUp('FOLLOWUP_SUBJECT_RASHI', createConversationState());
    expect(fresh!.text).toContain('अनुमान');
    let s = applyEntities(withRahuFact(), extractEntities(normalizeUtterance('पत्नी की')));
    const bound = routeFollowUp('FOLLOWUP_SUBJECT_RASHI', s);
    expect(bound!.text).toContain('आपके संगी की');
    s = withRahuFact();
    expect(routeFollowUp('FOLLOWUP_SUBJECT_RASHI', s)!.text).toContain('आपकी');
  });

  test('वापस with a pending flow defers to the resumers (null); without one it explains gently', () => {
    const s = suspendFlow(createConversationState(), { kind: 'INTAKE', step: 'ASK_NAME', slots: {}, labelHi: 'कुंडली इन्टेक' });
    expect(routeFollowUp('RESUME_FLOW', s)).toBeNull();
    const r = routeFollowUp('RESUME_FLOW', createConversationState());
    expect(r?.kind).toBe('RESUME');
    expect(r!.text).toContain('कोई रुका हुआ कार्य नहीं');
  });

  test('non-follow-up intents route to null so callers fall through', () => {
    expect(routeFollowUp('DETAIL_SHORT', withRahuFact())).toBeNull();
    expect(routeFollowUp('UNKNOWN', withRahuFact())).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* 7. Life concerns — empathy first, six pathways, never forced        */
/* ------------------------------------------------------------------ */

test.describe('KC7 — Life concerns', () => {
  test('concern detection maps intents, and only intents', () => {
    expect(detectLifeConcern('LIFE_CONCERN_JOB')).toBe('JOB');
    expect(detectLifeConcern('LIFE_CONCERN_HEARTBREAK')).toBe('HEARTBREAK');
    expect(detectLifeConcern('LIFE_CONCERN_STRESS')).toBe('STRESS');
    expect(detectLifeConcern('FOLLOWUP_WHY')).toBeNull();
    expect(detectLifeConcern(null)).toBeNull();
  });

  test('the reply is empathic acknowledgement FIRST — jyotish vocabulary appears nowhere', () => {
    for (const concern of ['JOB', 'HEARTBREAK', 'STRESS'] as const) {
      const r = lifeConcernReply(concern, 'राम');
      expect(r.text.startsWith('राम जी, ')).toBe(true);
      expect(r.text).toContain('जब मन तैयार हो');
      expect(r.text).not.toContain('राहु');
      expect(r.text).not.toContain('शनि');
      expect(r.text).not.toContain('कुंडली बना');
      expect(r.speakText.length).toBeGreaterThan(30);
    }
    expect(lifeConcernReply('JOB', '  ').text.startsWith('नौकरी')).toBe(true);
  });

  test('exactly the six humane pathways, in the plan\'s order', () => {
    expect(LIFE_PATHWAY_CHIPS.map((c) => c.action)).toEqual([
      'LIFE_PATH_TALK', 'LIFE_PATH_TIME', 'LIFE_PATH_SHANTI', 'LIFE_PATH_JAPA', 'LIFE_PATH_DARSHAN', 'OPEN_CONCIERGE',
    ]);
    expect(LIFE_PATHWAY_CHIPS.map((c) => c.label)).toEqual([
      '💬 बात करना', '🕰️ वर्तमान समय समझना', '🕉️ शान्ति अभ्यास', '📿 जप', '🪔 दर्शन', '📞 पंडित से बात',
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* 8. NextBestActions                                                  */
/* ------------------------------------------------------------------ */

test.describe('KC8 — NextBestActions', () => {
  test('chips follow the conversation state: fact → why/meaning/until, date → that-day, pending → वापस', () => {
    const bare = nextBestActions(createConversationState());
    expect(bare.map((c) => c.action)).toEqual(['MAIN_MENU']);

    const s = withRahuFact();
    const withFact = nextBestActions(s).map((c) => c.action);
    expect(withFact).toEqual(expect.arrayContaining(['FOLLOWUP_WHY', 'FOLLOWUP_MEANING', 'FOLLOWUP_UNTIL', 'MAIN_MENU']));

    const suspended = suspendFlow(s, { kind: 'INTAKE', step: 'ASK_BIRTH_TIME', slots: {}, labelHi: 'कुंडली इन्टेक' });
    const chips = nextBestActions(suspended);
    expect(chips.map((c) => c.action)).toContain('RESUME_FLOW');
    expect(chips.find((c) => c.action === 'RESUME_FLOW')!.label).toContain('कुंडली इन्टेक');
    expect(chips[chips.length - 1].action).toBe('MAIN_MENU');
  });
});

/* ------------------------------------------------------------------ */
/* 9. ScholarHandoverPacket (Module 4)                                 */
/* ------------------------------------------------------------------ */

test.describe('KC9 — ScholarHandoverPacket', () => {
  const now = new Date('2026-09-03T06:30:00Z');
  const full = buildScholarHandoverPacket({
    seeker: { name: 'राम कुमार', birthDate: '15/06/1995', birthTime: '10:30', birthCity: 'पटना', lat: 25.5941, lon: 85.1376, question: 'नौकरी कब लगेगी?' },
    pulse: { lagna: 'वृषभ (Vrishabha)', nakshatra: 'रोहिणी', dasha: 'चन्द्र • गुरु', transitStatus: 'POWER_DAY', transitMessage: 'शुभ सिद्धि योग सक्रिय है।' },
  }, now);

  test('packetId is quotable and day-stamped; sections cover the six handover duties', () => {
    expect(full.packetId).toMatch(/^SH-20260903-[0-9A-F]{4}$/);
    expect(full.sections.map((s) => s.heading)).toEqual([
      '१. साधक परिचय', '२. खगोलीय सारांश (इंजन-संगणित)', '३. आज का गोचर संदर्भ',
      '४. साधक का प्रश्न', '५. सहायक की सिफारिश', '६. स्रोत व प्रमाणन',
    ]);
  });

  test('WhatsApp text is a single paste-ready string carrying id, birth data, chart summary and the verbatim question', () => {
    expect(full.whatsappText).toContain(full.packetId);
    expect(full.whatsappText).toContain('राम कुमार');
    expect(full.whatsappText).toContain('15/06/1995');
    expect(full.whatsappText).toContain('10:30');
    expect(full.whatsappText).toContain('वृषभ (Vrishabha)');
    expect(full.whatsappText).toContain('रोहिणी');
    expect(full.whatsappText).toContain('नौकरी कब लगेगी?');
    expect(full.whatsappText).toContain('+91 99729 34937');
    expect(full.whatsappText).not.toContain('undefined');
    expect(full.whatsappText).not.toContain('null');
  });

  test('incomplete intake never bluffs — gaps are declared explicitly', () => {
    const gap = buildScholarHandoverPacket({ seeker: { name: 'सीता', question: null } }, now);
    expect(gap.whatsappText).toContain('इन्टेक अधूरा');
    expect(gap.sections[0].lines).toContain('जन्म तिथि: इन्टेक अधूरा — कृपया साधक से पूछें');
  });

  test('deterministic: same input + same clock ⇒ identical packet', () => {
    const again = buildScholarHandoverPacket({
      seeker: { name: 'राम कुमार', birthDate: '15/06/1995', birthTime: '10:30', birthCity: 'पटना', lat: 25.5941, lon: 85.1376, question: 'नौकरी कब लगेगी?' },
      pulse: { lagna: 'वृषभ (Vrishabha)', nakshatra: 'रोहिणी', dasha: 'चन्द्र • गुरु', transitStatus: 'POWER_DAY', transitMessage: 'शुभ सिद्धि योग सक्रिय है।' },
    }, now);
    expect(again.packetId).toBe(full.packetId);
    expect(again.whatsappText).toBe(full.whatsappText);
    expect(full.displayLines.length).toBeGreaterThan(10);
  });
});

/* ------------------------------------------------------------------ */
/* 10. Wiring contracts (source-level)                                 */
/* ------------------------------------------------------------------ */

test.describe('KC10 — the core is actually wired into the avatar and darshan', () => {
  test('FloatingAIGuruAvatar runs the full pipeline before the slot machine', () => {
    expect(componentSource).toContain("from '@/lib/kashi/conversationCore'");
    expect(componentSource).toContain("from '@/lib/kashi/scholarHandover'");
    expect(componentSource).toContain('normalizeUtterance(text)');
    expect(componentSource).toContain('extractEntities(norm)');
    expect(componentSource).toContain('matchIntent(norm)');
    expect(componentSource).toContain('detectLifeConcern');
    expect(componentSource).toContain('LIFE_PATHWAY_CHIPS');
    expect(componentSource).toContain('suspendFlow(convStateRef.current, frame)');
    expect(componentSource).toContain('INTERRUPTING_INTENTS');
    expect(componentSource).toContain('resolveDeterministicKashiIntent(text');
    expect(componentSource).toContain('recordFact(convStateRef.current');
    // The interruption branch must set intake aside BEFORE answering
    const suspIdx = componentSource.indexOf('suspendFlow(convStateRef.current, frame)');
    const slotIdx = componentSource.indexOf("if (intakeStep === 'ASK_NAME')");
    expect(suspIdx).toBeGreaterThan(0);
    expect(slotIdx).toBeGreaterThan(0);
    expect(suspIdx).toBeLessThan(slotIdx);
  });

  test('the intake domain chip feeds activeDomain, and free text feeds it too', () => {
    expect(componentSource).toContain("applyEntities(convStateRef.current, { domain: chip.action.replace('SET_DOMAIN_', '') })");
    expect(componentSource).toContain('applyEntities(convStateRef.current, extractEntities(norm))');
  });

  test('the pulse card is recited and carries the Executive Life Gauges from the canonical kernel', () => {
    expect(componentSource).toContain('आपकी खगोलीय गणना पूर्ण हुई');           // speakText: recitation
    expect(componentSource).toContain("import('@/lib/jyotish/canonicalSnapshot')");
    expect(componentSource).toContain("import('@/lib/jyotish/executiveLifeGauge')");
    expect(componentSource).toContain('computeExecutiveLifeDimensions(snapshot)');
    expect(componentSource).toContain('षड्-आयामी जीवन मापक (Executive Life Gauges)');
    expect(componentSource).toContain('normalizeBirthDateInput(seekerData.birthDate');
    // gauge failure must never kill the pulse card
    expect(componentSource).toContain('Executive gauges unavailable for pulse card');
  });

  test('resume is a real chip and a real utterance, and the nudge points at it', () => {
    expect(componentSource).toContain("action: 'RESUME_FLOW'");
    expect(componentSource).toContain('resumePromptHi(frame)');
    expect(componentSource).toContain('वापस');
  });

  test('all six life pathways are dispatched in the chip handler', () => {
    for (const a of ['LIFE_PATH_TALK', 'LIFE_PATH_TIME', 'LIFE_PATH_SHANTI', 'LIFE_PATH_JAPA', 'LIFE_PATH_DARSHAN']) {
      expect(componentSource, a).toContain(`chip.action === '${a}'`);
    }
  });

  test('the concierge modal surfaces the packet and prefills WhatsApp with it', () => {
    expect(componentSource).toContain('ScholarHandoverPacket — पंडित जी के लिए तैयार सारांश');
    expect(componentSource).toContain('buildScholarHandoverPacket({');
    expect(componentSource).toContain('handoverPacket.whatsappText');
    expect(componentSource).toContain('clipboard?.writeText(handoverPacket.whatsappText)');
  });

  test('darshan keeps the video-only UI but catches network failure silently with the shrine image', () => {
    expect(darshanSource).toContain('mediaFailed');
    expect(darshanSource).toContain('onError={() => setMediaFailed(true)}');
    expect(darshanSource).toContain("window.addEventListener('offline'");
    expect(darshanSource).toContain('src={activeShrine.imageUrl}');
    // No user-facing toggle: the image branch is reachable ONLY through mediaFailed
    const imgIdx = darshanSource.indexOf('src={activeShrine.imageUrl}');
    const branchIdx = darshanSource.lastIndexOf('{mediaFailed ? (', imgIdx);
    expect(branchIdx).toBeGreaterThan(0);
    expect(darshanSource).not.toContain('onClick={() => setMediaFailed');
    expect(darshanSource).not.toMatch(/setVideoStreamSource[^)]*IMAGE/);
  });
});
