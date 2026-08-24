import React from 'react';
import { Sun, Moon, ArrowRight, ShieldCheck, MapPin, Flame } from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

export default function HeroSection({
  panchangData,
  currentCity,
  onOpenCitySelector,
  onOpenConsultation,
  onExplorePanchang,
  onCreateKundali,
  lang = 'en',
  theme = 'dark'
}) {
  const t = TRANSLATIONS[lang]?.hero || TRANSLATIONS.en.hero;

  return (
    <section className="relative pt-24 pb-16 sm:pt-28 lg:pt-20 lg:pb-24 border-b border-black/[0.1] dark:border-white/[0.08] hero-varanasi-bg transition-colors duration-250">
      {/* Background Video Layer with Poster Fallback */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center opacity-65 dark:opacity-55 transition-opacity"
          poster="/varanasi-ghats-hero.jpg"
        >
          <source src="/kashi-hero-video.mp4" type="video/mp4" />
        </video>
        {/* Pandit-Ready Dawn Illumination (Sacred Banaras Morning Light) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF9] via-[#FAF7F2] to-[#F5EEDC] dark:via-[#060709]/60 dark:to-[#060709]/95 lg:bg-gradient-to-r lg:from-[#FFFDF9]/95 lg:via-[#FAF7F2]/75 lg:to-[#F5EEDC]/90 lg:dark:from-[#060709]/95 lg:dark:via-[#060709]/70 lg:dark:to-[#060709]/92" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        
        {/* Varanasi Editorial Split Horizon */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Serious Vedic Product Front */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-7">
            
            {/* Sacred Kashi Sanskrit Micro-Label */}
            <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 px-3.5 py-1.5 rounded-full border border-[#826315]/35 dark:border-[#D4AF37]/50 bg-[#FFFFFF]/95 dark:bg-[#0D0F1E]/95 backdrop-blur-md text-[10px] sm:text-[11px] font-mono-data uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#826315] dark:text-[#F0C968] shadow-xs font-bold max-w-full">
              <span className="flex items-center gap-1.5 text-[#A6461D] dark:text-[#F0A554]">
                <Flame className="w-3.5 h-3.5 text-[#E29A48] animate-pulse shrink-0" />
                <span className="truncate">{t.kashiBadge}</span>
              </span>
              <span className="opacity-30 hidden xs:inline">•</span>
              <span className="text-[#4A443B] dark:text-[#E2DAC9] truncate">{t.categoryTag}</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-2 sm:space-y-3">
              <h1 className="font-editorial text-clamp-hero font-bold text-[#181512] dark:text-[#F5F2EB]">
                {t.headline1} <br />
                <span className="text-[#826315] dark:text-[#D4AF37] drop-shadow-xs">{t.headline2}</span>
              </h1>
              <p className="text-base sm:text-xl text-[#4A443B] dark:text-[#DCD6CA] font-normal leading-relaxed pt-1 font-editorial italic">
                {t.subtitle}
              </p>
            </div>

            {/* Sub-text */}
            <p className="text-xs sm:text-base text-[#4A443B] dark:text-[#D1C9BF] max-w-xl leading-relaxed">
              {t.description}
            </p>

            {/* Daily Cosmic Forecast CTA (New Retention Hook) */}
            <div className="pt-1">
              <a 
                href="/daily"
                onClick={() => chitiSensory.playTick()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D4AF37]/50 dark:border-[#D4AF37]/70 bg-white/60 dark:bg-[#121528]/80 hover:bg-[#D4AF37]/10 text-xs font-semibold tracking-wider text-[#826315] dark:text-[#F0C968] transition-all shadow-xs"
              >
                🌟 Get Your Free Daily Cosmic Forecast <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Primary Action Buttons (Vertical Stack on Mobile, Row on Desktop) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5 w-full">
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  analytics.track(ANALYTICS_EVENTS.TODAY_PANCHANG_OPENED, { source: 'HERO_PRIMARY' });
                  onCreateKundali();
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-lg text-xs sm:text-sm font-mono-data uppercase tracking-wider font-bold bg-[#826315] dark:bg-[#D4AF37] text-white dark:text-[#060709] hover:bg-[#965B18] dark:hover:bg-[#E5C378] hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <span>{t.createKundali}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  chitiSensory.playTick();
                  analytics.track(ANALYTICS_EVENTS.TODAY_PANCHANG_OPENED, { source: 'HERO_SECONDARY' });
                  onExplorePanchang();
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-lg text-xs sm:text-sm font-mono-data uppercase tracking-wider font-bold bg-[#FFFFFF] dark:bg-[#0D0F1A] backdrop-blur-md border border-black/[0.15] dark:border-[#D4AF37]/50 text-[#181512] dark:text-[#F5F2EB] hover:border-[#826315] dark:hover:border-[#D4AF37] hover:text-[#826315] dark:hover:text-[#E5C378] transition-all shadow-xs flex items-center justify-center min-h-[44px]"
              >
                <span>{t.seePanchang}</span>
              </button>

              <button
                onClick={() => {
                  chitiSensory.playTick();
                  analytics.track(ANALYTICS_EVENTS.ASK_JYOTISHI_CLICKED, { source: 'HERO_TEXT' });
                  onOpenConsultation();
                }}
                className="w-full sm:w-auto text-xs font-mono-data uppercase tracking-wider text-[#A6461D] dark:text-[#F0A554] hover:text-[#826315] dark:hover:text-[#E5C378] transition-colors py-2 px-1 underline-offset-4 hover:underline flex items-center justify-center sm:justify-start gap-1 font-bold min-h-[44px]"
              >
                <span>{t.askScholar}</span>
              </button>
            </div>

            {/* Classical Footnote */}
            <div className="pt-3 sm:pt-4 flex items-center gap-2.5 text-[10px] sm:text-[11px] font-mono-data text-[#696256] dark:text-[#B5ACA0] border-t border-black/[0.1] dark:border-white/[0.12]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#826315] dark:text-[#F0C968] shrink-0" />
              <span>{t.footerNote}</span>
            </div>

          </div>

          {/* Right Column: "Cosmic Now" Astronomical Astrolabe Dial */}
          <div className="lg:col-span-5 w-full mt-4 lg:mt-0">
            <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#0D0F1C]/96 backdrop-blur-xl border border-black/[0.12] dark:border-[#D4AF37]/50 p-6 sm:p-7 shadow-2xl dark:shadow-[0_0_40px_rgba(212,175,55,0.16)] space-y-5 transition-all duration-250">
              
              {/* Instrument Header with Kashi Astrolabe Indicator */}
              <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.12] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#E29A48] dark:bg-[#F59E0B] shadow-[0_0_10px_#F59E0B] animate-pulse shrink-0" />
                  <div>
                    <span className="font-editorial text-base sm:text-lg font-bold text-[#181512] dark:text-[#FFFFFF] tracking-wide block leading-snug">
                      {t.cosmicNow}
                    </span>
                    <span className="text-[10px] font-mono-data text-[#826315] dark:text-[#F0C968] uppercase tracking-widest block font-extrabold mt-0.5">
                      {t.cosmicNowSub}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    chitiSensory.playTick();
                    onOpenCitySelector();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#16192E] border border-black/[0.1] dark:border-[#D4AF37]/40 text-[11px] font-mono-data text-[#826315] dark:text-[#F0C968] hover:border-[#826315] dark:hover:border-[#D4AF37] transition-colors font-bold shadow-xs"
                >
                  <MapPin className="w-3 h-3 text-[#A6461D] dark:text-[#F0A554]" />
                  <span>{currentCity.name}, {currentCity.state}</span>
                </button>
              </div>

              {/* Diurnal Solar Arc */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#121528] border border-black/[0.08] dark:border-white/[0.1] space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono-data text-[#4A443B] dark:text-[#E2DAC9] font-semibold">
                  <span className="flex items-center gap-1 text-[#A6461D] dark:text-[#F0A554]">
                    <Sun className="w-3.5 h-3.5" /> {t.rise}: {panchangData.sun.sunrise}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[#826315] dark:text-[#F0C968] font-bold">
                    {t.diurnalArc} ({panchangData.solarArcProgress}%)
                  </span>
                  <span className="flex items-center gap-1 text-[#3D3D99] dark:text-[#B0B0FF]">
                    <Moon className="w-3.5 h-3.5" /> {t.set}: {panchangData.sun.sunset}
                  </span>
                </div>

                {/* Progress Ribbon */}
                <div className="relative w-full h-2.5 bg-[#E2DAC9] dark:bg-[#070913] rounded-full overflow-hidden border border-black/[0.05] dark:border-white/[0.1]">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#A6461D] via-[#D4AF37] to-[#4F46E5] dark:from-[#E2825B] dark:via-[#D4AF37] dark:to-[#8B8BF5] transition-all duration-500"
                    style={{ width: `${panchangData.solarArcProgress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono-data text-[#696256] dark:text-[#B5ACA0] font-medium">
                  <span>Surya Lon: {panchangData.sun.siderealLongitude}°</span>
                  <span>Ayanamsha: {panchangData.ayanamsha}°</span>
                </div>
              </div>

              {/* Telemetry 4-Cell Matrix */}
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono-data">
                <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#121528] border border-black/[0.12] dark:border-[#D4AF37]/40 shadow-xs">
                  <div className="text-[9px] uppercase tracking-widest text-[#5C5549] dark:text-[#DCD6CA] font-bold">{t.tithi}</div>
                  <div className="font-bold text-[#181512] dark:text-[#FFFFFF] text-sm sm:text-base truncate mt-0.5" title={panchangData.tithi.fullName}>
                    {panchangData.tithi.name}
                  </div>
                  <div className="text-[10px] text-[#826315] dark:text-[#F0C968] mt-0.5 font-extrabold">
                    {panchangData.tithi.paksha} • {panchangData.tithi.progressPercent}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#121528] border border-black/[0.12] dark:border-[#D4AF37]/40 shadow-xs">
                  <div className="text-[9px] uppercase tracking-widest text-[#5C5549] dark:text-[#DCD6CA] font-bold">{t.nakshatra}</div>
                  <div className="font-bold text-[#181512] dark:text-[#FFFFFF] text-sm sm:text-base truncate mt-0.5">
                    {panchangData.nakshatra.name}
                  </div>
                  <div className="text-[10px] text-[#3D3D99] dark:text-[#B0B0FF] mt-0.5 font-extrabold">
                    Pada {panchangData.nakshatra.pada} • Lord: {panchangData.nakshatra.lord}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#121528] border border-black/[0.12] dark:border-[#D4AF37]/40 shadow-xs">
                  <div className="text-[9px] uppercase tracking-widest text-[#5C5549] dark:text-[#DCD6CA] font-bold">{t.yogaKarana}</div>
                  <div className="font-bold text-[#181512] dark:text-[#FFFFFF] text-sm sm:text-base truncate mt-0.5">
                    {panchangData.yoga.name}
                  </div>
                  <div className="text-[10px] text-[#A6461D] dark:text-[#F4A574] mt-0.5 font-extrabold">
                    Karana: {panchangData.karana.name}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#121528] border border-black/[0.12] dark:border-[#D4AF37]/40 shadow-xs">
                  <div className="text-[9px] uppercase tracking-widest text-[#5C5549] dark:text-[#DCD6CA] font-bold">{t.moonPhase}</div>
                  <div className="font-bold text-[#181512] dark:text-[#FFFFFF] text-sm sm:text-base truncate mt-0.5">
                    {panchangData.moon.phase}
                  </div>
                  <div className="text-[10px] text-[#3D3D99] dark:text-[#B0B0FF] mt-0.5 font-extrabold">
                    {panchangData.moon.illumination}% {t.illumination}
                  </div>
                </div>
              </div>

              {/* Status Band (High Contrast Alert) */}
              <div className={`p-3 rounded-xl border text-xs font-mono-data flex items-center justify-between ${
                panchangData.isAuspicious
                  ? 'bg-[#E3F5EC] dark:bg-[#062416] border-[#0D5A37] dark:border-[#10b981]/60 text-[#094A2D] dark:text-[#34d399]'
                  : 'bg-[#FDE8EC] dark:bg-[#2A0C12] border-[#9E1B2C] dark:border-[#ef4444]/60 text-[#821322] dark:text-[#fca5a5]'
              }`}>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-bold">{panchangData.currentPeriod}</div>
                    <div className="text-[10px] opacity-90 font-semibold">{t.rahuKaal}: {panchangData.timings.rahuKalam}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    chitiSensory.playTick();
                    onExplorePanchang();
                  }}
                  className="text-[11px] underline underline-offset-2 shrink-0 hover:opacity-100 font-bold"
                >
                  {t.viewAllTimes}
                </button>
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="pt-2 flex items-center justify-between text-[10px] font-mono-data text-[#696256] dark:text-[#DCD6CA] font-medium">
                <span>{t.abhijit}: {panchangData.timings.abhijitMuhurat}</span>
                <span className="text-[#826315] dark:text-[#F0C968] font-bold">{t.ephemerisStamp}</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
