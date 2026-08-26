'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConsultationRoomDefault() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/consultation/room/CT-2026-0825-001?mode=voice&role=devotee');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07080D] text-white font-mono-data text-xs">
      Connecting to Encrypted Consultation Chamber...
    </div>
  );
}
