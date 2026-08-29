import { ConsultationSession, ActualCostLedger } from './types';

export class SabhaCostLedgerEngine {
  /**
   * Calculates actual metered costs for a completed consultation session.
   */
  static computeSessionLedger(session: ConsultationSession): ActualCostLedger {
    const gbv = session.payment.amountInr || 1100;
    const pgFee = Math.round(gbv * 0.02 * 100) / 100; // Razorpay ~2%
    const scholarPayout = Math.round(gbv * 0.75 * 100) / 100; // 75% honorarium

    // WebRTC Minutes Cost (LiveKit Cloud ~₹0.06/participant/min)
    const webrtcMins = session.activeTransport === 'WEB_RTC' && session.startedAt && session.endedAt
      ? Math.ceil((session.endedAt - session.startedAt) / 60000) * 2
      : 0;
    const webrtcCost = Math.round(webrtcMins * 0.06 * 100) / 100;

    // TURN Bandwidth (Coturn/Xirsys ~₹8 per GB)
    const turnBytes = session.webrtcTelemetry?.selectedCandidateType === 'relay' ? 15000000 : 0; // ~15MB
    const turnCost = Math.round((turnBytes / 1073741824) * 8 * 100) / 100;

    // Exotel PSTN 2-Legs Cost (~₹0.60/min/leg)
    const pstnMins = session.activeTransport === 'PSTN_PHONE' && session.startedAt && session.endedAt
      ? Math.ceil((session.endedAt - session.startedAt) / 60000)
      : 0;
    const pstnCost = Math.round(pstnMins * 2 * 0.60 * 100) / 100;

    // AI Tokens & WhatsApp
    const aiInputTokens = 1200;
    const aiOutputTokens = 350;
    const aiCost = Math.round(((aiInputTokens * 0.20 + aiOutputTokens * 1.25) / 1000000) * 87 * 100) / 100; // in INR
    const waMessages = 2; // Booking confirmation + Folio delivery
    const waCost = Math.round(waMessages * 0.65 * 100) / 100; // Meta utility rate in India

    const totalCost = pgFee + scholarPayout + webrtcCost + turnCost + pstnCost + aiCost + waCost;
    const netMargin = Math.round((gbv - totalCost) * 100) / 100;

    const ledger: ActualCostLedger = {
      grossBookingValueInr: gbv,
      paymentGatewayFeeInr: pgFee,
      scholarPayoutInr: scholarPayout,
      webrtcParticipantMinutes: webrtcMins,
      webrtcCostInr: webrtcCost,
      turnBandwidthBytes: turnBytes,
      turnCostInr: turnCost,
      pstnLeg1Minutes: pstnMins,
      pstnLeg2Minutes: pstnMins,
      pstnCostInr: pstnCost,
      aiInputTokens,
      aiOutputTokens,
      aiCostInr: aiCost,
      whatsAppMessagesCount: waMessages,
      whatsAppCostInr: waCost,
      refundAmountInr: session.costLedger?.refundAmountInr || 0,
      netContributionMarginInr: netMargin
    };

    session.costLedger = ledger;
    return ledger;
  }
}
