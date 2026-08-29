'use client';

import React from 'react';
import { MessageCircle, ExternalLink, Copy, Check } from 'lucide-react';

interface WhatsAppDeliveryCardProps {
  consultationId: string;
  customerName: string;
  customerPhone: string;
  deliveryText: string;
  whatsappLink?: string;
  status?: 'DELIVERED' | 'DELIVERY_FAILED' | 'PENDING';
  onCopy?: () => void;
}

export default function WhatsAppDeliveryCard({
  consultationId,
  customerName,
  customerPhone,
  deliveryText,
  whatsappLink,
  status = 'DELIVERED',
  onCopy,
}: WhatsAppDeliveryCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(deliveryText);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 1800);
  };

  const handleOpenWhatsApp = () => {
    if (whatsappLink) {
      window.open(whatsappLink, '_blank');
    }
  };

  const isDelivered = status === 'DELIVERED';

  return (
    <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#FAF7F2] dark:bg-[#0A0C12] p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white">
          <MessageCircle className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold text-[#1C1917] dark:text-[#EFECE6]">Delivered on WhatsApp</div>
          <div className="text-xs text-[#857E74] dark:text-[#8E8A82]">Consultation #{consultationId.slice(0, 8)}</div>
        </div>
        <div className={`ml-auto px-3 py-1 text-xs font-mono rounded-full ${isDelivered ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {status}
        </div>
      </div>

      <div className="text-sm text-[#57524A] dark:text-[#AAA49A] mb-4 leading-relaxed line-clamp-3">
        {deliveryText.split('\n').slice(0, 4).join(' ')}...
      </div>

      <div className="flex flex-wrap gap-2">
        {whatsappLink && (
          <button
            onClick={handleOpenWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#128C7E] px-4 py-3 text-sm font-semibold text-white transition-all active:scale-[0.985]"
          >
            <MessageCircle className="w-4 h-4" /> Open in WhatsApp
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 px-5 py-3 text-sm font-medium text-[#8E6F1D] dark:text-[#D4AF37] transition-all"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy Message'}
        </button>
      </div>

      <div className="mt-3 text-[10px] text-center text-[#857E74]">
        Sent to {customerPhone} • {customerName}
      </div>
    </div>
  );
}
