'use client';

/**
 * KUNDLI LIST + FIRST-60-SECONDS CREATE FLOW (PROGRAM 4 / TRUST-02)
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listKundlis, saveKundli, deleteKundli } from '@/lib/kundliStore';
import BirthContextEditor from './BirthContextEditor';

export default function KundliListClient() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = () => setItems(listKundlis());
  useEffect(() => { refresh(); setReady(true); }, []);

  const handleCreate = (ctx) => {
    const res = saveKundli(ctx);
    if (res.ok) router.push(`/kundli/${res.kundli.id}`);
  };

  const handleDelete = (id) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this Kundli permanently?')) return;
    deleteKundli(id); refresh();
  };

  if (!ready) return <div className="py-16 text-center text-sm opacity-60">Loading your Kundlis…</div>;

  return (
    <div className="space-y-5">
      {!creating && (
        <button onClick={() => setCreating(true)}
          className="w-full rounded-xl border-2 border-dashed border-[#8E6F1D]/50 py-6 text-center hover:bg-[#8E6F1D]/[0.05]">
          <div className="font-editorial text-lg font-bold text-[#8E6F1D] dark:text-[#D4AF37]">+ New Kundli</div>
          <div className="text-xs opacity-70 mt-1">Enter birth details once — get a permanent, living Jyotish workspace.</div>
        </button>
      )}

      {creating && (
        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0b0d12] p-5">
          <h2 className="font-editorial text-lg font-bold mb-1">Create a Kundli</h2>
          <p className="text-[11px] opacity-70 mb-3">Coordinates and timezone are shown and editable — nothing is silently remapped.</p>
          <BirthContextEditor onSave={handleCreate} onCancel={() => setCreating(false)} saveLabel="Create Kundli" />
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-60">Your Kundlis ({items.length})</div>
          {items.map((k) => (
            <div key={k.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0b0d12] px-4 py-3">
              <button onClick={() => router.push(`/kundli/${k.id}`)} className="text-left min-w-0 flex-1">
                <div className="font-semibold truncate">{k.name || 'Unnamed Kundli'}</div>
                <div className="text-[11px] font-mono-data opacity-60 truncate">
                  {k.birthDate} · {k.birthTime || 'time unknown'} · {k.place || 'custom'} · {Number(k.latitude).toFixed(2)},{Number(k.longitude).toFixed(2)}
                </div>
              </button>
              <button onClick={() => handleDelete(k.id)} aria-label="Delete" className="text-xs opacity-50 hover:opacity-100 hover:text-red-500 shrink-0">Delete</button>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !creating && (
        <p className="text-center text-sm opacity-60 py-4">No Kundlis yet. Create your first one above.</p>
      )}
    </div>
  );
}
