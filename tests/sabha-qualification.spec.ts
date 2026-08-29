import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import { SabhaStateMachine } from '../src/lib/sabha/stateMachine';
import { SabhaPaymentEngine } from '../src/lib/sabha/paymentEntitlement';
import { SabhaAuthTokenEngine } from '../src/lib/sabha/auth';
import { SabhaEventEngine } from '../src/lib/sabha/events';
import { SabhaTimerEngine } from '../src/lib/sabha/timer';
import { SabhaTelephonyHandoverEngine } from '../src/lib/sabha/telephonyHandover';
import { SabhaCostLedgerEngine } from '../src/lib/sabha/costLedger';
import { SabhaSessionStore } from '../src/lib/sabha/store';
import { ConsultationSession } from '../src/lib/sabha/types';

function createMockDraftSession(sessionId: string = 'CT-SABHA-2026-TEST-001'): ConsultationSession {
  return {
    sessionId,
    state: 'DRAFT',
    serviceMode: 'SABHA',
    transportChannel: 'WEB_RTC',
    activeTransport: 'WEB_RTC',
    createdAt: Date.now(),
    scheduledFor: Date.now() + 3600000,
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
      name: 'Kamla Sharma',
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
      title: 'वरिष्ठ ज्योतिषी • काशी विद्वत् परिषद्',
      tradition: 'काशी परम्परा',
      phoneMasked: '+91 94150*****22'
    },
    question: 'माताजी के स्वास्थ्य एवं तीर्थ यात्रा का शुभ मुहूर्त क्या है?',
    category: 'Health & Muhurta',
    language: 'Hindi',
    consent: {
      consultationProcessing: true,
      optionalRecording: false,
      optionalTranscription: false,
      whatsAppDelivery: true,
      familyMemberParticipation: true,
      consentTimestamp: Date.now()
    },
    evidence: {
      calculatedAt: Date.now(),
      ayanamsha: 'LAHIRI_CHITRA_PAKSHA',
      lagnaSign: 'Karka (Cancer)',
      lagnaDegree: 14.28,
      nakshatra: 'Pushya (Pada 2)',
      nakshatraPada: 2,
      vimshottariDasha: {
        mahadasha: 'Jupiter',
        antardasha: 'Moon',
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
      finalInterpretation: '',
      recommendations: [],
      prescribedUpayas: [],
      provenanceTag: 'SCHOLAR_VERIFIED_AND_SIGNED'
    },
    currentChartFocus: {},
    eventSequence: 0,
    costLedger: {
      grossBookingValueInr: 1100,
      paymentGatewayFeeInr: 22,
      scholarPayoutInr: 825,
      webrtcParticipantMinutes: 0,
      webrtcCostInr: 0,
      turnBandwidthBytes: 0,
      turnCostInr: 0,
      pstnLeg1Minutes: 0,
      pstnLeg2Minutes: 0,
      pstnCostInr: 0,
      aiInputTokens: 0,
      aiOutputTokens: 0,
      aiCostInr: 0,
      whatsAppMessagesCount: 0,
      whatsAppCostInr: 0,
      refundAmountInr: 0,
      netContributionMarginInr: 0
    },
    payment: {
      isVerified: false,
      amountInr: 1100
    }
  };
}

test.describe('CosmicTantra Sabha — Real-World Transaction Qualification Suite', () => {

  test.beforeEach(() => {
    SabhaSessionStore.clearAllForTesting();
  });

  test('P0-1: Canonical State Machine — Complete Happy Path & Strict Progression', () => {
    const session = createMockDraftSession();
    SabhaSessionStore.save(session);

    // 1. DRAFT -> PAYMENT_PENDING
    let res = SabhaStateMachine.transition(session, 'INITIATE_PAYMENT', {
      sessionId: session.sessionId,
      actor: 'DEVOTEE',
      actorId: session.payer.id,
      idempotencyKey: 'init_001',
      timestamp: Date.now()
    });
    expect(res.success).toBe(true);
    expect(session.state).toBe('PAYMENT_PENDING');

    // 2. PAYMENT_PENDING -> PAID (INV-SABHA-001)
    session.payment.isVerified = true;
    res = SabhaStateMachine.transition(session, 'VERIFY_PAYMENT', {
      sessionId: session.sessionId,
      actor: 'PAYMENT_GATEWAY',
      actorId: 'RAZORPAY',
      idempotencyKey: 'pay_001',
      timestamp: Date.now()
    });
    expect(res.success).toBe(true);
    expect(session.state).toBe('PAID');

    // 3. PAID -> SCHEDULED
    res = SabhaStateMachine.transition(session, 'SCHEDULE_SESSION', {
      sessionId: session.sessionId,
      actor: 'DEVOTEE',
      actorId: session.payer.id,
      idempotencyKey: 'sch_001',
      timestamp: Date.now()
    });
    expect(res.success).toBe(true);
    expect(session.state).toBe('SCHEDULED');

    // 4. SCHEDULED -> READY
    res = SabhaStateMachine.transition(session, 'MARK_READY', {
      sessionId: session.sessionId,
      actor: 'SYSTEM',
      actorId: 'SYSTEM',
      idempotencyKey: 'rdy_001',
      timestamp: session.scheduledFor - 100000 // 1.6 mins before
    });
    expect(res.success).toBe(true);
    expect(session.state).toBe('READY');

    // 5. READY -> CONNECTING
    res = SabhaStateMachine.transition(session, 'START_CONNECTING', {
      sessionId: session.sessionId,
      actor: 'SCHOLAR',
      actorId: session.scholar.scholarId,
      idempotencyKey: 'con_001',
      timestamp: Date.now()
    });
    expect(res.success).toBe(true);
    expect(session.state).toBe('CONNECTING');

    // 6. CONNECTING -> ACTIVE (Requires connected realtime transport INV-SABHA-002)
    session.webrtcTelemetry = {
      iceConnectionState: 'connected',
      selectedCandidateType: 'relay',
      roundTripTimeMs: 45,
      jitterMs: 10,
      packetLossPercentage: 0.1,
      audioBitrateKbps: 32,
      reconnectCount: 0,
      lastTelemetryTimestamp: Date.now()
    };
    res = SabhaStateMachine.transition(session, 'ACTIVATE_SESSION', {
      sessionId: session.sessionId,
      actor: 'SYSTEM',
      actorId: 'LIVEKIT_MEDIA_SERVER',
      idempotencyKey: 'act_001',
      timestamp: Date.now()
    });
    expect(res.success).toBe(true);
    expect(session.state).toBe('ACTIVE');
    expect(session.startedAt).toBeDefined();

    // 7. ACTIVE -> COMPLETING (Scholar writes notes)
    session.scholarRecord.finalInterpretation = 'माताजी के स्वास्थ्य में सुधार होगा। कार्तिक मास में विश्वनाथ दर्शन करें।';
    res = SabhaStateMachine.transition(session, 'START_COMPLETING', {
      sessionId: session.sessionId,
      actor: 'SCHOLAR',
      actorId: session.scholar.scholarId,
      idempotencyKey: 'comp_001',
      timestamp: Date.now()
    });
    expect(res.success).toBe(true);
    expect(session.state).toBe('COMPLETING');

    // 8. COMPLETING -> COMPLETED
    res = SabhaStateMachine.transition(session, 'COMPLETE_SESSION', {
      sessionId: session.sessionId,
      actor: 'SCHOLAR',
      actorId: session.scholar.scholarId,
      idempotencyKey: 'done_001',
      timestamp: Date.now()
    });
    expect(res.success).toBe(true);
    expect(session.state).toBe('COMPLETED');
    expect(session.endedAt).toBeDefined();
  });

  test('P0-2: State Machine Invariants — Client UI cannot skip payment or jump to ACTIVE', () => {
    const session = createMockDraftSession();
    SabhaSessionStore.save(session);

    // Attempt direct transition from DRAFT to ACTIVE
    const res1 = SabhaStateMachine.transition(session, 'ACTIVATE_SESSION', {
      sessionId: session.sessionId,
      actor: 'DEVOTEE',
      actorId: session.payer.id,
      idempotencyKey: 'hack_001',
      timestamp: Date.now()
    });
    expect(res1.success).toBe(false);
    expect(session.state).toBe('DRAFT');

    // Attempt transition without payment verification (INV-SABHA-001)
    session.state = 'PAYMENT_PENDING';
    session.payment.isVerified = false;
    const res2 = SabhaStateMachine.transition(session, 'VERIFY_PAYMENT', {
      sessionId: session.sessionId,
      actor: 'PAYMENT_GATEWAY',
      actorId: 'RAZORPAY',
      idempotencyKey: 'unverified_001',
      timestamp: Date.now()
    });
    expect(res2.success).toBe(false);
    expect(session.state).toBe('PAYMENT_PENDING');

    // Attempt transition from CONNECTING to ACTIVE without real ICE connection (INV-SABHA-002)
    session.state = 'CONNECTING';
    session.payment.isVerified = true;
    session.webrtcTelemetry = {
      iceConnectionState: 'disconnected',
      selectedCandidateType: 'host',
      roundTripTimeMs: 0,
      jitterMs: 0,
      packetLossPercentage: 100,
      audioBitrateKbps: 0,
      reconnectCount: 1,
      lastTelemetryTimestamp: Date.now()
    };
    const res3 = SabhaStateMachine.transition(session, 'ACTIVATE_SESSION', {
      sessionId: session.sessionId,
      actor: 'SYSTEM',
      actorId: 'SYSTEM',
      idempotencyKey: 'fake_ice_001',
      timestamp: Date.now()
    });
    expect(res3.success).toBe(false);
    expect(session.state).toBe('CONNECTING');
  });

  test('P0-3: Payment Entitlement — Cryptographic HMAC Verification & Idempotency', () => {
    const session = createMockDraftSession();
    session.state = 'PAYMENT_PENDING';
    SabhaSessionStore.save(session);

    const secret = 'rzp_test_secret_9988';
    const orderId = 'order_test_777';
    const paymentId = 'pay_test_888';
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // Test 1: Forged signature fails
    const badRes = SabhaPaymentEngine.verifyAndEntitleSession({
      sessionId: session.sessionId,
      orderId,
      paymentId,
      signature: 'forged_fake_signature_hex',
      secret
    });
    expect(badRes.success).toBe(false);
    expect(SabhaSessionStore.get(session.sessionId)?.state).toBe('PAYMENT_FAILED');

    // Reset to PAYMENT_PENDING for valid test
    session.state = 'PAYMENT_PENDING';
    SabhaSessionStore.save(session);

    // Test 2: Valid signature succeeds exactly once
    const goodRes = SabhaPaymentEngine.verifyAndEntitleSession({
      sessionId: session.sessionId,
      orderId,
      paymentId,
      signature: validSignature,
      secret,
      idempotencyKey: 'idemp_pay_001'
    });
    expect(goodRes.success).toBe(true);
    expect(goodRes.session?.state).toBe('PAID');
    expect(goodRes.session?.payment.isVerified).toBe(true);

    // Test 3: Duplicate Webhook arrives late with same idempotency key
    const dupRes = SabhaPaymentEngine.verifyAndEntitleSession({
      sessionId: session.sessionId,
      orderId,
      paymentId,
      signature: validSignature,
      secret,
      idempotencyKey: 'idemp_pay_001'
    });
    expect(dupRes.success).toBe(true); // Idempotently returns existing verified session without double charge
  });

  test('P0-4: Session Authorization — Short-Lived Tamper-Proof Participant Credentials', () => {
    const session = createMockDraftSession();
    SabhaSessionStore.save(session);

    // 1. Generate Devotee Token
    const devoteeToken = SabhaAuthTokenEngine.generateToken(
      session.sessionId,
      session.payer.id,
      'DEVOTEE',
      30
    );
    expect(devoteeToken).toBeDefined();

    // 2. Validate Devotee Token
    const verifyDevotee = SabhaAuthTokenEngine.verifyToken(devoteeToken, session.sessionId);
    expect(verifyDevotee.valid).toBe(true);
    expect(verifyDevotee.payload?.role).toBe('DEVOTEE');
    expect(verifyDevotee.payload?.permissions).toContain('AUDIO_TALK');
    expect(verifyDevotee.payload?.permissions).not.toContain('EDIT_SCHOLAR_NOTES');

    // 3. Generate Scholar Token
    const scholarToken = SabhaAuthTokenEngine.generateToken(
      session.sessionId,
      session.scholar.scholarId,
      'SCHOLAR',
      30
    );
    const verifyScholar = SabhaAuthTokenEngine.verifyToken(scholarToken, session.sessionId);
    expect(verifyScholar.valid).toBe(true);
    expect(verifyScholar.payload?.role).toBe('SCHOLAR');
    expect(verifyScholar.payload?.permissions).toContain('EDIT_SCHOLAR_NOTES');

    // 4. Token tampering test
    const tamperedToken = devoteeToken.slice(0, -5) + 'AAAAA';
    const verifyTampered = SabhaAuthTokenEngine.verifyToken(tamperedToken, session.sessionId);
    expect(verifyTampered.valid).toBe(false);

    // 5. Cross-Session Isolation (Scholar A token used for Session B)
    const verifyCross = SabhaAuthTokenEngine.verifyToken(scholarToken, 'CT-SABHA-DIFFERENT-SESSION-999');
    expect(verifyCross.valid).toBe(false);
  });

  test('P0-5: Semantic Co-Browsing Contract & Canonical View Query on Reconnect', () => {
    const session = createMockDraftSession();
    SabhaSessionStore.save(session);

    // 1. Scholar emits BHAVA_FOCUS on 10th House
    const ev1 = SabhaEventEngine.emitEvent(session, 'BHAVA_FOCUS', 'SCHOLAR', { bhavaNumber: 10 });
    expect(ev1.success).toBe(true);
    expect(ev1.event?.sequence).toBe(1);
    expect(session.currentChartFocus.bhavaNumber).toBe(10);

    // 2. Scholar emits PLANET_FOCUS on Jupiter
    const ev2 = SabhaEventEngine.emitEvent(session, 'PLANET_FOCUS', 'SCHOLAR', { planet: 'JUPITER' });
    expect(ev2.success).toBe(true);
    expect(ev2.event?.sequence).toBe(2);
    expect(session.currentChartFocus.planet).toBe('JUPITER');

    // 3. Devotee drops connection and reconnects: queries canonical view state
    const canonicalState = SabhaEventEngine.getCanonicalViewState(session.sessionId);
    expect(canonicalState).not.toBeNull();
    expect(canonicalState?.currentChartFocus.bhavaNumber).toBe(10);
    expect(canonicalState?.currentChartFocus.planet).toBe('JUPITER');
    expect(canonicalState?.sequence).toBe(2);
  });

  test('P0-6: Server-Authoritative Timer & Immunity to Browser Refresh', () => {
    const session = createMockDraftSession();
    session.state = 'ACTIVE';
    const serverStart = Date.now() - 600000; // 10 mins ago (600s elapsed)
    session.startedAt = serverStart;
    session.entitledDurationSeconds = 1200; // 20m
    session.extensionSeconds = 0;
    session.gracePeriodSeconds = 60;
    SabhaSessionStore.save(session);

    // Test at 10 minutes: 600s elapsed, 600s remaining
    const t1 = SabhaTimerEngine.computeTimerState(session, serverStart + 600000);
    expect(t1.elapsedSeconds).toBe(600);
    expect(t1.remainingSeconds).toBe(600);
    expect(t1.isGracePeriod).toBe(false);
    expect(t1.isExpired).toBe(false);

    // Test at 20 minutes 30 seconds: inside 60s Grace Period
    const t2 = SabhaTimerEngine.computeTimerState(session, serverStart + 1230000);
    expect(t2.remainingSeconds).toBe(0);
    expect(t2.isGracePeriod).toBe(true);
    expect(t2.isExpired).toBe(false);
    expect(t2.statusText).toContain('Grace Period');

    // Test after Grace Period expired: 21 minutes 10 seconds
    const t3 = SabhaTimerEngine.computeTimerState(session, serverStart + 1270000);
    expect(t3.isExpired).toBe(true);
  });

  test('P0-7: Dynamic Network Handover — WebRTC to Exotel Masked PSTN with State Preservation', () => {
    const session = createMockDraftSession();
    session.state = 'ACTIVE';
    session.activeTransport = 'WEB_RTC';
    session.startedAt = Date.now() - 300000;
    session.currentChartFocus = { bhavaNumber: 10, planet: 'JUPITER' };
    session.scholarRecord.finalInterpretation = 'Preliminary analysis noted.';
    SabhaSessionStore.save(session);

    // Initiate Handover
    const handover = SabhaTelephonyHandoverEngine.initiatePstnHandover({
      sessionId: session.sessionId,
      reason: 'High WebRTC Packet Loss (42%) on Jio Network',
      actorId: 'AUTO_NETWORK_MONITOR'
    });

    expect(handover.success).toBe(true);
    expect(handover.session?.activeTransport).toBe('PSTN_PHONE');
    expect(handover.session?.pstnTelemetry?.provider).toBe('EXOTEL_INDIA');
    expect(handover.session?.pstnTelemetry?.leg1Status).toBe('in-progress');
    expect(handover.session?.currentChartFocus.bhavaNumber).toBe(10);
    expect(handover.session?.scholarRecord.finalInterpretation).toBe('Preliminary analysis noted.');
  });

  test('P1-1: Family-Assisted Consultation Model — Bangalore Son Paying for Bokaro Mother', () => {
    const session = createMockDraftSession();
    expect(session.payer.name).toBe('Aditya Sharma');
    expect(session.payer.city).toBe('Bangalore');
    expect(session.beneficiary.name).toBe('Kamla Sharma');
    expect(session.beneficiary.location).toBe('Bokaro');
    expect(session.beneficiary.relationToPayer).toBe('MOTHER');
    expect(session.consent.familyMemberParticipation).toBe(true);
    expect(session.consent.optionalRecording).toBe(false); // Default OFF
  });

  test('P2-1: Actual Cost Ledger & Unit Economics Metering', () => {
    const session = createMockDraftSession();
    session.state = 'COMPLETED';
    session.startedAt = Date.now() - 1200000;
    session.endedAt = Date.now();
    session.activeTransport = 'WEB_RTC';
    session.webrtcTelemetry = {
      iceConnectionState: 'completed',
      selectedCandidateType: 'relay',
      roundTripTimeMs: 50,
      jitterMs: 10,
      packetLossPercentage: 0.2,
      audioBitrateKbps: 32,
      reconnectCount: 0,
      lastTelemetryTimestamp: Date.now()
    };
    session.payment.amountInr = 1100;
    SabhaSessionStore.save(session);

    const ledger = SabhaCostLedgerEngine.computeSessionLedger(session);
    expect(ledger.grossBookingValueInr).toBe(1100);
    expect(ledger.paymentGatewayFeeInr).toBe(22); // ~2% Razorpay
    expect(ledger.scholarPayoutInr).toBe(825);   // 75% honorarium
    expect(ledger.webrtcParticipantMinutes).toBe(40); // 20m x 2 participants
    expect(ledger.webrtcCostInr).toBe(2.40);
    expect(ledger.netContributionMarginInr).toBeGreaterThan(200); // 20%+ net margin
  });

});
