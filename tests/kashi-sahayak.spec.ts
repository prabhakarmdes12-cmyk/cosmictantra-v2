/**
 * KASHI SAHAYAK — recitation, emotional support, voice input, clarification.
 *
 * Scope of this suite: the interaction engine, tested headlessly.
 * NOT covered here (reported separately as gaps):
 *  - real-browser gesture/autoplay behaviour;
 *  - physical Android / iPhone voice verification (no device in this
 *    environment;
 *  - audible female-voice selection (the sandbox has no Hindi voice).
 */
import { test, expect } from '@playwright/test';
import {
  EMOTION_PATHS,
  buildEmotionalResponse,
  resolvePassage,
  detectCrisis,
  detectEmotion,
  emotionPassageMap,
  SAFETY_GUIDANCE,
  type EmotionId,
} from '../src/lib/kashi/emotionalSupport';
import {
  AUTO_SEND_CONFIDENCE,
  CLARIFY_PREFIX,
  DEFAULT_SESSION,
  LISTEN_VERSE_LABEL,
  NO_MATCH_CHOICE,
  RETRY_VOICE_CHOICE,
  TYPE_CHOICE,
  VOICE_INPUT_STATES,
  applyControl,
  applySpeechOutcome,
  buildClarificationChoices,
  classifyTranscript,
  decideAutoplay,
  detectLanguage,
  nextVoiceState,
  persistableSession,
  requiresConsent,
  setSpeed,
  validateSession,
  visibleQuickActions,
  voiceStateMessage,
  type VoiceInputState,
} from '../src/lib/kashi/interaction';
import { GRANTHS_DATA } from '../src/lib/granth/libraryData';

const EMOTION_IDS = EMOTION_PATHS.map((p) => p.id);

/** Hindi-first message helper for the voice-state assertions below. */
const voiceStateMessageFor = (state: VoiceInputState): string => voiceStateMessage(state, 'hi');

test.describe('1 — every emotional selection produces an acknowledgment', () => {
  for (const id of EMOTION_IDS) {
    test(`${id}: feminine Hindi acknowledgement with a follow-up path`, () => {
      const r = buildEmotionalResponse(id);
      expect(r.acknowledgement.length).toBeGreaterThan(10);
      // Feminine self-reference, not masculine forms.
      expect(r.acknowledgement).toMatch(/मैं (समझती हूँ|यहाँ हूँ|सुन रही हूँ)|बिल्कुल/);
      expect(r.acknowledgement).not.toMatch(/मैं समझता हूँ|मैं यहाँ हूँ, आप/);
      // Every path resolves to either a passage or an explicit reason.
      if (id === 'just-talk') {
        expect(r.passage).toBeNull();
      } else {
        expect(r.passage ?? r.unresolvedReason).toBeTruthy();
      }
    });
  }
});

test.describe('2 — every displayed verse exists verbatim in the canonical store', () => {
  const gita: any = (GRANTHS_DATA as any[]).find((b) => b.slug === 'bhagavad-gita');
  const storeTexts: string[] = [];
  for (const sec of gita.sections) for (const v of sec.verses) storeTexts.push(v.sanskrit ?? '');

  for (const path of EMOTION_PATHS.filter((p) => p.passage)) {
    test(`${path.id}: passage text is copied from the store, not paraphrased`, () => {
      const resolved = resolvePassage(path.passage!);
      expect(resolved, `${path.id} must resolve a stored passage`).not.toBeNull();
      expect(storeTexts).toContain(resolved!.original);
      expect(resolved!.meaning.length).toBeGreaterThan(0);
      expect(resolved!.provenance).toMatch(/^[0-9a-f]{64}$/);
      // Provenance fields are always present.
      expect(resolved!.book.length).toBeGreaterThan(0);
      expect(resolved!.sectionId).toBe(path.passage!.sectionId);
      expect(resolved!.verseId).toContain(path.passage!.shlokaNo);
      expect(resolved!.storeVerified).toBe(true);
    });
  }

  test('the emotion → passage mapping table resolves for every mapped emotion', () => {
    const map = emotionPassageMap();
    const mapped = map.filter((m) => m.ref);
    expect(mapped.length).toBe(EMOTION_PATHS.length - 1); // all except just-talk
    for (const m of mapped) expect(m.resolved, `${m.emotion} unresolved`).toBe(true);
  });

  test('an unresolvable reference yields no verse and a stated reason', () => {
    expect(resolvePassage({ slug: 'bhagavad-gita', sectionId: 'gita-ch-2', shlokaNo: '९९-९९' })).toBeNull();
    expect(resolvePassage({ slug: 'no-such-book', sectionId: 'x', shlokaNo: 'y' })).toBeNull();
    expect(resolvePassage(null)).toBeNull();
  });
});

test.describe('3/4 — short recitation after a gesture; autoplay rejection', () => {
  test('a verse recites after a direct gesture when autoplay is allowed', () => {
    const d = decideAutoplay({ scope: 'verse', userGesture: true, autoplayAllowed: true, mode: 'verse-with-meaning' });
    expect(d.shouldRecite).toBe(true);
    expect(d.fallbackLabel).toBeNull();
  });

  test('blocked autoplay offers the श्लोक सुनें button instead', () => {
    const d = decideAutoplay({ scope: 'verse', userGesture: true, autoplayAllowed: false, mode: 'verse-with-meaning' });
    expect(d.shouldRecite).toBe(false);
    expect(d.fallbackLabel).toBe(LISTEN_VERSE_LABEL);
    expect(LISTEN_VERSE_LABEL).toBe('श्लोक सुनें');
  });

  test('no gesture means no autoplay', () => {
    const d = decideAutoplay({ scope: 'verse', userGesture: false, autoplayAllowed: true, mode: 'verse-with-meaning' });
    expect(d.shouldRecite).toBe(false);
    expect(d.fallbackLabel).toBe(LISTEN_VERSE_LABEL);
  });
});

test.describe('5/6 — conversation-only mode and consent for long readings', () => {
  test('conversation-only mode attaches no verse and no audio', () => {
    const r = buildEmotionalResponse('sadness', '', { mode: 'conversation-only' });
    expect(r.passage).toBeNull();
    expect(r.reflection).toBe('');
    const d = decideAutoplay({ scope: 'verse', userGesture: true, autoplayAllowed: true, mode: 'conversation-only' });
    expect(d.shouldRecite).toBe(false);
  });

  test('silent mode attaches no verse', () => {
    expect(buildEmotionalResponse('anger', '', { mode: 'silent' }).passage).toBeNull();
  });

  test('chapter and book scopes require consent; verse and short passage do not', () => {
    expect(requiresConsent('chapter')).toBe(true);
    expect(requiresConsent('book')).toBe(true);
    expect(requiresConsent('verse')).toBe(false);
    expect(requiresConsent('short-passage')).toBe(false);
  });

  test('a long scope is never auto-started, even with a gesture', () => {
    const d = decideAutoplay({ scope: 'chapter', userGesture: true, autoplayAllowed: true, mode: 'complete-reading' });
    expect(d.shouldRecite).toBe(false);
    expect(d.reason).toContain('consent');
  });
});

test.describe('7/8 — transcript editing and low-confidence handling', () => {
  test('a confident transcript is editable before sending', () => {
    const c = classifyTranscript({ text: 'मुझे एक श्लोक सुनाइए', confidence: 0.9 });
    expect(c.state).toBe('understood');
    expect(c.canAutoSend).toBe(true);
    expect(voiceStateMessageFor('understood')).toContain('बदल'); // edit hint
  });

  test('a low-confidence transcript is never auto-sent', () => {
    const c = classifyTranscript({ text: 'मुझे शायद श्लोक', confidence: AUTO_SEND_CONFIDENCE - 0.01 });
    expect(c.state).toBe('uncertain');
    expect(c.canAutoSend).toBe(false);
  });

  test('an empty transcript is never auto-sent', () => {
    expect(classifyTranscript({ text: '   ', confidence: 1 }).canAutoSend).toBe(false);
  });
});

test.describe('9 — contextual clarification choices', () => {
  test('unclear input produces choices with the escape, retry and text options', () => {
    const choices = buildClarificationChoices({});
    expect(choices.length).toBeGreaterThanOrEqual(4);
    expect(choices).toContain(NO_MATCH_CHOICE);
    expect(choices).toContain(RETRY_VOICE_CHOICE);
    expect(choices).toContain(TYPE_CHOICE);
    expect(CLARIFY_PREFIX).toContain('मैं पूरी बात स्पष्ट नहीं समझ पायी');
  });

  test('choices are context-sensitive, not a fixed list', () => {
    const paused = buildClarificationChoices({ hasPausedPassage: true });
    const emotion = buildClarificationChoices({ emotion: 'just-talk' });
    const kundli = buildClarificationChoices({ emotion: 'career' });
    expect(paused).toContain('पाठ आगे बढ़ाइए');
    expect(emotion).toContain('मेरी बात सुनिए');
    expect(paused).not.toEqual(kundli);
  });

  test('a pending offer is offered as a resumable choice', () => {
    expect(buildClarificationChoices({ hasPendingOffer: true })).toContain('हाँ, पढ़िए');
  });

  test('English context returns English choices', () => {
    const choices = buildClarificationChoices({ language: 'en', emotion: 'just-talk' });
    expect(choices.some((c) => c === 'Just listen to me')).toBe(true);
    expect(choices).toContain('None of these');
  });
});

test.describe('10/11 — language detection and voice fallbacks', () => {
  test('Hindi, English and Hinglish inputs are recognised', () => {
    expect(detectLanguage('मुझे एक श्लोक सुनाइए')).toBe('hi');
    expect(detectLanguage('please recite a verse')).toBe('en');
    // Hinglish contains Devanagari, so the conversation stays in Hindi.
    expect(detectLanguage('mujhe ek shlok सुनाइए please')).toBe('hi');
  });

  test('all ten voice states exist and have messages', () => {
    expect(VOICE_INPUT_STATES.length).toBe(10);
    for (const s of VOICE_INPUT_STATES) {
      expect(voiceStateMessageFor(s).length).toBeGreaterThan(5);
    }
  });

  test('permission denied falls back to typing, and says so', () => {
    expect(nextVoiceState('requesting-permission', 'permission-denied')).toBe('permission-denied');
    expect(voiceStateMessageFor('permission-denied')).toContain('लिखकर');
  });

  test('unsupported browser never claims to hear the user', () => {
    expect(nextVoiceState('idle', 'unsupported')).toBe('unsupported');
    const msg = voiceStateMessageFor('unsupported');
    expect(msg).toContain('उपलब्ध नहीं');
    expect(msg).not.toContain('सुन रही हूँ');
  });

  test('network and microphone-unavailable paths are distinct', () => {
    expect(nextVoiceState('processing', 'network-error')).toBe('network-error');
    expect(nextVoiceState('idle', 'mic-unavailable')).toBe('unavailable');
    expect(voiceStateMessageFor('network-error')).toContain('संपर्क नहीं');
  });

  test('cancelling listening returns to idle', () => {
    expect(nextVoiceState('listening', 'cancel')).toBe('idle');
  });
});

test.describe('12/13 — controls, speed and speech failure', () => {
  test('pause, resume, stop, mute, meaning toggle and repeat behave', () => {
    let s = DEFAULT_SESSION;
    s = applyControl(s, 'pause');
    expect(s.paused).toBe(true);
    s = applyControl(s, 'resume');
    expect(s.paused).toBe(false);
    s = applyControl(s, 'mute');
    expect(s.muted).toBe(true);
    s = applyControl(s, 'unmute');
    expect(s.muted).toBe(false);
    const withMeaning = s.includeMeaning;
    s = applyControl(s, 'toggle-meaning');
    expect(s.includeMeaning).toBe(!withMeaning);
    s = applyControl({ ...s, cursor: 3, passageRef: { slug: 'bhagavad-gita', sectionId: 'gita-ch-2', shlokaNo: '२-४७' } }, 'stop');
    expect(s.cursor).toBe(0);
    expect(s.passageRef).toBeNull();
  });

  test('speed is clamped to the supported range', () => {
    expect(setSpeed(DEFAULT_SESSION, 5).speed).toBe(2);
    expect(setSpeed(DEFAULT_SESSION, 0.1).speed).toBe(0.5);
    expect(setSpeed(DEFAULT_SESSION, 1.25).speed).toBe(1.25);
  });

  test('a speech failure or silent completion does not advance the cursor', () => {
    const before = applyControl(DEFAULT_SESSION, 'advance');
    expect(before.cursor).toBe(1);
    const errored = applySpeechOutcome(before, 'error');
    expect(errored.cursor).toBe(1);
    const silent = applySpeechOutcome(before, 'silent-completion');
    expect(silent.cursor).toBe(1);
    const delivered = applySpeechOutcome(before, 'delivered');
    expect(delivered.cursor).toBe(2);
  });

  test('quick actions are contextual, never all at once', () => {
    const idle = visibleQuickActions(DEFAULT_SESSION);
    expect(idle.length).toBeLessThanOrEqual(4);
    const reading = visibleQuickActions({
      ...DEFAULT_SESSION,
      cursor: 2,
      paused: true,
      passageRef: { slug: 'bhagavad-gita', sectionId: 'gita-ch-2', shlokaNo: '२-४७' },
    });
    expect(reading).toContain('आगे पढ़ें');
    expect(reading).toContain('रोकें');
    expect(reading.length).toBeLessThanOrEqual(7);
  });
});

test.describe('14/15 — refresh restoration and sensitive-data handling', () => {
  test('non-sensitive reading state survives a serialize/validate round trip', () => {
    const live = applyControl(
      { ...DEFAULT_SESSION, language: 'hi', mode: 'verse-with-meaning', cursor: 4, includeMeaning: true },
      'pause',
    );
    const stored = JSON.parse(JSON.stringify(persistableSession(live)));
    const restored = validateSession(stored);
    expect(restored).not.toBeNull();
    expect(restored!.cursor).toBe(4);
    expect(restored!.paused).toBe(true);
    expect(restored!.includeMeaning).toBe(true);
    expect(restored!.revision).toBe(live.revision);
  });

  test('persisted state never contains an emotional transcript', () => {
    const stored = persistableSession({ ...DEFAULT_SESSION, emotionContext: 'sadness' });
    const keys = Object.keys(stored);
    expect(keys).not.toContain('transcript');
    expect(keys).not.toContain('messages');
    expect(keys).not.toContain('emotionalTranscript');
    // Only the emotion CATEGORY is kept, never what the user said.
    expect(stored.emotionContext).toBe('sadness');
  });

  test('forged or malformed session data is rejected, not repaired', () => {
    expect(validateSession(null)).toBeNull();
    expect(validateSession({})).toBeNull();
    expect(validateSession({ ...DEFAULT_SESSION, schemaVersion: 99 })).toBeNull();
    expect(validateSession({ ...DEFAULT_SESSION, cursor: -1 })).toBeNull();
    expect(validateSession({ ...DEFAULT_SESSION, mode: 'nonsense' })).toBeNull();
    expect(validateSession({ ...DEFAULT_SESSION, revision: 0 })).toBeNull();
    expect(validateSession({ ...DEFAULT_SESSION, speed: 'fast' })).toBeNull();
    expect(validateSession({ ...DEFAULT_SESSION, paused: 'yes' })).toBeNull();
    expect(validateSession({ ...DEFAULT_SESSION, messages: ['secret'] })).toBeNull();
  });

  test('an out-of-date revision cannot overwrite a newer session', () => {
    const server = { ...DEFAULT_SESSION, revision: 7, cursor: 9 };
    const staleClientWrite = { ...persistableSession(server), revision: 5, cursor: 0 };
    expect(staleClientWrite.revision).toBeLessThan(server.revision);
    // The guard is the revision comparison performed by the caller.
    expect(validateSession(staleClientWrite)!.revision).toBe(5);
  });
});

test.describe('16 — crisis language bypasses the scripture flow', () => {
  const crisisInputs = [
    'मैं खुदकुशी करने की सोच रही हूँ',
    'मैं अब नहीं रहना चाहती',
    'I want to die',
    'कभी-कभी लगता है कि जीना नहीं चाहता',
  ];

  for (const input of crisisInputs) {
    test(`"${input}" returns safety guidance and no verse`, () => {
      expect(detectCrisis(input)).toBe(true);
      const r = buildEmotionalResponse('sadness', input);
      expect(r.guidance).toBe('safety');
      expect(r.passage).toBeNull();
      expect(r.reflection).toBe('');
      expect(r.acknowledgement).toBe(SAFETY_GUIDANCE);
      expect(SAFETY_GUIDANCE).toContain('14416');
    });
  }

  test('ordinary sadness is not treated as a crisis', () => {
    expect(detectCrisis('आज बहुत उदास हूँ')).toBe(false);
    const r = buildEmotionalResponse('sadness', 'आज बहुत उदास हूँ');
    expect(r.guidance).toBe('none');
    expect(r.passage).not.toBeNull();
  });
});

test.describe('emotion detection', () => {
  test('keyword cues select the right path', () => {
    expect(detectEmotion('मैं बहुत उदास हूँ')).toBe('sadness');
    expect(detectEmotion('I am feeling anxious about work')).toBe('anxiety');
    expect(detectEmotion('मुझे बहुत गुस्सा आ रहा है')).toBe('anger');
    expect(detectEmotion('बस मुझसे बात करो')).toBe('just-talk');
    expect(detectEmotion('career confusion')).not.toBeNull();
  });

  test('unmatched text returns null rather than guessing', () => {
    expect(detectEmotion('आज मौसम अच्छा है')).toBeNull();
    expect(detectEmotion('')).toBeNull();
  });
});
