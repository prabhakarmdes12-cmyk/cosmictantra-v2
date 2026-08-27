import { ToolDefinition } from '../types';

export const VEDIC_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_panchang',
      description: 'Get deterministic Vedic Panchang metrics including Tithi, Nakshatra, Yoga, Karana, Rahu Kaal, and Abhijit Muhurat for a given location and date.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name (e.g. Varanasi, New Delhi, Mumbai)' },
          dateStr: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_temple_darshan',
      description: 'Get verified temple sanctum and live stream stream details for major shrines (Kashi Vishwanath, Somnath, Mahakal, Baidyanath, Ganga Aarti, etc.)',
      parameters: {
        type: 'object',
        properties: {
          shrine: { type: 'string', description: 'Name of the shrine or deity (e.g. kashi, somnath, mahakal, ganga)' }
        },
        required: ['shrine']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_kashi_journey',
      description: 'Generate structured 5-Temple Kashi Sacred Pilgrimage circuit with Ganga Aarti and sunrise timings.',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Duration of visit in days (default: 2)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_mantra',
      description: 'Get authentic Sanskrit verses, transliteration, and spiritual benefits for sacred mantras (Maha Mrityunjaya, Shiva Tandava, Hanuman Chalisa, Gayatri).',
      parameters: {
        type: 'object',
        properties: {
          mantraType: { type: 'string', description: 'Type of mantra (e.g. mrityunjaya, shivatandav, hanuman, gayatri)' }
        },
        required: ['mantraType']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_muhurat',
      description: 'Calculate auspicious candidate Muhurta windows for marriage, griha pravesh, namkaran, or business starting.',
      parameters: {
        type: 'object',
        properties: {
          eventType: { type: 'string', description: 'Event type (e.g. marriage, vivah, business, travel, grihapravesh)' }
        },
        required: ['eventType']
      }
    }
  }
];
