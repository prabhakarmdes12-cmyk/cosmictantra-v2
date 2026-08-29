/**
 * PROTECTED CANONICAL JYOTISH KERNEL: Kundli Living Workspace & Versioned Store
 * Implements persistent Kundli objects, URL routing (/kundli/[id]), and reproducible snapshots.
 * Complies with Programs 3, 4, 18 and Invariants INV_JYOTISH_001, INV_JYOTISH_002, INV_JYOTISH_006.
 */

import { getCanonicalJyotishSnapshot, CanonicalJyotishSnapshot, NormalizedBirthContext } from './canonicalSnapshot';

export interface StoredKundliRecord {
  id: string;
  personName: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  birthContext: NormalizedBirthContext;
  timeConfidence: 'EXACT' | 'APPROXIMATE' | 'UNKNOWN';
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  engineVersion: string;
  ayanamshaName: string;
  snapshot: CanonicalJyotishSnapshot;
}

// Built-in verified benchmark presets
const PRESET_KUNDLIS: StoredKundliRecord[] = [
  {
    id: 'master-prabhakar-1989',
    personName: 'Prabhakar Sharma',
    gender: 'MALE',
    birthContext: {
      birthDate: '1989-05-26',
      birthTime: '02:20:30',
      latitude: 22.0797,
      longitude: 82.1391,
      timezone: 5.5,
      locationName: 'Bilaspur, Chhattisgarh, India'
    },
    timeConfidence: 'EXACT',
    notes: 'Reference Specimen — Master Kundli V1 (Pisces Ascendant, Capricorn Moon, Shravana Nakshatra, Jupiter MD / Saturn AD in 2026).',
    tags: ['Master Reference', 'AstroSage Qualified', 'JPL Qualified', 'Benchmark Specimen'],
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
    engineVersion: 'CosmicTantra Professional Kernel V36.0 (Deterministic)',
    ayanamshaName: 'Chitra Paksha (Lahiri Standard)',
    snapshot: getCanonicalJyotishSnapshot({
      birthDate: '1989-05-26',
      birthTime: '02:20:30',
      latitude: 22.0797,
      longitude: 82.1391,
      timezone: 5.5,
      locationName: 'Bilaspur, Chhattisgarh, India'
    })
  },
  {
    id: 'gandhi-1869',
    personName: 'Mahatma Gandhi',
    gender: 'MALE',
    birthContext: {
      birthDate: '1869-10-02',
      birthTime: '07:11',
      latitude: 21.6417,
      longitude: 69.6293,
      timezone: 4.6419,
      locationName: 'Porbandar, Gujarat, India'
    },
    timeConfidence: 'EXACT',
    notes: 'Father of the Nation - Libra Ascendant with Mars & Venus in 1st house.',
    tags: ['Historical', 'Leadership', 'B.V. Raman Notable Horoscopes'],
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
    engineVersion: 'CosmicTantra Professional Kernel V36.0 (Deterministic)',
    ayanamshaName: 'Chitra Paksha (Lahiri Standard)',
    snapshot: getCanonicalJyotishSnapshot({
      birthDate: '1869-10-02',
      birthTime: '07:11',
      latitude: 21.6417,
      longitude: 69.6293,
      timezone: 4.6419,
      locationName: 'Porbandar, Gujarat, India'
    })
  },
  {
    id: 'vivekananda-1863',
    personName: 'Swami Vivekananda',
    gender: 'MALE',
    birthContext: {
      birthDate: '1863-01-12',
      birthTime: '06:33',
      latitude: 22.5726,
      longitude: 88.3639,
      timezone: 5.8908,
      locationName: 'Kolkata, West Bengal, India'
    },
    timeConfidence: 'EXACT',
    notes: 'Spiritual Luminary - Sagittarius Ascendant with Sun & Venus in Lagna.',
    tags: ['Historical', 'Spiritual', 'B.V. Raman Notable Horoscopes'],
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
    engineVersion: 'CosmicTantra Professional Kernel V36.0 (Deterministic)',
    ayanamshaName: 'Chitra Paksha (Lahiri Standard)',
    snapshot: getCanonicalJyotishSnapshot({
      birthDate: '1863-01-12',
      birthTime: '06:33',
      latitude: 22.5726,
      longitude: 88.3639,
      timezone: 5.8908,
      locationName: 'Kolkata, West Bengal, India'
    })
  },
  {
    id: 'einstein-1879',
    personName: 'Albert Einstein',
    gender: 'MALE',
    birthContext: {
      birthDate: '1879-03-14',
      birthTime: '11:30',
      latitude: 48.4011,
      longitude: 9.9876,
      timezone: 0.6658,
      locationName: 'Ulm, Germany'
    },
    timeConfidence: 'EXACT',
    notes: 'Theoretical Physicist - Gemini Ascendant with Mercury, Venus, Saturn in 10th.',
    tags: ['Historical', 'Science', 'Nobel Laureate'],
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
    engineVersion: 'CosmicTantra Professional Kernel V36.0 (Deterministic)',
    ayanamshaName: 'Chitra Paksha (Lahiri Standard)',
    snapshot: getCanonicalJyotishSnapshot({
      birthDate: '1879-03-14',
      birthTime: '11:30',
      latitude: 48.4011,
      longitude: 9.9876,
      timezone: 0.6658,
      locationName: 'Ulm, Germany'
    })
  },
  {
    id: 'priya-sharma-1995',
    personName: 'Priya Sharma',
    gender: 'FEMALE',
    birthContext: {
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 25.5941,
      longitude: 85.1376,
      timezone: 5.5,
      locationName: 'Patna, Bihar, India'
    },
    timeConfidence: 'EXACT',
    notes: 'Standard consumer profile benchmark chart.',
    tags: ['Demo', 'Consumer'],
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
    engineVersion: 'CosmicTantra Professional Kernel V36.0 (Deterministic)',
    ayanamshaName: 'Chitra Paksha (Lahiri Standard)',
    snapshot: getCanonicalJyotishSnapshot({
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 25.5941,
      longitude: 85.1376,
      timezone: 5.5,
      locationName: 'Patna, Bihar, India'
    })
  }
];

// In-memory cache for fast lookup
const IN_MEMORY_STORE: Map<string, StoredKundliRecord> = new Map();
PRESET_KUNDLIS.forEach(k => IN_MEMORY_STORE.set(k.id, k));

/**
 * Creates a persistent Kundli record and computes its deterministic snapshot.
 */
export function createKundli(
  personName: string,
  birthContext: NormalizedBirthContext,
  timeConfidence: 'EXACT' | 'APPROXIMATE' | 'UNKNOWN' = 'EXACT',
  gender: 'MALE' | 'FEMALE' | 'OTHER' = 'OTHER',
  notes: string = ''
): StoredKundliRecord {
  const slug = personName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'kundli';
  const timestamp = Date.now().toString(36);
  const id = `${slug}-${timestamp}`;

  const snapshot = getCanonicalJyotishSnapshot(birthContext);
  const record: StoredKundliRecord = {
    id,
    personName,
    gender,
    birthContext,
    timeConfidence,
    notes,
    tags: ['User Created'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    engineVersion: snapshot.meta.engineVersion,
    ayanamshaName: snapshot.meta.ayanamshaName,
    snapshot
  };

  IN_MEMORY_STORE.set(id, record);

  // If in browser, save to localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedList = JSON.parse(window.localStorage.getItem('cosmictantra_kundlis') || '[]');
      storedList.unshift({ id, personName, birthDate: birthContext.birthDate, createdAt: record.createdAt });
      window.localStorage.setItem('cosmictantra_kundlis', JSON.stringify(storedList.slice(0, 50)));
      window.localStorage.setItem(`cosmictantra_kundli_${id}`, JSON.stringify(record));
    } catch (e) {
      console.warn('Could not persist kundli to localStorage', e);
    }
  }

  return record;
}

/**
 * Retrieves a Kundli record by ID.
 */
export function getKundliById(id: string): StoredKundliRecord | null {
  // Check memory store
  if (IN_MEMORY_STORE.has(id)) {
    return IN_MEMORY_STORE.get(id)!;
  }

  // Check localStorage if in browser
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(`cosmictantra_kundli_${id}`);
      if (raw) {
        const record: StoredKundliRecord = JSON.parse(raw);
        IN_MEMORY_STORE.set(id, record);
        return record;
      }
    } catch (e) {
      console.warn('Could not load kundli from localStorage', e);
    }
  }

  return null;
}

/**
 * Lists all available Kundlis (Presets + User Created).
 */
export function listAllKundlis(): StoredKundliRecord[] {
  const result: StoredKundliRecord[] = Array.from(IN_MEMORY_STORE.values());

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedList = JSON.parse(window.localStorage.getItem('cosmictantra_kundlis') || '[]');
      for (const item of storedList) {
        if (!IN_MEMORY_STORE.has(item.id)) {
          const raw = window.localStorage.getItem(`cosmictantra_kundli_${item.id}`);
          if (raw) {
            const record = JSON.parse(raw);
            IN_MEMORY_STORE.set(item.id, record);
            result.push(record);
          }
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage', e);
    }
  }

  return result;
}
