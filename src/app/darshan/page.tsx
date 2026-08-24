import type { Metadata } from 'next';
import AmbientAdSlot from '@/components/AmbientAdSlot';

export const metadata: Metadata = {
  title: 'Live Temple Darshan — Kashi Vishwanath & Daily Aarti Streams',
  description: 'Watch live darshan from India\'s sacred temples with Vedic timing context: daily Aarti windows, Abhijit-adjacent muhurats and festival alerts. Curated official streams — free, on CosmicTantra.',
  alternates: { canonical: '/darshan' },
};

const TEMPLES = [
  { name: 'Kashi Vishwanath Temple', city: 'Varanasi, UP', ritual: 'Mangala Aarti 3:00 AM · Evening Aarti 6:30–7:30 PM', note: 'Our home temple — Ganga Aarti at Dashashwamedh follows at 6:45 PM (Surya Sandhya band).', href: 'https://www.youtube.com/@shrikashivishwanathtemple' },
  { name: 'Shri Mahakaleshwar Jyotirlinga', city: 'Ujjain, MP', ritual: 'Bhasma Aarti 4:00 AM (winter) · Sandhya Aarti 6:30 PM', note: 'Ujjain is one of our practitioner hubs — jyotirlinga bhasma aarti is the most sought-after darshan in Malwa.', href: 'https://www.youtube.com/@shrimahakaleshwar' },
  { name: 'Shri Siddhivinayak Ganpati', city: 'Mumbai, MH', ritual: 'Aarti 5:30 AM, 12:30 PM, 7:30 PM', note: 'Most-visited temple for business beginnings — pairs with our Business Muhurat module.', href: 'https://www.youtube.com/@siddhivinayaktemple' },
  { name: 'Sri Venkateswara (Tirumala)', city: 'Tirupati, AP', ritual: 'Suprabhatam 2:30 AM · Thomala Sevai 3:15 AM', note: 'Official streaming via TTD; check timings for local timezone.', href: 'https://tirumala.org' },
  { name: 'Shirdi Sai Baba Samadhi Mandir', city: 'Shirdi, MH', ritual: 'Kakad Aarti 4:30 AM · Dhoop Aarti 12:30 PM', note: 'Thursday (Guruvar) is the peak darshan day — aligned with Jupiter\'s weekday.', href: 'https://www.sai.org.in' },
  { name: 'ISKCON Vrindavan & Bangalore', city: 'Vrindavan / Bengaluru', ritual: 'Mangala Aarti 4:30 AM · Sandhya Aarti 7:00 PM', note: 'Stable streaming channels with daily schedules.', href: 'https://www.iskconbangalore.org' },
];

const WINDOWS = [
  { label: 'Brahma Muhurat (47 min before sunrise)', detail: 'Deep meditation, mantra japa, Sankalpa' },
  { label: 'Sunrise Sandhya (सूर्योदय)', detail: 'Ganga Snana, Surya Arghya, Pratah Aarti' },
  { label: 'Abhijit Muhurat (midday)', detail: 'Highest-harmony daytime window for puja & beginnings' },
  { label: 'Sunset Sandhya (सूर्यास्त)', detail: 'Ganga Aarti, Deepa Daan, Sandhya Vandana' },
];

export default function DarshanPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-14 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="max-w-3xl">
          <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] font-bold">साक्षात् दर्शन • Live Sacred Time</div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold mt-2">Live Temple Darshan, timed by the Panchang</h1>
          <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-3 leading-relaxed">
            Every temple stream below is an official public broadcast. What we add is <strong>Vedic timing
            context</strong> — the aarti windows, the Sandhya bands, and which muhurat is strongest today.
            Darshan becomes a ritual, not a video list.
          </p>
        </header>

        {/* Aggregator live embed (official public channel uploads playlist) */}
        <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#8E6F1D] dark:text-[#D4AF37] font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Darshan Aggregator — public YouTube channel
          </div>
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-black/[0.08] dark:border-white/[0.08]">
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube-nocookie.com/embed/videoseries?list=UUXhail7h5FDRbHprlR56nIw"
              title="Live Darshan — official temple streams"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-[10px] text-[#857E74] dark:text-[#8E8A82] mt-3">
            Streams are public YouTube broadcasts embedded via the official iframe API (YouTube attribution retained). We do not host or re-stream any footage.
          </p>
        </div>

        {/* Temple cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLES.map(t => (
            <a key={t.name} href={t.href} target="_blank" rel="noopener noreferrer"
              className="group p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm hover:border-[#D4AF37] transition-all">
              <div className="font-editorial text-lg font-bold text-[#1C1917] dark:text-[#EFECE6] group-hover:text-[#8E6F1D] dark:group-hover:text-[#E5C378]">{t.name}</div>
              <div className="text-[10px] text-[#4848A8] dark:text-[#8B8BF5] font-mono-data mt-0.5">{t.city}</div>
              <div className="text-[11px] text-[#57524A] dark:text-[#AAA49A] mt-2 font-mono-data">{t.ritual}</div>
              <p className="text-[10px] text-[#857E74] dark:text-[#8E8A82] mt-2 leading-relaxed">{t.note}</p>
              <div className="mt-3 text-[10px] font-bold text-[#8E6F1D] dark:text-[#D4AF37] uppercase tracking-widest">Watch official stream ↗</div>
            </a>
          ))}
        </div>

        {/* Vedic timing guide */}
        <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#8E6F1D] dark:text-[#D4AF37] font-bold mb-4">Daily Ritual Timing Windows (Vedic)</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {WINDOWS.map(w => (
              <div key={w.label} className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-[#FAF7F2] dark:bg-[#0A0C12]">
                <div className="text-xs font-bold text-[#1C1917] dark:text-[#EFECE6]">{w.label}</div>
                <div className="text-[11px] text-[#57524A] dark:text-[#AAA49A] mt-1">{w.detail}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#857E74] dark:text-[#8E8A82] mt-4">
            Exact sunrise/sunset, Rahu Kaal and Abhijit timings for your city are on the <a href="/panchang/varanasi" className="underline text-[#8E6F1D] dark:text-[#D4AF37]">Live Panchang page</a>.
          </p>
        </div>

        <AmbientAdSlot />
      </div>
    </main>
  );
}
