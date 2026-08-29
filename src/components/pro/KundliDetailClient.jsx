'use client';

/**
 * KUNDLI DETAIL — ownership-enforced loader (PROGRAM 4 / TRUST-02)
 * A user can NEVER open another user's Kundli by changing the URL id: the store
 * refuses a foreign owner with FORBIDDEN (no IDOR, no data leak).
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getKundli } from '@/lib/kundliStore';
import LivingKundli from './LivingKundli';

export default function KundliDetailClient({ id }) {
  const [state, setState] = useState({ status: 'loading' });
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    try { setTheme(localStorage.getItem('cosmictantra_theme') || 'dark'); } catch { /* noop */ }
    const res = getKundli(id);
    if (res.ok) setState({ status: 'ok', record: res.kundli });
    else setState({ status: res.error });
  }, [id]);

  if (state.status === 'loading') return <div className="py-16 text-center text-sm opacity-60">Loading Kundli…</div>;

  if (state.status === 'FORBIDDEN') {
    return (
      <Guard title="Not your Kundli"
        body="This Kundli belongs to another account and cannot be opened by changing the URL. Your own Kundlis are private to you." />
    );
  }
  if (state.status === 'NOT_FOUND') {
    return <Guard title="Kundli not found" body="No Kundli exists at this address on this device." />;
  }

  return <LivingKundli record={state.record} theme={theme} onUpdated={(r) => setState({ status: 'ok', record: r })} />;
}

function Guard({ title, body }) {
  return (
    <div className="py-16 text-center max-w-md mx-auto">
      <div className="font-editorial text-2xl font-bold">{title}</div>
      <p className="text-sm opacity-70 mt-2">{body}</p>
      <Link href="/kundli" className="inline-block mt-4 px-4 py-2 rounded bg-[#8E6F1D] text-white text-sm">← Back to your Kundlis</Link>
    </div>
  );
}
