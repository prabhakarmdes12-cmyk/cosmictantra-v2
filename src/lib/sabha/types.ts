export type SabhaMode = 
  | 'PRASHNA'         // प्रश्न: One focused written folio
  | 'VAANI'           // वाणी: Private voice consultation
  | 'SABHA'           // सभा: Interactive chart consultation
  | 'DARSHAN'         // दर्शन: Video consultation
  | 'ANUSHTHAN'       // अनुष्ठान: Sacred ritual booking
  | 'PUNAH_PARAMARSH';// पुनः परामर्श: Follow-up session

export type TransportChannel = 'WEB_RTC' | 'PSTN_PHONE' | 'VIDEO';

export type SabhaSessionStatus = 
  | 'SCHEDULED' 
  | 'WAITING_ROOM' 
  | 'ACTIVE' 
  | 'CONCLUDING' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface SabhaParticipant {
  id: string;
  name: string;
  phoneMasked?: string;
  role: 'SEEKER' | 'SCHOLAR' | 'FAMILY_MEMBER';
  joinedAt?: string;
  channel: TransportChannel;
}

export interface SabhaChartEvent {
  timestamp: number;
  type: 'BHAVA_FOCUS' | 'PLANET_FOCUS' | 'DASHA_FOCUS' | 'TRANSIT_FOCUS' | 'UPAYA_PROPOSED';
  target: {
    bhavaNumber?: number;
    planet?: string;
    dashaKey?: string;
    upayaTitle?: string;
  };
}

export interface ConsultationRecord {
  consultationId: string;
  cosmicId: string;
  seekerName: string;
  seekerPhoneMasked: string;
  familyAssisted?: {
    memberName: string;
    memberRelation: string;
    contactChannel: TransportChannel;
  };
  scholarName: string;
  scholarTitle: string;
  topic: string;
  mode: SabhaMode;
  transportChannel: TransportChannel;
  status: SabhaSessionStatus;
  scheduledAt: string;
  durationMinutes: number;
  remainingSeconds: number;
  amount: number;
  evidenceConsulted: {
    natalChart: boolean;
    vimshottariDasha: string;
    currentTransit: string;
    panchangAlignment: string;
  };
  scholarNotes: string;
  prescribedUpayas: string[];
  recommendedWindow?: string;
  followUpDate?: string;
  chartEvents: SabhaChartEvent[];
  isAudioRecorded: boolean; // default: false (Privacy-first)
  networkQuality?: 'EXCELLENT' | 'MODERATE' | 'POOR' | 'PSTN_FALLBACK';
}
