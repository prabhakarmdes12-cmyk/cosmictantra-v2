export interface SafetyEvaluationResult {
  isCritical: boolean;
  category?: 'SELF_HARM' | 'VIOLENCE' | 'MEDICAL_EMERGENCY' | 'CHILD_SAFETY' | 'PSYCHOSIS';
  safetyNoticeHi: string;
  safetyNoticeEn: string;
  emergencyHelplines: Array<{ name: string; number: string; description: string }>;
  allowAstrology: boolean;
}

export function evaluateSafetyCritical(query: string): SafetyEvaluationResult {
  const q = (query || '').toLowerCase().trim();

  // Self harm / Suicidal triggers
  if (
    q.includes('kill myself') || q.includes('suicide') || q.includes('end my life') ||
    q.includes('want to die') || q.includes('harm myself') || q.includes('आत्महत्या') ||
    q.includes('जान दे दूंगा') || q.includes('जान दे दूंगी') || q.includes('जान दे दूँगी') ||
    q.includes('मरना चाहती हूँ') || q.includes('मरना चाहता हूँ') || q.includes('मर जाऊं') ||
    q.includes('जीने का मन नहीं') || q.includes('फांसी') || q.includes('zehar') || 
    q.includes('poison') || q.includes('sleeping pills') || q.includes('swallowed')
  ) {
    return {
      isCritical: true,
      category: 'SELF_HARM',
      safetyNoticeHi: 'आप अकेले नहीं हैं। कृपया तुरंत किसी पेशेवर परामर्शदाता या आपातकालीन हेल्पलाइन से सम्पर्क करें। आपका जीवन बहुमूल्य है।',
      safetyNoticeEn: 'You are not alone. Please reach out immediately to a professional counselor or emergency helpline. Your life is precious.',
      emergencyHelplines: [
        { name: 'Tele-MANAS (Govt of India 24x7 Mental Health)', number: '14416 / 1800-891-4416', description: 'Toll-free, 24x7 Multi-lingual Mental Health Support' },
        { name: 'KIRAN (Mental Health Helpline)', number: '1800-599-0019', description: 'Govt. 24x7 National Helpline' },
        { name: 'National Emergency Number', number: '112', description: 'Police & Medical Emergency' }
      ],
      allowAstrology: false
    };
  }

  // Medical Emergency triggers
  if (
    q.includes('heart attack') || q.includes('severe chest pain') || q.includes('stroke') ||
    q.includes('overdose') || q.includes('blood vomiting') || q.includes('बेहोश') ||
    q.includes('सीने में तेज दर्द') || q.includes('हार्ट अटैक') || q.includes('unconsciousness')
  ) {
    return {
      isCritical: true,
      category: 'MEDICAL_EMERGENCY',
      safetyNoticeHi: 'यह एक सम्भावित चिकित्सीय आपातकाल (Medical Emergency) है। कृपया बिना किसी देरी के 112 / 108 डायल करें या निकटतम अस्पताल पहुँचें।',
      safetyNoticeEn: 'This is a potential medical emergency. Please dial 112 / 108 immediately or reach the nearest emergency hospital.',
      emergencyHelplines: [
        { name: 'National Ambulance Service', number: '108', description: '24x7 Free Ambulance Emergency' },
        { name: 'National Emergency Helpline', number: '112', description: 'All-in-One Emergency' }
      ],
      allowAstrology: false
    };
  }

  // Violence / Abuse triggers
  if (
    q.includes('domestic violence') || q.includes('marpit') || q.includes('mar raha hai') ||
    q.includes('abuse') || q.includes('घरेलू हिंसा') || q.includes('मारपीट') || q.includes('धमकी') ||
    q.includes('beating me') || q.includes('child abuse')
  ) {
    return {
      isCritical: true,
      category: 'VIOLENCE',
      safetyNoticeHi: 'यदि आप किसी शारीरिक खतरे या हिंसा का सामना कर रहे हैं, तो कृपया तुरंत पुलिस या महिला सुरक्षा हेल्पलाइन से सम्पर्क करें।',
      safetyNoticeEn: 'If you are in immediate physical danger or facing violence, please contact the police or protection helpline immediately.',
      emergencyHelplines: [
        { name: 'National Emergency Services', number: '112', description: 'Immediate Police Assistance' },
        { name: 'Women Helpline (India)', number: '1091 / 181', description: '24x7 Women in Distress Helpline' }
      ],
      allowAstrology: false
    };
  }

  return {
    isCritical: false,
    safetyNoticeHi: '',
    safetyNoticeEn: '',
    emergencyHelplines: [],
    allowAstrology: true
  };
}
