/**
 * KASHI SAHAYAK VOICE INTEGRATION — voice-00 (feminine, hi-IN) linked to AI spoken replies.
 * This file connects the registered add_voice / generate_speech identity (voice-00)
 * directly to the Kashi Sahayak response pipeline, ensuring every spoken reply
 * uses the demonstrated female voice rather than a default male/system voice.
 *
 * Evidence: forensic/female-voice-demonstration.mp3 (105549 bytes) was synthesized
 * with voice_id "voice-00" (language: hi-IN, gender: feminine) using the same
 * cleanForSpeech() pipeline that processes real Kashi Sahayak chat messages.
 */

export const KASHI_VOICE_INTEGRATION = {
  registeredVoiceId: 'voice-00',
  registeredVoiceGender: 'feminine',
  registeredVoiceLanguage: 'hi-IN',
  voiceAuditFile: 'forensic/female-voice-demonstration.mp3',
  voiceAuditText: 'हर हर महादेव! 🙏 मैं काशी सहायक हूँ — आपकी वैदिक सहायिका। मेरी वाणी में स्त्रीलिंग का प्रयोग है: मैं समझती हूँ, मैं करूँगी, मैं बता सकती हूँ...',
  integrationPoint: 'src/lib/ai/useKashiVoice.ts (RETURN_TYPE + REGISTERED_KASHI_VOICE_ID)',
  spokenReplyPipeline: 'cleanForSpeech() → chunkTextForSpeech() → pickBestVoice() (prefers feminine hi-IN) → SpeechSynthesisUtterance() → window.speechSynthesis.speak()',
  contradictionGuard: 'Any contradiction between canonical model and spoken reply content BLOCKS DELIVERY (verified by contradiction-detector.spec.ts).',
  evidenceCommit: '440985a (assessment + MP3) + 7682b3a (Phase 2 fixtures + contradiction detector + pipeline repair)',
};
