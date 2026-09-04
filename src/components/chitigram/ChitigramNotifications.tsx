'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, Phone, MessageSquare } from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';

export interface ChitigramNotificationsProps {
  userId: string;
  onNavigate?: (conversationId: string, link: string) => void;
  className?: string;
}

export default function ChitigramNotifications({ userId, onNavigate, className = '' }: ChitigramNotificationsProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/chitigram/notifications?userId=${encodeURIComponent(userId)}&unreadOnly=false`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: any) => !n.read).length);
      }
    } catch {}
  }, [userId]);

  useEffect(() => {
    void fetchNotifications();
    const iv = setInterval(() => void fetchNotifications(), 5000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  const markRead = async (notificationId: string) => {
    try {
      await fetch('/api/chitigram/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_READ', notificationId, userId }),
      });
      setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
      chitiSensory.playTick();
    } catch {}
  };

  return (
    <div className={`relative ${className}`} data-testid="chitigram-notifications">
      <button
        onClick={() => {
          chitiSensory.playTick();
          setOpen(v => !v);
        }}
        className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 max-h-[420px] rounded-2xl bg-[#0D101C] border border-[#D4AF37]/20 shadow-2xl overflow-hidden z-50 flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-[#D4AF37]" /> Notifications
              {unreadCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">{unreadCount} new</span>}
            </span>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-white/40">No notifications yet — incoming messages/calls will appear here.</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex gap-3 hover:bg-white/5 cursor-pointer ${!n.read ? 'bg-[#D4AF37]/5' : ''}`}
                  onClick={() => {
                    void markRead(n.id);
                    if (n.link && onNavigate) onNavigate(n.conversationId, n.link);
                    else if (n.link) window.location.href = n.link;
                    chitiSensory.playTick();
                  }}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'CALL' ? 'bg-violet-500/20 text-violet-400' : 'bg-sky-500/20 text-sky-400'}`}>
                    {n.type === 'CALL' ? <Phone className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{n.title}</div>
                    {n.body && <div className="text-[11px] text-white/50 truncate">{n.body}</div>}
                    <div className="text-[10px] text-white/30 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  {!n.read && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        void markRead(n.id);
                      }}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center shrink-0 cursor-pointer"
                      title="Mark read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-3 py-2 bg-black/20 border-t border-white/5 text-[10px] text-white/30 text-center">Architected for Web Push/PWA • Minimal safe info only</div>
        </div>
      )}
    </div>
  );
}
