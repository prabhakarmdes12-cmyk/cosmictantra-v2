/**
 * Regional Jyotish Terminology
 * Tamil, Gujarati, Bengali — Authentic terminology
 */

export const regionalTerms = {
  tamil: {
    tithi: 'திதி',
    nakshatra: 'நட்சத்திரம்',
    rahuKaal: 'ராகு காலம்',
    abhijit: 'அபிஜித் முகூர்த்தம்',
    gulika: 'குளிகை',
    yamaganda: 'யமகண்டம்',
    yoga: 'யோகம்',
    lagna: 'லக்னம்',
    dasha: 'தசை',
    panchang: 'பஞ்சாங்கம்',
    note: 'Vakya vs Drik Panchangam',
  },
  gujarati: {
    tithi: 'તિથિ',
    nakshatra: 'નક્ષત્ર',
    rahuKaal: 'રાહુકાળ',
    abhijit: 'અભિજિત મુહૂર્ત',
    gulika: 'ગુળિકા',
    yamaganda: 'યમગંડ',
    yoga: 'યોગ',
    lagna: 'લગ્ન',
    dasha: 'દશા',
    panchang: 'પંચાંગ',
    note: 'Choghadiya-primary',
  },
  bengali: {
    tithi: 'তিথি',
    nakshatra: 'নক্ষত্র',
    rahuKaal: 'রাহুকাল',
    abhijit: 'অভিজিৎ মুহূর্ত',
    gulika: 'গুলিকা',
    yamaganda: 'যমগণ্ড',
    yoga: 'যোগ',
    lagna: 'লগ্ন',
    dasha: 'দশা',
    panchang: 'পঞ্জিকা',
    note: 'Panjika conventions',
  },
};

export type RegionalLanguage = 'tamil' | 'gujarati' | 'bengali';
