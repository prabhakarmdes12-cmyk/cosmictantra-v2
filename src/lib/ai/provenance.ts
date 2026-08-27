export type ProvenanceType = 
  | 'CALCULATED'
  | 'SOURCE_DOCUMENTED'
  | 'AI_EXPLANATION'
  | 'SCHOLAR_REVIEWED';

export interface ProvenanceDetails {
  type: ProvenanceType;
  label: string;
  sourceEngineOrGrantha: string;
  timestamp: number;
  calculationParameters?: {
    location?: string;
    latitude?: number;
    longitude?: number;
    ayanamsha?: string;
    algorithm?: string;
  };
  scriptureReference?: {
    grantha: string;
    kandaOrAdhyaya?: string;
    shlokaNumber?: string;
    quoteType: 'DIRECT_QUOTE' | 'PARAPHRASE' | 'TRADITIONAL_INTERPRETATION';
  };
  scholarSignature?: {
    scholarId: string;
    scholarName: string;
    credentialTitle: string;
    sessionRecordId: string;
    verifiedAt: number;
  };
}

export function createCalculatedProvenance(
  sourceEngine: string,
  location: string = 'Varanasi',
  algorithm: string = 'Lahiri Drik Siddhanta'
): ProvenanceDetails {
  return {
    type: 'CALCULATED',
    label: 'Calculated (खगोलीय गणना)',
    sourceEngineOrGrantha: sourceEngine,
    timestamp: Date.now(),
    calculationParameters: {
      location,
      ayanamsha: 'Lahiri (24° 16\')',
      algorithm
    }
  };
}

export function createDocumentedProvenance(
  grantha: string,
  shlokaNumber?: string,
  quoteType: 'DIRECT_QUOTE' | 'PARAPHRASE' | 'TRADITIONAL_INTERPRETATION' = 'DIRECT_QUOTE'
): ProvenanceDetails {
  return {
    type: 'SOURCE_DOCUMENTED',
    label: 'Source Documented (शास्त्र प्रामाणिक)',
    sourceEngineOrGrantha: grantha,
    timestamp: Date.now(),
    scriptureReference: {
      grantha,
      shlokaNumber,
      quoteType
    }
  };
}

export function createAIExplanationProvenance(): ProvenanceDetails {
  return {
    type: 'AI_EXPLANATION',
    label: 'AI Explanation (सहायक व्याख्या)',
    sourceEngineOrGrantha: 'CosmicTantra Kashi Sahayak Assistant',
    timestamp: Date.now()
  };
}

export function createScholarReviewedProvenance(
  scholarId: string,
  scholarName: string,
  sessionRecordId: string
): ProvenanceDetails {
  return {
    type: 'SCHOLAR_REVIEWED',
    label: 'Scholar Reviewed (विद्वत् प्रमाणित)',
    sourceEngineOrGrantha: 'Kashi Vidvat Parishad / Verified Practitioner Record',
    timestamp: Date.now(),
    scholarSignature: {
      scholarId,
      scholarName,
      credentialTitle: 'वरिष्ठ ज्योतिषी • वाराणसी',
      sessionRecordId,
      verifiedAt: Date.now()
    }
  };
}
