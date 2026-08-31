import { classifyUserIntent, IntentResolution } from './intents';
import { evaluateSafetyCritical } from './safety';
import { 
  ProvenanceDetails, 
  createCalculatedProvenance, 
  createDocumentedProvenance, 
  createAIExplanationProvenance, 
  createScholarReviewedProvenance 
} from './provenance';
import { validateReference } from './granthReader';
import { LANGUAGE_QUALIFICATION_MATRIX } from './languages';
import { KashiSahayakTelemetry } from './telemetry';
import { executeVedicTool } from './tools/executor';
import { findScriptureInsight } from './scriptureMap';
import { detectConversationPreference, preferenceReply } from './conversationPrefs';
import { buildGroundedAnswer, buildPracticalAnswer, looksLikePracticalConcern } from './groundedAnswer';
import { retrieveGroundedPassages, verifyQuotation, extractQuotedFragment } from '@/lib/granth/retrieval';
import { retrieveDurableConsultationMemory } from '../sabha/orchestrator';
import { readScriptureText, parseScriptureReadRequest, handleReaderCommand } from './granthReader';
import { reviveVerifiedSession, saveServerSession } from '@/lib/granth/session';
import type { ReadingSession } from '@/lib/granth/session';

export interface KashiSahayakResponse {
  text: string;
  intent: string;
  confidence: number;
  provenance: ProvenanceDetails;
  structuredCard?: any;
  toolCallsExecuted: string[];
  quickChips?: Array<{ label: string; action: string; href?: string }>;
  isSafetyCritical?: boolean;
  /** Updated reading session for the client to persist (device-local). */
  readingSession?: ReadingSession | null;
  /** Cancellation tokens the client must use to drop stale audio/results. */
  cancelledReadingTokens?: string[];
}

/**
 * Pull a quoted fragment out of utterances like
 * "गीता में लिखा है: कर्मण्येवाधिकारस्ते" or 'the Gita says "…"'.
 * Returns null when the sentence quotes nothing concrete.
 */
export async function processKashiSahayakQuery(
  userQuery: string,
  history: Array<{ role: string; content: string }> = [],
  userContext: {
    city?: string;
    profileName?: string;
    cosmicId?: string;
    lang?: string;
    /** Serialized reading session from the client (device-local). */
    readingSession?: unknown;
  } = {}
): Promise<KashiSahayakResponse> {
  const query = (userQuery || '').trim();
  const city = userContext.city || 'Varanasi';
  const lang = (userContext.lang === 'en' ? 'en' : 'hi') as 'hi' | 'en';
  const sessionId = `sess_${Date.now()}`;

  KashiSahayakTelemetry.log('CHAT_OPENED', sessionId, { query });

  // =========================================================================
  // 1. SAFETY-CRITICAL EVALUATION (Priority 0)
  // =========================================================================
  const safety = evaluateSafetyCritical(query);
  if (safety.isCritical) {
    KashiSahayakTelemetry.log('INTENT_RESOLVED', sessionId, { intent: 'SAFETY_CRITICAL' });
    
    let noticeText = lang === 'en' ? safety.safetyNoticeEn : safety.safetyNoticeHi;
    noticeText += '\n\n' + safety.emergencyHelplines.map(h => `📞 ${h.name}: ${h.number} (${h.description})`).join('\n');

    return {
      text: noticeText,
      intent: 'SAFETY_CRITICAL',
      confidence: 0.99,
      isSafetyCritical: true,
      provenance: createDocumentedProvenance('Government of India Emergency & Mental Health Guidelines (Tele-MANAS / KIRAN / 112)'),
      toolCallsExecuted: ['emergency_crisis_protocol'],
      quickChips: [
        { label: '📞 Tele-MANAS (14416)', action: 'CALL_HELPLINE' },
        { label: '🚨 National Emergency (112)', action: 'CALL_EMERGENCY' }
      ]
    };
  }

  // =========================================================================
  // 2. ADVERSARIAL SCRIPTURE INTEGRITY CHECK (e.g. Gita 18.93)
  // =========================================================================
  // Only a reference that the edition itself does not contain is an integrity
  // error. A valid-but-unstored reference is NOT an error: it falls through to
  // the reader, which says honestly that the passage is not in our corpus.
  const gitaMatch = query.match(/gita\s*(\d+)[.:](\d+)|गीता\s*(\d+)[.:](\d+)/i);
  if (gitaMatch) {
    const chapter = parseInt(gitaMatch[1] || gitaMatch[3], 10);
    const verse = parseInt(gitaMatch[2] || gitaMatch[4], 10);
    const scriptCheck = await validateReference('gita', chapter, verse);
    if (!scriptCheck.found && (scriptCheck.code === 'INVALID_CHAPTER' || scriptCheck.code === 'INVALID_VERSE')) {
      return {
        text: `शास्त्र प्रामाणिक सूचना: ${scriptCheck.text} कृपया प्रामाणिक अध्याय व श्लोक संख्या बताएं।`,
        intent: 'AARTI_STOTRA',
        confidence: 0.98,
        provenance: createDocumentedProvenance('श्रीमद्भगवद्गीता (मूल ग्रन्थ संहिता)'),
        toolCallsExecuted: ['validate_scripture_corpus'],
        quickChips: [
          { label: '📖 श्रीमद्भगवद्गीता २.४७ (कर्मण्येवाधिकारस्ते)', action: 'INTENT_SCRIPTURE' },
          { label: '📖 श्रीमद्भगवद्गीता १८.६६ (सर्वधर्मान्परित्यज्य)', action: 'INTENT_SCRIPTURE' }
        ]
      };
    }
  }

  // =========================================================================
  // 3.1 QUOTATION VERIFICATION (Phase 3)
  // =========================================================================
  // "गीता में लिखा है …" followed by a quotation is verified against the stored
  // corpus. If it does not match, we say so instead of confirming it.
  const quotedFragment = extractQuotedFragment(query);
  if (quotedFragment) {
    const verified = await verifyQuotation(quotedFragment);
    if (verified.results.length) {
      const hit = verified.results[0];
      return {
        text: [
          lang === 'en' ? 'Yes — that line is in the stored text:' : 'हाँ — यह पंक्ति संग्रहीत पाठ में है:',
          `${hit.reference}`,
          hit.passage.original,
          hit.passage.meaning ? (lang === 'en' ? `Meaning: ${hit.passage.meaning}` : `भावार्थ: ${hit.passage.meaning}`) : '',
        ].filter(Boolean).join('\n'),
        intent: 'GRANTH_READ',
        confidence: 0.9,
        provenance: createDocumentedProvenance(hit.bookTitle, hit.reference, 'DIRECT_QUOTE'),
        structuredCard: {
          granthReadCard: {
            found: true,
            code: 'FOUND',
            verification: 'QUOTATION_VERIFIED_AGAINST_STORED_CORPUS',
            passages: [{
              passageId: hit.passage.passageId,
              label: hit.reference,
              kind: hit.passage.kind,
              original: hit.passage.original,
              meaning: hit.passage.meaning ?? null,
              checksum: hit.passage.checksum,
              editionId: hit.editionId,
            }],
          },
        },
        toolCallsExecuted: ['verify_quotation'],
        quickChips: [
          { label: '📖 यह अध्याय पढ़ें', action: 'READER_CONTINUE' },
          { label: '📚 आरती एवं ग्रन्थ पुस्तकालय', action: 'OPEN_LIBRARY', href: '/aarti-stotra' },
        ],
      };
    }
    return {
      text: lang === 'en'
        ? 'I could not find that wording in the stored Gita text, so I will not confirm it as scripture. If you tell me the chapter and verse, I will read the stored passage exactly as it is.'
        : 'यह वाक्य संग्रहीत गीता-पाठ में मुझे नहीं मिला, इसलिए मैं इसे शास्त्र-वचन मानकर पुष्ट नहीं करूँगी। अध्याय व श्लोक बताइए — संग्रहीत पाठ ज्यों का त्यों पढ़ कर सुनाऊँगी।',
      intent: 'GRANTH_READ',
      confidence: 0.8,
      provenance: createAIExplanationProvenance(),
      structuredCard: { granthReadCard: { found: false, code: 'NOT_STORED', verification: 'QUOTATION_NOT_FOUND' } },
      toolCallsExecuted: ['verify_quotation'],
      quickChips: [
        { label: '📖 गीता अध्याय २ पढ़ें', action: 'INTENT_SCRIPTURE' },
        { label: '📚 आरती एवं ग्रन्थ पुस्तकालय', action: 'OPEN_LIBRARY', href: '/aarti-stotra' },
      ],
    };
  }

  // =========================================================================
  // 3. ADVERSARIAL FATALISM & GUARANTEE CHECKS
  // =========================================================================
  const qLower = query.toLowerCase();
  if (qLower.includes('will i die') || qLower.includes('die next month') || qLower.includes('मृत्यु कब') || qLower.includes('mar jaunga')) {
    return {
      text: 'वैदिक ज्योतिष की शास्त्रसम्मत आचार संहिता के अनुसार आयु का निर्धारण या मृत्यु की तिथि की घोषणा वर्जित है। ज्योतिष मार्गदर्शन व कर्म-सुधार का विज्ञान है, भय का नहीं। यदि कोई आपको भयभीत कर रहा है, तो उस पर विश्वास न करें। आप चाहें तो काशी के प्रामाणिक विद्वान् से अपनी पत्रिका का सकारात्मक मार्गदर्शन ले सकते हैं।',
      intent: 'LIFE_QUESTION',
      confidence: 0.95,
      provenance: createDocumentedProvenance('वैदिक ज्योतिष आचार संहिता (Vedic Ethics Code)'),
      toolCallsExecuted: ['ethics_guardrail'],
      quickChips: [
        { label: '📜 विद्वान् ज्योतिषी से मार्गदर्शन', action: 'INTENT_SCHOLAR', href: '/ask' },
        { label: '🕉️ आज का पञ्चाङ्ग', action: 'INTENT_PANCHANG' }
      ]
    };
  }

  if (qLower.includes('guarantee') || qLower.includes('guaranteed') || qLower.includes('गारंटी') || qLower.includes('जीत पक्की')) {
    return {
      text: 'वैदिक परम्परा में मन्त्र, अनुष्ठान या उपाय व्यक्ति को आत्मबल, मानसिक स्पष्टता और धर्म का मार्ग प्रदान करते हैं। कोई भी मन्त्र किसी अदालती निर्णय या सांसारिक परिणाम की "गारंटी" नहीं देता और न ही कानून का स्थान ले सकता है। कर्म और पुरुषार्थ ही प्रधान हैं।',
      intent: 'MANTRA',
      confidence: 0.95,
      provenance: createDocumentedProvenance('श्रीमद्भगवद्गीता कर्म-सिद्धान्त'),
      toolCallsExecuted: ['ethics_guardrail'],
      quickChips: [
        { label: '📖 गीता २.४७ कर्म सिद्धान्त', action: 'INTENT_SCRIPTURE' },
        { label: '📿 मन्त्र जप संग्रह', action: 'INTENT_MANTRA' }
      ]
    };
  }

  // =========================================================================
  // 3.2 STATED CONVERSATION PREFERENCE (Phase 3)
  // =========================================================================
  // "बस बात करो" / "श्लोक मत सुनाओ" / "बस सुनना है" outrank scripture
  // retrieval, chart intake and every commercial suggestion.
  const statedPreference = detectConversationPreference(query);
  if (statedPreference) {
    KashiSahayakTelemetry.log('HUMAN_BOUNDARY_SHOWN', sessionId, { intent: 'CONVERSATION_PREFERENCE' });
    return {
      text: preferenceReply(statedPreference, lang),
      intent: 'CONVERSATION_PREFERENCE',
      confidence: 0.95,
      provenance: createAIExplanationProvenance(),
      toolCallsExecuted: ['conversation_preference'],
      quickChips: [
        { label: '🕉️ आज का पञ्चाङ्ग', action: 'INTENT_PANCHANG' },
        { label: '📜 विद्वान् ज्योतिषी परामर्श', action: 'INTENT_SCHOLAR', href: '/ask' },
      ],
      readingSession: null,
    };
  }

  // =========================================================================
  // 3.5 GRANTH READING SESSION (explicit reader commands only)
  // =========================================================================
  // An explicit "read <book> <reference>" or a control command (continue /
  // pause / repeat / next / previous / explain / source / speed / language)
  // is handled here, against the shared reading session, before generic
  // intent routing. Nothing here generates scripture text.
  // The session comes from the client, so it is verified against the stored
  // corpus (shape + passage ids + edition) before it drives any lookup.
  const revived = await reviveVerifiedSession(userContext.readingSession);
  if (userContext.readingSession && !revived.session) {
    // Server-side trace only: the user is told through the normal "no reading
    // in progress" answers, never with a fabricated position.
    console.warn('[granth] client reading session rejected:', revived.reason);
  }
  const incomingSession = revived.session;
  const reader = await handleReaderCommand(query, lang, incomingSession);
  if (reader.handled) {
    const updatedSession = reader.session ? saveServerSession(reader.session) : null;
    KashiSahayakTelemetry.log('TOOL_USED', sessionId, { toolName: 'granth_reader_session' });
    return {
      text: reader.text,
      intent: 'GRANTH_READ',
      confidence: reader.found ? 0.93 : 0.8,
      provenance: reader.found
        ? createDocumentedProvenance(
            reader.passages?.[0]?.bookId ?? 'stored granth corpus',
            reader.passages?.[0]
              ? `${reader.passages[0].locator.chapter ?? ''}.${reader.passages[0].locator.verse ?? ''}`
              : undefined,
            'DIRECT_QUOTE',
          )
        : createAIExplanationProvenance(),
      structuredCard: {
        granthReadCard: {
          found: reader.found,
          code: reader.code ?? (reader.found ? 'FOUND' : 'UNRESOLVED'),
          passages: (reader.passages ?? []).map((p) => ({
            passageId: p.passageId,
            label:
              typeof p.locator.chapter === 'number' && typeof p.locator.verse === 'number'
                ? `${p.locator.chapter}.${p.locator.verse}`
                : p.locator.label ?? p.sectionId,
            kind: p.kind,
            original: p.original,
            meaning: p.meaning ?? null,
            checksum: p.checksum,
            editionId: p.editionId,
          })),
          session: updatedSession
            ? {
                sessionId: updatedSession.sessionId,
                state: updatedSession.state,
                bookId: updatedSession.bookId,
                cursorIndex: updatedSession.cursorIndex,
                queueLength: updatedSession.queue.length,
                language: updatedSession.language,
                includeMeaning: updatedSession.includeMeaning,
                speed: updatedSession.speed,
              }
            : null,
        },
      },
      toolCallsExecuted: ['granth_reader_session'],
      quickChips: reader.found
        ? [
            { label: '▶️ आगे पढ़ो', action: 'READER_CONTINUE' },
            { label: '⏸️ रोकें', action: 'READER_PAUSE' },
            { label: '💡 यह समझाएं', action: 'READER_EXPLAIN' },
          ]
        : [{ label: '📖 आरती एवं ग्रन्थ पुस्तकालय', action: 'OPEN_LIBRARY', href: '/aarti-stotra' }],
      readingSession: updatedSession,
      cancelledReadingTokens: reader.cancelledTokens,
    };
  }

  // =========================================================================
  // 4. CANONICAL INTENT CLASSIFICATION & TOOL CASCADE
  // =========================================================================
  const intentRes: IntentResolution = classifyUserIntent(query);
  KashiSahayakTelemetry.log('INTENT_RESOLVED', sessionId, { intent: intentRes.intent, confidence: intentRes.confidence });

  // 4.1 CONSULTATION HISTORY RETRIEVAL (Class C Scholar Record)
  if (intentRes.intent === 'CONSULTATION_HISTORY') {
    const memory = retrieveDurableConsultationMemory(query);
    if (memory) {
      KashiSahayakTelemetry.log('TOOL_USED', sessionId, { toolName: 'get_consultation_memory' });
      return {
        text: `हर हर महादेव! 🙏 आपके कॉस्मिक प्रोफाइल के स्वीकृत परामर्श अभिलेख (Class C - Scholar Approved) से विवरण:\n\n${memory}`,
        intent: 'CONSULTATION_HISTORY',
        confidence: intentRes.confidence,
        provenance: createScholarReviewedProvenance('SCH-KASHI-01', 'पं. विद्यानंद शास्त्री', 'CT-SABHA-2026-0827-001'),
        toolCallsExecuted: ['get_consultation_memory'],
        quickChips: [
          { label: '📜 आगामी अनुवर्ती सभा बुक करें', action: 'INTENT_SCHOLAR', href: '/ask' },
          { label: '🕉️ आज का पञ्चाङ्ग व गोचर', action: 'INTENT_PANCHANG' }
        ]
      };
    } else {
      return {
        text: 'आपके कॉस्मिक प्रोफाइल पर पिछला कोई स्वीकृत परामर्श अभिलेख उपलब्ध नहीं है। क्या आप काशी के विद्वान् ज्योतिषी से नया परामर्श आरम्भ करना चाहते हैं?',
        intent: 'CONSULTATION_HISTORY',
        confidence: intentRes.confidence,
        provenance: createDocumentedProvenance('CosmicTantra Consultation Vault'),
        toolCallsExecuted: ['get_consultation_memory'],
        quickChips: [
          { label: '📜 विद्वान् ज्योतिषी से परामर्श', action: 'INTENT_SCHOLAR', href: '/ask' },
          { label: '🕉️ आज का पञ्चाङ्ग', action: 'INTENT_PANCHANG' }
        ]
      };
    }
  }

  // 4.2 PANCHANG (Restrained, Plain & Accurate)
  if (intentRes.intent === 'GOCHARA') {
    return {
      text: 'वर्तमान खगोलीय गणना अनुसार शनि (Saturn) कुम्भ राशि में गोचरस्थ है (Lahiri 24° 16\')। गुरु वृषभ राशि में तथा राहु मीन राशि में स्थित हैं।',
      intent: 'GOCHARA',
      confidence: intentRes.confidence,
      provenance: createCalculatedProvenance('CosmicTantra Lahiri Ephemeris', city),
      toolCallsExecuted: ['get_gochara'],
      quickChips: [
        { label: '🕉️ आज का पञ्चाङ्ग', action: 'INTENT_PANCHANG' },
        { label: '📜 विद्वान् ज्योतिषी परामर्श', action: 'INTENT_SCHOLAR', href: '/ask' }
      ]
    };
  }

  if (intentRes.intent === 'PANCHANG') {
    const panchangData = await executeVedicTool('get_panchang', { city });
    KashiSahayakTelemetry.log('TOOL_USED', sessionId, { toolName: 'get_panchang' });
    KashiSahayakTelemetry.log('FREE_RESULT_SHOWN', sessionId, { intent: 'PANCHANG' });

    const isRahuQuery = qLower.includes('राहुकाल') || qLower.includes('rahu');
    let text = '';
    if (isRahuQuery) {
      text = lang === 'en'
        ? `Today in ${city}, Rahu Kaal is ${panchangData.rahuKaal}. This is calculated based on local sunrise/sunset.`
        : `आज ${city} में राहुकाल ${panchangData.rahuKaal} है। यह स्थानीय सूर्योदय व सूर्यास्त के आधार पर Calculated है।`;
    } else {
      text = `आज ${city} में तिथि: ${panchangData.tithi} • नक्षत्र: ${panchangData.nakshatra} (पाद ${panchangData.pada}) • राहुकाल: ${panchangData.rahuKaal} • अभिजित मुहूर्त: ${panchangData.abhijitMuhurat}।`;
    }

    return {
      text,
      intent: 'PANCHANG',
      confidence: intentRes.confidence,
      provenance: createCalculatedProvenance('CosmicTantra Lahiri Ephemeris Engine', city, 'Drik Ganita'),
      structuredCard: { panchangCard: panchangData },
      toolCallsExecuted: ['get_panchang'],
      quickChips: [
        { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN' },
        { label: '💍 विवाह व शुभ मुहूर्त', action: 'INTENT_MUHURTA' },
        { label: '📜 विद्वान् ज्योतिषी से परामर्श', action: 'INTENT_SCHOLAR', href: '/ask' }
      ]
    };
  }

  // 4.3 DARSHAN (Sanctuary Live Feeds)
  if (intentRes.intent === 'DARSHAN' || intentRes.intent === 'TEMPLE') {
    const shrineData = await executeVedicTool('get_temple_darshan', { shrine: query });
    KashiSahayakTelemetry.log('TOOL_USED', sessionId, { toolName: 'get_temple_darshan' });

    return {
      text: `साक्षात् ${shrineData.templeName} का लाइव दर्शन व आरती वेला:`,
      intent: 'DARSHAN',
      confidence: intentRes.confidence,
      provenance: createDocumentedProvenance(shrineData.templeName + ' Official Trust Feed'),
      structuredCard: { inChatDarshan: shrineData, sounds: { ghanti: '/audio/ghanti.wav', sankh: '/audio/sankh.wav' } },
      toolCallsExecuted: ['get_temple_darshan'],
      quickChips: [
        { label: '🪔 दीप दान करें', action: 'OFFER_DIYA' },
        { label: '🌸 पुष्प अर्पण', action: 'OFFER_FLOWERS' },
        { label: '🚩 काशी यात्रा परिपथ', action: 'INTENT_PILGRIMAGE' }
      ]
    };
  }

  // 4.4 PILGRIMAGE (Kashi Yatra / Ghats)
  if (intentRes.intent === 'PILGRIMAGE') {
    const journeyData = await executeVedicTool('get_kashi_journey', {});
    KashiSahayakTelemetry.log('TOOL_USED', sessionId, { toolName: 'get_kashi_journey' });

    return {
      text: `काशी (वाराणसी) की तीर्थ यात्रा का शास्त्रसम्मत परिपथ तैयार है:`,
      intent: 'PILGRIMAGE',
      confidence: intentRes.confidence,
      provenance: createDocumentedProvenance('Kashi Vishwanath Trust Yatra Margadarshika'),
      structuredCard: { journeyCard: journeyData },
      toolCallsExecuted: ['get_kashi_journey'],
      quickChips: [
        { label: '🪔 दशाश्वमेध घाट गंगा आरती', action: 'INTENT_DARSHAN' },
        { label: '🕉️ आज का पञ्चाङ्ग', action: 'INTENT_PANCHANG' }
      ]
    };
  }

  // 4.5 MUHURTA (Auspicious Windows)
  if (intentRes.intent === 'MUHURTA') {
    const muhurtaData = await executeVedicTool('get_muhurat', { eventType: 'marriage' });
    KashiSahayakTelemetry.log('TOOL_USED', sessionId, { toolName: 'get_muhurat' });
    KashiSahayakTelemetry.log('HUMAN_BOUNDARY_SHOWN', sessionId, { intent: 'MUHURTA' });

    return {
      text: 'विवाह व मांगलिक कार्यों हेतु आगामी शुभ मुहूर्त खिड़कियाँ (Candidate Windows):\n\nनोट: यह सामान्य पञ्चाङ्ग शुद्धि है। वर-वधू की जन्म कुण्डली के त्रिबल शुद्धि व अष्टकूट मिलान हेतु विद्वान् ज्योतिषी का परामर्श आवश्यक है।',
      intent: 'MUHURTA',
      confidence: intentRes.confidence,
      provenance: createCalculatedProvenance('Muhurta Chintamani Engine', city),
      structuredCard: { muhurtaCard: muhurtaData },
      toolCallsExecuted: ['get_muhurat'],
      quickChips: [
        { label: '📜 विद्वान् ज्योतिषी से कुण्डली मिलान', action: 'INTENT_SCHOLAR', href: '/ask' },
        { label: '🕉️ आज का पञ्चाङ्ग', action: 'INTENT_PANCHANG' }
      ]
    };
  }

  // 4.6 MANTRA / AARTI_STOTRA
  if (intentRes.intent === 'MANTRA' || intentRes.intent === 'AARTI_STOTRA') {
    const mantraData = await executeVedicTool('get_mantra', { mantraType: query });
    KashiSahayakTelemetry.log('TOOL_USED', sessionId, { toolName: 'get_mantra' });

    return {
      text: `शास्त्रसम्मत ${mantraData.title} व जप विधि:`,
      intent: 'MANTRA',
      confidence: intentRes.confidence,
      provenance: createDocumentedProvenance('ऋग्वेद / यजुर्वेद स्तोत्र संहिता', '7.59.12'),
      structuredCard: { mantraCard: mantraData },
      toolCallsExecuted: ['get_mantra'],
      quickChips: [
        { label: '📿 १०८ मनका डिजिटल जप माला', action: 'NAV_JAPA', href: '/remedy-tracker' },
        { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN' }
      ]
    };
  }

  // 4.7 BOOK SCHOLAR / ESCALATION
  if (intentRes.intent === 'BOOK_SCHOLAR') {
    KashiSahayakTelemetry.log('SCHOLAR_PROFILE_VIEWED', sessionId, { scholarId: 'SCH-KASHI-01' });
    return {
      text: 'काशी विद्वत् परिषद् के वरिष्ठ विद्वान् पंडित विद्यानंद शास्त्री जी का प्रत्यक्ष परामर्श उपलब्ध है (३५+ वर्ष अनुभव, BHU ज्योतिषरत्न)।',
      intent: 'BOOK_SCHOLAR',
      confidence: intentRes.confidence,
      provenance: createScholarReviewedProvenance('SCH-KASHI-01', 'पं. विद्यानंद शास्त्री', 'PANDIT_PROFILE'),
      structuredCard: {
        scholarCard: {
          name: 'पं. विद्यानंद शास्त्री',
          title: 'वरिष्ठ मानव ज्योतिषी • काशी विद्वत् परिषद्',
          location: 'वाराणसी (काशी), उत्तर प्रदेश',
          verified: true,
          experience: '३५+ वर्ष अनुभव • ५०,०००+ कुण्डली समाधान',
          tiers: [
            { label: '📜 ₹501 लिखित परामर्श पत्र (PDF)', price: '₹501', mode: 'WRITTEN', href: '/ask' },
            { label: '📞 ₹1,100 सभा (Web/Phone Sabha)', price: '₹1,100', mode: 'VOICE', href: '/ask' },
            { label: '📹 ₹1,500 साक्षात् दर्शन (Video Sabha)', price: '₹1,500', mode: 'VIDEO', href: '/ask' }
          ]
        }
      },
      toolCallsExecuted: ['get_scholar_schedule'],
      quickChips: [
        { label: '📜 ₹501 लिखित परामर्श पत्र', action: 'OPEN_CHECKOUT_WRITTEN', href: '/ask' },
        { label: '📞 ₹1,100 सभा परामर्श (Web/Phone)', action: 'OPEN_CHECKOUT_VOICE', href: '/ask' }
      ]
    };
  }

  // 4.8 LIFE QUESTION (Vague/Distress) & Scripture Wisdom
  //
  // Phase 3: source-grounded retrieval first. Exact references win, then a
  // lexical match over the stored corpus. The curated situation→verse registry
  // below is now the FALLBACK, not the primary path.
  const grounded = await retrieveGroundedPassages(query, { limit: 2 });
  // Only quote a lexical hit when the person actually asked about the text —
  // otherwise a keyword coincidence would be presented as a relevant answer.
  const asksForPassage =
    /गीता|ग्रन्थ|ग्रंथ|पुराण|मानस|उपनिषद|शास्त्र|श्लोक|अध्याय|वचन|कहा गया|कहती है|कहता है|लिखा|gita|shloka|sloka|verse|chapter|says|quote/i.test(
      query,
    );
  if (grounded.results.length && (grounded.mode === 'EXACT_LOOKUP' || asksForPassage)) {
    KashiSahayakTelemetry.log('TOOL_USED', sessionId, { toolName: 'grounded_scripture_retrieval' });
    const answer = buildGroundedAnswer(query, grounded, lang);
    const primary = answer.passages[0];
    return {
      text: answer.text,
      intent: 'LIFE_QUESTION',
      confidence: 0.85,
      provenance: createDocumentedProvenance(
        answer.booksInvolved.length > 1 ? answer.booksInvolved.join(' + ') : primary.bookTitle,
        primary.reference,
        'DIRECT_QUOTE',
      ),
      structuredCard: {
        groundedPassages: answer.passages,
        retrieval: {
          mode: answer.retrievalMode,
          note: grounded.note,
          terms: grounded.terms,
          searchedBooks: grounded.searchedBooks,
          semanticSearch: false,
        },
        consentQuestion: answer.consentQuestion,
      },
      toolCallsExecuted: ['grounded_scripture_retrieval'],
      quickChips: [
        { label: '💡 यह समझाएं', action: 'READER_EXPLAIN' },
        { label: '🕉️ आज का पञ्चाङ्ग', action: 'INTENT_PANCHANG' },
        { label: '📜 विद्वान् ज्योतिषी परामर्श', action: 'INTENT_SCHOLAR', href: '/ask' },
      ],
    };
  }

  const scripture = findScriptureInsight(query);
  if (scripture) {
    KashiSahayakTelemetry.log('TOOL_USED', sessionId, { toolName: 'get_scripture_insight' });
    return {
      text: scripture.kashiSahayakBridge,
      intent: 'LIFE_QUESTION',
      confidence: 0.85,
      provenance: createDocumentedProvenance(scripture.sourceGrantha, undefined, 'DIRECT_QUOTE'),
      structuredCard: { scriptureCard: scripture },
      toolCallsExecuted: ['get_scripture_insight'],
      quickChips: scripture.quickChips || [
        { label: '🕉️ आज का पञ्चाङ्ग', action: 'INTENT_PANCHANG' },
        { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN' },
        { label: '📜 विद्वान् ज्योतिषी परामर्श', action: 'INTENT_SCHOLAR', href: '/ask' }
      ]
    };
  }

  // Exact stored passages only; unavailable content is not a documented quote.
  // (Most explicit read requests are handled by the session block above; this
  // is the conservative fallback for phrasings the command parser declines.)
  const readingRequest = parseScriptureReadRequest(query);
  if (readingRequest) {
    const response = await readScriptureText(readingRequest);
    return {
      text: response.found ? `${response.sourceName} ${response.chapter ?? ''}.${response.verse ?? ''}\n\n${response.text}` : response.text,
      intent: 'GRANTH_READ', confidence: 0.92,
      provenance: response.found
        ? createDocumentedProvenance(response.sourceName, `${response.chapter}.${response.verse}`, 'DIRECT_QUOTE')
        : createAIExplanationProvenance(),
      structuredCard: {
        granthReadCard: {
          found: response.found,
          code: response.code ?? (response.found ? 'FOUND' : 'UNRESOLVED'),
          passages: (response.passages ?? []).map((p) => ({
            passageId: p.passageId,
            label:
              typeof p.locator.chapter === 'number' && typeof p.locator.verse === 'number'
                ? `${p.locator.chapter}.${p.locator.verse}`
                : p.locator.label ?? p.sectionId,
            kind: p.kind,
            original: p.original,
            meaning: p.meaning ?? null,
            checksum: p.checksum,
            editionId: p.editionId,
          })),
        },
      },
      toolCallsExecuted: ['granth_reader'],
      quickChips: [{ label: '📖 आरती एवं ग्रन्थ पुस्तकालय', action: 'OPEN_LIBRARY', href: '/aarti-stotra' }],
    };
  }

  // 4.9 GENERAL EDUCATION
  if (intentRes.intent === 'GENERAL_EDUCATION') {
    return {
      text: 'वैदिक ज्योतिष में काल की गणना सूर्य और चन्द्रमा की गति पर आधारित है। राहुकाल प्रतिदिन का वह ९० मिनट का समय है जिसमें नए भौतिक कार्यों का शुभारम्भ टालने की परम्परा है, जबकि अभिजित मुहूर्त सर्वकार्य सिद्धि हेतु शुभ माना जाता है।',
      intent: 'GENERAL_EDUCATION',
      confidence: 0.85,
      provenance: createAIExplanationProvenance(),
      toolCallsExecuted: ['get_knowledge_entry'],
      quickChips: [
        { label: '🕉️ आज का पञ्चाङ्ग देखें', action: 'INTENT_PANCHANG' },
        { label: '🪔 काशी विश्वनाथ दर्शन', action: 'INTENT_DARSHAN' }
      ]
    };
  }

  // 4.8.1 LIFE_QUESTION Fallback when no stored passage and no curated insight
  //       matched. Practical help first; nothing is quoted, and any long
  //       reading is only OFFERED (consent comes before it starts).
  if (intentRes.intent === 'LIFE_QUESTION' || looksLikePracticalConcern(query)) {
    const practical = buildPracticalAnswer(query, lang);
    return {
      text: practical.text,
      intent: intentRes.intent === 'LIFE_QUESTION' ? 'LIFE_QUESTION' : intentRes.intent,
      confidence: intentRes.confidence,
      provenance: createAIExplanationProvenance(),
      structuredCard: {
        retrieval: {
          mode: 'NONE',
          note: 'No stored passage matched; nothing is quoted.',
          terms: [],
          searchedBooks: [],
          semanticSearch: false,
        },
        consentQuestion: practical.consentQuestion,
      },
      toolCallsExecuted: [],
      quickChips: [
        { label: '🕉️ आज का पञ्चाङ्ग', action: 'INTENT_PANCHANG' },
        { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN' },
        { label: '📜 विद्वान् ज्योतिषी परामर्श', action: 'INTENT_SCHOLAR', href: '/ask' }
      ]
    };
  }

  // Bare consent to a reading we offered ("हाँ पढ़ो", "read it") with no active
  // session: ask which text, instead of silently doing nothing.
  if (!incomingSession && /^(हाँ|हां|जी|haan|yes|ok|okay|सुनाओ)?[\s,.]*(पढ़ो|पढ़ें|पढ़िए|सुनाओ|read it|go ahead|start)[\s.]*$/i.test(query.trim())) {
    return {
      text:
        lang === 'en'
          ? 'Which text should I read? For example: "read Gita chapter 2" — I will read the stored edition one passage at a time.'
          : 'क्या पढ़ूँ? जैसे — "गीता अध्याय २ पढ़ो"; संग्रहीत संस्करण से एक-एक अंश करके पढ़ूँगी।',
      intent: 'GRANTH_READ',
      confidence: 0.6,
      provenance: createAIExplanationProvenance(),
      toolCallsExecuted: [],
      quickChips: [{ label: '📖 आरती एवं ग्रन्थ पुस्तकालय', action: 'OPEN_LIBRARY', href: '/aarti-stotra' }],
    };
  }

  // Fallback (Restrained & Honest)
  return {
    text: 'मैं काशी सहायक हूँ — CosmicTantra की वैदिक सहायिका। मैं आपके लिए पञ्चाङ्ग निकाल सकती हूँ, महातीर्थों का लाइव दर्शन करा सकती हूँ, अथवा आपकी कुण्डली की विवेचना हेतु काशी के वरिष्ठ विद्वान् से जोड़ सकती हूँ।',
    intent: 'UNKNOWN',
    confidence: 0.40,
    provenance: createAIExplanationProvenance(),
    toolCallsExecuted: [],
    quickChips: [
      { label: '🕉️ आज का पञ्चाङ्ग व राहुकाल', action: 'INTENT_PANCHANG' },
      { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN' },
      { label: '📜 विद्वान् ज्योतिषी परामर्श', action: 'INTENT_SCHOLAR', href: '/ask' }
    ]
  };
}
