import type { Metadata } from 'next';
import PersonalCalendar from '@/components/tools/PersonalCalendar';

export const metadata: Metadata = {
  title: 'My Vedic Calendar — Daily Panchang & Muhurat Alerts',
  description: 'Your personal Vedic calendar: Rahu Kaal, Yamaganda, Panchak, Rikta Tithis, Abhijit Muhurat, festivals and Dasha transitions — colour-coded by day, exportable to Google/Apple Calendar (.ics).',
  alternates: { canonical: '/my-calendar' },
};

export default function MyCalendarPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="max-w-3xl">
          <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] font-bold">दैनिक पंचांग • Vedic Time</div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold mt-2">My Personal Vedic Calendar</h1>
          <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-3 leading-relaxed">
            Red days to avoid, green windows to act, and the festivals and Dasha transitions that shape your
            month — computed for your own birth details. Subscribe the whole feed to your Google or Apple
            calendar with one tap.
          </p>
        </header>
        <PersonalCalendar />
      </div>
    </main>
  );
}
