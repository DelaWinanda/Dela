import React, { useState } from 'react';
import { Settings, Info, Globe, HelpCircle } from 'lucide-react';
import { AppConfig } from '../types';

interface ConfigPanelProps {
  config: AppConfig;
  onChangeConfig: (newConfig: Partial<AppConfig>) => void;
  onTestPing: () => Promise<void>;
  isTestingPing: boolean;
}

export default function ConfigPanel({
  config,
  onChangeConfig,
  onTestPing,
  isTestingPing
}: ConfigPanelProps) {
  const [showNetworkInfo, setShowNetworkInfo] = useState(false);

  return (
    <div className="bg-[#F0EFEC] border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col h-full justify-between text-[#141414]">
      <div>
        {/* Header Title */}
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-[#141414]/15">
          <div className="p-2 bg-[#141414] text-white">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider font-display">Pengaturan Koneksi</h2>
            <p className="text-[10px] font-mono text-[#141414]/60">Hubungkan dashboard ke hardware</p>
          </div>
        </div>

        {/* Selected Mode Explanations info */}
        <div className="bg-white border-2 border-[#141414] p-3 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] mb-5 text-[11px] leading-relaxed">
          <div className="flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-[#141414] mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-display font-bold uppercase tracking-wider block mb-1 text-xs">Informative Mode IP</span>
              <p className="text-[#141414]/80">
                Dashboard mengirim command HTTP GET & POST langsung ke IP WiFi router lokal tempat ESP32 terhubung (tanpa ada server perantara cloud lain, delay 0ms).
              </p>
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div className="bg-white border-2 border-[#141414] p-4 space-y-3.5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <span className="text-[10px] uppercase font-mono text-[#141414] font-bold block border-b-2 border-[#141414] pb-2 flex items-center space-x-1.5 align-middle">
              <Globe className="w-4 h-4" />
              <span>Konfigurasi Jaringan & IP</span>
            </span>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#141414]/70 mb-1.5 font-mono">
                Direct IP / Host Address ESP32:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.directIp}
                  onChange={(e) => onChangeConfig({ directIp: e.target.value })}
                  placeholder="Contoh: http://192.168.1.50"
                  className="flex-1 bg-[#F0EFEC]/40 border-2 border-[#141414] px-3 py-2 text-xs text-[#141414] placeholder-[#141414]/40 focus:outline-none focus:ring-1 focus:ring-[#141414]"
                />
                <button
                  type="button"
                  id="btn-test-ping"
                  onClick={onTestPing}
                  disabled={isTestingPing || !config.directIp}
                  className="px-3.5 py-2 bg-white hover:bg-[#F0EFEC] text-[#141414] border-2 border-[#141414] text-xs font-bold font-mono uppercase shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-transform active:translate-y-0.5 disabled:opacity-50"
                >
                  {isTestingPing ? 'Ping...' : 'Ping'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Info & Running Locally Guide Section */}
      <div className="mt-6 border-t-2 border-[#141414]/15 pt-4">
        <button
          type="button"
          onClick={() => setShowNetworkInfo(!showNetworkInfo)}
          className="flex items-center space-x-1 sm:space-x-2 text-[11px] text-[#141414] hover:text-[#141414]/80 font-bold uppercase font-mono select-none"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Cara Mengatasi Jaringan & CORS?</span>
        </button>

        {showNetworkInfo && (
          <div className="mt-3 text-[11px] text-[#141414] leading-relaxed bg-white border-2 border-[#141414] p-3 space-y-2 animate-fadeIn shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
            <p>
              🔒 <strong className="font-display uppercase tracking-tight">CORS & HTTPS Security:</strong> Browser secara bawaan memotong request HTTP ke local IP (192.168.x.x) jika diakses melalui cloud HTTPS (AI Studio).
            </p>
            <p>
              ✅ <strong className="text-emerald-700 font-bold uppercase tracking-tight">Solusi Terbaik (Sangat Direkomendasikan):</strong> Jalankan aplikasi ini secara lokal di komputer Anda menggunakan perintah <code className="bg-[#F0EFEC] px-1 py-0.5 border border-[#141414] rounded">npm run dev</code> di terminal project. Akses via <code className="font-bold">http://localhost:3000</code>. Keamanan CORS/HTTPS akan hilang sepenuhnya dan kontrol IP lokal berfungsi langsung!
            </p>
            <p>
              ✅ <strong className="text-emerald-700 font-bold uppercase tracking-tight">Solusi Tunnel:</strong> Gunakan Ngrok atau LocalTunnel untuk mengekspos port serial / router ESP32 secara eksternal agar bisa diakses lewat link HTTPS.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
