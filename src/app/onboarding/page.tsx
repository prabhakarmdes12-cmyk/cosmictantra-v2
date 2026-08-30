import { redirect } from 'next/navigation';

/**
 * /onboarding — the old name/phone mock was never linked and dead-ended on an
 * empty dashboard. The real onboarding is the 30-second free Kundali: it saves
 * a Parivaar profile and reveals the Cosmic ID automatically (see
 * docs/NEW_USER_UX_AUDIT_AND_JOURNEY_SIMPLIFICATION.md §5, P1 #12).
 */
export default function OnboardingRedirect() {
  redirect('/#kundali-section');
}
