/**
 * COSMICTANTRA SABHA — DOMAIN MODEL & ENTITY SCHEMA
 * Strictly distinguishes Payer, Beneficiary, Participant, Profile Owner, and Scholar.
 * Strictly separates Deterministic Evidence, AI Drafts, and Scholar-Approved Records.
 */

export type SessionState = 
  | 'DRAFT'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'SCHEDULED'
  | 'READY'
  | 'CONNECTING'
  | 'ACTIVE'
  | 'GRACE_PERIOD'
  | 'COMPLETING'
  | 'COMPLETED'
  // Exceptional States
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'NO_SHOW_DEVOTEE'
  | 'NO_SHOW_SCHOLAR'
  | 'CONNECTION_FAILED'
  | 'INTERRUPTED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type TransportChannel = 'WEB_RTC' | 'PSTN_PHONE' | 'VIDEO';
export type SabhaServiceMode = 'PRASHNA' | 'VAANI' | 'SABHA' | 'DARSHAN' | 'ANUSHTHAN' | 'PUNAH_PARAMARSH';
export type ParticipantRole = 'DEVOTEE' | 'SCHOLAR' | 'FAMILY_MEMBER' | 'ADMIN';
export type ActorType = 'DEVOTEE' | 'SCHOLAR' | 'SYSTEM' | 'ADMIN' | 'PAYMENT_GATEWAY' | 'TELEPHONY_PROVIDER';

export interface ConsentMatrix {
  consultationProcessing: boolean;
  optionalRecording: boolean;       // DEFAULT: false
  optionalTranscription: boolean;   // DEFAULT: false
  whatsAppDelivery: boolean;
  familyMemberParticipation: boolean;
  consentTimestamp: number;
}

export interface PayerInfo {
  id: string;
  name: string;
  phoneMasked: string;
  emailMasked?: string;
  city?: string;
}

export interface BeneficiaryInfo {
  id: string;
  name: string;
  phoneMasked: string;
  relationToPayer: string; // e.g., 'SELF', 'MOTHER', 'FATHER', 'SPOUSE', 'CHILD'
  location: string;
}

export interface ProfileOwner {
  cosmicId: string;
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: number;
}

export interface ScholarInfo {
  scholarId: string;
  name: string;
  title: string;
  tradition: string; // e.g. 'Kashi Vidwat Parishad'
  phoneMasked: string;
}

// Class A: Deterministic System Evidence
export interface DeterministicSystemEvidence {
  calculatedAt: number;
  ayanamsha: 'LAHIRI_CHITRA_PAKSHA';
  lagnaSign: string;
  lagnaDegree: number;
  nakshatra: string;
  nakshatraPada: number;
  vimshottariDasha: {
    mahadasha: string;
    antardasha: string;
    pratyantardasha: string;
    startDate: string;
    endDate: string;
  };
  activeTransits: Array<{
    planet: string;
    transitSign: string;
    aspectsBhava: number[];
  }>;
  panchangSnapshot: {
    tithi: string;
    vara: string;
    nakshatra: string;
    yoga: string;
    karana: string;
    rahukala: string;
    abhijitMuhurta: string;
  };
}

// Class B: AI-Generated Material
export interface AIGeneratedMaterial {
  generatedAt: number;
  modelProvider: string;
  draftSummary: string;
  suggestedObservations: string[];
  suggestedScriptureMatch?: {
    grantha: string;
    verse: string;
    meaningHi: string;
  };
  provenanceTag: 'AI_COGNITIVE_CO_PILOT';
}

// Class C: Scholar-Approved Record (Immature -> Final)
export interface ScholarApprovedRecord {
  approvedAt?: number;
  scholarId: string;
  scholarName: string;
  scholarSignatureDigest?: string;
  finalInterpretation: string;
  recommendations: string[];
  prescribedUpayas: string[];
  recommendedMuhuratWindow?: string;
  followUpDate?: string;
  folioPdfUrl?: string;
  provenanceTag: 'SCHOLAR_VERIFIED_AND_SIGNED';
}

// Versioned Semantic Co-Browsing Event
export interface SabhaSemanticEvent {
  eventId: string;
  sessionId: string;
  sequence: number;
  timestamp: number;
  actor: 'SCHOLAR' | 'DEVOTEE' | 'SYSTEM';
  schemaVersion: '1.0.0';
  type: 
    | 'BHAVA_FOCUS'
    | 'PLANET_FOCUS'
    | 'DASHA_FOCUS'
    | 'TRANSIT_FOCUS'
    | 'MUHURAT_FOCUS'
    | 'VIEW_RESET';
  payload: {
    bhavaNumber?: number;
    planet?: string;
    dashaKey?: string;
    muhuratKey?: string;
    meta?: Record<string, any>;
  };
}

export interface WebRTCTelemetry {
  iceConnectionState: 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed';
  selectedCandidateType: 'host' | 'srflx' | 'prflx' | 'relay'; // relay = TURN
  roundTripTimeMs: number;
  jitterMs: number;
  packetLossPercentage: number;
  audioBitrateKbps: number;
  reconnectCount: number;
  lastTelemetryTimestamp: number;
}

export interface PSTNTelemetry {
  provider: 'EXOTEL_INDIA';
  callSid?: string;
  leg1Status: 'dialing' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'no-answer';
  leg2Status: 'dialing' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'no-answer';
  answeredTimestamp?: number;
  durationSeconds: number;
}

export interface ActualCostLedger {
  grossBookingValueInr: number;
  paymentGatewayFeeInr: number;
  scholarPayoutInr: number;
  webrtcParticipantMinutes: number;
  webrtcCostInr: number;
  turnBandwidthBytes: number;
  turnCostInr: number;
  pstnLeg1Minutes: number;
  pstnLeg2Minutes: number;
  pstnCostInr: number;
  aiInputTokens: number;
  aiOutputTokens: number;
  aiCostInr: number;
  whatsAppMessagesCount: number;
  whatsAppCostInr: number;
  refundAmountInr: number;
  netContributionMarginInr: number;
}

export interface SessionAuditLog {
  auditId: string;
  sessionId: string;
  timestamp: number;
  actor: ActorType;
  actorId: string;
  fromState?: SessionState;
  toState?: SessionState;
  action: string;
  idempotencyKey?: string;
  details?: Record<string, any>;
}

export interface ConsultationSession {
  sessionId: string; // Format: CT-SABHA-YYYY-XXXXXXXX
  state: SessionState;
  serviceMode: SabhaServiceMode;
  transportChannel: TransportChannel;
  activeTransport: 'WEB_RTC' | 'PSTN_PHONE';
  
  // Timing & Authority
  createdAt: number;
  scheduledFor: number;
  startedAt?: number;
  entitledDurationSeconds: number; // e.g. 1200
  extensionSeconds: number;        // e.g. 0 or 600
  gracePeriodSeconds: number;      // 60
  endedAt?: number;
  
  // Participants & Identity
  payer: PayerInfo;
  beneficiary: BeneficiaryInfo;
  profile: ProfileOwner;
  scholar: ScholarInfo;
  
  // Seeker's Inquiry
  question: string;
  category: string;
  language: string;
  
  // Consents
  consent: ConsentMatrix;
  
  // Consultation Content Classes
  evidence: DeterministicSystemEvidence;
  aiMaterial?: AIGeneratedMaterial;
  scholarRecord: ScholarApprovedRecord;
  
  // Real-time Event Log & Current Canonical Focus
  currentChartFocus: {
    bhavaNumber?: number;
    planet?: string;
    dashaKey?: string;
  };
  eventSequence: number;
  
  // Telemetry & Ledger
  webrtcTelemetry?: WebRTCTelemetry;
  pstnTelemetry?: PSTNTelemetry;
  costLedger: ActualCostLedger;
  
  // Payment Verification
  payment: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    isVerified: boolean;
    amountInr: number;
    verifiedAt?: number;
  };
}

// Aliases for Backward Compatibility
export type ConsultationRecord = ConsultationSession;
export type SabhaMode = SabhaServiceMode;
export type SabhaChartEvent = SabhaSemanticEvent;
