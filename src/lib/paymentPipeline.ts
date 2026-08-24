import { db } from '@/lib/db';
import { calculateKundali } from '@/lib/astrologyEngine.js';
import { calculateVimshottariDasha, getCurrentDasha } from '@/engines/dashaEngine.js';
import { calculatePanchang } from '@/engines/panchang.js';
import { buildSystemPrompt, generateRemedies } from '@/engines/guruAI.js';

export const DEFAULT_AI_MODEL = process.env.NEXT_PUBLIC_GURU_AI_MODEL || 'claude-sonnet-4-20250514';

/**
 * Shared post-payment consultation pipeline.
 *
 * Idempotent: if the consultation is no longer PAYMENT_PENDING it returns the
 * current record without side effects (used by both the Razorpay webhook and
 * the client-side /verify endpoint).
 */
export async function processPaidConsultation(targetId: string) {
  const consultation = await db.astrologyConsultation.findUnique({
    where: { id: targetId },
  });

  if (!consultation) return null;

  // IDEMPOTENCY CHECK: If already paid and processed, return without duplicate execution
  if (consultation.status !== 'PAYMENT_PENDING') {
    return consultation;
  }

  // Step 1: Update payment status to CALCULATING
  await db.astrologyConsultation.update({
    where: { id: targetId },
    data: {
      paymentStatus: 'PAID',
      status: 'CALCULATING',
      paymentProvider: 'RAZORPAY',
    },
  });

  // Step 2: Execute canonical astrology calculations
  const birthDateStr = consultation.birthDate.toISOString().slice(0, 10);
  const lat = consultation.birthLat;
  const lon = consultation.birthLon;
  const tz = consultation.timezone;
  const bTime = consultation.birthTime;

  const kundali = calculateKundali(birthDateStr, bTime, lat, lon, tz);
  const moonNak = (kundali.planets as any).Moon.nakshatra;
  const dashaList = calculateVimshottariDasha(moonNak, new Date(birthDateStr));
  const activeDasha = getCurrentDasha(dashaList, new Date());
  const todayPanchang = calculatePanchang(new Date(), lat, lon, tz);
  const remedies = generateRemedies(kundali as any);

  const calculationSnapshot = {
    kundali,
    dashas: dashaList,
    currentDasha: activeDasha,
    panchang: todayPanchang,
    remedies,
    calculatedAt: new Date().toISOString(),
  };

  // Step 3: Generate AI Working Draft (env-driven model; resilient timeout)
  const systemPrompt = buildSystemPrompt('en', kundali as any);
  let aiDraftText = buildFallbackDraft(consultation, kundali as any, activeDasha, remedies);
  let aiModelUsed = DEFAULT_AI_MODEL;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: aiModelUsed,
          max_tokens: 1200,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Customer Question: "${consultation.customerQuestion}"\n\nPlease provide a structured astrological working analysis for the practitioner's review.`,
            },
          ],
        }),
      });
      clearTimeout(timeoutId);

      if (aiRes.ok) {
        const aiJson: any = await aiRes.json();
        const text = aiJson?.content?.map((b: any) => b.text || '').join('\n').trim();
        if (text) aiDraftText = text;
      }
    } catch (err) {
      console.error('AI draft generation failed — using deterministic draft:', err);
    }
  }

  // Step 4: Update Consultation to PANDIT_REVIEW
  const updated = await db.astrologyConsultation.update({
    where: { id: targetId },
    data: {
      status: 'PANDIT_REVIEW',
      calculationSnapshot: calculationSnapshot as any,
      calculationVersion: 'v34',
      aiDraft: aiDraftText,
      aiModel: aiModelUsed,
      promptVersion: 'v34',
    },
  });

  // Step 5: Audit Log
  await db.astrologyAuditLog.create({
    data: {
      consultationId: updated.id,
      practitionerId: updated.practitionerId,
      eventType: 'PAYMENT_VERIFIED',
      actorType: 'CUSTOMER',
      payload: {
        amount: updated.amount,
        status: updated.status,
        paymentStatus: updated.paymentStatus,
      },
    },
  });

  return updated;
}

function buildFallbackDraft(consultation: any, kundali: any, activeDasha: any, remedies: any[]) {
  const k = kundali;
  const planets = k?.planets || {};
  return `[AI-Prepared Working Draft — Practitioner Verification Required]

1. PLANETARY & LAGNA SUMMARY:
- Lagna: ${k?.lagna?.rashiName} (${k?.lagna?.nakshatra?.name} Nakshatra)
- Sun in ${planets.Sun?.rashiName} (House ${planets.Sun?.house})
- Moon in ${planets.Moon?.rashiName} (House ${planets.Moon?.house}, ${planets.Moon?.nakshatra?.name} Nakshatra)
- Active Dasha: ${activeDasha?.planet} Mahadasha (${activeDasha?.percentDone}% complete)

2. ASTROLOGICAL ANALYSIS FOR QUESTION:
Question: "${consultation.customerQuestion}"
- Career/Business House (10th): Ruled by ${k?.houses?.[9]?.rashiName}.
- Financial Gain House (11th): ${k?.houses?.[10]?.rashiName}.
- Current planetary influence under ${activeDasha?.planet} Dasha suggests strategic alignment before taking major capital decisions.

3. SUGGESTED VERIFIED REMEDIES:
${(remedies || []).map((r: any) => `• ${r.planet} (${r.type}): ${r.remedy}`).join('\n') || '• Daily Hanuman Chalisa or Gayatri Mantra recitation.'}

(Draft prepared for practitioner verification. Edit and confirm before approving.)`;
}
