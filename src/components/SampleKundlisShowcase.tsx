'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Award, ArrowRight, Compass, Flame, BookOpen, ShieldCheck } from 'lucide-react';
import { chitiSensory } from '../lib/chitiAudio';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';

export interface SampleKundli {
  id: string;
  name: string;
  hindiName: string;
  birthDate: string;
  birthTime: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: number;
  lagna: string;
  moonRasi: string;
  highlights: string;
  highlightsHi: string;
  tag: string;
}

export const SAMPLE_KUNDLIS: SampleKundli[] = [
  {
    id: 'kashi-reference-1989',
    name: 'Kashi Golden Specimen (1989)',
    hindiName: 'काशी स्वर्ण मानक पत्रिका (1989)',
    birthDate: '1989-05-26',
    birthTime: '02:20:30',
    city: 'Bilaspur, Chhattisgarh, India',
    latitude: 22.0797,
    longitude: 82.1391,
    timezone: 5.5,
    lagna: 'Pisces (Meena)',
    moonRasi: 'Capricorn (Makara)',
    highlights: 'Full 17-Volume qualification baseline with JPL Horizons & AstroSage validated sidereal coordinates.',
    highlightsHi: '१७-खण्डों का प्रामाणिक संदर्भ पत्र — नासा JPL व एस्ट्रोसेज द्वारा सत्यापित शुद्ध गणना।',
    tag: 'REFERENCE SPECIMEN'
  },
  {
    id: 'gandhi-1869',
    name: 'Mahatma Gandhi (1869)',
    hindiName: 'महात्मा गाँधी (1869)',
    birthDate: '1869-10-02',
    birthTime: '07:12:00',
    city: 'Porbandar, Gujarat, India',
    latitude: 21.6417,
    longitude: 69.6293,
    timezone: 5.5,
    lagna: 'Libra (Tula)',
    moonRasi: 'Leo (Simha)',
    highlights: 'Mars-Venus in 1st house, Jupiter in 7th. World leader of Ahimsa and Satyagraha.',
    highlightsHi: 'तुला लग्न, प्रथम भाव में मंगल-शुक्र, सप्तम में गुरु — अहिंसा व सत्याग्रह के महानायक।',
    tag: 'HISTORICAL BENCHMARK'
  },
  {
    id: 'vivekananda-1863',
    name: 'Swami Vivekananda (1863)',
    hindiName: 'स्वामी विवेकानन्द (1863)',
    birthDate: '1863-01-12',
    birthTime: '06:33:00',
    city: 'Kolkata, West Bengal, India',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 5.5,
    lagna: 'Sagittarius (Dhanu)',
    moonRasi: 'Virgo (Kanya)',
    highlights: 'Sagittarius Lagna with Sun in 1st, Saturn in 10th. Spiritual renaissance of Vedanta.',
    highlightsHi: 'धनु लग्न, प्रथम भाव में सूर्य, दशम में शनि — वेदान्त एवं आध्यात्मिक चेतना के अग्रदूत।',
    tag: 'SPIRITUAL LUMINARY'
  }
];

interface SampleKundlisShowcaseProps {
  lang?: string;
  theme?: string;
}

export default function SampleKundlisShowcase({ lang = 'en', theme = 'dark' }: SampleKundlisShowcaseProps) {
  const isHi = lang === 'hi';

  const handleSampleClick = (sample: SampleKundli) => {
    chitiSensory.playTick();
    try {
      localStorage.setItem('cosmictantra_active_kundli', JSON.stringify({
        name: sample.name,
        birthDate: sample.birthDate,
        birthTime: sample.birthTime,
        city: sample.city,
        latitude: sample.latitude,
        longitude: sample.longitude,
        timezone: sample.timezone,
        source: 'SAMPLE_SHOWCASE'
      }));
    } catch {}
  };

  return (
    <section id="sample-kundlis-section" className="py-16 lg:py-20 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#06070B] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-2 font-bold">
              <Flame className="w-3.5 h-3.5 text-[#E29A48]" />
              <span>{isHi ? 'प्रमाणित वैदिक संदर्भ पत्रिकाएं' : 'QUALIFIED GOLDEN REFERENCE CHARTS'}</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] dark:text-[#EFECE6] tracking-tight">
              {isHi ? 'विद्वत्-परीक्षित कुण्डली उदाहरण' : 'Explore Master Kundli Specimens'}
            </h2>
            <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#AAA49A] font-mono-data mt-2 max-w-2xl">
              {isHi
                ? 'प्रामाणिक लाहिरी अयनांश पर आधारित १७-खण्डों की विस्तृत मास्टर कुण्डली — एक क्लिक में सम्पूर्ण पत्र, वर्ग चक्र एवं पीडीएफ प्रिंट देखें।'
                : 'Inspect complete 17-Volume encyclopedic Master Kundlis with full divisional charts, dasha periods, and 1-click printable PDF.'}
            </p>
          </div>

          <Link
            href="/report"
            className="inline-flex items-center gap-2 text-xs font-mono-data uppercase tracking-wider font-bold text-[#8E6F1D] dark:text-[#D4AF37] hover:underline"
          >
            <span>{isHi ? 'सम्पूर्ण मास्टर रिपोर्ट खोलें →' : 'Open Master Folio Report →'}</span>
          </Link>
        </div>

        {/* 3 Reference Specimen Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_KUNDLIS.map((sample) => (
            <div
              key={sample.id}
              className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#0C0E17] p-6 flex flex-col justify-between hover:border-[#8E6F1D]/40 dark:hover:border-[#D4AF37]/40 transition-all shadow-md hover:shadow-xl group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[9px] font-mono-data uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 text-[#8E6F1D] dark:text-[#E5C378] border border-[#8E6F1D]/20 dark:border-[#D4AF37]/20">
                    {sample.tag}
                  </span>
                  <Compass className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37]" />
                </div>

                <h3 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-[#FFFFFF] group-hover:text-[#8E6F1D] dark:group-hover:text-[#D4AF37] transition-colors">
                  {isHi ? sample.hindiName : sample.name}
                </h3>

                <div className="text-[11px] font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-1 space-y-0.5">
                  <p>{sample.birthDate} • {sample.birthTime} IST</p>
                  <p>{sample.city}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs font-mono-data">
                  <div>
                    <span className="text-[#8E6F1D] dark:text-[#D4AF37] font-semibold">{isHi ? 'लग्न:' : 'Lagna:'}</span>{' '}
                    <span className="text-[#1C1917] dark:text-[#EFECE6]">{sample.lagna}</span>
                  </div>
                  <div>
                    <span className="text-[#8E6F1D] dark:text-[#D4AF37] font-semibold">{isHi ? 'राशि:' : 'Rashi:'}</span>{' '}
                    <span className="text-[#1C1917] dark:text-[#EFECE6]">{sample.moonRasi}</span>
                  </div>
                </div>

                <p className="text-xs text-[#57524A] dark:text-[#C5BFB5] mt-3 leading-relaxed">
                  {isHi ? sample.highlightsHi : sample.highlights}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    handleSampleClick(sample);
                    const url = `/report?name=${encodeURIComponent(sample.name)}&dob=${sample.birthDate}&tob=${sample.birthTime}&city=${encodeURIComponent(sample.city)}&lat=${sample.latitude}&lng=${sample.longitude}&tz=${sample.timezone}`;
                    window.location.href = url;
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-mono-data uppercase tracking-wider font-bold bg-[#FAF7F2] dark:bg-[#151824] hover:bg-[#8E6F1D] dark:hover:bg-[#D4AF37] text-[#1C1917] dark:text-[#EFECE6] hover:text-white dark:hover:text-[#060709] border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <span>{isHi ? 'मास्टर पत्रिका देखें' : 'View Master Kundli'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quality note */}
        <div className="mt-8 p-4 rounded-xl bg-white/60 dark:bg-[#0C0E17]/60 border border-black/[0.06] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs font-mono-data text-[#57524A] dark:text-[#AAA49A]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37] shrink-0" />
            <span>{isHi ? 'प्रत्येक चार्ट में १७ खण्ड, वर्ग चक्र (D1-D60), षड्बल एवं अष्टकवर्ग की पूर्ण प्रामाणिक गणना सम्मिलित है।' : 'All charts feature complete 17 volumes, Shodashavarga (D1-D60), Shadbala, and Ashtakavarga calculations.'}</span>
          </div>
          <span className="text-[#8E6F1D] dark:text-[#D4AF37] font-semibold">{isHi ? 'लाहिरी अयनांश मानक' : 'Lahiri Ayanamsha Standard'}</span>
        </div>

      </div>
    </section>
  );
}
