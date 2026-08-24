import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateKundali } from '@/engines/astrologyEngine.js';
import { calculateVimshottariDasha, getCurrentDasha } from '@/engines/dashaEngine.js';
import { calculatePanchang } from '@/engines/panchang.js';
import { buildSystemPrompt, generateRemedies } from '@/engines/guruAI.js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerQuestion,
      birthDate,
      birthTime,
      birthCity,
      birthLat,
      birthLon,
      timezone,
      practitionerId,
    } = body;

    if (!customerName || !customerQuestion || !birthDate) {
      return NextResponse.json(
        { success: false, error: 'Customer Name, Birth Date, and Question are required.' },
        { status: 400 }
      );
    }

    const lat = Number(birthLat) || 25.5941;
    const lon = Number(birthLon) || 85.1376;
    const tz = Number(timezone) || 5.5;
    const bTime = birthTime || '10:30';
    const city = birthCity || 'Patna';

    // Step 1: Execute protected calculation engines
    const kundali = calculateKundali(birthDate, bTime, lat, lon, tz);
    const dashaList = calculateVimshottariDasha(kundali.planets.Moon.nakshatra, new Date(birthDate));
    const activeDasha = getCurrentDasha(dashaList, new Date());
    const todayPanchang = calculatePanchang(new Date(), lat, lon, tz);
    const remedies = generateRemedies(kundali);

    const calculationSnapshot = {
      kundali,
      dashas: dashaList,
      currentDasha: activeDasha,
      panchang: todayPanchang,
      remedies,
      calculatedAt: new Date().toISOString(),
    };

    // Step 2: Build System Prompt and generate AI Draft
    const systemPrompt = buildSystemPrompt('en', kundali);
    let aiDraftText = '';
    let aiModel = 'claude-sonnet-4-20250514';

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: aiModel,
            max_tokens: 1000,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: `Customer Question: "${customerQuestion}"\n\nPlease provide a structured astrological working analysis for the practitioner's review.`,
              },
            ],
          }),
        });

        clearTimeout(timeoutId);
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData.content?.[0]?.text) {
            aiDraftText = aiData.content[0].text;
          }
        }
      } catch (err) {
        console.warn('Claude API request omitted or timed out, generating structured working draft fallback.');
      }
    }

    if (!aiDraftText) {
      // Structured AI Working Draft fallback
      aiDraftText = `[AI-Prepared Working Draft — Practitioner Verification Required]

1. PLANETARY & LAGNA SUMMARY:
- Lagna: ${kundali.lagna.rasiName} (${kundali.lagna.nakshatra.name} Nakshatra)
- Sun in ${kundali.planets.Sun.rasiName} (House ${kundali.planets.Sun.house})
- Moon in ${kundali.planets.Moon.rasiName} (House ${kundali.planets.Moon.house}, ${kundali.planets.Moon.nakshatra.name} Nakshatra)
- Active Dasha: ${activeDasha.planet} Mahadasha (${activeDasha.percentDone}% complete)

2. ASTROLOGICAL ANALYSIS FOR QUESTION:
Question: "${customerQuestion}"
- Career/Business House (10th): Ruled by ${kundali.houses[9].rasiName}.
- Financial Gain House (11th): ${kundali.houses[10].rasiName}.
- Current planetary influence under ${activeDasha.planet} Dasha suggests strategic alignment before taking major capital decisions.

3. SUGGESTED VERIFIED REMEDIES:
${remedies.map(r => `• ${r.planet} (${r.type}): ${r.remedy}`).join('\n') || '• Daily Hanuman Chalisa or Gayatri Mantra recitation.'}

(Draft prepared for practitioner verification. Edit and confirm before approving.)`;
    }

    // Step 3: Create Consultation record marked as TEST CASE
    const consultation = await db.astrologyConsultation.create({
      data: {
        isTestCase: true,
        orderType: 'INTERNAL_TEST',
        status: 'PANDIT_REVIEW',
        customerName,
        customerPhone: customerPhone || null,
        customerEmail: customerEmail || null,
        customerQuestion,
        birthDate: new Date(birthDate),
        birthTime: bTime,
        birthCity: city,
        birthLat: lat,
        birthLon: lon,
        timezone: tz,
        calculationSnapshot: calculationSnapshot as any,
        calculationVersion: 'v34',
        aiDraft: aiDraftText,
        aiModel,
        promptVersion: 'v34',
        practitionerId: practitionerId || null,
        paymentProvider: 'INTERNAL_TEST',
        paymentStatus: 'BYPASSED_INTERNAL_TEST',
        amount: 0,
      },
    });

    // Step 4: Audit Log
    await db.astrologyAuditLog.create({
      data: {
        consultationId: consultation.id,
        practitionerId: practitionerId || null,
        eventType: 'TEST_CASE_CREATED',
        actorType: 'ADMIN',
        payload: {
          customerName,
          customerQuestion,
          isTestCase: true,
          status: consultation.status,
          hasCalculationSnapshot: true,
          hasAiDraft: true,
        },
      },
    });

    return NextResponse.json({
      success: true,
      consultation: {
        id: consultation.id,
        publicId: consultation.publicId,
        isTestCase: consultation.isTestCase,
        status: consultation.status,
        customerName: consultation.customerName,
        customerQuestion: consultation.customerQuestion,
        calculationSnapshot,
        aiDraft: consultation.aiDraft,
        createdAt: consultation.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Test consultation detailed error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to create test consultation',
        stack: error?.stack,
        details: String(error),
      },
      { status: 500 }
    );
  }
}
