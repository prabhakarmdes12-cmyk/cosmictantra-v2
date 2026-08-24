import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LIBRARY, getArticle } from '@/lib/libraryContent';
import AmbientAdSlot from '@/components/AmbientAdSlot';

export function generateStaticParams() {
  return LIBRARY.map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = getArticle(params.slug);
  if (!a) return {};
  return {
    title: `${a.title}`,
    description: a.excerpt,
    alternates: { canonical: `/library/${a.slug}` },
    openGraph: { title: a.title, description: a.excerpt },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) notFound();

  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-14 px-4 sm:px-6">
      <article className="max-w-3xl mx-auto">
        <Link href="/library" className="text-[10px] uppercase tracking-widest text-[#4848A8] dark:text-[#8B8BF5] font-bold hover:underline">
          ← Vedic Library
        </Link>
        <div className="mt-4 text-[9px] uppercase tracking-[0.2em] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">{a.category}</div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold mt-2">{a.title}</h1>
        <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-3 italic">{a.excerpt}</p>

        <div className="mt-8 space-y-6">
          {a.sections.map((s, i) => (
            <section key={i} className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
              <h2 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-[#EFECE6]">{s.heading}</h2>
              <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-2 leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {(a.toolLinks || []).map(l => (
            <Link key={l.href} href={l.href}
              className="block p-4 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/5 text-center text-xs font-bold text-[#8E6F1D] dark:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all">
              {l.label} →
            </Link>
          ))}
        </div>
        <AmbientAdSlot />
      </article>
    </main>
  );
}
