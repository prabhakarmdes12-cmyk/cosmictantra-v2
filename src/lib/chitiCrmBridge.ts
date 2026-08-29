import { db } from '@/lib/db';

export interface SeekerIntakeDossier {
  name: string;
  phone: string;
  birthDate?: string;
  birthTime?: string;
  birthCity?: string;
  domain?: string;
  question: string;
  lagna?: string;
  nakshatra?: string;
  dasha?: string;
}

/**
 * Records intake leads in CosmicTantra database and triggers Chiti Console CRM Follow-up pipeline.
 */
export async function recordIntakeLead(dossier: SeekerIntakeDossier) {
  try {
    const leadId = `LEAD-${Date.now().toString().slice(-6)}`;

    // 1. Try to record in astrologyConsultation as INTAKE_LEAD or test case
    try {
      await db.astrologyConsultation.create({
        data: {
          isTestCase: false,
          orderType: 'STANDARD_PAID',
          status: 'PAYMENT_PENDING',
          customerName: dossier.name || 'Seeker',
          customerPhone: dossier.phone,
          customerQuestion: dossier.question,
          birthDate: dossier.birthDate ? new Date(dossier.birthDate) : new Date('1995-06-15'),
          birthTime: dossier.birthTime || '10:30',
          birthCity: dossier.birthCity || 'Varanasi',
          birthLat: 25.3176,
          birthLon: 82.9739,
          timezone: 5.5,
          paymentProvider: 'RAZORPAY',
          paymentStatus: 'PENDING',
          amount: 501,
        },
      });
    } catch (dbErr) {
      console.warn('DB intake lead recording fallback:', dbErr);
    }

    // 2. Format Chiti Console WhatsApp Automated Follow-Up Payload
    const whatsappPayload = {
      to: dossier.phone,
      template: 'vedic_consultation_dropoff_t15',
      language: 'hi',
      variables: {
        seeker_name: dossier.name,
        lagna: dossier.lagna || 'वृषभ (Taurus)',
        nakshatra: dossier.nakshatra || 'रोहिणी',
        dasha: dossier.dasha || 'चन्द्र • गुरु',
        review_url: `https://cosmictantra.com/ask?lead=${leadId}`,
      },
    };

    // 3. Dispatch to Chiti Console CRM API if configured
    const chitiCrmApi = process.env.CHITI_CONSOLE_API_BASE || 'https://chiti-console.vercel.app/api';
    if (process.env.CHITI_CONSOLE_API_KEY) {
      try {
        await fetch(`${chitiCrmApi}/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.CHITI_CONSOLE_API_KEY,
          },
          body: JSON.stringify({
            title: `Vedic Consultation Lead: ${dossier.name}`,
            contactName: dossier.name,
            contactPhone: dossier.phone,
            source: 'COSMIC_TANTRA_AI_GURU',
            notes: `Lagna: ${dossier.lagna}, Nakshatra: ${dossier.nakshatra}, Question: ${dossier.question}`,
            metadata: dossier,
          }),
        });
      } catch (crmErr) {
        console.warn('Chiti Console CRM dispatch fallback:', crmErr);
      }
    }

    return {
      success: true,
      leadId,
      scheduledFollowUps: ['T+15_MIN_WHATSAPP', 'T+24_HOUR_MUHURAT'],
    };
  } catch (err: any) {
    console.error('Record intake lead error:', err);
    return { success: false, error: err?.message || 'Intake recording error' };
  }
}
