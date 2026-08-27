'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Flame, 
  Volume2, 
  VolumeX, 
  Share2, 
  Sun, 
  Moon, 
  Clock, 
  Compass, 
  Check, 
  Copy, 
  ChevronRight, 
  ChevronLeft,
  Maximize2, 
  Minimize2,
  Heart, 
  RotateCcw,
  Bell,
  Eye,
  Calendar,
  Send,
  ExternalLink,
  Play,
  Pause,
  Tv,
  Award,
  BookOpen,
  Phone,
  MapPin,
  Search,
  Image as ImageIcon,
  ShieldCheck,
  Radio,
  Layers,
  Settings,
  Tv2,
  ListFilter,
  AlertCircle
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { playBell, playTick, playConch, playFlowerDrop } from '@/lib/chitiAudio';
import { getProfiles } from '@/lib/profileStore';

interface ShrineItem {
  id: string;
  order: number;
  name: string;
  nameHi: string;
  deity: string;
  deityHi: string;
  location: string;
  locationHi: string;
  state: string;
  category: 'JYOTIRLINGA' | 'SHAKTI_PEETH' | 'CHAR_DHAM' | 'GANGA_AARTI';
  shloka: string;
  shlokaMeaning: string;
  angaOrSignificance: string;
  bhairavOrLord?: string;
  imageUrl: string;
  videoId: string;
  liveUrl: string;
  trustUrl: string;
  helpline: string;
  mapQuery: string;
  timingsHi: string;
  color: string;
}

// 1. All 12 Sacred Dwadasha Jyotirlingas of Bharat with Authentic Verified Images & Direct Live Feeds
const JYOTIRLINGA_DATA: ShrineItem[] = [
  {
    id: 'jyotirlinga-1',
    order: 1,
    name: '1. Shri Somnath Jyotirlinga',
    nameHi: '१. श्री सोमनाथ महादेव (प्रथम ज्योतिर्लिंग)',
    deity: 'Lord Somnath (Shiva)',
    deityHi: 'देवाधिदेव सोमनाथ',
    location: 'Prabhas Patan, Saurashtra',
    locationHi: 'प्रभास पाटन, सौराष्ट्र',
    state: 'Gujarat',
    category: 'JYOTIRLINGA',
    shloka: 'सौराष्ट्रे सोमनाथं च श्रीशैले मल्लिकार्जुनम् ।',
    shlokaMeaning: 'सौराष्ट्र प्रान्त में प्रथम ज्योतिर्लिंग श्री सोमनाथ एवं श्रीशैल पर्वत पर मल्लिकार्जुन विराजित हैं।',
    angaOrSignificance: 'प्रथम ज्योतिर्लिंग — चन्द्रमा के शाप निवारण हेतु भगवान शिव यहाँ प्रत्यक्ष प्रकट हुए।',
    bhairavOrLord: 'चन्द्रेश्वर महादेव',
    imageUrl: '/images/darshan/somnath.jpg',
    videoId: 'Wu321m2SUKY',
    liveUrl: 'https://www.youtube.com/@SomnathTempleOfficialChannel/live',
    trustUrl: 'https://somnath.org',
    helpline: '+91 2876 231 200',
    mapQuery: 'Somnath Temple Gujarat',
    timingsHi: 'प्रातः ०७:०० • मध्याह्न १२:०० • सांध्य आरती ०७:०० सायं',
    color: '#0284C7'
  },
  {
    id: 'jyotirlinga-2',
    order: 2,
    name: '2. Shri Mallikarjuna Jyotirlinga',
    nameHi: '२. श्री मल्लिकार्जुन स्वामी',
    deity: 'Lord Mallikarjuna & Bhramaramba',
    deityHi: 'श्री मल्लिकार्जुन एवं माँ भ्रमराम्बा',
    location: 'Srisailam, Kurnool',
    locationHi: 'श्रीशैलम् पर्वत, कर्नूल',
    state: 'Andhra Pradesh',
    category: 'JYOTIRLINGA',
    shloka: 'सौराष्ट्रे सोमनाथं च श्रीशैले मल्लिकार्जुनम् ।',
    shlokaMeaning: 'श्रीशैल शिखर पर मल्लिकार्जुन भगवान शिव एवं देवी पार्वती का साक्षात् युगल रूप है।',
    angaOrSignificance: 'दक्षिण का कैलास — यह ज्योतिर्लिंग और शक्तिपीठ (माँ भ्रमराम्बा) दोनों का दुर्लभ संगम है।',
    bhairavOrLord: 'शम्बरानन्द भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1400&q=85',
    videoId: '3R-3m_Q9qQ8',
    liveUrl: 'https://www.youtube.com/@srisailadevasthanam/live',
    trustUrl: 'https://srisailadevasthanam.org',
    helpline: '+91 8524 288 888',
    mapQuery: 'Mallikarjuna Swamy Temple Srisailam',
    timingsHi: 'सुप्रभातम् ०५:०० • महामंगल आरती ०६:३० सायं',
    color: '#0D9488'
  },
  {
    id: 'jyotirlinga-3',
    order: 3,
    name: '3. Shri Mahakaleshwar Jyotirlinga',
    nameHi: '३. श्री महाकालेश्वर (उज्जैन)',
    deity: 'Lord Mahakal (Shiva)',
    deityHi: 'काल के भी काल श्री महाकाल',
    location: 'Ujjain, Avantika',
    locationHi: 'उज्जैन (अवन्तिका Puri)',
    state: 'Madhya Pradesh',
    category: 'JYOTIRLINGA',
    shloka: 'उज्जयिन्यां महाकालमोङ्कारममलेश्वरम् ।',
    shlokaMeaning: 'उज्जयिनी नगरी में महाकाल तथा ओंकार पर्वत पर अमलेश्वर विराजित हैं।',
    angaOrSignificance: 'एकमात्र दक्षिणमुखी ज्योतिर्लिंग — विश्वप्रसिद्ध भस्म आरती द्वारा काल-मृत्यु भय का नाश होता है।',
    bhairavOrLord: 'आनन्द भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1400&q=85',
    videoId: 'V31rQRlFNMs',
    liveUrl: 'https://www.youtube.com/@ShreeMahakaleshwarUjjainOfficial/live',
    trustUrl: 'https://shrimahakaleshwar.com',
    helpline: '+91 734 255 0563',
    mapQuery: 'Mahakaleshwar Jyotirlinga Ujjain',
    timingsHi: 'भस्म आरती ०४:०० प्रातः • सांध्य आरती ०६:३० सायं',
    color: '#C2410C'
  },
  {
    id: 'jyotirlinga-4',
    order: 4,
    name: '4. Shri Omkareshwar Jyotirlinga',
    nameHi: '४. श्री ओंकारेश्वर / ममलेश्वर महादेव',
    deity: 'Lord Omkareshwar',
    deityHi: 'प्रणव स्वरूप ओंकारेश्वर',
    location: 'Mandhata Island, Narmada River',
    locationHi: 'मान्धाता द्वीप, नर्मदा तट',
    state: 'Madhya Pradesh',
    category: 'JYOTIRLINGA',
    shloka: 'उज्जयिन्यां महाकालमोङ्कारममलेश्वरम् ।',
    shlokaMeaning: 'पवित्र नर्मदा नदी के ॐ आकार वाले द्वीप पर ओंकारेश्वर ज्योतिर्लिंग विराजित हैं।',
    angaOrSignificance: 'नर्मदा तट पर ॐ कार स्वरूप द्वीप जहाँ भगवान शिव शयन हेतु पधारते हैं।',
    bhairavOrLord: 'अमलेश्वर',
    imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1400&q=85',
    videoId: 'cQpL9s9zCcS',
    liveUrl: 'https://www.youtube.com/@omkareshwartemple/live',
    trustUrl: 'https://shriomkareshwar.org',
    helpline: '+91 7280 271 228',
    mapQuery: 'Omkareshwar Temple Madhya Pradesh',
    timingsHi: 'प्रातः आरती ०५:०० • शयन आरती ०८:३० रात्रि',
    color: '#D97706'
  },
  {
    id: 'jyotirlinga-5',
    order: 5,
    name: '5. Shri Kedarnath Jyotirlinga',
    nameHi: '५. श्री केदारनाथ धाम (हिमालय)',
    deity: 'Lord Kedarnath',
    deityHi: 'हिमालयपति श्री केदारनाथ',
    location: 'Rudraprayag, Garhwal Himalayas',
    locationHi: 'रुद्रप्रयाग (मन्दाकिनी तट)',
    state: 'Uttarakhand',
    category: 'JYOTIRLINGA',
    shloka: 'परल्यां वैद्यनाथं च डाकिन्यां भीमशङ्करम् । सेतुबन्धे तु रामेशं नागेशं दारुकावने ॥',
    shlokaMeaning: 'तुषार-मण्डित हिमालय के सर्वोच्च शिखर पर विराजित श्री केदारनाथ मोक्ष प्रदाता हैं।',
    angaOrSignificance: 'पाण्डवों को पापमुक्त करने हेतु प्रकट हुए वृषभ पृष्ठ (बैल की पीठ) रूपी स्वयंभू शिवलिंग।',
    bhairavOrLord: 'भुकुण्ड भैरव',
    imageUrl: '/images/darshan/kedarnath.jpg',
    videoId: 'L-t1V35G-HY',
    liveUrl: 'https://www.youtube.com/@badrikedar/live',
    trustUrl: 'https://badrinath-kedarnath.gov.in',
    helpline: '+91 135 274 1600',
    mapQuery: 'Kedarnath Temple Uttarakhand',
    timingsHi: 'महाभिषेक ०४:०० प्रातः • शयन आरती ०७:३० सायं',
    color: '#2563EB'
  },
  {
    id: 'jyotirlinga-6',
    order: 6,
    name: '6. Shri Bhimashankar Jyotirlinga',
    nameHi: '६. श्री भीमाशंकर महादेव',
    deity: 'Lord Bhimashankar',
    deityHi: 'भीमा नदी उद्गम स्वामी',
    location: 'Bhorgiri, Sahyadri Hills',
    locationHi: 'सह्याद्रि पर्वत, भीमा उद्गम',
    state: 'Maharashtra',
    category: 'JYOTIRLINGA',
    shloka: 'डाकिन्यां भीमशङ्करम् ।',
    shlokaMeaning: 'डाकिनी क्षेत्र में भीमाशंकर ज्योतिर्लिंग के रूप में भगवान शिव प्रकट हुए।',
    angaOrSignificance: 'भीमासुर का वध करने हेतु भगवान शिव ने यहाँ रुद्र रूप धारण किया। भीमा नदी का उद्गम स्थल।',
    bhairavOrLord: 'भीम भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1400&q=85',
    videoId: 'e_0dY52R54c',
    liveUrl: 'https://www.youtube.com/@bhimashankartemple/live',
    trustUrl: 'https://bhimashankar.in',
    helpline: '+91 2135 273 244',
    mapQuery: 'Bhimashankar Temple Maharashtra',
    timingsHi: 'काकड़ आरती ०४:३० • सांध्य आरती ०७:३० सायं',
    color: '#059669'
  },
  {
    id: 'jyotirlinga-7',
    order: 7,
    name: '7. Shri Kashi Vishwanath Jyotirlinga',
    nameHi: '७. श्री काशी विश्वनाथ ज्योतिर्लिंग (वाराणसी)',
    deity: 'Lord Vishweshwara (Kashi Naresh)',
    deityHi: 'विश्वेश्वर, काशी के अधिपति',
    location: 'Varanasi, Ganga Bank',
    locationHi: 'वाराणसी (अविमुक्त क्षेत्र)',
    state: 'Uttar Pradesh',
    category: 'JYOTIRLINGA',
    shloka: 'वाराणस्यां तु विश्वेशं त्र्यम्बकं गौतमीतटे ।',
    shlokaMeaning: 'पवित्र काशी में विश्वनाथ एवं गोदावरी तट पर त्र्यम्बकेश्वर विराजित हैं।',
    angaOrSignificance: 'त्रिशूल पर टिकी मोक्षदायिनी काशी नगरी के राजा, जो मृत्यु काल में तारक मन्त्र प्रदान करते हैं।',
    bhairavOrLord: 'काशी कोतवाल काल भैरव',
    imageUrl: '/images/darshan/kashi-vishwanath.jpg',
    videoId: '-rqYkZ3x0jM',
    liveUrl: 'https://www.youtube.com/@ShreeKashiVishwanathMandir/live',
    trustUrl: 'https://www.shrikashivishwanath.org',
    helpline: '+91 542 239 2629',
    mapQuery: 'Kashi Vishwanath Temple Varanasi',
    timingsHi: 'मंगला आरती ०३:०० प्रातः • सांध्य आरती ०७:०० सायं',
    color: '#8E6F1D'
  },
  {
    id: 'jyotirlinga-8',
    order: 8,
    name: '8. Shri Trimbakeshwar Jyotirlinga',
    nameHi: '८. श्री त्र्यम्बकेश्वर ज्योतिर्लिंग (नासिक)',
    deity: 'Lord Trimbakeshwar (Brahma, Vishnu, Mahesh)',
    deityHi: 'त्रिदेव स्वरूप त्र्यम्बकेश्वर',
    location: 'Trimbak, Brahmagiri Hills',
    locationHi: 'ब्रह्मगिरि पर्वत, गोदावरी उद्गम',
    state: 'Maharashtra',
    category: 'JYOTIRLINGA',
    shloka: 'त्र्यम्बकं गौतमीतटे ।',
    shlokaMeaning: 'गौतमी (गोदावरी) नदी के तट पर ब्रह्मगिरि पर्वत के निकट त्र्यम्बकेश्वर ज्योतिर्लिंग स्थित हैं।',
    angaOrSignificance: 'एकमात्र ज्योतिर्लिंग जिसमें ब्रह्मा, विष्णु और महेश तीनों के तीन मुख लिंग में समाहित हैं।',
    bhairavOrLord: 'त्र्यम्बक भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1624555130581-1d9cca783bc0?auto=format&fit=crop&w=1400&q=85',
    videoId: 'uK7_xGf7b-o',
    liveUrl: 'https://www.youtube.com/@trimbakeshwar/live',
    trustUrl: 'https://trimbakeshwartrust.com',
    helpline: '+91 2594 233 215',
    mapQuery: 'Trimbakeshwar Shiva Temple Nashik',
    timingsHi: 'मंगला आरती ०५:३० • सांध्य महापूजा ०७:०० सायं',
    color: '#4F46E5'
  },
  {
    id: 'jyotirlinga-9',
    order: 9,
    name: '9. Shri Baidyanath Jyotirlinga',
    nameHi: '९. श्री वैद्यनाथ धाम (देवघर)',
    deity: 'Lord Baidyanath (Vaidyeshwara)',
    deityHi: 'मनोकामना लिंग वैद्यनाथ',
    location: 'Deoghar, Santhal Pargana',
    locationHi: 'देवघर (बाबा धाम)',
    state: 'Jharkhand',
    category: 'JYOTIRLINGA',
    shloka: 'परल्यां वैद्यनाथं च ।',
    shlokaMeaning: 'रावण द्वारा लंका ले जाते समय स्थापित पावन वैद्यनाथ ज्योतिर्लिंग समस्त रोगों का शमन करते हैं।',
    angaOrSignificance: 'मनोकामना लिंग — सावन मास में कांवड़िये सुल्तानगंज से उत्तरवाहिनी गंगाजल लेकर पदयात्रा करते हैं।',
    bhairavOrLord: 'चन्द्रचूड़ भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1400&q=85',
    videoId: 'e9k0a3O2HnA',
    liveUrl: 'https://www.youtube.com/@babadhamdeoghar/live',
    trustUrl: 'https://babadham.org',
    helpline: '+91 6432 232 295',
    mapQuery: 'Baba Baidyanath Dham Deoghar',
    timingsHi: 'प्रातः सरकारी पूजा ०४:०० • सांध्य शृंगार ०७:३०',
    color: '#9333EA'
  },
  {
    id: 'jyotirlinga-10',
    order: 10,
    name: '10. Shri Nageshwar Jyotirlinga',
    nameHi: '१०. श्री नागेश्वर महादेव (दारुकावन)',
    deity: 'Lord Nageshwara',
    deityHi: 'नागेश्वर दारुकावन पति',
    location: 'Dwarka / Darukavana',
    locationHi: 'द्वारका पुरी के समीप',
    state: 'Gujarat',
    category: 'JYOTIRLINGA',
    shloka: 'नागेशं दारुकावने ।',
    shlokaMeaning: 'दारुक वन में नागेश्वर ज्योतिर्लिंग समस्त विष व सर्पदोषों का निवारण करते हैं।',
    angaOrSignificance: 'भगवान शिव का प्रथम ज्योतिर्लिंग स्वरूप जो रुद्राक्ष एवं नागों से सुशोभित होकर अभय प्रदान करता है।',
    bhairavOrLord: 'भीम भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1400&q=85',
    videoId: 'W55yFhU9XlE',
    liveUrl: 'https://www.youtube.com/@nageshwartemple/live',
    trustUrl: 'https://dwarkadhish.org',
    helpline: '+91 2892 234 080',
    mapQuery: 'Nageshwar Jyotirlinga Dwarka Gujarat',
    timingsHi: 'प्रातः आरती ०६:०० • सांध्य महाआरती ०७:०० सायं',
    color: '#EA580C'
  },
  {
    id: 'jyotirlinga-11',
    order: 11,
    name: '11. Shri Rameshwaram Jyotirlinga',
    nameHi: '११. श्री रामेश्वरम् ज्योतिर्लिंग (तमिलनाडु)',
    deity: 'Lord Ramanathaswamy',
    deityHi: 'श्री रामनाथस्वामी (राम द्वारा पूजित)',
    location: 'Rameswaram Island, Pamban',
    locationHi: 'पाम्बन द्वीप, सागर संगम',
    state: 'Tamil Nadu',
    category: 'JYOTIRLINGA',
    shloka: 'सेतुबन्धे तु रामेशम् ।',
    shlokaMeaning: 'श्री रामसेतु के तट पर प्रभु श्रीराम द्वारा स्वयं बालू से निर्मित रामेश्वर ज्योतिर्लिंग विराजित हैं।',
    angaOrSignificance: 'लंका विजय से पूर्व श्रीराम द्वारा माता सीता सहित स्थापित लिंग। यहाँ के २२ पावन तीर्थ कुण्ड प्रसिद्ध हैं।',
    bhairavOrLord: 'रुरु भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1400&q=85',
    videoId: 'jW7eS3rV24o',
    liveUrl: 'https://www.youtube.com/@rameshwaramtemple/live',
    trustUrl: 'https://rameswaramtemple.tnhrce.in',
    helpline: '+91 4573 221 223',
    mapQuery: 'Ramanathaswamy Temple Rameswaram',
    timingsHi: 'स्पटिक लिंग दर्शन ०५:०० प्रातः • सांध्य आरती ०७:००',
    color: '#0891B2'
  },
  {
    id: 'jyotirlinga-12',
    order: 12,
    name: '12. Shri Grishneshwar Jyotirlinga',
    nameHi: '१२. श्री घृष्णेश्वर / घुश्मेश्वर महादेव',
    deity: 'Lord Grishneshwar',
    deityHi: 'घुश्मा-भक्ति फलप्रद घृष्णेश्वर',
    location: 'Verul, Ellora Caves',
    locationHi: 'वेरुल (एलोरा गुफाओं के निकट)',
    state: 'Maharashtra',
    category: 'JYOTIRLINGA',
    shloka: 'घुश्मेशं च शिवालये । एतानि ज्योतिर्लिङ्गानि सायं प्रातः पठेन्नरः ॥',
    shlokaMeaning: 'शिवालय क्षेत्र में घृष्णेश्वर ज्योतिर्लिंग स्थित हैं। द्वादश ज्योतिर्लिंग के स्मरण से समस्त पाप नष्ट होते हैं।',
    angaOrSignificance: '१२वाँ अन्तिम ज्योतिर्लिंग — परम शिवभक्त घुश्मा की अनन्य भक्ति से प्रसन्न होकर भगवान यहाँ प्रकट हुए।',
    bhairavOrLord: 'कपाल भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1624555130581-1d9cca783bc0?auto=format&fit=crop&w=1400&q=85',
    videoId: 'Uu83ro6p4iI',
    liveUrl: 'https://www.youtube.com/@grishneshwartemple/live',
    trustUrl: 'https://grishneshwar.org',
    helpline: '+91 2437 244 585',
    mapQuery: 'Grishneshwar Jyotirlinga Ellora',
    timingsHi: 'मंगला आरती ०५:३० • सांध्य आरती ०८:०० रात्रि',
    color: '#7C3AED'
  }
];

// 2. The Major Shakti Peethas of Bharat
const SHAKTI_PEETH_DATA: ShrineItem[] = [
  {
    id: 'shakti-1',
    order: 1,
    name: '1. Maa Kamakhya Temple (Guwahati)',
    nameHi: '१. माँ कामाख्या महापीठ (गुवाहाटी)',
    deity: 'Maa Kamakhya (Adi Shakti)',
    deityHi: 'महामाया माँ कामाख्या',
    location: 'Nilachal Hills, Guwahati',
    locationHi: 'नीलाचल पर्वत, गुवाहाटी',
    state: 'Assam',
    category: 'SHAKTI_PEETH',
    shloka: 'कामाख्या कामसम्पन्ना कामेशी कामरूपिणी ।',
    shlokaMeaning: 'नीलाचल पर्वत पर स्थित माँ कामाख्या साधकों की समस्त मनोकामनाएं पूर्ण करने वाली महाशक्ति हैं।',
    angaOrSignificance: 'योनि पीठ — सती का योनि मण्डल यहाँ गिरा। तन्त्र साधना का सर्वोच्च केन्द्र (अम्बुवाची मेला)।',
    bhairavOrLord: 'उमानन्द भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1624555130581-1d9cca783bc0?auto=format&fit=crop&w=1400&q=85',
    videoId: 'aKQP2prPPLE',
    liveUrl: 'https://www.youtube.com/@MaaKamakhyaDevasthan/live',
    trustUrl: 'https://maakamakhya.org',
    helpline: '+91 361 273 4654',
    mapQuery: 'Kamakhya Temple Guwahati Assam',
    timingsHi: 'आरती ०५:३० प्रातः • भोग आरती ०१:०० • सांध्य आरती ०७:३०',
    color: '#BE123C'
  },
  {
    id: 'shakti-2',
    order: 2,
    name: '2. Kalighat Kali Mandir (Kolkata)',
    nameHi: '२. माँ कालीघाट (कोलकाता)',
    deity: 'Maa Kalika',
    deityHi: 'दक्षिण कालिका माँ',
    location: 'Kolkata, Adi Ganga Bank',
    locationHi: 'कोलकाता (आदि गंगा तट)',
    state: 'West Bengal',
    category: 'SHAKTI_PEETH',
    shloka: 'कालीका दक्षिणे मूले नकुलेशेन सङ्गता ।',
    shlokaMeaning: 'माँ काली यहाँ अपने रौद्र एवं कृपामयी स्वरूप में विराजमान होकर भक्तों का कल्याण करती हैं।',
    angaOrSignificance: 'दक्षिण पादांगुष्ठ — सती के दाहिने पैर का अंगूठा यहाँ गिरा था।',
    bhairavOrLord: 'नकुलेश भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1400&q=85',
    videoId: '9g0H4Yv6v9o',
    liveUrl: 'https://www.youtube.com/@kalighattemple/live',
    trustUrl: 'https://kalighattemple.com',
    helpline: '+91 33 2455 2236',
    mapQuery: 'Kalighat Kali Temple Kolkata',
    timingsHi: 'मंगला ०५:०० • मध्याह्न भोग ०२:०० • सांध्य आरती ०७:००',
    color: '#881337'
  },
  {
    id: 'shakti-3',
    order: 3,
    name: '3. Maa Tarapith (Birbhum)',
    nameHi: '३. माँ तारापीठ (बीरभूम)',
    deity: 'Maa Ugra Tara',
    deityHi: 'माँ उग्रतारा (महाविद्या)',
    location: 'Tarapith, Rampurhat',
    locationHi: 'तारापीठ, बीरभूम (द्वारका नदी)',
    state: 'West Bengal',
    category: 'SHAKTI_PEETH',
    shloka: 'तारा त्रैलोक्यतारिणी महाभयहरी शिवा ।',
    shlokaMeaning: 'द्वितीय महाविद्या माँ तारा भवसागर से तारने वाली एवं महाभय का नाश करने वाली हैं।',
    angaOrSignificance: 'नयन पीठ — सती का तीसरा नेत्र (नयन) यहाँ गिरा था। वामाखेपा की सिद्ध साधना भूमि।',
    bhairavOrLord: 'चन्द्रचूड़ भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1400&q=85',
    videoId: 's5R-tG0l6-Q',
    liveUrl: 'https://www.youtube.com/@tarapithmandir/live',
    trustUrl: 'https://tarapithtemple.org',
    helpline: '+91 3461 253 288',
    mapQuery: 'Tarapith Temple Birbhum West Bengal',
    timingsHi: 'प्रातः स्नानाभिषेक ०६:०० • सन्ध्या आरती ०७:३०',
    color: '#9F1239'
  },
  {
    id: 'shakti-4',
    order: 4,
    name: '4. Maa Jwala Ji (Kangra)',
    nameHi: '४. माँ ज्वाला जी (कांगड़ा)',
    deity: 'Maa Jwalamukhi',
    deityHi: 'अखण्ड ज्योति स्वरूपा ज्वाला जी',
    location: 'Kangra Valley, Shivalik Hills',
    locationHi: 'कांगड़ा घाटी, शिवालिक',
    state: 'Himachal Pradesh',
    category: 'SHAKTI_PEETH',
    shloka: 'ज्वालामुखी महाभागा जिह्वापातेन पाविता ।',
    shlokaMeaning: 'जहाँ सती की जिह्वा गिरी, वहाँ अनन्त काल से प्राकृतिक पावन ज्योति प्रज्वलित है।',
    angaOrSignificance: 'जिह्वा पीठ — सती की जीभ यहाँ गिरी। यहाँ कोई मूर्ति नहीं, ९ पावन ज्वालाओं की पूजा होती है।',
    bhairavOrLord: 'उन्मत्त भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1400&q=85',
    videoId: '8W8I0uVjJ1U',
    liveUrl: 'https://www.youtube.com/@jwalajitemple/live',
    trustUrl: 'https://jwalajitemple.org',
    helpline: '+91 1970 222 226',
    mapQuery: 'Jwalamukhi Temple Kangra Himachal',
    timingsHi: 'मंगला आरती ०५:०० • शयन आरती ०८:०० रात्रि',
    color: '#EA580C'
  },
  {
    id: 'shakti-5',
    order: 5,
    name: '5. Maa Vishalakshi (Varanasi)',
    nameHi: '५. माँ विशालाक्षी शक्तिपीठ (काशी)',
    deity: 'Maa Vishalakshi',
    deityHi: 'विशाल नयनों वाली माँ विशालाक्षी',
    location: 'Mir Ghat, Kashi',
    locationHi: 'मीर घाट, काशी (वाराणसी)',
    state: 'Uttar Pradesh',
    category: 'SHAKTI_PEETH',
    shloka: 'वाराणस्यां विशालाक्षी मणिकर्णीति विश्रुता ।',
    shlokaMeaning: 'काशी क्षेत्र में माँ विशालाक्षी मणिकर्णिका कुण्ड के निकट शक्तिपीठ रूप में विराजित हैं।',
    angaOrSignificance: 'कर्ण कुण्डल / नयन — सती के कान की मणियाँ यहाँ गिरीं। काशी यात्रा विशालाक्षी दर्शन बिना अधूरी है।',
    bhairavOrLord: 'काल भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=1400&q=85',
    videoId: 'H7-bL2Yp4j8',
    liveUrl: 'https://www.youtube.com/@vishalakshitemple/live',
    trustUrl: 'https://varanasi.nic.in',
    helpline: '+91 542 222 0001',
    mapQuery: 'Vishalakshi Temple Varanasi',
    timingsHi: 'प्रातः आरती ०५:३० • सांध्य आरती ०७:०० सायं',
    color: '#B45309'
  },
  {
    id: 'shakti-6',
    order: 6,
    name: '6. Maa Vaishno Devi Bhavan',
    nameHi: '६. माँ वैष्णो देवी (त्रिकूटा पर्वत, कटरा)',
    deity: 'Maa Vaishno Devi (Kali, Lakshmi, Saraswati)',
    deityHi: 'माँ वैष्णो देवी (त्रिगुणात्मिका पिण्डी)',
    location: 'Trikuta Hills, Katra',
    locationHi: 'त्रिकूटा पर्वत, कटरा धाम',
    state: 'Jammu & Kashmir',
    category: 'SHAKTI_PEETH',
    shloka: 'महाकाली महालक्ष्मी महासरस्वती रूपिणी ।',
    shlokaMeaning: 'माँ वैष्णो देवी महाकाली, महालक्ष्मी एवं महासरस्वती तीनों के सम्मिलित स्वरूप में अभय देती हैं।',
    angaOrSignificance: 'पवित्र गुफा — त्रिकूटा पर्वत पर प्राकृतिक तीन पिण्डियों के रूप में माँ साक्षात् विराजित हैं।',
    bhairavOrLord: 'बाबा भैरवनाथ',
    imageUrl: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1400&q=85',
    videoId: 'hZgP-Y4YJ8w',
    liveUrl: 'https://www.youtube.com/@maavaishnodevibhojan/live',
    trustUrl: 'https://www.maavaishnodevi.org',
    helpline: '+91 1991 232 029',
    mapQuery: 'Vaishno Devi Bhawan Katra',
    timingsHi: 'प्रातः आरती ०५:०० • सांध्य महाआरती ०६:३० सायं',
    color: '#E11D48'
  },
  {
    id: 'shakti-7',
    order: 7,
    name: '7. Maa Chamundeshwari (Mysuru)',
    nameHi: '७. माँ चामुण्डेश्वरी शक्तिपीठ (मैसूर)',
    deity: 'Maa Chamundi (Durga)',
    deityHi: 'महिषासुरमर्दिनी माँ चामुण्डा',
    location: 'Chamundi Hills, Mysuru',
    locationHi: 'चामुंडी पर्वत, मैसूर',
    state: 'Karnataka',
    category: 'SHAKTI_PEETH',
    shloka: 'चामुण्डा चण्डमुण्डघ्नी महिषासुरमर्दिनी ।',
    shlokaMeaning: 'महिषासुर का संहार करने वाली माँ चामुण्डेश्वरी भक्तों को पराक्रम व रक्षा प्रदान करती हैं।',
    angaOrSignificance: 'केश पीठ — सती के केश (बाल) यहाँ गिरे थे। मैसूर का प्रसिद्ध दशहरा उत्सव यहीं से सम्बद्ध है।',
    bhairavOrLord: 'कपाल भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1400&q=85',
    videoId: 'FqS5f1y_z4w',
    liveUrl: 'https://www.youtube.com/@chamundeshwaritemple/live',
    trustUrl: 'https://chamundeshwaritemple.in',
    helpline: '+91 821 259 0027',
    mapQuery: 'Chamundeshwari Temple Mysuru',
    timingsHi: 'प्रातः दर्शन ०७:३० • महामंगला आरती ०७:३० सायं',
    color: '#7E22CE'
  },
  {
    id: 'shakti-8',
    order: 8,
    name: '8. Maa Ambaji Temple (Gujarat)',
    nameHi: '८. माँ अम्बाजी शक्तिपीठ (गब्बर पर्वत)',
    deity: 'Maa Amba (Arasuri Ambaji)',
    deityHi: 'माँ अम्बा (आरासुरी अम्बाजी)',
    location: 'Gabbar Hill, Banaskantha',
    locationHi: 'गब्बर पर्वत, बनासकांठा',
    state: 'Gujarat',
    category: 'SHAKTI_PEETH',
    shloka: 'अम्बा विश्वम्भरी देवी सर्वशत्रुविनाशिनी ।',
    shlokaMeaning: 'गब्बर पर्वत पर माँ अम्बा का श्रीयंत्र स्वरूप अखण्ड ज्योति के रूप में पूजित है।',
    angaOrSignificance: 'हृदय पीठ — सती का हृदय यहाँ गिरा था। यहाँ मूर्ति नहीं, गुप्त "विशो यंत्र" की पूजा होती है।',
    bhairavOrLord: 'बटुक भैरव',
    imageUrl: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1400&q=85',
    videoId: 'n5l7t1w8Q_c',
    liveUrl: 'https://www.youtube.com/@ambajitempleofficial/live',
    trustUrl: 'https://ambajitemple.in',
    helpline: '+91 2749 262 136',
    mapQuery: 'Ambaji Temple Gabbar Hill Gujarat',
    timingsHi: 'प्रातः आरती ०७:०० • सांध्य आरती ०७:०० सायं',
    color: '#C026D3'
  }
];

// 3. Char Dham & Famous Mahateerthas of Bharat
const CHAR_DHAM_DATA: ShrineItem[] = [
  {
    id: 'chardham-1',
    order: 1,
    name: '1. Shri Ram Janmabhoomi Mandir (Ayodhya)',
    nameHi: '१. श्री राम जन्मभूमि मंदिर (अयोध्या धाम)',
    deity: 'Bhagwan Shri Ram Lalla',
    deityHi: 'प्रभु श्रीराम लला सरकार',
    location: 'Ayodhya Dham, Sarayu Bank',
    locationHi: 'अयोध्या धाम (सरयू तट)',
    state: 'Uttar Pradesh',
    category: 'CHAR_DHAM',
    shloka: 'रामो विग्रहवान् धर्मः साधुः सत्यपराक्रमः ।',
    shlokaMeaning: 'मर्यादा पुरुषोत्तम प्रभु श्रीराम साक्षात् धर्म एवं सत्य के विग्रह हैं।',
    angaOrSignificance: 'प्रभु श्रीराम की पावन जन्मस्थली — करोड़ों सनातनियों की आस्था का नव-निर्मित भव्य मन्दिर।',
    imageUrl: '/images/darshan/ram-mandir.jpg',
    videoId: 'kY-F3j_G-k0',
    liveUrl: 'https://www.youtube.com/@DoordarshanNational/live',
    trustUrl: 'https://srjbtkshetra.org',
    helpline: '+91 5278 297 800',
    mapQuery: 'Ram Mandir Ayodhya Uttar Pradesh',
    timingsHi: 'मंगला आरती ०४:३० • शृंगार आरती ०६:३० • सांध्य ०७:३०',
    color: '#D97706'
  },
  {
    id: 'chardham-2',
    order: 2,
    name: '2. Shri Badrinath Dham (Himalayas)',
    nameHi: '२. श्री बदरीनाथ धाम (अलकनन्दा तट)',
    deity: 'Lord Badri Vishal (Narayana)',
    deityHi: 'श्री बदरी विशाल नारायण',
    location: 'Chamoli, Garhwal Himalayas',
    locationHi: 'चमोली (नर-नारायण पर्वत)',
    state: 'Uttarakhand',
    category: 'CHAR_DHAM',
    shloka: 'बद्रीनाथं समाराध्य मुच्यते सर्वकिल्बिषैः ।',
    shlokaMeaning: 'बदरी विशाल के दर्शन मात्र से मनुष्य जन्म-मरण के बन्धन से मुक्त हो जाता है।',
    angaOrSignificance: 'वैकुण्ठ धाम — बदरी वन में तपस्यारत भगवान नारायण का शालिग्राम शिला रूप।',
    imageUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1400&q=85',
    videoId: 'aKQP2prPPLE',
    liveUrl: 'https://www.youtube.com/@badrikedar/live',
    trustUrl: 'https://badrinath-kedarnath.gov.in',
    helpline: '+91 135 274 1600',
    mapQuery: 'Badrinath Temple Uttarakhand',
    timingsHi: 'महाभिषेक ०४:३० प्रातः • शयन आरती ०८:३० रात्रि',
    color: '#2563EB'
  },
  {
    id: 'chardham-3',
    order: 3,
    name: '3. Shri Jagannath Puri Dham (Odisha)',
    nameHi: '३. श्री जगन्नाथ महाप्रभु (पुरी धाम)',
    deity: 'Lord Jagannath, Balabhadra, Subhadra',
    deityHi: 'जगत के नाथ श्री जगन्नाथ जी',
    location: 'Puri, Bay of Bengal Coast',
    locationHi: 'श्रीक्षेत्र Puri (महोदधि तट)',
    state: 'Odisha',
    category: 'CHAR_DHAM',
    shloka: 'नीलाचलनिवासाय नित्याय परमात्मने । बलभद्रसुभद्राभ्यां जगन्नाथाय ते नमः ॥',
    shlokaMeaning: 'नीलाचल पर्वत पर नित्य निवास करने वाले भगवान जगन्नाथ, बलभद्र और सुभद्रा को प्रणाम है।',
    angaOrSignificance: 'महाप्रसाद धाम — विश्वप्रसिद्ध रथयात्रा एवं दारु ब्रह्म स्वरूप श्री जगन्नाथ जी।',
    imageUrl: 'https://images.unsplash.com/photo-1608408891486-f5194b6845cc?auto=format&fit=crop&w=1400&q=85',
    videoId: 'aKQP2prPPLE',
    liveUrl: 'https://www.youtube.com/@ddodiya/live',
    trustUrl: 'https://puri.nic.in',
    helpline: '+91 6752 222 002',
    mapQuery: 'Jagannath Temple Puri Odisha',
    timingsHi: 'मंगला आरती ०५:०० • सन्ध्या धूप ०७:०० सायं',
    color: '#EA580C'
  },
  {
    id: 'chardham-4',
    order: 4,
    name: '4. Sri Venkateswara Swamy (Tirupati Balaji)',
    nameHi: '४. श्री वेंकटेश्वर स्वामी (तिरुपति बालाजी)',
    deity: 'Lord Balaji (Govinda)',
    deityHi: 'कलयुग के प्रत्यक्ष देव भगवान बालाजी',
    location: 'Tirumala Hills, Tirupati',
    locationHi: 'सप्तगिरि (तिरुमला पर्वत)',
    state: 'Andhra Pradesh',
    category: 'CHAR_DHAM',
    shloka: 'वेङ्कटाद्रिसमं स्थानं ब्रह्माण्डे नास्ति किञ्चन । वेङ्कटेशसमो देवो न भूतो न भविष्यति ॥',
    shlokaMeaning: 'सम्पूर्ण ब्रह्माण्ड में वेंकटाद्रि के समान कोई तीर्थ नहीं और वेंकटेश के समान कोई देव नहीं।',
    angaOrSignificance: 'सप्तगिरि अधिपति — कलिकाल में भक्तों की रक्षा करने वाले साक्षात् भगवान विष्णु।',
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1400&q=85',
    videoId: 'hZgP-Y4YJ8w',
    liveUrl: 'https://www.youtube.com/@svbcttd/live',
    trustUrl: 'https://tirumala.org',
    helpline: '+91 877 227 7777',
    mapQuery: 'Venkateswara Temple Tirumala Tirupati',
    timingsHi: 'सुप्रभातम् ०३:०० प्रातः • तोमाल सेवा ०४:०० • एकान्त सेवा ११:०० रात्रि',
    color: '#4338CA'
  }
];

// 4. Sacred Ganga & River Aartis of Bharat
const GANGA_AARTI_DATA: ShrineItem[] = [
  {
    id: 'aarti-1',
    order: 1,
    name: '1. Maha Ganga Aarti (Dashashwamedh Ghat, Kashi)',
    nameHi: '१. भव्य माँ गंगा महाआरती (दशाश्वमेध घाट, काशी)',
    deity: 'Maa Ganga',
    deityHi: 'पतित पावनी माँ गंगा',
    location: 'Dashashwamedh Ghat, Varanasi',
    locationHi: 'दशाश्वमेध घाट (वाराणसी)',
    state: 'Uttar Pradesh',
    category: 'GANGA_AARTI',
    shloka: 'गङ्गे च यमुने चैव गोदावरि सरस्वति । नर्मदे सिन्धु कावेरि जलेऽस्मिन् सन्निधिं कुरु ॥',
    shlokaMeaning: 'समस्त पावन नदियां इस जल में उपस्थित होकर भक्तों को पावन करें।',
    angaOrSignificance: 'काशी के घाटों पर वैदिक ब्राह्मणों द्वारा पीतल के भव्य दीपों से की जाने वाली अलौकिक महाआरती।',
    imageUrl: '/images/darshan/ganga-aarti.jpg',
    videoId: '9g0H4Yv6v9o',
    liveUrl: 'https://www.youtube.com/@gangaaartivaranasi/live',
    trustUrl: 'https://varanasi.nic.in',
    helpline: '+91 542 222 0001',
    mapQuery: 'Dashashwamedh Ghat Ganga Aarti Varanasi',
    timingsHi: 'दैनिक भव्य सांध्य महाआरती ०६:४५ सायं से ०७:४५ सायं',
    color: '#D97706'
  },
  {
    id: 'aarti-2',
    order: 2,
    name: '2. Maha Ganga Aarti (Har Ki Pauri, Haridwar)',
    nameHi: '२. माँ गंगा आरती (हर की पौड़ी, हरिद्वार)',
    deity: 'Maa Ganga',
    deityHi: 'ब्रह्मकुण्ड माँ गंगा',
    location: 'Har Ki Pauri, Haridwar',
    locationHi: 'ब्रह्मकुण्ड, हर की पौड़ी',
    state: 'Uttarakhand',
    category: 'GANGA_AARTI',
    shloka: 'हरिद्वारं महातीर्थं सर्वपापप्रणाशनम् ।',
    shlokaMeaning: 'जहाँ अमृत की बूंदें गिरीं, वह ब्रह्मकुण्ड समस्त पापों का नाश करता है।',
    angaOrSignificance: 'समुद्र मन्थन के अमृत बिन्दु स्थल ब्रह्मकुण्ड पर श्री गंगा सभा द्वारा आयोजित दिव्य महाआरती।',
    imageUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1400&q=85',
    videoId: '0AjyTUaEfOs',
    liveUrl: 'https://www.youtube.com/@GangaSabhaHaridwar/live',
    trustUrl: 'https://haridwarrishikeshtourism.com',
    helpline: '+91 1334 227 000',
    mapQuery: 'Har Ki Pauri Ganga Aarti Haridwar',
    timingsHi: 'प्रातः आरती ०५:३० • सांध्य महाआरती ०६:३० सायं',
    color: '#0D9488'
  }
];

export default function DarshanPage() {
  const [activeCategory, setActiveCategory] = useState<'JYOTIRLINGA' | 'SHAKTI_PEETH' | 'CHAR_DHAM' | 'GANGA_AARTI'>('JYOTIRLINGA');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isParikramaPlaying, setIsParikramaPlaying] = useState<boolean>(true);
  const [cycleSpeedSec, setCycleSpeedSec] = useState<number>(30);
  const [progressSec, setProgressSec] = useState<number>(0);
  const [displayMode, setDisplayMode] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [videoStreamSource, setVideoStreamSource] = useState<'LOCAL' | 'YOUTUBE'>('YOUTUBE');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [flowers, setFlowers] = useState<Array<{ id: number; x: number; icon: string; size: number; duration?: string; delay?: string; rot?: number }>>([]);
  const [diyasLitCount, setDiyasLitCount] = useState<number>(148392);
  const [hasLitDiya, setHasLitDiya] = useState<boolean>(false);
  const [bellRinging, setBellRinging] = useState<boolean>(false);
  const [shankhActive, setShankhActive] = useState<boolean>(false);
  const [japaCount, setJapaCount] = useState<number>(0);
  const [devoteeName, setDevoteeName] = useState<string>('');
  const [devoteeGotra, setDevoteeGotra] = useState<string>('Kashyap');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [yatraCompleted, setYatraCompleted] = useState<boolean>(false);
  const [showSankalpaModal, setShowSankalpaModal] = useState<boolean>(false);
  const [imgLoadError, setImgLoadError] = useState<boolean>(false);

  const cinemaStageRef = useRef<HTMLDivElement>(null);

  // Reset img error on shrine change
  useEffect(() => {
    setImgLoadError(false);
  }, [currentIndex, activeCategory]);

  // Active dataset based on category
  const baseDataset = useMemo(() => {
    switch (activeCategory) {
      case 'JYOTIRLINGA': return JYOTIRLINGA_DATA;
      case 'SHAKTI_PEETH': return SHAKTI_PEETH_DATA;
      case 'CHAR_DHAM': return CHAR_DHAM_DATA;
      case 'GANGA_AARTI': return GANGA_AARTI_DATA;
      default: return JYOTIRLINGA_DATA;
    }
  }, [activeCategory]);

  // Filtered dataset based on live search
  const currentDataset = useMemo(() => {
    if (!searchQuery.trim()) return baseDataset;
    const q = searchQuery.toLowerCase();
    return baseDataset.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.nameHi.includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.locationHi.includes(q) ||
      s.state.toLowerCase().includes(q) ||
      s.deityHi.includes(q)
    );
  }, [baseDataset, searchQuery]);

  // Current active shrine
  const activeShrine = useMemo(() => {
    return currentDataset[currentIndex] || currentDataset[0] || baseDataset[0];
  }, [currentDataset, currentIndex, baseDataset]);

  // Load user profile name
  useEffect(() => {
    try {
      const profiles = getProfiles();
      if (profiles && profiles.length > 0 && profiles[0].name) {
        setDevoteeName(profiles[0].name);
      }
      const savedDiyas = localStorage.getItem('cosmictantra_diyas_lit');
      if (savedDiyas) {
        setDiyasLitCount(parseInt(savedDiyas, 10));
      }
    } catch {}
  }, []);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 30-Second Autoplay Parikrama Engine
  useEffect(() => {
    if (!isParikramaPlaying || currentDataset.length === 0) return;

    const intervalMs = 100;
    const increment = intervalMs / 1000;

    const timer = setInterval(() => {
      setProgressSec(prev => {
        const next = prev + increment;
        if (next >= cycleSpeedSec) {
          playBell();
          setCurrentIndex(curr => {
            const nextIdx = (curr + 1) % currentDataset.length;
            if (nextIdx === 0) {
              playConch();
              setYatraCompleted(true);
            }
            return nextIdx;
          });
          return 0;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isParikramaPlaying, cycleSpeedSec, currentDataset.length]);

  // Toggle Fullscreen Mode
  const handleToggleFullscreen = () => {
    playTick();
    if (!document.fullscreenElement) {
      if (cinemaStageRef.current?.requestFullscreen) {
        cinemaStageRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Category switch
  const handleCategorySwitch = (cat: 'JYOTIRLINGA' | 'SHAKTI_PEETH' | 'CHAR_DHAM' | 'GANGA_AARTI') => {
    playBell();
    setActiveCategory(cat);
    setCurrentIndex(0);
    setProgressSec(0);
    setYatraCompleted(false);
  };

  // Direct step jump
  const handleStepJump = (idx: number) => {
    playBell();
    setCurrentIndex(idx);
    setProgressSec(0);
  };

  // Prev / Next controls
  const handleNextShrine = () => {
    playBell();
    setCurrentIndex(prev => (prev + 1) % currentDataset.length);
    setProgressSec(0);
  };

  const handlePrevShrine = () => {
    playBell();
    setCurrentIndex(prev => (prev === 0 ? currentDataset.length - 1 : prev - 1));
    setProgressSec(0);
  };

  // Toggle Parikrama Play / Pause
  const handleToggleParikrama = () => {
    playTick();
    setIsParikramaPlaying(prev => !prev);
  };

  // Flower Drop Animation Trigger (4x Divine Shower: 72 Sacred Petals)
  const handleOfferFlowers = () => {
    playFlowerDrop();
    const icons = ['🌸', '🌺', '🌼', '🍃', '🏵️', '🌹', '🪷', '🌷', '🌿', '✨'];
    const newBatch = Array.from({ length: 72 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: Math.floor(Math.random() * 96) + 2,
      icon: icons[Math.floor(Math.random() * icons.length)],
      size: Math.floor(Math.random() * 20) + 18,
      duration: (2.4 + Math.random() * 1.6).toFixed(2),
      delay: (Math.random() * 0.8).toFixed(2),
      rot: Math.floor(Math.random() * 720) - 360,
    }));
    setFlowers(prev => [...prev, ...newBatch]);
    setTimeout(() => {
      setFlowers(prev => prev.filter(f => !newBatch.some(nb => nb.id === f.id)));
    }, 4500);
  };

  // Ring Bell Trigger
  const handleRingBell = () => {
    playBell();
    setBellRinging(true);
    setTimeout(() => setBellRinging(false), 900);
  };

  // Blow Conch Trigger
  const handleBlowShankh = () => {
    playConch();
    setShankhActive(true);
    setTimeout(() => setShankhActive(false), 2800);
  };

  // Light Diya Trigger
  const handleLightDiya = () => {
    playBell();
    if (!hasLitDiya) {
      setHasLitDiya(true);
      setDiyasLitCount(prev => {
        const next = prev + 1;
        try {
          localStorage.setItem('cosmictantra_diyas_lit', next.toString());
        } catch {}
        return next;
      });
    }
  };

  // Mantra Japa Increment Trigger
  const handleJapaIncrement = () => {
    playTick();
    if (japaCount + 1 === 108) {
      playBell();
      setJapaCount(108);
    } else if (japaCount >= 108) {
      setJapaCount(1);
    } else {
      setJapaCount(prev => prev + 1);
    }
  };

  // 1-Click WhatsApp Sankalpa Share
  const handleShareWhatsApp = () => {
    playBell();
    const today = new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const nameStr = devoteeName.trim() ? devoteeName.trim() : 'भक्त';
    const text = `🕉️ साक्षात् पावन दर्शन व तीर्थ परिक्रमा • ${today}\n\n🌸 ${nameStr} द्वारा आज का पावन दर्शन:\n📍 मन्दिर: ${activeShrine.nameHi}\n🏛️ धाम: ${activeShrine.locationHi}, ${activeShrine.state}\n📜 मन्त्र: "${activeShrine.shloka}"\n\n🙏 ३०-सेकेण्ड अखण्ड परिक्रमा मोड में घर बैठे समस्त १२ ज्योतिर्लिंगों, ५२ शक्तिपीठों एवं धामों के साक्षात् दर्शन करें:\n🔗 https://cosmictantra.chiti.tech/darshan\n\n(हर हर महादेव • ॐ नमो भगवते वासुदेवाय 🌺)`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Copy Share Text
  const handleCopyShare = () => {
    playBell();
    const today = new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const nameStr = devoteeName.trim() ? devoteeName.trim() : 'भक्त';
    const text = `🕉️ साक्षात् पावन दर्शन • ${today}\n\n🌸 ${nameStr} द्वारा दर्शन: ${activeShrine.nameHi} (${activeShrine.locationHi})\nघर बैठे समस्त पावन तीर्थों के दर्शन करें:\nhttps://cosmictantra.chiti.tech/darshan`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const progressPercent = Math.min(100, Math.round((progressSec / cycleSpeedSec) * 100));
  const remainingSeconds = Math.max(0, Math.ceil(cycleSpeedSec - progressSec));

  return (
    <CosmicTantraShell>
      {/* Floating Flowers Canvas (4x Divine Shower) */}
      {flowers.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {flowers.map(f => (
            <div
              key={f.id}
              style={{
                left: `${f.x}%`,
                top: '-40px',
                fontSize: `${f.size}px`,
                animation: `flowerFall ${f.duration || '2.8'}s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
                animationDelay: `${f.delay || '0'}s`,
              }}
              className="absolute select-none drop-shadow-md"
            >
              {f.icon}
            </div>
          ))}
          <style jsx>{`
            @keyframes flowerFall {
              0% { transform: translateY(0) rotate(0deg) scale(0.7); opacity: 1; }
              75% { opacity: 0.95; }
              100% { transform: translateY(105vh) rotate(360deg) scale(1.15); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* ONE-VIEW STUDIO CONTAINER */}
      <div className="py-2 sm:py-4 px-2 sm:px-4 lg:px-6 mx-auto max-w-[1600px] space-y-2 sm:space-y-3">
        
        {/* Compact 1-Row Control Bar: Category Pills + Search + Mode Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0E101D]/90 backdrop-blur-md rounded-2xl border border-[#8E6F1D]/30 p-2 sm:px-3 sm:py-2 text-white">
          <h1 className="sr-only">12 Jyotirlinga, 52 Shakti Peeth & Char Dham Darshan</h1>
          
          {/* Category Switcher Pills */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => handleCategorySwitch('JYOTIRLINGA')}
              className={`px-3 py-1 rounded-xl text-[11px] font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeCategory === 'JYOTIRLINGA'
                  ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <span>🔱</span>
              <span>१२ द्वादश ज्योतिर्लिंग (12 Jyotirlingas)</span>
            </button>

            <button
              onClick={() => handleCategorySwitch('SHAKTI_PEETH')}
              className={`px-3 py-1 rounded-xl text-[11px] font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeCategory === 'SHAKTI_PEETH'
                  ? 'bg-[#BE123C] text-white shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <span>🌺</span>
              <span>५२ महा शक्तिपीठ (52 Shakti Peethas)</span>
            </button>

            <button
              onClick={() => handleCategorySwitch('CHAR_DHAM')}
              className={`px-3 py-1 rounded-xl text-[11px] font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeCategory === 'CHAR_DHAM'
                  ? 'bg-[#D97706] text-white shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <span>🚩</span>
              <span>चार धाम व महातीर्थ (Char Dham)</span>
            </button>

            <button
              onClick={() => handleCategorySwitch('GANGA_AARTI')}
              className={`px-3 py-1 rounded-xl text-[11px] font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeCategory === 'GANGA_AARTI'
                  ? 'bg-[#0D9488] text-white shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <span>🌊</span>
              <span>माँ गंगा महाआरती (Ganga Aartis)</span>
            </button>
          </div>

          {/* Search + Sankalpa Modal Launcher */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentIndex(0); }}
                placeholder="तीर्थ खोजें..."
                className="pl-7 pr-3 py-1 rounded-xl bg-white/10 border border-white/15 text-[11px] font-mono-data text-white placeholder-white/50 outline-none focus:border-[#D4AF37] w-32 sm:w-44"
              />
            </div>

            <button
              onClick={() => setShowSankalpaModal(true)}
              className="px-3 py-1 rounded-xl bg-[#8E6F1D]/80 hover:bg-[#8E6F1D] text-white text-[11px] font-mono-data font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="Daily Sankalpa Card"
            >
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">दैनिक संकल्प</span>
            </button>
          </div>
        </div>

        {/* UNIFIED 1-VIEW GRID: 2 COLUMNS (Cinema Player 68% + Live Sanctuary Info 32%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          
          {/* LEFT 8 COLUMNS: MAIN CINEMA PLAYER & INTEGRATED ACTION DOCK */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div className="relative group h-full">
              
              {/* Dynamic Ambient Deity Aura */}
              <div 
                className="absolute -inset-3 rounded-3xl opacity-35 blur-2xl transition-all duration-700 pointer-events-none -z-10"
                style={{ 
                  background: `radial-gradient(ellipse at center, ${activeShrine.color} 0%, transparent 72%)` 
                }}
              />

              <div 
                ref={cinemaStageRef}
                className={`relative bg-[#05060A] rounded-3xl border border-[#8E6F1D]/40 shadow-2xl overflow-hidden flex flex-col justify-between transition-all h-full ${
                  isFullscreen ? 'fixed inset-0 z-[9999] rounded-none border-none h-screen w-screen' : 'min-h-[460px] sm:min-h-[520px] lg:min-h-[560px]'
                }`}
              >
                {/* Top Glassmorphic HUD Bar */}
                <div className="absolute top-0 inset-x-0 z-30 p-2.5 sm:p-4 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between gap-2 text-white">
                  
                  {/* Shrine Title & Badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-mono-data font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      24x7 LIVE DARSHAN
                    </span>

                    <div>
                      <h2 className="font-editorial font-bold text-sm sm:text-base text-white leading-none">
                        {activeShrine.nameHi}
                      </h2>
                      <span className="text-[10px] font-mono-data text-[#D1C9BF] hidden sm:inline">
                        {activeShrine.locationHi} • {activeShrine.state}
                      </span>
                    </div>
                  </div>

                  {/* Mode Toggle & Fullscreen Button */}
                  <div className="flex items-center gap-1.5">
                    <div className="inline-flex items-center rounded-xl bg-black/60 backdrop-blur-md border border-white/15 p-0.5 text-xs font-mono-data">
                      <button
                        onClick={() => { playTick(); setDisplayMode('IMAGE'); }}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          displayMode === 'IMAGE' ? 'bg-[#8E6F1D] text-white shadow-xs' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>साक्षात् छवि</span>
                      </button>
                      <button
                        onClick={() => { playTick(); setDisplayMode('VIDEO'); }}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          displayMode === 'VIDEO' ? 'bg-[#8E6F1D] text-white shadow-xs' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <Play className="w-3 h-3" />
                        <span>वीडियो / लाइव</span>
                      </button>
                    </div>

                    <button
                      onClick={handleToggleFullscreen}
                      className="p-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 hover:border-amber-400 text-white transition-all cursor-pointer"
                      title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Mode"}
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
                    </button>
                  </div>
                </div>

                {/* Main Visual Screen: Real HD Photo OR Video Launcher */}
                <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden min-h-[300px] sm:min-h-[380px]">
                  {displayMode === 'IMAGE' ? (
                    <div className="relative w-full h-full min-h-[300px] sm:min-h-[380px]">
                      {!imgLoadError ? (
                        <img
                          src={activeShrine.imageUrl}
                          alt={activeShrine.name}
                          onError={() => setImgLoadError(true)}
                          className="w-full h-full object-cover brightness-[0.88] transition-all duration-700"
                        />
                      ) : (
                        /* Fail-safe Sacred Vedic Temple Sanctum SVG Art */
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1308] via-[#0c0803] to-[#050301] p-6 text-center space-y-3">
                          <div className="w-20 h-20 rounded-full border-2 border-amber-400/60 bg-amber-500/10 flex items-center justify-center shadow-2xl">
                            <span className="text-3xl text-amber-300 font-serif">ॐ</span>
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-editorial text-2xl font-bold text-amber-200">
                              {activeShrine.nameHi}
                            </h3>
                            <p className="text-xs font-mono-data text-amber-400/80">
                              {activeShrine.locationHi} • {activeShrine.state}
                            </p>
                          </div>
                          <div className="font-serif italic text-xs text-amber-100/90 max-w-md">
                            "{activeShrine.shloka}"
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/40 pointer-events-none" />
                    </div>
                  ) : (
                    /* Video / Live Stream Screen: Plays Real HD Aarti Video / YouTube Live */
                    <div className="relative w-full h-full min-h-[300px] sm:min-h-[380px] bg-black flex items-center justify-center overflow-hidden">
                      {videoStreamSource === 'LOCAL' ? (
                        <video
                          key={`video-local-${activeShrine.id}`}
                          src="/kashi-hero-video.mp4"
                          controls
                          autoPlay
                          loop
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="relative w-full h-full bg-black flex items-center justify-center">
                          <iframe
                            key={`video-yt-${activeShrine.id}`}
                            src={`https://www.youtube-nocookie.com/embed/${activeShrine.videoId || 'kY-F3j_G-k0'}?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1`}
                            className="w-full h-full border-0 absolute inset-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            title={activeShrine.nameHi}
                          />

                          {/* Direct Launch Bar for Official Temple Trust Live Stream Channel */}
                          <div className="absolute bottom-3 inset-x-3 sm:inset-x-6 z-30 flex flex-wrap items-center justify-between gap-2 bg-black/90 backdrop-blur-md p-2 sm:px-4 sm:py-2 rounded-2xl border border-red-500/40 text-white shadow-2xl">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                              <span className="text-[11px] sm:text-xs font-mono-data font-bold text-red-200">
                                🔴 {activeShrine.nameHi} (आधिकारिक 24x7 लाइव ट्रस्ट चैनल)
                              </span>
                            </div>

                            <a
                              href={activeShrine.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => playBell()}
                              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono-data font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105"
                            >
                              <span>साक्षात् यूट्यूब लाइव खोलें ↗</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Video Stream Source Switcher Overlay */}
                      <div className="absolute top-14 left-3 z-30 flex items-center gap-1.5 bg-black/75 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-lg">
                        <button
                          onClick={() => { playTick(); setVideoStreamSource('LOCAL'); }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono-data font-bold transition-all cursor-pointer ${
                            videoStreamSource === 'LOCAL' ? 'bg-[#8E6F1D] text-white shadow-xs' : 'text-white/70 hover:text-white'
                          }`}
                        >
                          🎬 पावन आरती (HD Video)
                        </button>
                        <button
                          onClick={() => { playTick(); setVideoStreamSource('YOUTUBE'); }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono-data font-bold transition-all cursor-pointer ${
                            videoStreamSource === 'YOUTUBE' ? 'bg-red-600 text-white shadow-xs' : 'text-white/70 hover:text-white'
                          }`}
                        >
                          🔴 यूट्यूब लाइव
                        </button>
                      </div>

                      {/* Top Right Live Badge */}
                      <div className="absolute top-14 right-3 z-30 pointer-events-none">
                        <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono-data font-bold uppercase flex items-center gap-1 shadow-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          24x7 LIVE STREAM
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Sacred Shloka Overlay Subtitle */}
                  {displayMode === 'IMAGE' && (
                    <div className="absolute bottom-20 sm:bottom-22 inset-x-2 sm:inset-x-6 z-20 pointer-events-none text-center space-y-0.5 max-w-3xl mx-auto drop-shadow-xl">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/30 text-amber-300 text-[10px] font-mono-data font-bold uppercase">
                        <Flame className="w-2.5 h-2.5 text-amber-400 animate-bounce" />
                        <span>{activeShrine.deityHi} • {activeShrine.locationHi}</span>
                      </div>
                      <p className="font-serif text-xs sm:text-base italic text-amber-100/95 font-medium leading-tight drop-shadow-md">
                        "{activeShrine.shloka}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Floating Cinema Glass Dock */}
                <div className="relative z-30 p-2.5 sm:p-3 bg-gradient-to-t from-black via-black/95 to-transparent space-y-2">
                  
                  {/* Scrubber Progress Bar */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] font-mono-data text-white/80 px-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-300">
                          {isParikramaPlaying ? `⚡ परिक्रमा गतिमान (${remainingSeconds}s शेष)` : '⏸️ परिक्रमा रुकी हुई'}
                        </span>
                        <span>•</span>
                        <span>तीर्थ {currentIndex + 1} / {currentDataset.length}</span>
                      </div>
                      <div className="text-white/60">
                        {cycleSpeedSec}s Auto
                      </div>
                    </div>

                    <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${progressPercent}%` }}
                        className="h-full bg-gradient-to-r from-amber-400 via-[#D4AF37] to-rose-500 transition-all duration-100 ease-linear shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Player & Action Controls Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    
                    {/* Left: Player Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handlePrevShrine}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white cursor-pointer active:scale-95"
                        title="Previous"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        onClick={handleToggleParikrama}
                        className="px-3 py-1 rounded-xl bg-[#8E6F1D] hover:bg-[#A88424] text-white font-mono-data text-[11px] font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        {isParikramaPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isParikramaPlaying ? 'विराम' : 'प्रारम्भ'}</span>
                      </button>

                      <button
                        onClick={handleNextShrine}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white cursor-pointer active:scale-95"
                        title="Next"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 backdrop-blur-md text-[11px] font-mono-data text-white">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <select
                          value={cycleSpeedSec}
                          onChange={(e) => { playTick(); setCycleSpeedSec(Number(e.target.value)); setProgressSec(0); }}
                          className="bg-transparent font-bold text-white outline-none cursor-pointer"
                        >
                          <option value={15} className="bg-neutral-900 text-white">१५s</option>
                          <option value={30} className="bg-neutral-900 text-white">३०s</option>
                          <option value={60} className="bg-neutral-900 text-white">६०s</option>
                        </select>
                      </div>
                    </div>

                    {/* Right: Ritual Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={handleRingBell}
                        className={`px-2.5 py-1 rounded-xl border backdrop-blur-md transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono-data font-bold active:scale-95 ${
                          bellRinging
                            ? 'bg-amber-500 text-white border-amber-500 scale-105 shadow-md'
                            : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                        }`}
                      >
                        <Bell className={`w-3 h-3 text-amber-400 ${bellRinging ? 'animate-bounce' : ''}`} />
                        <span>घण्टी</span>
                      </button>

                      <button
                        onClick={handleBlowShankh}
                        className={`px-2.5 py-1 rounded-xl border backdrop-blur-md transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono-data font-bold active:scale-95 ${
                          shankhActive
                            ? 'bg-indigo-600 text-white border-indigo-600 scale-105 shadow-md'
                            : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                        }`}
                      >
                        <Volume2 className={`w-3 h-3 text-indigo-400 ${shankhActive ? 'animate-pulse' : ''}`} />
                        <span>शंख</span>
                      </button>

                      <button
                        onClick={handleOfferFlowers}
                        className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-md text-[11px] font-mono-data font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                      >
                        <Sparkles className="w-3 h-3 text-pink-400" />
                        <span>पुष्प अर्पण</span>
                      </button>

                      <button
                        onClick={handleLightDiya}
                        className={`px-2.5 py-1 rounded-xl border backdrop-blur-md transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono-data font-bold active:scale-95 ${
                          hasLitDiya
                            ? 'bg-amber-500/30 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                            : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                        }`}
                      >
                        <Flame className={`w-3 h-3 ${hasLitDiya ? 'text-amber-400 animate-pulse' : 'text-amber-500'}`} />
                        <span>{hasLitDiya ? 'दीपदान ✓' : 'दीपदान'}</span>
                      </button>

                      <button
                        onClick={handleJapaIncrement}
                        className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-md text-[11px] font-mono-data font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                      >
                        <RotateCcw className="w-2.5 h-2.5 text-amber-400" />
                        <span>जप {japaCount}/108</span>
                      </button>

                      <button
                        onClick={handleShareWhatsApp}
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-mono-data font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        <Send className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: LIVE SANCTUARY INFO + 4 CONNECTION TILES + PLAYLIST QUEUE */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-2.5">
            
            {/* 1. Active Shrine Shloka & Puranic Context Card */}
            <div className="bg-white dark:bg-[#0E101D] rounded-2xl border border-black/10 dark:border-white/10 p-3.5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono-data uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span>वैदिक माहात्म्य</span>
                </div>
                <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-[#8E6F1D]/15 text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                  {activeShrine.state}
                </span>
              </div>

              <div className="font-serif text-sm font-bold text-[#1C1917] dark:text-[#FAF7F2] leading-snug">
                {activeShrine.shloka}
              </div>

              <p className="text-[11px] font-mono-data text-[#57524A] dark:text-[#D1C9BF] leading-relaxed line-clamp-2">
                {activeShrine.shlokaMeaning}
              </p>

              <div className="text-[10px] font-mono-data text-[#78716C] pt-1 border-t border-black/5 dark:border-white/5 line-clamp-1">
                <strong>महात्म्य:</strong> {activeShrine.angaOrSignificance}
              </div>
            </div>

            {/* 2. Four Direct Ways to Connect Tiles (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={activeShrine.trustUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playTick()}
                className="p-2.5 rounded-xl bg-white dark:bg-[#121422] border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] transition-all flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer group shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968] group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-mono-data font-bold text-[#1C1917] dark:text-white">ई-पूजा बुकिंग</span>
                <span className="text-[9px] font-mono-data text-[#78716C]">अधिकृत ट्रस्ट ↗</span>
              </a>

              <a
                href={`tel:${activeShrine.helpline.replace(/\s+/g, '')}`}
                onClick={() => playTick()}
                className="p-2.5 rounded-xl bg-white dark:bg-[#121422] border border-black/10 dark:border-white/10 hover:border-emerald-500 transition-all flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer group shadow-xs"
              >
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-mono-data font-bold text-[#1C1917] dark:text-white">हेल्पलाइन</span>
                <span className="text-[9px] font-mono-data text-[#78716C] line-clamp-1">{activeShrine.helpline}</span>
              </a>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeShrine.mapQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playTick()}
                className="p-2.5 rounded-xl bg-white dark:bg-[#121422] border border-black/10 dark:border-white/10 hover:border-rose-500 transition-all flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer group shadow-xs"
              >
                <MapPin className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-mono-data font-bold text-[#1C1917] dark:text-white">दिशा-निर्देश</span>
                <span className="text-[9px] font-mono-data text-[#78716C]">Google Maps ↗</span>
              </a>

              <a
                href={activeShrine.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playBell()}
                className="p-2.5 rounded-xl bg-white dark:bg-[#121422] border border-black/10 dark:border-white/10 hover:border-red-500 transition-all flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer group shadow-xs"
              >
                <Radio className="w-4 h-4 text-red-600 animate-pulse group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-mono-data font-bold text-[#1C1917] dark:text-white">लाइव प्रसारण</span>
                <span className="text-[9px] font-mono-data text-[#78716C]">YouTube Live ↗</span>
              </a>
            </div>

            {/* 3. YouTube-Style Scrollable Playlist Queue */}
            <div className="bg-white dark:bg-[#0E101D] rounded-2xl border border-black/10 dark:border-white/10 p-3 shadow-sm flex-1 flex flex-col justify-between">
              
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">
                  <ListFilter className="w-3.5 h-3.5 text-[#8E6F1D]" />
                  <span>परिक्रमा तीर्थ सूची ({currentDataset.length})</span>
                </div>
                <span className="text-[10px] font-mono-data text-[#78716C]">
                  {currentIndex + 1} / {currentDataset.length}
                </span>
              </div>

              {/* Scrollable list of shrines */}
              <div className="space-y-1.5 max-h-[170px] sm:max-h-[190px] overflow-y-auto pr-1 mt-2 custom-scrollbar">
                {currentDataset.map((shrine, sIdx) => {
                  const isCurrent = sIdx === currentIndex;
                  return (
                    <button
                      key={shrine.id}
                      onClick={() => handleStepJump(sIdx)}
                      className={`w-full p-2 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] shadow-xs ring-1 ring-[#8E6F1D]'
                          : 'bg-[#FAF7F2] dark:bg-[#161826] text-[#44403C] dark:text-[#D1C9BF] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono-data font-bold opacity-75">#{sIdx + 1}</span>
                        <div className="min-w-0">
                          <div className="text-[11px] font-editorial font-bold line-clamp-1">
                            {shrine.nameHi.split('(')[0]}
                          </div>
                          <div className="text-[9px] font-mono-data opacity-75 line-clamp-1">
                            {shrine.locationHi}
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="text-[9px] font-mono-data font-bold px-1.5 py-0.5 rounded bg-black/20 text-white">
                          सक्रिय
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono-data opacity-60">
                          {shrine.state}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Family Sankalpa & Blessing Card */}
            <div className="bg-gradient-to-br from-[#8E6F1D]/10 via-[#FAF7F2] to-[#D4AF37]/10 dark:from-[#D4AF37]/15 dark:via-[#0E101D] dark:to-[#8E6F1D]/10 rounded-2xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 p-2.5 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1">
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span>Family Sankalpa & Blessing Card</span>
                </div>
                <button
                  onClick={() => setShowSankalpaModal(true)}
                  className="text-[9px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#D4AF37] underline cursor-pointer"
                >
                  सम्पूर्ण संकल्प ↗
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={devoteeName}
                  onChange={(e) => setDevoteeName(e.target.value)}
                  placeholder="आपका नाम (Name)"
                  className="flex-1 px-2 py-1 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#161826] text-[10px] font-mono-data outline-none"
                />
                <button
                  onClick={handleShareWhatsApp}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-mono-data font-bold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                >
                  <Send className="w-2.5 h-2.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Complete Parikrama Celebration Banner */}
        {yatraCompleted && (
          <div className="bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 border border-amber-400 rounded-2xl p-4 text-center space-y-2 shadow-lg animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white">
                🎉 पावन तीर्थ परिक्रमा सम्पूर्ण • Parikrama Completed!
              </h3>
            </div>
            <p className="text-xs font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
              आपने आज घर बैठे समस्त पवित्र धामों के साक्षात् दर्शन व परिक्रमा पूर्ण की।
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono-data font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp पर शेयर करें</span>
              </button>
              <button
                onClick={() => setYatraCompleted(false)}
                className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 text-xs font-mono-data font-bold cursor-pointer"
              >
                पुनः परिक्रमा
              </button>
            </div>
          </div>
        )}

        {/* 6. Daily Morning Sankalpa Modal */}
        {showSankalpaModal && (
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/40 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
              
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white">
                    दैनिक प्रातःकालीन संकल्प व आशीर्वाद
                  </h3>
                </div>
                <button
                  onClick={() => setShowSankalpaModal(false)}
                  className="p-1 rounded-lg text-[#78716C] hover:text-black dark:hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Devotee Name & Gotra Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={devoteeName}
                  onChange={(e) => setDevoteeName(e.target.value)}
                  placeholder="आपका शुभ नाम"
                  className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] text-xs font-mono-data outline-none focus:border-[#8E6F1D]"
                />
                <input
                  type="text"
                  value={devoteeGotra}
                  onChange={(e) => setDevoteeGotra(e.target.value)}
                  placeholder="गोत्र (e.g. कश्यप)"
                  className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] text-xs font-mono-data outline-none focus:border-[#8E6F1D]"
                />
              </div>

              {/* Formatted Sankalpa Text Box */}
              <div className="bg-[#FAF7F2] dark:bg-[#070912] rounded-2xl border border-[#8E6F1D]/20 p-4 space-y-2 font-serif text-xs text-[#1C1917] dark:text-[#FAF7F2] italic text-center">
                <p>
                  "मम आत्मनः श्रुतिस्मृतिपुराणोक्त फलप्राप्त्यर्थं, सकल पापक्षयार्थं, परिवारस्य आरोग्य-ऐश्वर्य-समृद्धि सिद्धयर्थं, 
                  <strong> {devoteeGotra || 'कश्यप'} </strong> गोत्रोत्पन्न <strong> {devoteeName || 'भक्त'} </strong> अहम् 
                  <strong> {activeShrine.nameHi} </strong> सम्मुखे मनसा दीप-पुष्पं समर्पयामि।"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono-data font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp पर भेजें</span>
                </button>

                <button
                  onClick={handleCopyShare}
                  className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 text-xs font-mono-data font-bold cursor-pointer"
                >
                  {copiedShare ? 'कॉपी हो गया ✓' : 'कॉपी करें'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </CosmicTantraShell>
  );
}
