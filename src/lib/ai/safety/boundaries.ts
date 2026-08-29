export interface SafetyCheckResult {
  isSafe: boolean;
  sanitizedText?: string;
  violationType?: 'FATALISTIC_PREDICTION' | 'HARMFUL_PRACTICE' | 'MEDICAL_LEGAL_OVERSTEP';
  redirectMessage?: string;
}

export function evaluateVedicSafety(query: string): SafetyCheckResult {
  const q = query.toLowerCase();

  // 1. Block fatalistic / death prediction queries
  if (q.includes('कब मरूँगा') || q.includes('मृत्यु कब होगी') || q.includes('when will i die') || q.includes('death date')) {
    return {
      isSafe: false,
      violationType: 'FATALISTIC_PREDICTION',
      redirectMessage: 'सनातन वैदिक ज्योतिष में आयु व मृत्यु की पूर्व-घोषणा वर्जित है। जीवन रक्षा व आत्म-बल हेतु महामृत्युंजय मन्त्र का जप एवं भगवान विश्वनाथ की शरण सर्वोत्तम मानी गई है।'
    };
  }

  // 2. Block harmful / malefic black magic queries
  if (q.includes('मारण') || q.includes('उच्चाटन') || q.includes('वशीकरण') || q.includes('black magic') || q.includes('वशीकरण मंत्र')) {
    return {
      isSafe: false,
      violationType: 'HARMFUL_PRACTICE',
      redirectMessage: 'काशी की पावन परम्परा केवल सात्त्विक, कल्याणकारी व रक्षात्मक वैदिक अनुष्ठानों का समर्थन करती है। मन की शान्ति व रक्षा हेतु आप श्री हनुमान चालीसा अथवा गायत्री मन्त्र का आश्रय लें।'
    };
  }

  return { isSafe: true };
}
