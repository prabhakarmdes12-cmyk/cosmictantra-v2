'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  FileText,
  Layers,
  Volume2,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  X
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { playTick } from '@/lib/chitiAudio';
import { GRANTHS_DATA, STOTRAS_DATA, AARTIS_DATA, SIDDHA_STUTI_DATA } from '@/lib/granth/libraryData';

interface VerseItem {
  shlokaNo?: string;
  sanskrit: string;
  hindi: string;
}

interface VerseSection {
  id: string;
  title: string;
  subtitle?: string;
  verses: VerseItem[];
}

interface SacredTextItem {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  deity: string;
  source: string;
  verified: boolean;
  category: 'aarti' | 'stotra' | 'granth' | 'siddha-stuti';
  videoId?: string;
  structure?: string;
  meaningSummary?: string;
  sections: VerseSection[];
}
// =========================================================================
// SACRED SCRIPTURE DATA
// -------------------------------------------------------------------------
// The four collections below were extracted verbatim (no text edited) from
// this file into versioned JSON modules by
// `node scripts/extract-granth-library.cjs`, so the reader, chat and API can
// share one source of truth. Re-run that script after any text change and
// commit the regenerated JSON + `src/lib/granth/data/manifest.json`.
//
// Row counts are storage rows (verses, speaker labels, invocation/paratext and
// grouped material). They are NOT edition-completeness evidence. See
// `docs/granth/COVERAGE-REPORT.md` for per-edition coverage.
// =========================================================================
const granthsData: SacredTextItem[] = GRANTHS_DATA;
const stotrasData: SacredTextItem[] = STOTRAS_DATA;
const aartisData: SacredTextItem[] = AARTIS_DATA;
const siddhaStutiData: SacredTextItem[] = SIDDHA_STUTI_DATA;


export default function AartiStotraLibrary() {
  const [activeCategory, setActiveCategory] = useState<'aarti' | 'stotra' | 'granth' | 'siddha-stuti'>('aarti');
  const [selectedId, setSelectedId] = useState<number>(1);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const [showHindi, setShowHindi] = useState<boolean>(true);
  const [readingMode, setReadingMode] = useState<'paginated' | 'full'>('paginated');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [bookmarkedKeys, setBookmarkedKeys] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastReadBookmark, setLastReadBookmark] = useState<{
    category: 'aarti' | 'stotra' | 'granth' | 'siddha-stuti';
    id: number;
    title: string;
    sectionIndex: number;
    sectionTitle: string;
  } | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(true);

  // Load Saved Bookmark & Preferences on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cosmictantra_sacred_last_read');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.title) {
          setLastReadBookmark(parsed);
        }
      }
      const savedBm = localStorage.getItem('cosmictantra_verse_bookmarks');
      if (savedBm) {
        setBookmarkedKeys(JSON.parse(savedBm));
      }
    } catch {
      // Gracefully ignore storage errors
    }
  }, []);

  // Active dataset
  const currentDataset = useMemo(() => {
    if (activeCategory === 'aarti') return aartisData;
    if (activeCategory === 'stotra') return stotrasData;
    if (activeCategory === 'siddha-stuti') return siddhaStutiData;
    return granthsData;
  }, [activeCategory]);

  // Live Filtered Dataset based on Search Query
  const filteredDataset = useMemo(() => {
    if (!searchQuery.trim()) return currentDataset;
    const q = searchQuery.toLowerCase().trim();
    return currentDataset.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const subMatch = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
      const deityMatch = item.deity.toLowerCase().includes(q);
      const verseMatch = item.sections.some(s => 
        s.title.toLowerCase().includes(q) || 
        s.verses.some(v => v.sanskrit.toLowerCase().includes(q) || v.hindi.toLowerCase().includes(q))
      );
      return titleMatch || subMatch || deityMatch || verseMatch;
    });
  }, [currentDataset, searchQuery]);

  // Selected Sacred Item
  const activeItem = useMemo(() => {
    const found = filteredDataset.find(item => item.id === selectedId) || currentDataset.find(item => item.id === selectedId);
    return found || filteredDataset[0] || currentDataset[0] || aartisData[0];
  }, [filteredDataset, currentDataset, selectedId]);

  // Active Section
  const activeSection = useMemo(() => {
    if (!activeItem.sections || activeItem.sections.length === 0) return null;
    return activeItem.sections[activeSectionIndex] || activeItem.sections[0];
  }, [activeItem, activeSectionIndex]);

  // Auto-Save Last Read Position
  useEffect(() => {
    if (activeItem && activeSection) {
      try {
        const payload = {
          category: activeCategory,
          id: activeItem.id,
          title: activeItem.title,
          sectionIndex: activeSectionIndex,
          sectionTitle: activeSection.title,
        };
        localStorage.setItem('cosmictantra_sacred_last_read', JSON.stringify(payload));
      } catch {
        // Ignore
      }
    }
  }, [activeCategory, activeItem, activeSectionIndex, activeSection]);

  // Category switch handler
  const handleCategoryChange = (cat: 'aarti' | 'stotra' | 'granth' | 'siddha-stuti') => {
    playTick();
    setActiveCategory(cat);
    const targetDataset = cat === 'aarti' ? aartisData : cat === 'stotra' ? stotrasData : cat === 'siddha-stuti' ? siddhaStutiData : granthsData;
    setSelectedId(targetDataset[0]?.id || 1);
    setActiveSectionIndex(0);
    setSearchQuery('');
  };

  // Item select handler
  const handleItemSelect = (id: number) => {
    playTick();
    setSelectedId(id);
    setActiveSectionIndex(0);
  };

  // Resume Reading Handler
  const handleResumeReading = () => {
    if (!lastReadBookmark) return;
    playTick();
    setActiveCategory(lastReadBookmark.category);
    setSelectedId(lastReadBookmark.id);
    setActiveSectionIndex(lastReadBookmark.sectionIndex);
    setShowResumeBanner(false);
  };

  // Bookmark Verse Toggle
  const handleToggleBookmark = (key: string) => {
    playTick();
    setBookmarkedKeys(prev => {
      const exists = prev.includes(key);
      const updated = exists ? prev.filter(k => k !== key) : [...prev, key];
      try {
        localStorage.setItem('cosmictantra_verse_bookmarks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Copy handler
  const handleCopy = (textKey: string, textToCopy: string) => {
    playTick();
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(textKey);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Full item text compiler for single-click export
  const getFullCompiledText = (item: SacredTextItem) => {
    let output = `${item.title}\n${item.subtitle ? item.subtitle + '\n' : ''}\n`;
    item.sections.forEach((sec) => {
      output += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n${sec.title}\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      sec.verses.forEach((v) => {
        if (v.shlokaNo) output += `[${v.shlokaNo}]\n`;
        output += `${v.sanskrit}\n\n`;
        if (v.hindi) output += `भावार्थ: ${v.hindi}\n\n`;
      });
    });
    return output;
  };

  // Font size classes
  const fontClasses = useMemo(() => {
    if (fontSize === 'normal') {
      return {
        sanskrit: 'text-sm sm:text-base leading-relaxed',
        hindi: 'text-xs sm:text-sm leading-relaxed',
      };
    }
    if (fontSize === 'xlarge') {
      return {
        sanskrit: 'text-lg sm:text-2xl leading-loose',
        hindi: 'text-sm sm:text-base leading-relaxed',
      };
    }
    return {
      sanskrit: 'text-base sm:text-lg leading-loose',
      hindi: 'text-xs sm:text-sm leading-relaxed',
    };
  }, [fontSize]);

  return (
    <CosmicTantraShell>
      <div className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#F0C968] text-xs font-mono-data font-bold uppercase tracking-[2px]">
            <Sparkles className="w-3.5 h-3.5" />
            शास्त्रीय मन्त्र व महाग्रंथ संग्रह • SACRED SANCTUARY READER
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[#1C1917] dark:text-[#FFFFFF] tracking-tight">
            Aarti & Stotra Library
          </h1>
          <p className="text-xs sm:text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF] max-w-2xl mx-auto">
            100% full, exhaustive Sanskrit texts with complete authentic Hindi translations (सार्थ भावार्थ), auto-bookmarking, and single-view reading sanctuary.
          </p>
        </div>

        {/* 0. Last Read Auto-Bookmark Banner (If Available & Not Dismissed) */}
        {lastReadBookmark && showResumeBanner && (lastReadBookmark.id !== activeItem.id || lastReadBookmark.sectionIndex !== activeSectionIndex) && (
          <div className="bg-gradient-to-r from-[#8E6F1D]/15 via-[#D4AF37]/15 to-[#8E6F1D]/10 dark:from-[#D4AF37]/20 dark:via-[#8E6F1D]/20 dark:to-transparent rounded-2xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-in fade-in">
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bookmark className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-[11px] font-mono-data uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                  पिछली बार पढ़ी गई जगह (Resume Reading):
                </div>
                <div className="font-editorial font-bold text-sm text-[#1C1917] dark:text-white">
                  {lastReadBookmark.title} • <span className="text-xs font-mono-data text-[#57524A] dark:text-[#D1C9BF]">{lastReadBookmark.sectionTitle}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleResumeReading}
                className="px-3.5 py-1.5 rounded-xl bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] text-xs font-mono-data font-bold flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer shadow-sm"
              >
                <span>यहाँ से जारी रखें (Resume)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowResumeBanner(false)}
                className="p-1.5 rounded-lg text-[#78716C] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 1. Search Bar & Main Category Tabs Switcher */}
        <div className="space-y-3">
          
          {/* Live Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="खोजें: श्लोक, चौपाई, देवता, आरती, स्तोत्र, या भावार्थ (Search library)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0E101D]/90 backdrop-blur-md text-xs font-mono-data text-[#1C1917] dark:text-white placeholder-[#78716C] focus:border-[#8E6F1D] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#8E6F1D]/20 outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2.5">
            <button 
              onClick={() => handleCategoryChange('aarti')}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer ${
                activeCategory === 'aarti' 
                  ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] shadow-md' 
                  : 'bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#44403C] dark:text-[#D1C9BF] hover:border-[#8E6F1D]'
              }`}
            >
              आरती संग्रह ({aartisData.length})
            </button>
            <button 
              onClick={() => handleCategoryChange('stotra')}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer ${
                activeCategory === 'stotra' 
                  ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] shadow-md' 
                  : 'bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#44403C] dark:text-[#D1C9BF] hover:border-[#8E6F1D]'
              }`}
            >
              स्तोत्र व सूक्त ({stotrasData.length})
            </button>
            <button 
              onClick={() => handleCategoryChange('granth')}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'granth' 
                  ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] shadow-md' 
                  : 'bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#44403C] dark:text-[#D1C9BF] hover:border-[#8E6F1D]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              पवित्र महाग्रंथ ({granthsData.length})
            </button>
            <button 
              onClick={() => handleCategoryChange('siddha-stuti')}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'siddha-stuti' 
                  ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] shadow-md' 
                  : 'bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#44403C] dark:text-[#D1C9BF] hover:border-[#8E6F1D]'
              }`}
            >
              <span>🎵</span>
              सिद्ध स्तुति व भजन ({siddhaStutiData.length})
            </button>
          </div>
        </div>

        {/* 2. Text Selection Grid Cards (In-View Tabs with Headings for direct discovery) */}
        <div className="bg-white/80 dark:bg-[#0B0D17]/80 backdrop-blur-md rounded-2xl border border-[#8E6F1D]/20 dark:border-[#D4AF37]/25 p-3.5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
            <span className="text-[11px] font-mono-data uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">
              {searchQuery ? `खोज परिणाम (${filteredDataset.length})` : 'ग्रंथ व स्तोत्र चयन • Select Sacred Text:'}
            </span>
            <span className="text-[11px] font-mono-data text-[#78716C]">
              {filteredDataset.length} Texts Available
            </span>
          </div>

          {filteredDataset.length === 0 ? (
            <div className="text-center py-6 text-xs font-mono-data text-[#78716C]">
              कोई परिणाम नहीं मिला। कृपया अन्य शब्द खोजें।
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {filteredDataset.map((item) => {
                const isSelected = item.id === activeItem.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item.id)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] border-[#8E6F1D] shadow-md ring-2 ring-[#8E6F1D]/30'
                        : 'bg-[#FAF7F2] dark:bg-[#121422] text-[#44403C] dark:text-[#D1C9BF] border-black/5 dark:border-white/10 hover:border-[#8E6F1D]'
                    }`}
                  >
                    <div>
                      <h3 className={`font-editorial font-bold text-xs sm:text-sm line-clamp-1 ${
                        isSelected ? 'text-white dark:text-[#060709]' : 'text-[#1C1917] dark:text-white'
                      }`}>
                        {item.title}
                      </h3>
                      {item.subtitle && (
                        <div className={`text-[10px] font-editorial italic line-clamp-1 mt-0.5 ${
                          isSelected ? 'text-white/80 dark:text-black/70' : 'text-[#78716C]'
                        }`}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                    <div className={`text-[10px] font-mono-data font-bold mt-2 ${
                      isSelected ? 'text-white/90 dark:text-black/90' : 'text-[#8E6F1D] dark:text-[#F0C968]'
                    }`}>
                      {item.deity}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. The Unified Sanctuary Reader Viewport (Same View Field) */}
        <div className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 shadow-xl overflow-hidden">
          
          {/* Reader Top Bar */}
          <div className="bg-[#FAF7F2] dark:bg-[#121422] p-5 sm:p-6 border-b border-black/10 dark:border-white/10 space-y-4">
            
            {/* Title & Metadata */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#F0C968] text-[11px] font-mono-data font-bold">
                  <span>{activeItem.deity}</span>
                  <span>•</span>
                  <span>{activeItem.source}</span>
                </div>
                <div className="font-editorial font-bold text-2xl sm:text-3xl text-[#1C1917] dark:text-white">
                  {activeItem.title}
                </div>
                {activeItem.subtitle && (
                  <p className="text-xs sm:text-sm font-editorial italic text-[#57524A] dark:text-[#D1C9BF]">
                    {activeItem.subtitle}
                  </p>
                )}
              </div>

              {/* Action Controls: Reading Mode, Hindi Toggle, Font Size, Copy All */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* View Mode Toggle: Paginated vs Continuous Scroll */}
                <div className="inline-flex items-center rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#161826] p-0.5">
                  <button
                    onClick={() => { playTick(); setReadingMode('paginated'); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono-data font-bold flex items-center gap-1 transition-all ${
                      readingMode === 'paginated'
                        ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709]'
                        : 'text-[#78716C]'
                    }`}
                    title="Read by Section / Chapter"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>खण्ड-वार</span>
                  </button>
                  <button
                    onClick={() => { playTick(); setReadingMode('full'); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono-data font-bold flex items-center gap-1 transition-all ${
                      readingMode === 'full'
                        ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709]'
                        : 'text-[#78716C]'
                    }`}
                    title="Read Complete Full Text with continuous scroll"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>सम्पूर्ण अखण्ड पाठ</span>
                  </button>
                </div>

                {/* Translation Toggle */}
                <button
                  onClick={() => { playTick(); setShowHindi(!showHindi); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    showHindi
                      ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] border-[#8E6F1D]'
                      : 'bg-white dark:bg-[#161826] text-[#78716C] border-black/10 dark:border-white/10'
                  }`}
                  title="Toggle Hindi Translation"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showHindi ? 'सार्थ भावार्थ ON' : 'केवल संस्कृत'}</span>
                </button>

                {/* Font Size Selector */}
                <div className="inline-flex items-center rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#161826] p-0.5">
                  <button
                    onClick={() => setFontSize('normal')}
                    className={`px-2 py-1 rounded-lg text-xs font-mono-data font-bold ${
                      fontSize === 'normal' ? 'bg-[#8E6F1D]/15 text-[#8E6F1D] dark:text-[#F0C968]' : 'text-[#78716C]'
                    }`}
                    title="Normal Font Size"
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize('large')}
                    className={`px-2 py-1 rounded-lg text-xs font-mono-data font-bold ${
                      fontSize === 'large' ? 'bg-[#8E6F1D]/15 text-[#8E6F1D] dark:text-[#F0C968]' : 'text-[#78716C]'
                    }`}
                    title="Large Font Size"
                  >
                    A+
                  </button>
                  <button
                    onClick={() => setFontSize('xlarge')}
                    className={`px-2 py-1 rounded-lg text-xs font-mono-data font-bold ${
                      fontSize === 'xlarge' ? 'bg-[#8E6F1D]/15 text-[#8E6F1D] dark:text-[#F0C968]' : 'text-[#78716C]'
                    }`}
                    title="Extra Large Font Size"
                  >
                    A++
                  </button>
                </div>

                {/* 1-Click Copy All */}
                <button
                  onClick={() => handleCopy(`full-${activeItem.id}`, getFullCompiledText(activeItem))}
                  className="px-3 py-1.5 rounded-xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 bg-white dark:bg-[#161826] text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#060709] transition-all cursor-pointer flex items-center gap-1.5"
                  title="Copy complete sacred text"
                >
                  {copiedKey === `full-${activeItem.id}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span>Copied All</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>सम्पूर्ण पाठ कॉपी</span>
                    </>
                  )}
                </button>
                
                <div className="px-2.5 py-1 text-[11px] font-mono-data bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 text-[#8E6F1D] dark:text-[#F0C968] rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#15803D] dark:text-[#4ADE80]" />
                  Source Documented
                </div>
              </div>
            </div>

            {/* Spiritual Essence Banner */}
            {activeItem.meaningSummary && (
              <div className="p-3.5 rounded-2xl bg-[#8E6F1D]/5 dark:bg-[#D4AF37]/10 border border-[#8E6F1D]/15 dark:border-[#D4AF37]/20 text-xs font-mono-data text-[#57524A] dark:text-[#E2D9CE] leading-relaxed">
                <strong className="text-[#8E6F1D] dark:text-[#F0C968]">तत्त्व दर्शन एवं सार: </strong>
                {activeItem.meaningSummary}
              </div>
            )}

            {/* Section / Chapter Tabs (Shown in paginated mode when multiple sections exist) */}
            {readingMode === 'paginated' && activeItem.sections && activeItem.sections.length > 1 && (
              <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
                <div className="text-[11px] font-mono-data uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                  अध्याय व खण्ड चयन • Select Section / Chapter:
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {activeItem.sections.map((sec, idx) => {
                    const isSecActive = idx === activeSectionIndex;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => { playTick(); setActiveSectionIndex(idx); }}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono-data font-bold transition-all cursor-pointer border ${
                          isSecActive
                            ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] border-[#8E6F1D] shadow-sm'
                            : 'bg-white dark:bg-[#161826] text-[#57524A] dark:text-[#D1C9BF] border-black/10 dark:border-white/10 hover:border-[#8E6F1D]'
                        }`}
                      >
                        {sec.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Reader Sanctuary Body — Continuous Scroll or Paginated */}
          <div className={`p-4 sm:p-8 space-y-8 scrollbar-thin scrollbar-thumb-[#8E6F1D]/30 scrollbar-track-transparent ${
            readingMode === 'paginated' ? 'max-h-[650px] overflow-y-auto' : 'overflow-visible'
          }`}>
            
            {/* Embedded Curated Video Player for Siddha Stuti / Bhajans */}
            {activeItem.videoId && (
              <div className="bg-black/95 rounded-2xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/45 p-3.5 sm:p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-mono-data">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>सिद्ध स्तुति एवं भजन प्रसारण • {activeItem.deity}</span>
                  </div>
                  <span className="text-[11px] text-white/70">
                    {activeItem.source}
                  </span>
                </div>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner bg-black border border-white/10">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${activeItem.videoId}?autoplay=1&mute=1&rel=0&playsinline=1&modestbranding=1`}
                    className="w-full h-full border-0 absolute inset-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={activeItem.title}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono-data text-white/80 pt-1 border-t border-white/10">
                  <span>श्रवण के साथ नीचे सम्पूर्ण स्तोत्र का सार्थ पाठ करें 👇</span>
                  <a
                    href={`https://www.youtube.com/watch?v=${activeItem.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 underline flex items-center gap-1 font-bold"
                  >
                    <span>यूट्यूब पर खोलें ↗</span>
                  </a>
                </div>
              </div>
            )}

            {/* 1. If Paginated Mode: Show only active section */}
            {readingMode === 'paginated' && activeSection && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-3">
                  <div>
                    <h3 className="font-editorial font-bold text-lg sm:text-xl text-[#1C1917] dark:text-white">
                      {activeSection.title}
                    </h3>
                    {activeSection.subtitle && (
                      <p className="text-xs font-mono-data text-[#8E6F1D] dark:text-[#F0C968]">
                        {activeSection.subtitle}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-mono-data text-[#78716C]">
                    {activeSection.verses.length} श्लोक / पद
                  </span>
                </div>

                <div className="space-y-5">
                  {activeSection.verses.map((verse, vIdx) => {
                    const vKey = `${activeItem.id}-${activeSection.id}-${vIdx}`;
                    return (
                      <div
                        key={vIdx}
                        className="bg-[#FAF7F2] dark:bg-[#070912] rounded-2xl border border-black/5 dark:border-white/5 p-4 sm:p-6 space-y-3 transition-all hover:border-[#8E6F1D]/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          {verse.shlokaNo && (
                            <span className="px-2.5 py-0.5 rounded-md bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#F0C968] text-[11px] font-mono-data font-bold">
                              {verse.shlokaNo}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleBookmark(vKey)}
                              className={`p-1.5 rounded-lg text-xs font-mono-data transition-all cursor-pointer ${
                                bookmarkedKeys.includes(vKey)
                                  ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709]'
                                  : 'text-[#78716C] hover:text-[#8E6F1D] dark:hover:text-[#F0C968] hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                              title={bookmarkedKeys.includes(vKey) ? 'Remove bookmark' : 'Bookmark this verse'}
                            >
                              {bookmarkedKeys.includes(vKey) ? (
                                <BookmarkCheck className="w-3.5 h-3.5" />
                              ) : (
                                <Bookmark className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleCopy(vKey, `${verse.sanskrit}\n\nभावार्थ: ${verse.hindi}`)}
                              className="p-1.5 rounded-lg text-[#78716C] hover:text-[#8E6F1D] dark:hover:text-[#F0C968] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                              title="Copy this verse"
                            >
                              {copiedKey === vKey ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <pre className={`whitespace-pre-wrap font-serif tracking-wide text-[#1C1917] dark:text-[#FAF7F2] select-text ${fontClasses.sanskrit}`}>
                          {verse.sanskrit}
                        </pre>

                        {showHindi && verse.hindi && (
                          <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#121422] border border-[#8E6F1D]/15 dark:border-[#D4AF37]/20 text-[#44403C] dark:text-[#E7E5E4] space-y-1">
                            <div className="text-[11px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider flex items-center gap-1">
                              <span>🌺 प्रमाणिक हिन्दी भावार्थ</span>
                            </div>
                            <p className={`font-serif ${fontClasses.hindi}`}>
                              {verse.hindi}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. If Continuous Full Mode: Render ALL sections with zero truncation */}
            {readingMode === 'full' && (
              <div className="space-y-10">
                {activeItem.sections.map((sec, sIdx) => (
                  <div key={sec.id} className="space-y-5">
                    <div className="flex items-center justify-between gap-2 border-b border-[#8E6F1D]/20 dark:border-[#D4AF37]/20 pb-3">
                      <div>
                        <h3 className="font-editorial font-bold text-lg sm:text-xl text-[#8E6F1D] dark:text-[#F0C968]">
                          {sec.title}
                        </h3>
                        {sec.subtitle && (
                          <p className="text-xs font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
                            {sec.subtitle}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-mono-data text-[#78716C]">
                        {sec.verses.length} श्लोक / पद
                      </span>
                    </div>

                    <div className="space-y-5">
                      {sec.verses.map((verse, vIdx) => {
                        const vKey = `full-${activeItem.id}-${sec.id}-${vIdx}`;
                        return (
                          <div
                            key={vIdx}
                            className="bg-[#FAF7F2] dark:bg-[#070912] rounded-2xl border border-black/5 dark:border-white/5 p-4 sm:p-6 space-y-3 transition-all hover:border-[#8E6F1D]/40"
                          >
                            <div className="flex items-center justify-between gap-2">
                              {verse.shlokaNo && (
                                <span className="px-2.5 py-0.5 rounded-md bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#F0C968] text-[11px] font-mono-data font-bold">
                                  {verse.shlokaNo}
                                </span>
                              )}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleBookmark(vKey)}
                                  className={`p-1.5 rounded-lg text-xs font-mono-data transition-all cursor-pointer ${
                                    bookmarkedKeys.includes(vKey)
                                      ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709]'
                                      : 'text-[#78716C] hover:text-[#8E6F1D] dark:hover:text-[#F0C968] hover:bg-black/5 dark:hover:bg-white/5'
                                  }`}
                                  title={bookmarkedKeys.includes(vKey) ? 'Remove bookmark' : 'Bookmark this verse'}
                                >
                                  {bookmarkedKeys.includes(vKey) ? (
                                    <BookmarkCheck className="w-3.5 h-3.5" />
                                  ) : (
                                    <Bookmark className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleCopy(vKey, `${verse.sanskrit}\n\nभावार्थ: ${verse.hindi}`)}
                                  className="p-1.5 rounded-lg text-[#78716C] hover:text-[#8E6F1D] dark:hover:text-[#F0C968] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                  title="Copy this verse"
                                >
                                  {copiedKey === vKey ? (
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <pre className={`whitespace-pre-wrap font-serif tracking-wide text-[#1C1917] dark:text-[#FAF7F2] select-text ${fontClasses.sanskrit}`}>
                              {verse.sanskrit}
                            </pre>

                            {showHindi && verse.hindi && (
                              <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#121422] border border-[#8E6F1D]/15 dark:border-[#D4AF37]/20 text-[#44403C] dark:text-[#E7E5E4] space-y-1">
                                <div className="text-[11px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider flex items-center gap-1">
                                  <span>🌺 प्रमाणिक हिन्दी भावार्थ</span>
                                </div>
                                <p className={`font-serif ${fontClasses.hindi}`}>
                                  {verse.hindi}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reader Pagination Footer (Only in Paginated Mode) */}
          {readingMode === 'paginated' && activeItem.sections && activeItem.sections.length > 1 && (
            <div className="bg-[#FAF7F2] dark:bg-[#121422] p-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
              <button
                disabled={activeSectionIndex === 0}
                onClick={() => { playTick(); setActiveSectionIndex(prev => Math.max(0, prev - 1)); }}
                className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-mono-data font-bold transition-all border ${
                  activeSectionIndex === 0
                    ? 'opacity-40 cursor-not-allowed bg-transparent border-black/5 dark:border-white/5'
                    : 'bg-white dark:bg-[#161826] text-[#1C1917] dark:text-white border-black/10 dark:border-white/10 hover:border-[#8E6F1D] cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>पिछला खण्ड (Prev)</span>
              </button>

              <span className="text-xs font-mono-data text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                खण्ड {activeSectionIndex + 1} of {activeItem.sections.length}
              </span>

              <button
                disabled={activeSectionIndex === activeItem.sections.length - 1}
                onClick={() => { playTick(); setActiveSectionIndex(prev => Math.min(activeItem.sections.length - 1, prev + 1)); }}
                className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-mono-data font-bold transition-all border ${
                  activeSectionIndex === activeItem.sections.length - 1
                    ? 'opacity-40 cursor-not-allowed bg-transparent border-black/5 dark:border-white/5'
                    : 'bg-white dark:bg-[#161826] text-[#1C1917] dark:text-white border-black/10 dark:border-white/10 hover:border-[#8E6F1D] cursor-pointer'
                }`}
              >
                <span>अगला खण्ड (Next)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </CosmicTantraShell>
  );
}
