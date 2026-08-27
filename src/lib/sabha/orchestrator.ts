import { ConsultationSession, SabhaSemanticEvent, SabhaServiceMode, TransportChannel } from './types';
import { SabhaSessionStore } from './store';

// Helper to seed initial records
export function initSeedSessions(): void {
  if (SabhaSessionStore.list().length === 0) {
    const seedSession: ConsultationSession = {
      sessionId: 'CT-SABHA-2026-0825-001',
      state: 'ACTIVE',
      serviceMode: 'SABHA',
      transportChannel: 'WEB_RTC',
      activeTransport: 'WEB_RTC',
      createdAt: Date.now() - 600000,
      scheduledFor: Date.now() - 300000,
      startedAt: Date.now() - 300000,
      entitledDurationSeconds: 1200,
      extensionSeconds: 0,
      gracePeriodSeconds: 60,
      payer: {
        id: 'USR-BANGALORE-99',
        name: 'Aditya Sharma',
        phoneMasked: '+91 98765*****10',
        city: 'Bangalore'
      },
      beneficiary: {
        id: 'USR-BOKARO-01',
        name: 'Kamla Sharma (Mother in Bokaro)',
        phoneMasked: '+91 94311*****55',
        relationToPayer: 'MOTHER',
        location: 'Bokaro'
      },
      profile: {
        cosmicId: 'CT-4821',
        name: 'Kamla Sharma',
        birthDate: '1962-08-14',
        birthTime: '06:45',
        birthPlace: 'Bokaro',
        latitude: 23.6693,
        longitude: 86.1511,
        timezone: 5.5
      },
      scholar: {
        scholarId: 'SCH-KASHI-01',
        name: 'पं. विद्यानंद शास्त्री',
        title: 'वरिष्ठ मानव ज्योतिषी • काशी विद्वत् परिषद्',
        tradition: 'काशी परम्परा',
        phoneMasked: '+91 94150*****22'
      },
      question: 'व्यापार विस्तार एवं वित्तीय निर्णय (Business Direction)',
      category: 'Career & Business',
      language: 'Hindi',
      consent: {
        consultationProcessing: true,
        optionalRecording: false,
        optionalTranscription: false,
        whatsAppDelivery: true,
        familyMemberParticipation: true,
        consentTimestamp: Date.now() - 600000
      },
      evidence: {
        calculatedAt: Date.now() - 600000,
        ayanamsha: 'LAHIRI_CHITRA_PAKSHA',
        lagnaSign: 'Vrishabha (Taurus)',
        lagnaDegree: 14.28,
        nakshatra: 'Rohini (Pada 2)',
        nakshatraPada: 2,
        vimshottariDasha: {
          mahadasha: 'Moon',
          antardasha: 'Jupiter',
          pratyantardasha: 'Saturn',
          startDate: '2026-05-10',
          endDate: '2027-09-12'
        },
        activeTransits: [
          { planet: 'Jupiter', transitSign: 'Taurus', aspectsBhava: [2, 4, 6] }
        ],
        panchangSnapshot: {
          tithi: 'Shukla Dwitiya',
          vara: 'Guruvara',
          nakshatra: 'Purva Phalguni',
          yoga: 'Siddha',
          karana: 'Balava',
          rahukala: '13:30 - 15:00',
          abhijitMuhurta: '11:45 - 12:35'
        }
      },
      scholarRecord: {
        scholarId: 'SCH-KASHI-01',
        scholarName: 'पं. विद्यानंद शास्त्री',
        finalInterpretation: 'नवम्बर २०२६ से प्रारम्भ होने वाली गुरु अन्तर्दशा दशम व एकादश भाव में विस्तार लाएगी। नये व्यापारिक अनुबंधों हेतु २७ नवम्बर २०२६ का मुहूर्त सर्वोत्तम है। चतुर्थ तिमाही में त्वरित वित्तीय जोखिम से बचें।',
        recommendations: ['२७ नवम्बर को शुभ व्यापार मुहूर्त में आरम्भ'],
        prescribedUpayas: [
          'भीमसेनी कपूर नित्य सांध्य आरती',
          'गुरुवार को चने की दाल व गुड़ का गौ-सेवा दान',
          'महामृत्युंजय मन्त्र नित्य १०८ जप'
        ],
        recommendedMuhuratWindow: '२७ नवम्बर – १५ दिसम्बर २०२६ (व्यापार मुहूर्त)',
        followUpDate: '२७ नवम्बर २०२६',
        provenanceTag: 'SCHOLAR_VERIFIED_AND_SIGNED'
      },
      currentChartFocus: {
        bhavaNumber: 10,
        planet: 'JUPITER'
      },
      eventSequence: 2,
      costLedger: {
        grossBookingValueInr: 1100,
        paymentGatewayFeeInr: 22,
        scholarPayoutInr: 825,
        webrtcParticipantMinutes: 10,
        webrtcCostInr: 1.20,
        turnBandwidthBytes: 15000000,
        turnCostInr: 0.11,
        pstnLeg1Minutes: 0,
        pstnLeg2Minutes: 0,
        pstnCostInr: 0,
        aiInputTokens: 1200,
        aiOutputTokens: 350,
        aiCostInr: 0.45,
        whatsAppMessagesCount: 1,
        whatsAppCostInr: 0.65,
        refundAmountInr: 0,
        netContributionMarginInr: 250.59
      },
      payment: {
        razorpayOrderId: 'order_seed_001',
        razorpayPaymentId: 'pay_seed_001',
        razorpaySignature: 'sig_seed_001',
        isVerified: true,
        amountInr: 1100,
        verifiedAt: Date.now() - 600000
      }
    };
    SabhaSessionStore.save(seedSession);
  }
}

initSeedSessions();

export function getConsultationRecord(idOrCosmicId: string): ConsultationSession | null {
  initSeedSessions();
  const list = SabhaSessionStore.list();
  return list.find(s => s.sessionId === idOrCosmicId || s.profile.cosmicId === idOrCosmicId) || null;
}

export function saveConsultationRecord(session: ConsultationSession): void {
  SabhaSessionStore.save(session);
}

export function dispatchChartEvent(sessionId: string, event: { type: SabhaSemanticEvent['type']; target: Record<string, any> }): ConsultationSession | null {
  const session = getConsultationRecord(sessionId);
  if (!session) return null;

  if (event.type === 'BHAVA_FOCUS' && event.target.bhavaNumber !== undefined) {
    session.currentChartFocus.bhavaNumber = event.target.bhavaNumber;
  } else if (event.type === 'PLANET_FOCUS' && event.target.planet !== undefined) {
    session.currentChartFocus.planet = event.target.planet;
  }
  session.eventSequence = (session.eventSequence || 0) + 1;
  SabhaSessionStore.save(session);
  return session;
}

export function retrieveDurableConsultationMemory(query: string, cosmicId: string = 'CT-4821'): string | null {
  initSeedSessions();
  const session = getConsultationRecord(cosmicId);
  if (!session) return null;

  const q = query.toLowerCase();
  if (
    q.includes('पंडित जी ने') || q.includes('pandit') || q.includes('सलाह') || 
    q.includes('उपाय') || q.includes('business') || q.includes('व्यापार') ||
    q.includes('पिछले परामर्श') || q.includes('previous consultation') || q.includes('last session')
  ) {
    return `अभिलेख संख्या: ${session.sessionId}
विद्वान्: ${session.scholar.name} (${session.scholar.title})
परामर्श विषय: "${session.question}"

📜 विद्वत्-विवेचना व निर्णय (Class C - Scholar Approved):
${session.scholarRecord.finalInterpretation}

✦ शास्त्रसम्मत विहित उपाय:
${session.scholarRecord.prescribedUpayas.map((u: string, i: number) => `${i + 1}. ${u}`).join('\n')}

📅 आगामी शुभ काल / अनुवर्ती परामर्श:
${session.scholarRecord.recommendedMuhuratWindow || '२७ नवम्बर २०२६'}`;
  }
  return null;
}
