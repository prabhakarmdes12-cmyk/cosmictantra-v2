'use client';

/**
 * FullMegaMenuModal - CosmicTantra 2027 UI/UX
 * 
 * Reorganized according to UI/UX Design Direction 2027 Section 2:
 * 
 * The 5 Primary Destinations:
 * 1. Today - Panchanga, daily timing, auspicious muhurtas
 * 2. My Kundli - Narrative chart + analytical tools (D10, Ashtakavarga, Shadbala)
 * 3. Ask - Context-aware Kashi Sahayak AI assistant
 * 4. Consult - Verified Vedic pandits, human escalation
 * 5. Darshan & Puja - Live temple darshan, virtual offerings
 * 
 * Architectural Rule: D10, Ashtakavarga, Shadbala, and Ephemeris are
 * ANALYTICAL VIEWS INSIDE My Kundli, never top-level navigation items.
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  X, 
  Search, 
  Sparkles, 
  Compass, 
  Calendar, 
  ShoppingBag, 
  Flame, 
  ShieldCheck, 
  User, 
  BookOpen, 
  Download, 
  ArrowUpRight,
  Heart,
  Eye,
  FileText,
  Activity,
  Layers,
  Award,
  Sun,
  Eye as EyeIcon,
  Gem
} from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';
import CosmicTantraLogo from '@/components/visual/CosmicTantraLogo';

/**
 * Navigation categories aligned with UI/UX Design Direction 2027
 */
type NavCategory = 
  | 'TODAY' 
  | 'MY_KUNDLI' 
  | 'MY_KUNDLI_ANALYTICAL' 
  | 'ASK' 
  | 'CONSULT' 
  | 'DARSHAN' 
  | 'PROFILE';

interface NavTile {
  title: string;
  titleHi: string;
  href: string;
  icon: string;
  badge?: string;
  description: string;
  category: NavCategory;
}

// ========================================================================
// 5 PRIMARY DESTINATIONS + ANALYTICAL TOOLS (INSIDE My Kundli)
// ========================================================================
const MEGA_MENU_TILES: NavTile[] = [
  // ========================================================================
  // 1. TODAY - Panchanga, daily timing, auspicious muhurtas
  // ========================================================================
  {
    title: '72h Multi-Horizon Forecast',
    titleHi: '७२ घण्टे दैनिक राशिफल व गोचर',
    href: '/daily',
    icon: '🔮',
    badge: 'POPULAR',
    description: 'Deterministic Today, Tomorrow & Day-After forecasts, weekly peaks, and monthly Sankranti ingress.',
    category: 'TODAY'
  },
  {
    title: 'Aura Monthly Vedic Calendar',
    titleHi: 'मासिक वैदिक पञ्चाङ्ग कैलेंडर',
    href: '/calendar',
    icon: '📅',
    description: 'Full 30-day interactive calendar with Shubha Muhurats, Ekadashi, Purnima, and Day Inspector.',
    category: 'TODAY'
  },
  {
    title: 'Parivaar Family Panchang',
    titleHi: 'परिवार पञ्चाङ्ग व सुरक्षा सूत्र',
    href: '/family-panchang',
    icon: '👥',
    description: 'Synchronized family transits, collective harmony score, and protective planetary alerts.',
    category: 'TODAY'
  },
  {
    title: 'Stellarium Vedic Observatory',
    titleHi: 'खगोल वेधशाला (Stellarium Sky)',
    href: '/observatory',
    icon: '🔭',
    badge: 'NEW • 3D SKY',
    description: 'Real-time celestial sphere, 27 Nakshatras (108 Padas), Graha Sphuta & Digbala radar.',
    category: 'TODAY'
  },

  // ========================================================================
  // 2. MY KUNDLI - Narrative chart + Analytical tools embedded inside
  // ========================================================================
  {
    title: "Scholar's Desk (Kundali + Dasha)",
    titleHi: 'जन्मकुण्डली व विंशोत्तरी दशा',
    href: '/dashboard',
    icon: '🏛️',
    badge: 'CORE',
    description: 'North Indian Janma Kundali, Bhavas, Navamsha, and multi-level Vimshottari Dasha calculation.',
    category: 'MY_KUNDLI'
  },
  {
    title: '36-Point Kundali Milan & PDF Report',
    titleHi: '३६-गुण कुण्डली मिलान व PDF रिपोर्ट',
    href: '/kundali-milan',
    icon: '💍',
    badge: 'REPORT & PDF',
    description: 'Classical 36-Guna matching, Nadi Dosha Bhanga, Manglik alignment & complete 6-page downloadable PDF report.',
    category: 'MY_KUNDLI'
  },
  {
    title: 'Written Folio Archive (PDF)',
    titleHi: 'लिखित कुण्डली ग्रंथ (PDF)',
    href: '/report',
    icon: '📜',
    description: 'Download high-resolution, vector-rendered astrological counsel reports without mojibake.',
    category: 'MY_KUNDLI'
  },

  // ========================================================================
  // ANALYTICAL TOOLS INSIDE My Kundli (per UI/UX Design Direction 2027 Section 2)
  // "D10, Ashtakavarga, and Ephemeris are ANALYTICAL VIEWS INSIDE My Kundli"
  // ========================================================================
  {
    title: 'D10 - Dasamsa (Career Analysis)',
    titleHi: 'दशमांश (Dasamsa) - करियर विश्लेषण',
    href: '/kundli/d10',
    icon: '📊',
    description: '10th derivative chart for career, profession, and social status analysis.',
    category: 'MY_KUNDLI_ANALYTICAL'
  },
  {
    title: 'Ashtakavarga Matrix',
    titleHi: 'अष्टकवर्ग मैट्रिक्स',
    href: '/kundli/ashtakavarga',
    icon: '🗺️',
    description: 'Planetary strength matrix showing benefic/reduced points in each sign.',
    category: 'MY_KUNDLI_ANALYTICAL'
  },
  {
    title: 'Shadbala (Six-Fold Strength)',
    titleHi: 'षड्बल (षड्गुण)',
    href: '/kundli/shadbala',
    icon: '⚖️',
    description: 'Six-fold planetary strength: Sthanabala, Digbala, Chestabala, Kalabala, etc.',
    category: 'MY_KUNDLI_ANALYTICAL'
  },
  {
    title: 'Ephemeris & Raw Coordinates',
    titleHi: 'सूर्य सिद्धान्त (Ephemeris)',
    href: '/kundli/ephemeris',
    icon: '🔢',
    description: 'Raw astronomical longitudes for all planets, nodes, and upagrahas.',
    category: 'MY_KUNDLI_ANALYTICAL'
  },

  // ========================================================================
  // 3. ASK - Context-aware Kashi Sahayak AI assistant
  // ========================================================================
  {
    title: 'AI Guru & Vedic Consultation',
    titleHi: 'AI गुरु वैदिक परामर्श (Kashi Sahayak)',
    href: '/ask',
    icon: '🔮',
    badge: 'LIVE GURU',
    description: 'Conversational AI Guru intake, instant Vedic pulse report, and verified Banaras scholar session.',
    category: 'ASK'
  },

  // ========================================================================
  // 4. CONSULT - Verified Vedic pandits, human escalation
  // ========================================================================
  {
    title: 'Scholar Consultation (Pandit)',
    titleHi: 'विद्वान् ज्योतिषी परामर्श',
    href: '/ask',
    icon: '👤',
    badge: 'HUMAN SCHOLAR',
    description: 'Verified Kashi Vidvat Parishad pandits with ScholarHandoverPacket pre-filled.',
    category: 'CONSULT'
  },
  {
    title: 'Pandit Onboarding Portal',
    titleHi: 'विद्वान् ज्योतिषी ऑनबोर्डिंग',
    href: '/pandit/onboard',
    icon: '🪔',
    badge: 'EARN 80%',
    description: 'Join the Kashi Vidvat Parishad network. Instant pre-context dossiers and daily Razorpay payouts.',
    category: 'CONSULT'
  },
  {
    title: 'Scholar Presentation Deck',
    titleHi: 'विद्वत परिषद प्रस्तुति डेक',
    href: '/presentation',
    icon: '🎓',
    description: 'Institutional slide presentation on sidereal ephemeris engines and Varanasi traditions.',
    category: 'CONSULT'
  },

  // ========================================================================
  // 5. DARSHAN & PUJA - Live temple darshan, virtual offerings
  // ========================================================================
  {
    title: 'Live Sacred Darshan Studio',
    titleHi: '२६ महातीर्थ लाइव दर्शन व ई-पूजा',
    href: '/darshan',
    icon: '🌸',
    badge: '24x7 LIVE',
    description: '12 Jyotirlingas, 52 Shakti Peeths, Char Dham & Ganga Aarti with 24x7 YouTube feeds & E-Puja.',
    category: 'DARSHAN'
  },
  {
    title: 'Aarti & Stotra Mahagrantha Library',
    titleHi: 'आरती, स्तोत्र व महाग्रन्थ संग्रह',
    href: '/aarti-stotra',
    icon: '🪔',
    description: 'Authentic Sanskrit verses, Devanagari lyrics, English transliteration, and deep theological context.',
    category: 'DARSHAN'
  },
  {
    title: 'Planetary Upaya Studio',
    titleHi: 'ग्रह शान्ति व उपचार विधा',
    href: '/upaya',
    icon: '💎',
    description: 'Certified gemstones, Rudraksha, Vedic Yantras, and scriptural Daan-Sankalpa recommendations.',
    category: 'DARSHAN'
  },
  {
    title: 'Daily Japa & Mantra Tracker',
    titleHi: 'दैनिक मन्त्र जप व माला काउंटर',
    href: '/remedy-tracker',
    icon: '📿',
    description: 'Interactive 108-bead Japa counter with haptic audio feedback and planetary streak tracking.',
    category: 'DARSHAN'
  },
  {
    title: 'Vedic Pooja Store & Samagri',
    titleHi: 'वैदिक पूजा सामग्री प्रतिष्ठान',
    href: '/store',
    icon: '🛍️',
    badge: 'COMING SOON',
    description: 'Authentic puja samagri storefront — opening after supplier partnerships are finalised.',
    category: 'DARSHAN'
  },

  // ========================================================================
  // PROFILE - Devotee account
  // ========================================================================
  {
    title: 'Cosmic ID & Family Vault',
    titleHi: 'भक्त पहचान व पारिवारिक वॉल्ट',
    href: '/profile',
    icon: '👤',
    badge: 'DPDP SECURE',
    description: 'Manage multiple family birth profiles, Gotra, Janma Nakshatra, and E-Puja booking history.',
    category: 'PROFILE'
  },
  {
    title: 'Chaldean Name Numerology',
    titleHi: 'काल्डियन नाम अंकशास्त्र',
    href: '/numerology/name',
    icon: '🔢',
    description: 'Chaldean sound frequency calculator, compound destiny number, and business name alignment.',
    category: 'PROFILE'
  }
];

interface FullMegaMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FullMegaMenuModal({ isOpen, onClose }: FullMegaMenuModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTiles = useMemo(() => {
    if (!searchQuery.trim()) return MEGA_MENU_TILES;
    const q = searchQuery.toLowerCase();
    return MEGA_MENU_TILES.filter(tile => 
      tile.title.toLowerCase().includes(q) ||
      tile.titleHi.includes(q) ||
      tile.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filter by 5 Primary Destinations
  const todayTiles = useMemo(() => filteredTiles.filter(t => t.category === 'TODAY'), [filteredTiles]);
  const myKundliTiles = useMemo(() => filteredTiles.filter(t => t.category === 'MY_KUNDLI'), [filteredTiles]);
  const analyticalTiles = useMemo(() => filteredTiles.filter(t => t.category === 'MY_KUNDLI_ANALYTICAL'), [filteredTiles]);
  const askTiles = useMemo(() => filteredTiles.filter(t => t.category === 'ASK'), [filteredTiles]);
  const consultTiles = useMemo(() => filteredTiles.filter(t => t.category === 'CONSULT'), [filteredTiles]);
  const darshanTiles = useMemo(() => filteredTiles.filter(t => t.category === 'DARSHAN'), [filteredTiles]);
  const profileTiles = useMemo(() => filteredTiles.filter(t => t.category === 'PROFILE'), [filteredTiles]);

  if (!isOpen) return null;

  const handleNavigate = (href: string) => {
    chitiSensory.playTick();
    onClose();
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };

  // Render a nav section with consistent styling
  const renderSection = (
    title: string,
    titleHi: string,
    icon: React.ReactNode,
    tiles: NavTile[]
  ) => {
    if (tiles.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono-data font-bold text-[#F0C968] uppercase tracking-wider">
          {icon}
          <span>{titleHi}</span>
        </div>
        <div className="space-y-2">
          {tiles.map((tile) => (
            <button
              key={tile.href + tile.category}
              onClick={() => handleNavigate(tile.href)}
              className="w-full text-left p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/50 transition-all group flex items-start gap-3 cursor-pointer"
            >
              <span className="text-2xl p-1 bg-black/40 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                {tile.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-editorial text-sm font-bold text-white group-hover:text-[#F0C968] transition-colors line-clamp-1">
                    {tile.titleHi}
                  </h4>
                  {tile.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[9px] font-mono-data font-bold shrink-0">
                      {tile.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono-data text-[#A8A29E] leading-relaxed mt-0.5 line-clamp-2">
                  {tile.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#06070B]/95 text-white backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen flex flex-col justify-between space-y-8">
        
        {/* Top Bar: Authority Logo, Search & Close Button */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <CosmicTantraLogo size="md" subtitle="5-PRIMARY DESTINATIONS" />
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="खोजें: आज, कुण्डली, परामर्श, दर्शन..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono-data text-white placeholder:text-[#78716C] outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Close Button */}
          <button
            onClick={() => { chitiSensory.playTick(); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono-data font-bold text-white transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
          >
            <span>Close</span>
            <X className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Mobile Search Input */}
        <div className="sm:hidden relative">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="खोजें: आज, कुण्डली, परामर्श, दर्शन..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono-data text-white placeholder:text-[#78716C] outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Navigation Grid - 5 Primary Destinations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
          
          {/* 1. TODAY */}
          {renderSection(
            'Today',
            '1. आज (Today)',
            <Sun className="w-4 h-4 text-amber-400" />,
            todayTiles
          )}

          {/* 2. MY KUNDLI */}
          {renderSection(
            'My Kundli',
            '2. मेरी कुण्डली (My Kundli)',
            <Compass className="w-4 h-4 text-amber-400" />,
            myKundliTiles
          )}

          {/* 2b. ANALYTICAL TOOLS (Nested inside My Kundli) */}
          {renderSection(
            'Analytical Tools',
            '↳ विश्लेषण उपकरण (Inside My Kundli)',
            <Layers className="w-4 h-4 text-amber-400/70" />,
            analyticalTiles
          )}

          {/* 3. ASK */}
          {renderSection(
            'Ask',
            '3. पूछें (Ask)',
            <Sparkles className="w-4 h-4 text-amber-400" />,
            askTiles
          )}

          {/* 4. CONSULT */}
          {renderSection(
            'Consult',
            '4. परामर्श (Consult)',
            <User className="w-4 h-4 text-amber-400" />,
            consultTiles
          )}

          {/* 5. DARSHAN & PUJA */}
          {renderSection(
            'Darshan & Puja',
            '5. दर्शन व पूजा (Darshan & Puja)',
            <Flame className="w-4 h-4 text-amber-400" />,
            darshanTiles
          )}

          {/* PROFILE */}
          {renderSection(
            'Profile',
            'भक्त वॉल्ट (Profile)',
            <User className="w-4 h-4 text-amber-400/70" />,
            profileTiles
          )}

        </div>

        {/* Bottom Footer Bar with Quick Actions */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-data text-[#A8A29E]">
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="text-[#F0C968] font-bold">Vedic Precision:</span>
            <span>Chitra Paksha (Lahiri) Ayanamsha</span>
            <span>•</span>
            <span>Sidereal Ephemeris v34</span>
            <span>•</span>
            <span>No Synthetic Percentiles</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigate('/ask')}
              className="px-4 py-2 rounded-xl bg-[#8E6F1D] hover:bg-[#D4AF37] text-white hover:text-black font-bold transition-all shadow-md cursor-pointer"
            >
              Ask Scholar →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
