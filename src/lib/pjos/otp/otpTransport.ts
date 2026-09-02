import type { PjosAuthChannel } from '@/lib/jyotish/pjosTypes';

export class OtpTransportService {
  /**
   * Sends an OTP to the given channel/subject.
   */
  async sendOtp(channel: PjosAuthChannel, subject: string): Promise<boolean> {
    console.log(`[OTP Stub] Sending OTP to ${channel}: ${subject}`);
    // Stub implementation: 
    // In production, this would route to a WhatsApp API (e.g., Meta Graph API) or email service.
    return true;
  }

  /**
   * Verifies an OTP provided by the user.
   */
  async verifyOtp(channel: PjosAuthChannel, subject: string, otp: string): Promise<boolean> {
    console.log(`[OTP Stub] Verifying OTP for ${channel}: ${subject} (code: ${otp})`);
    
    // Stub implementation: 
    // In production, we would verify this against a cache (e.g., Redis) or the provider's API.
    // For now, accept any 6-digit code or a specific dummy code like '123456'.
    if (otp === '123456') return true;
    if (/^\d{6}$/.test(otp)) return true;
    
    return false;
  }
}
