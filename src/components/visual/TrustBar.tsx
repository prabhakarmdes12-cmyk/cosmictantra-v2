'use client';

import React from 'react';
import { ShieldCheck, Clock, Users, Award } from 'lucide-react';

export default function TrustBar() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-[#57524A] dark:text-[#AAA49A] py-4 border-y border-[#D4AF37]/10">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#10B981]" /> <span>DPDP Compliant</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#8E6F1D]" /> <span>4–12h Delivery</span>
      </div>
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-[#4848A8]" /> <span>Family Profiles</span>
      </div>
      <div className="flex items-center gap-2">
        <Award className="w-4 h-4 text-[#D4AF37]" /> <span>Practitioner Verified</span>
      </div>
    </div>
  );
}
