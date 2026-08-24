import React, { useState } from 'react';
import { User, Play, MessageSquare, Globe, BookOpen, X } from 'lucide-react';
import { PRACTITIONERS, EDITORIAL_VIDEOS } from '../lib/practitioners';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

export default function PractitionersSection({ onOpenConsultation, lang = 'en', theme = 'dark' }) {
  const [activeVideo, setActiveVideo] = useState(null);
  const t = TRANSLATIONS[lang]?.scholars || TRANSLATIONS.en.scholars;

  return (
    <section id="practitioners-section" className="py-16 lg:py-24 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#060709] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-2 font-bold">
            <User className="w-3.5 h-3.5" />
            <span>{t.tag}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] dark:text-[#EFECE6]">
            {t.heading}
          </h2>
          <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#8E8A82] font-mono-data mt-2">
            {t.subheading}
          </p>
        </div>

        {/* Scholar Profiles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-16 font-mono-data">
          {PRACTITIONERS.map((practitioner) => (
            <div
              key={practitioner.id}
              className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B0C11] border border-black/[0.08] dark:border-white/[0.08] hover:border-[#D4AF37]/50 transition-colors flex flex-col justify-between shadow-xs hover:shadow-xl"
            >
              <div>
                {/* Photo & Lineage */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
                  <img
                    src={practitioner.avatar}
                    alt={practitioner.name}
                    className="w-14 h-14 rounded-xl object-cover border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 shrink-0"
                  />
                  <div>
                    <h3 className="font-editorial text-base font-bold text-[#1C1917] dark:text-[#EFECE6]">
                      {practitioner.name}
                    </h3>
                    <div className="text-[11px] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
                      {practitioner.yearsPractising} {t.yearsPractising}
                    </div>
                    <div className="text-[10px] text-[#857E74] dark:text-[#6B6760] line-clamp-1">
                      {practitioner.lineage}
                    </div>
                  </div>
                </div>

                {/* Philosophy Statement */}
                <p className="text-xs text-[#57524A] dark:text-[#AAA49A] italic leading-relaxed mb-4 p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.05] dark:border-white/[0.05]">
                  "{practitioner.philosophy}"
                </p>

                {/* Specializations */}
                <div className="space-y-1.5 mb-4">
                  <div className="text-[9px] uppercase tracking-wider text-[#857E74] dark:text-[#6B6760] font-bold">
                    {t.focusAreas}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {practitioner.specialisations.map((spec, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-[#FAF7F2] dark:bg-[#101218] border border-black/[0.06] dark:border-white/[0.06] text-[10px] text-[#1C1917] dark:text-[#EFECE6]"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="text-[11px] text-[#857E74] dark:text-[#6B6760] mb-4 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-[#4848A8] dark:text-[#8B8BF5]" />
                  <span>{practitioner.languages.join(' • ')}</span>
                </div>
              </div>

              {/* Consultation trigger */}
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  analytics.track(ANALYTICS_EVENTS.ASK_JYOTISHI_CLICKED, { practitioner: practitioner.name });
                  onOpenConsultation(`Consultation with ${practitioner.name}`);
                }}
                className="w-full py-2.5 rounded-lg bg-[#FAF7F2] dark:bg-[#101218] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 hover:bg-[#FFFFFF] dark:hover:bg-[#161822] text-xs font-bold text-[#1C1917] dark:text-[#EFECE6] transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                <span>{t.consultWith} {practitioner.name.split(' ')[1]} Ji</span>
              </button>
            </div>
          ))}
        </div>

        {/* Video as Trust: Learn from Practicing Jyotishis */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] dark:bg-[#090A0E] border border-black/[0.08] dark:border-white/[0.08] shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <div>
              <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] mb-1 flex items-center gap-1.5 font-bold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t.archiveTag}</span>
              </div>
              <h3 className="font-editorial text-2xl font-bold text-[#1C1917] dark:text-[#EFECE6]">
                {t.archiveHeading}
              </h3>
            </div>
            <span className="text-[11px] font-mono-data text-[#857E74] dark:text-[#6B6760]">
              {t.archiveSub}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-data">
            {EDITORIAL_VIDEOS.map((video) => (
              <div
                key={video.id}
                onClick={() => {
                  chitiSensory.playTick();
                  analytics.track(ANALYTICS_EVENTS.PRACTITIONER_VIDEO_PLAYED, { video: video.title });
                  setActiveVideo(video);
                }}
                className="group p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.06] dark:border-white/[0.06] hover:border-[#8B8BF5]/50 cursor-pointer transition-colors flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-2.5 bg-[#12141c]">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/70 border border-white/30 flex items-center justify-center text-white">
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-1.5 right-1.5 px-1 rounded bg-black/80 text-[9px] text-white">
                      {video.duration}
                    </span>
                  </div>

                  <div className="text-[9px] text-[#8E6F1D] dark:text-[#D4AF37] uppercase font-bold">
                    {video.topic}
                  </div>
                  <h4 className="font-semibold text-xs text-[#1C1917] dark:text-[#EFECE6] group-hover:text-[#4848A8] dark:group-hover:text-[#8B8BF5] transition-colors mt-0.5 line-clamp-2">
                    {video.title}
                  </h4>
                  <div className="text-[10px] text-[#857E74] dark:text-[#6B6760] mt-1">
                    {video.practitioner}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Video Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-2xl bg-[#FFFFFF] dark:bg-[#090A0E] border border-black/[0.1] dark:border-white/[0.1] p-6 shadow-2xl space-y-4 text-left font-mono-data">
            <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-3">
              <div>
                <span className="text-[9px] text-[#8E6F1D] dark:text-[#D4AF37] uppercase font-bold">
                  {activeVideo.topic} • {activeVideo.practitioner}
                </span>
                <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-[#EFECE6]">
                  {activeVideo.title}
                </h3>
              </div>
              <button 
                onClick={() => setActiveVideo(null)}
                className="p-1 rounded text-[#857E74] dark:text-[#8E8A82] hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Box */}
            <div className="relative aspect-video rounded-xl bg-black border border-white/[0.06] overflow-hidden flex flex-col items-center justify-center p-6 text-center">
              <img
                src={activeVideo.thumbnail}
                alt={activeVideo.title}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
              <div className="relative z-10 space-y-2.5 max-w-sm">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-black flex items-center justify-center mx-auto shadow-lg">
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                </div>
                <div className="text-xs font-semibold text-white">
                  "{activeVideo.summary}"
                </div>
                <div className="text-[10px] text-[#D4AF37]">
                  Archived Masterclass Discourses • 2026 Collection
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-[#857E74] dark:text-[#6B6760]">Duration: {activeVideo.duration} mins</span>
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  setActiveVideo(null);
                  onOpenConsultation(`Question inspired by ${activeVideo.title}`);
                }}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#060709] font-bold text-xs uppercase hover:bg-[#E5C378] transition-colors"
              >
                Ask a Question to Scholar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
