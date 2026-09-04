'use client';

import React from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  PhoneOff,
  Layers
} from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';

interface ChitiConnectDockProps {
  isMuted: boolean;
  onToggleMute: () => void;
  isSpeakerOn: boolean;
  onToggleSpeaker: () => void;
  activeMode: 'voice' | 'video';
  onToggleMode: () => void;
  showDrawer?: boolean;
  onToggleDrawer?: () => void;
  onEndCall: () => void;
  endCallLabel?: string;
  isEnded?: boolean;
}

export default function ChitiConnectDock({
  isMuted,
  onToggleMute,
  isSpeakerOn,
  onToggleSpeaker,
  activeMode,
  onToggleMode,
  showDrawer,
  onToggleDrawer,
  onEndCall,
  endCallLabel = 'कॉल समाप्त करें',
  isEnded = false
}: ChitiConnectDockProps) {
  if (isEnded) return null;

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-3xl bg-[#0F121E]/90 backdrop-blur-xl border border-white/10 shadow-2xl z-20 max-w-fit mx-auto transition-all">
      {/* Microphone Mute/Unmute */}
      <button
        onClick={() => {
          chitiSensory.playTick();
          onToggleMute();
        }}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
          isMuted
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
            : 'bg-white/10 text-white hover:bg-white/15'
        }`}
        title={isMuted ? 'माइक चालू करें (Unmute)' : 'माइक बंद करें (Mute)'}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Speaker Toggle */}
      <button
        onClick={() => {
          chitiSensory.playTick();
          onToggleSpeaker();
        }}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
          !isSpeakerOn
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
            : 'bg-white/10 text-white hover:bg-white/15'
        }`}
        title={isSpeakerOn ? 'ध्वनि म्यूट करें' : 'ध्वनि चालू करें'}
        aria-label={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
      >
        {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>

      {/* Voice / Video Toggle */}
      <button
        onClick={() => {
          chitiSensory.playTick();
          onToggleMode();
        }}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
          activeMode === 'video'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500'
            : 'bg-white/10 text-white hover:bg-white/15'
        }`}
        title={activeMode === 'video' ? 'ऑडियो मोड पर जाएँ' : 'वीडियो दर्शन शुरू करें'}
        aria-label={activeMode === 'video' ? 'Switch to audio mode' : 'Switch to video mode'}
      >
        {activeMode === 'video' ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      {/* Optional Folio / Drawer Toggle for Scholar */}
      {onToggleDrawer && (
        <button
          onClick={() => {
            chitiSensory.playTick();
            onToggleDrawer();
          }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
            showDrawer
              ? 'bg-[#8E6F1D] text-white shadow-md'
              : 'bg-white/10 text-white hover:bg-white/15'
          }`}
          title="परामर्श फ़ोलियो / नोट्स खोलें"
          aria-label="Toggle folio drawer"
        >
          <Layers className="w-5 h-5 text-amber-400" />
        </button>
      )}

      {/* End Call / Cancel Button */}
      <button
        onClick={() => {
          chitiSensory.playTick();
          onEndCall();
        }}
        className="px-5 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-rose-600/40 transition-all cursor-pointer"
        title={endCallLabel}
        aria-label={endCallLabel}
      >
        <PhoneOff className="w-5 h-5" />
        <span className="hidden sm:inline">{endCallLabel}</span>
      </button>
    </div>
  );
}
