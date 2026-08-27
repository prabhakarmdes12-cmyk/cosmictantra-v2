import { ConsultationRecord, SabhaChartEvent, SabhaMode, TransportChannel } from './types';

// In-Memory Durable Consultation Store (simulates database persistence)
const CONSULTATION_VAULT: Map<string, ConsultationRecord> = new Map();

// Seed initial consultation records for Priya Sharma and Rahul Verma
const SEED_RECORDS: ConsultationRecord[] = [
  {
    consultationId: 'CT-2026-0825-001',
    cosmicId: 'CT-4821',
    seekerName: 'Priya Sharma',
    seekerPhoneMasked: '+91 98765*****10',
    familyAssisted: {
      memberName: 'Kamla Sharma (Mother)',
      memberRelation: 'Mother in Bokaro',
      contactChannel: 'PSTN_PHONE'
    },
    scholarName: 'पं. विद्यानंद शास्त्री',
    scholarTitle: 'वरिष्ठ मानव ज्योतिषी • काशी विद्वत् परिषद्',
    topic: 'व्यापार विस्तार एवं वित्तीय निर्णय (Business Direction)',
    mode: 'SABHA',
    transportChannel: 'WEB_RTC',
    status: 'COMPLETED',
    scheduledAt: '25 Aug 2026, 09:14 AM',
    durationMinutes: 20,
    remainingSeconds: 0,
    amount: 1100,
    evidenceConsulted: {
      natalChart: true,
      vimshottariDasha: 'चन्द्र महादशा • गुरु अन्तर्दशा',
      currentTransit: 'गुरु गोचर दशम भाव (कर्म क्षेत्र) सक्रिय',
      panchangAlignment: 'शुक्ल द्वितीया, रोहिणी नक्षत्र'
    },
    scholarNotes: 'नवम्बर २०२६ से प्रारम्भ होने वाली गुरु अन्तर्दशा दशम व एकादश भाव में विस्तार लाएगी। नये व्यापारिक अनुबंधों हेतु २७ नवम्बर २०२६ का मुहूर्त सर्वोत्तम है। चतुर्थ तिमाही में त्वरित वित्तीय जोखिम से बचें।',
    prescribedUpayas: [
      'भीमसेनी कपूर नित्य सांध्य आरती',
      'गुरुवार को चने की दाल व गुड़ का गौ-सेवा दान',
      'महामृत्युंजय मन्त्र नित्य १०८ जप'
    ],
    recommendedWindow: '२७ नवम्बर – १५ दिसम्बर २०२६ (व्यापार मुहूर्त)',
    followUpDate: '२७ नवम्बर २०२६',
    chartEvents: [
      { timestamp: 1787700000, type: 'BHAVA_FOCUS', target: { bhavaNumber: 10 } },
      { timestamp: 1787700120, type: 'PLANET_FOCUS', target: { planet: 'JUPITER' } }
    ],
    isAudioRecorded: false,
    networkQuality: 'EXCELLENT'
  }
];

// Initialize seed records
SEED_RECORDS.forEach(rec => CONSULTATION_VAULT.set(rec.consultationId, rec));
SEED_RECORDS.forEach(rec => CONSULTATION_VAULT.set(rec.cosmicId, rec));

export function getConsultationRecord(idOrCosmicId: string): ConsultationRecord | null {
  return CONSULTATION_VAULT.get(idOrCosmicId) || null;
}

export function saveConsultationRecord(record: ConsultationRecord): void {
  CONSULTATION_VAULT.set(record.consultationId, record);
  if (record.cosmicId) {
    CONSULTATION_VAULT.set(record.cosmicId, record);
  }
}

export function createSabhaSession(params: {
  cosmicId: string;
  seekerName: string;
  seekerPhone: string;
  topic: string;
  mode: SabhaMode;
  transportChannel: TransportChannel;
  amount: number;
  familyAssisted?: { memberName: string; memberRelation: string; contactChannel: TransportChannel };
}): ConsultationRecord {
  const consultationId = `CT-2026-${Date.now().toString().slice(-6)}`;
  const record: ConsultationRecord = {
    consultationId,
    cosmicId: params.cosmicId || `CT-${Math.floor(1000 + Math.random() * 9000)}`,
    seekerName: params.seekerName,
    seekerPhoneMasked: params.seekerPhone ? `${params.seekerPhone.slice(0, 5)}*****${params.seekerPhone.slice(-2)}` : '+91 98765*****10',
    familyAssisted: params.familyAssisted,
    scholarName: 'पं. विद्यानंद शास्त्री',
    scholarTitle: 'वरिष्ठ मानव ज्योतिषी • काशी विद्वत् परिषद्',
    topic: params.topic,
    mode: params.mode,
    transportChannel: params.transportChannel,
    status: 'SCHEDULED',
    scheduledAt: new Date().toLocaleString('hi-IN'),
    durationMinutes: params.mode === 'PRASHNA' ? 0 : 20,
    remainingSeconds: params.mode === 'PRASHNA' ? 0 : 1200,
    amount: params.amount,
    evidenceConsulted: {
      natalChart: true,
      vimshottariDasha: 'चन्द्र महादशा • गुरु अन्तर्दशा',
      currentTransit: 'गुरु गोचर १०म भाव',
      panchangAlignment: 'दृक् पञ्चाङ्ग'
    },
    scholarNotes: '',
    prescribedUpayas: [],
    chartEvents: [],
    isAudioRecorded: false,
    networkQuality: 'EXCELLENT'
  };

  saveConsultationRecord(record);
  return record;
}

export function dispatchChartEvent(consultationId: string, event: SabhaChartEvent): ConsultationRecord | null {
  const record = getConsultationRecord(consultationId);
  if (!record) return null;
  record.chartEvents.push(event);
  saveConsultationRecord(record);
  return record;
}

export function retrieveDurableConsultationMemory(query: string, cosmicId: string = 'CT-4821'): string | null {
  const record = getConsultationRecord(cosmicId);
  if (!record) return null;

  const q = query.toLowerCase();
  if (
    q.includes('पंडित जी ने') || q.includes('pandit') || q.includes('सलाह') || 
    q.includes('उपाय') || q.includes('business') || q.includes('व्यापार') ||
    q.includes('पिछले परामर्श') || q.includes('previous consultation') || q.includes('last session')
  ) {
    return `अभिलेख संख्या: ${record.consultationId}
विद्वान्: ${record.scholarName} (${record.scholarTitle})
परामर्श विषय: "${record.topic}"

📜 विद्वत्-विवेचना व निर्णय:
${record.scholarNotes}

✦ शास्त्रसम्मत विहित उपाय:
${record.prescribedUpayas.map((u, i) => `${i + 1}. ${u}`).join('\n')}

📅 आगामी शुभ काल / अनुवर्ती परामर्श:
${record.recommendedWindow || '२७ नवम्बर २०२६'}`;
  }
  return null;
}
