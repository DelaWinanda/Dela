import React from 'react';
import { Power, Play, Square, Zap } from 'lucide-react';
import { RelayState, ConnectionMode } from '../types';

interface RelayControlsProps {
  relays: RelayState[];
  variMode: number;
  connectionMode: ConnectionMode;
  onToggleRelay: (index: number) => void;
  onAllRelays: (state: boolean) => void;
  onSetVariMode: (mode: number) => void;
  isLoading: boolean;
}

export default function RelayControls({
  relays,
  variMode,
  connectionMode,
  onToggleRelay,
  onAllRelays,
  onSetVariMode,
  isLoading
}: RelayControlsProps) {
  return (
    <div className="bg-[#F0EFEC] border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col h-full text-[#141414]">
      {/* Header section */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[#141414]/15">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#141414] text-[#E4E3E0] border border-[#141414]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider font-display">
              Relay Control Center
            </h2>
            <p className="text-[10px] font-mono text-[#141414]/60">
              Active-LOW (LOW = ON, HIGH = OFF)
            </p>
          </div>
        </div>

        {/* Connection status badge */}
        <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase border-2 border-[#141414] bg-white shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
          {connectionMode.replace('_', ' ')}
        </span>
      </div>

      {/* Relays Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {relays.map((relay, idx) => (
          <button
            key={relay.id}
            id={`relay-btn-${relay.id}`}
            onClick={() => !isLoading && onToggleRelay(idx)}
            disabled={isLoading}
            className={`transition-all duration-200 relative p-4 text-left border-2 border-[#141414] flex flex-col justify-between h-28 focus:outline-none focus:ring-2 focus:ring-[#141414] ${
              relay.state
                ? 'bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] font-medium text-[#141414]'
                : 'bg-[#E4E3E0]/50 hover:bg-[#E4E3E0] text-[#141414]/70'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`p-1.5 border border-[#141414] ${
                relay.state ? 'bg-[#141414] text-white' : 'bg-white text-[#141414]'
              }`}>
                <Power className="w-4 h-4" />
              </span>
              <span className={`text-[9px] font-mono px-2 py-0.5 border border-[#141414] uppercase font-bold ${
                relay.state ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}>
                {relay.state ? 'LOW' : 'HIGH'}
              </span>
            </div>

            <div className="mt-2">
              <div className="font-display font-bold text-xs uppercase tracking-tight">{relay.name}</div>
              <div className="text-[9px] font-mono text-[#141414]/60">GPIO {relay.pin}</div>
            </div>

            {/* Solid neobrutalist power state indicator dot */}
            <div className={`absolute bottom-4 right-4 w-3.5 h-3.5 rounded-full border-2 border-[#141414] ${
              relay.state ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'
            }`}></div>
          </button>
        ))}
      </div>

      {/* Manual Master Triggers */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          id="btn-all-on"
          onClick={() => !isLoading && onAllRelays(true)}
          disabled={isLoading}
          className="py-3 border-2 border-[#141414] bg-white hover:bg-[#F0EFEC] text-[#141414] text-[11px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-transform active:translate-y-0.5"
        >
          Semua ON
        </button>
        <button
          id="btn-all-off"
          onClick={() => !isLoading && onAllRelays(false)}
          disabled={isLoading}
          className="py-3 border-2 border-[#141414] bg-[#141414] hover:bg-[#141414]/90 text-white text-[11px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] transition-transform active:translate-y-0.5"
        >
          Semua OFF
        </button>
      </div>

      {/* Sequence Animation Mode / Variasi Mode */}
      <div className="mt-auto border-t-2 border-[#141414]/15 pt-5">
        <h3 className="text-[10px] font-bold uppercase tracking-wider mb-4 font-mono text-[#141414]/60">
          ⚙️ VARIATION MODES
        </h3>

        <div className="flex flex-col space-y-2">
          {/* Variasi 1 */}
          <button
            id="btn-vari-1"
            onClick={() => !isLoading && onSetVariMode(1)}
            disabled={isLoading}
            className={`flex items-center justify-between p-3 border-2 border-[#141414] text-[11px] text-left transition duration-200 ${
              variMode === 1
                ? 'bg-white shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] font-bold text-[#141414]'
                : 'bg-white/40 text-[#141414]/80 hover:bg-white/80'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Play className={`w-3.5 h-3.5 ${variMode === 1 ? 'animate-bounce' : ''}`} />
              <div className="font-display font-medium uppercase tracking-tight">
                VARIASI 1 <span className="font-mono text-[9px] text-[#141414]/60 ml-1">(1 → 2 → 3 → 4)</span>
              </div>
            </div>
            <span className="text-[9px] font-mono border border-[#141414] px-1 bg-white font-bold">{variMode === 1 ? 'RUN' : 'OFF'}</span>
          </button>

          {/* Variasi 2 */}
          <button
            id="btn-vari-2"
            onClick={() => !isLoading && onSetVariMode(2)}
            disabled={isLoading}
            className={`flex items-center justify-between p-3 border-2 border-[#141414] text-[11px] text-left transition duration-200 ${
              variMode === 2
                ? 'bg-white shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] font-bold text-[#141414]'
                : 'bg-white/40 text-[#141414]/80 hover:bg-white/80'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Play className={`w-3.5 h-3.5 ${variMode === 2 ? 'animate-bounce' : ''}`} />
              <div className="font-display font-medium uppercase tracking-tight">
                VARIASI 2 <span className="font-mono text-[9px] text-[#141414]/60 ml-1">(4 → 3 → 2 → 1)</span>
              </div>
            </div>
            <span className="text-[9px] font-mono border border-[#141414] px-1 bg-white font-bold">{variMode === 2 ? 'RUN' : 'OFF'}</span>
          </button>

          {/* Stop Button */}
          <button
            id="btn-vari-stop"
            onClick={() => !isLoading && onSetVariMode(0)}
            disabled={isLoading}
            className={`flex items-center justify-center space-x-2 p-2.5 border-2 border-[#141414] transition text-xs font-bold uppercase tracking-wide ${
              variMode !== 0
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-[#E4E3E0] text-[#141414]/40 cursor-not-allowed border-dashed'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span className="font-display">RESET ANIMASI / STANDBY</span>
          </button>
        </div>
      </div>
    </div>
  );
}
