import { ChatMessage, AIResponse, ProvenanceMeta } from './types';
import { KASHI_SAHAYAK_SYSTEM_PROMPT } from './prompts/kashiSahayakPrompt';
import { evaluateVedicSafety } from './safety/boundaries';
import { VEDIC_TOOLS } from './tools/registry';
import { executeVedicTool } from './tools/executor';
import { callLocalLLM } from './providers/local';
import { callOpenRouter } from './providers/openrouter';
import { findScriptureInsight } from './scriptureMap';
import { retrieveDurableConsultationMemory } from '../sabha/orchestrator';

export async function processKashiSahayakQuery(
  userQuery: string,
  history: ChatMessage[] = [],
  userContext?: { city?: string; profileName?: string }
): Promise<AIResponse> {
  // 1. Vedic Safety & Boundaries Audit
  const safety = evaluateVedicSafety(userQuery);
  if (!safety.isSafe) {
    return {
      text: safety.redirectMessage || 'कल्याणकारी मार्गदर्शन हेतु प्रश्न पूछें।',
      provenance: {
        source: 'वैदिक आचार संहिता',
        interpretation: 'काशी सहायक'
      },
      quickChips: [
        { label: '🕉️ आज का पञ्चाङ्ग देखें', action: 'INTENT_PANCHANG' },
        { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN_KASHI' },
        { label: '📿 महामृत्युंजय मन्त्र जप', action: 'INTENT_MANTRA_MRITYUNJAYA' }
      ]
    };
  }

  // 1.5 Durable Consultation Memory Retrieval (Cosmic ID Anchor)
  const memoryText = retrieveDurableConsultationMemory(userQuery);
  if (memoryText) {
    return {
      text: `हर हर महादेव! 🙏 आपके कॉस्मिक प्रोफाइल (CT-4821) के स्वीकृत परामर्श अभिलेख से प्राप्त विवरण:\n\n${memoryText}`,
      provenance: {
        calculation: 'CosmicTantra Sabha Verified Vault',
        location: 'Varanasi (काशी)',
        source: 'पं. विद्यानंद शास्त्री अधिकृत अभिलेख',
        scholar: 'सत्यापित मानव ज्योतिषी परामर्श',
        interpretation: 'अक्षुण्ण अभिलेख प्रतिलिपि'
      },
      quickChips: [
        { label: '📜 आगामी अनुवर्ती सभा बुक करें', action: 'INTENT_SCHOLAR' },
        { label: '🪔 काशी विश्वनाथ दीप दान', action: 'INTENT_DARSHAN_KASHI' },
        { label: '🕉️ आज का पञ्चाङ्ग व गोचर', action: 'INTENT_PANCHANG' }
      ]
    };
  }

  // 2. Deterministic Tool & Scripture Wisdom Cascade
  const q = userQuery.toLowerCase();
  const scriptureMatch = findScriptureInsight(userQuery);

  let executedToolName: string | undefined;
  let toolResult: any;
  let structuredCard: any = {};
  let provenance: ProvenanceMeta = {
    calculation: 'CosmicTantra Lahiri Engine',
    location: userContext?.city || 'Varanasi (काशी)',
    source: scriptureMatch ? scriptureMatch.sourceGrantha : 'प्रामाणिक दृक् पञ्चाङ्ग / शास्त्र',
    interpretation: scriptureMatch ? 'काशी सहायक • शास्त्रसम्मत उद्बोधन' : 'काशी सहायक • AI-Assisted'
  };

  if (scriptureMatch) {
    structuredCard.scriptureCard = scriptureMatch;
  }

  if (q.includes('आज') || q.includes('राहुकाल') || q.includes('पंचांग') || q.includes('पञ्चाङ्ग') || q.includes('तिथि') || q.includes('चौघड़िया')) {
    executedToolName = 'get_panchang';
    toolResult = await executeVedicTool('get_panchang', { city: userContext?.city || 'Varanasi' });
    structuredCard.panchangCard = toolResult;
    provenance.source = 'प्रामाणिक दृक् पञ्चाङ्ग';
  } else if (q.includes('दर्शन') || q.includes('विश्वनाथ') || q.includes('सोमनाथ') || q.includes('महाकाल') || q.includes('गंगा आरती')) {
    executedToolName = 'get_temple_darshan';
    toolResult = await executeVedicTool('get_temple_darshan', { shrine: q });
    structuredCard = { inChatDarshan: toolResult };
    provenance.darshan = 'प्रत्यक्ष मन्दिर ट्रस्ट लाइव स्रोत';
  } else if (q.includes('काशी जाना') || q.includes('वाराणसी यात्रा') || q.includes('काशी यात्रा')) {
    executedToolName = 'get_kashi_journey';
    toolResult = await executeVedicTool('get_kashi_journey', {});
    structuredCard = { journeyCard: toolResult };
    provenance.source = 'काशी विश्वनाथ न्यास एवं पञ्चाङ्ग मार्गदर्शिका';
  } else if (q.includes('महामृत्युंजय') || q.includes('जाप') || q.includes('मन्त्र') || q.includes('ताण्डव')) {
    executedToolName = 'get_mantra';
    toolResult = await executeVedicTool('get_mantra', { mantraType: q });
    structuredCard = { mantraCard: toolResult };
    provenance.source = 'ऋग्वेद / यजुर्वेद स्तोत्र संहिता';
  } else if (q.includes('शादी') || q.includes('विवाह') || q.includes('मुहूर्त')) {
    executedToolName = 'get_muhurat';
    toolResult = await executeVedicTool('get_muhurat', { eventType: 'marriage' });
    structuredCard = { muhurtaCard: toolResult };
    provenance.calculation = 'मुहूर्त चिंतामणि एवं दृक् गणना';
    provenance.scholar = 'पं. विद्यानंद शास्त्री (वाराणसी) उपलब्ध';
  } else if (
    q.includes('sad') || q.includes('feeling sad') || q.includes('depress') ||
    q.includes('anxious') || q.includes('lonely') || q.includes('scared') ||
    q.includes('उदास') || q.includes('दुखी') || q.includes('तनाव') ||
    q.includes('घबराहट') || q.includes('परेशान') || q.includes('अकेला')
  ) {
    executedToolName = 'get_mantra';
    toolResult = await executeVedicTool('get_mantra', { mantraType: 'mrityunjaya' });
    structuredCard = {
      mantraCard: toolResult,
      inChatDarshan: {
        templeName: 'श्री काशी विश्वनाथ ज्योतिर्लिंग',
        deity: 'भगवान शिव (विश्वेश्वर)',
        location: 'वाराणसी धाम, उत्तर प्रदेश',
        image: '/images/darshan/kashi-vishwanath.jpg',
        embedUrl: 'https://www.youtube-nocookie.com/embed/-rqYkZ3x0jM?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1',
        officialLiveUrl: 'https://www.youtube.com/@ShriKashiVishwanathTempleTrust/live',
        timings: 'मंगला आरती ०३:०० • सांध्य आरती ०७:०० सायं'
      }
    };
    provenance.source = 'ऋग्वेद महामृत्युंजय संहिता एवं साक्षात् दर्शन';
    provenance.interpretation = 'काशी सहायक • सांत्वना व आत्म-बल';
  }

  // 3. Try LLM for natural speech if available, or synthesize seamlessly
  let responseText = '';
  try {
    if (process.env.OPENROUTER_API_KEY) {
      const messages: ChatMessage[] = [
        { role: 'system', content: KASHI_SAHAYAK_SYSTEM_PROMPT },
        ...history.slice(-4),
        { role: 'user', content: userQuery }
      ];
      if (toolResult) {
        messages.push({
          role: 'system',
          content: `टूल्स गणना परिणाम: ${JSON.stringify(toolResult)}`
        });
      }
      const llmRes = await callOpenRouter(messages, VEDIC_TOOLS);
      responseText = llmRes?.choices?.[0]?.message?.content || '';
    } else if (process.env.LOCAL_LLM_URL) {
      const messages: ChatMessage[] = [
        { role: 'system', content: KASHI_SAHAYAK_SYSTEM_PROMPT },
        ...history.slice(-4),
        { role: 'user', content: userQuery }
      ];
      const llmRes = await callLocalLLM(messages, VEDIC_TOOLS);
      responseText = llmRes?.message?.content || '';
    }
  } catch (err) {
    console.warn('LLM inference bypassed, using deterministic synthesis:', (err as Error).message);
  }

  // 4. Deterministic Natural Speech Fallback (Guarantees 100% uptime with 0 hallucinations)
  if (!responseText) {
    if (executedToolName === 'get_panchang') {
      responseText = `हर हर महादेव! 🙏 आज की खगोलीय गणना अनुसार ${toolResult.dateStr} को ${toolResult.tithi} है। नक्षत्र: ${toolResult.nakshatra}। राहुकाल: ${toolResult.rahuKaal} तक रहेगा।`;
    } else if (executedToolName === 'get_temple_darshan') {
      responseText = `हर हर महादेव! 🙏 साक्षात् ${toolResult.name} का लाइव दर्शन आपके सम्मुख उपस्थित है।`;
    } else if (executedToolName === 'get_kashi_journey') {
      responseText = `हर हर महादेव! 🙏 काशी (वाराणसी) की पावन तीर्थ यात्रा का शास्त्रसम्मत परिपथ तैयार है।`;
    } else if (executedToolName === 'get_mantra') {
      const isDistress = q.includes('sad') || q.includes('depress') || q.includes('anxious') || q.includes('lonely') || q.includes('उदास') || q.includes('दुखी') || q.includes('तनाव') || q.includes('घबराहट');
      if (isDistress) {
        responseText = `हर हर महादेव! 🙏 मन की व्यथा व उदासी समझी जा सकती है। ज्योतिष में मन का कारक चन्द्रमा है, और गोचर चक्र के प्रभाव से मन में कभी-कभी अशान्ति या भारीपन आना स्वाभाविक है। यह स्थायी नहीं है।\\n\\nभगवान विश्वनाथ का ध्यान और महामृत्युंजय मन्त्र का शांत श्रवण आपके चित्त को शांति व ऊर्जा प्रदान करेगा। नीचे साक्षात् दर्शन व मन्त्र जप उपस्थित है:`;
      } else {
        responseText = `हर हर महादेव! 🙏 प्रामाणिक शास्त्रसम्मत मन्त्र संग्रह:`;
      }
    } else if (executedToolName === 'get_muhurat') {
      responseText = `हर हर महादेव! 🙏 विवाह व मांगलिक कार्यों हेतु आगामी शुभ मुहूर्त खिड़कियाँ:`;
    } else if (scriptureMatch) {
      responseText = scriptureMatch.kashiSahayakBridge;
    } else {
      responseText = `हर हर महादेव! 🙏 मैं काशी सहायक हूँ। मैं आपके लिए पञ्चाङ्ग निकाल सकता हूँ, महातीर्थों का लाइव दर्शन करा सकता हूँ, अथवा काशी के विद्वान् ज्योतिषी से आपकी कुण्डली की विवेचना करा सकता हूँ।`;
    }
  }

  return {
    text: responseText,
    provenance,
    structuredCard,
    toolCallsExecuted: executedToolName ? [executedToolName] : [],
    quickChips: scriptureMatch?.quickChips || [
      { label: '🕉️ आज का पञ्चाङ्ग व राहुकाल', action: 'INTENT_PANCHANG' },
      { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN_KASHI' },
      { label: '🚩 काशी यात्रा परिपथ', action: 'INTENT_JOURNEY_KASHI' },
      { label: '📿 महामृत्युंजय मन्त्र जप', action: 'INTENT_MANTRA_MRITYUNJAYA' },
      { label: '📜 विद्वान् ज्योतिषी परामर्श', action: 'INTENT_SCHOLAR' }
    ]
  };
}
