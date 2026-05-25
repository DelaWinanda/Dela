import React, { useState } from 'react';
import { Settings, Info, Globe, Bot, HelpCircle } from 'lucide-react';
import { ConnectionMode, AppConfig } from '../types';

interface ConfigPanelProps {
  config: AppConfig;
  onChangeConfig: (newConfig: Partial<AppConfig>) => void;
  onSendTestTelegram: () => Promise<void>;
  onTestPing: () => Promise<void>;
  isTestingTelegram: boolean;
  isTestingPing: boolean;
}

export default function ConfigPanel({
  config,
  onChangeConfig,
  onSendTestTelegram,
  onTestPing,
  isTestingTelegram,
  isTestingPing
}: ConfigPanelProps) {
  const [showNetworkInfo, setShowNetworkInfo] = useState(false);

  const modeTips = {
    simulation: 'Mode Simulasi Mandiri. Mengizinkan pengujian langsung di AI Studio preview tanpa perangkat fisik. Data sensor dihasilkan otomatis.',
    cloud_sync: 'Rekomendasi Utama! ESP32 Anda mengirim data ke server ini via HTTP POST, dan mengambil state relay via HTTP GET. Bekerja tanpa port-forwarding!',
    telegram: 'State relay dikirim via Telegram Bot API proxy. Sangat fungsional jika Anda juga menggunakan bot Telegram untuk kontrol manual.',
    direct: 'Dashboard langsung mengirim Command HTTP ke IP router lokal ESP32 Anda (misal: http://192.168.1.50). Bagus untuk delay 0ms.'
  };

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
            <p className="text-[10px] font-mono text-[#141414]/60">Pilih perutean pengiriman perintah</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-white border-2 border-[#141414] p-1.5 grid grid-cols-2 gap-1.5 mb-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          {(['simulation', 'cloud_sync', 'telegram', 'direct'] as ConnectionMode[]).map((m) => (
            <button
              key={m}
              id={`config-mode-tab-${m}`}
              onClick={() => onChangeConfig({ mode: m })}
              className={`py-2 text-[10px] sm:text-[11px] font-bold uppercase font-mono transition duration-200 border-2 ${
                config.mode === m
                  ? 'bg-[#141414] text-white border-[#141414]'
                  : 'text-[#141414] hover:text-[#141414]/80 bg-white border-transparent'
              }`}
            >
              {m === 'simulation' && 'Simulasi'}
              {m === 'cloud_sync' && 'Cloud REST'}
              {m === 'telegram' && 'Telegram'}
              {m === 'direct' && 'Direct IP'}
            </button>
          ))}
        </div>

        {/* Selected Mode Explanations info */}
        <div className="bg-white border-2 border-[#141414] p-3 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] mb-5 text-[11px] leading-relaxed">
          <div className="flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-[#141414] mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-display font-bold uppercase tracking-wider block mb-1 text-xs">Penjelasan Mode</span>
              <p className="text-[#141414]/80">{modeTips[config.mode]}</p>
            </div>
          </div>
        </div>

        {/* Form Inputs based on Mode */}
        <div className="space-y-4">
          {/* 1. Direct IP Configs */}
          {(config.mode === 'direct' || config.mode === 'cloud_sync') && (
            <div className="bg-white border-2 border-[#141414] p-4 space-y-3.5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <span className="text-[10px] uppercase font-mono text-[#141414] font-bold block border-b-2 border-[#141414] pb-2 flex items-center space-x-1.5">
                <Globe className="w-4 h-4" />
                <span>Konfigurasi Jaringan & IP</span>
              </span>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#141414]/70 mb-1.5 font-mono">
                  Direct IP / Endpoint Host ESP32:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.directIp}
                    onChange={(e) => onChangeConfig({ directIp: e.target.value })}
                    placeholder="Contoh: http://192.168.1.50 atau https://tunnel-ku.loca.lt"
                    className="flex-1 bg-[#F0EFEC]/40 border-2 border-[#141414] px-3 py-2 text-xs text-[#141414] placeholder-[#141414]/40 focus:outline-none"
                  />
                  {config.mode === 'direct' && (
                    <button
                      type="button"
                      id="btn-test-ping"
                      onClick={onTestPing}
                      disabled={isTestingPing || !config.directIp}
                      className="px-3.5 py-2 bg-white hover:bg-[#F0EFEC] text-[#141414] border-2 border-[#141414] text-xs font-bold font-mono uppercase shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-transform active:translate-y-0.5 disabled:opacity-50"
                    >
                      {isTestingPing ? 'Ping...' : 'Ping'}
                    </button>
                  )}
                </div>
              </div>

              {config.mode === 'cloud_sync' && (
                <div className="text-[11px] text-[#141414] bg-[#F0EFEC] border-2 border-[#141414] p-3 space-y-2 font-mono">
                  <span className="text-[#141414] font-sans font-bold uppercase tracking-wider text-[10px] block">🔗 LINK WEB HOOK REST API ANDA</span>
                  <div className="bg-white p-2 border border-[#141414] text-[10px] text-[#141414] select-all overflow-x-auto whitespace-nowrap mt-1">
                    {window.location.origin}/api/sensor-data
                  </div>
                  <p className="text-[10px] text-[#141414]/70 leading-relaxed font-sans mt-1">
                    ESP32 dapat melakukan HTTP POST data sensor menuju link di atas untuk update grafik secara global.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. Telegram Bot Configuration */}
          {(config.mode === 'telegram') && (
            <div className="bg-white border-2 border-[#141414] p-4 space-y-3.5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <span className="text-[10px] uppercase font-mono text-[#141414] font-bold block border-b-2 border-[#141414] pb-2 flex items-center space-x-1.5">
                <Bot className="w-4 h-4" />
                <span>Akun Bot Telegram</span>
              </span>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#141414]/70 mb-1.5 font-mono">
                  BOT Token:
                </label>
                <input
                  type="text"
                  value={config.telegramToken}
                  onChange={(e) => onChangeConfig({ telegramToken: e.target.value })}
                  placeholder="8611614379:AAESo7Y4Fh...dst"
                  className="w-full bg-[#F0EFEC]/40 border-2 border-[#141414] px-3 py-2 text-xs text-[#141414] placeholder-[#141414]/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#141414]/70 mb-1.5 font-mono">
                  Chat ID Penerima:
                </label>
                <input
                  type="text"
                  value={config.telegramChatId}
                  onChange={(e) => onChangeConfig({ telegramChatId: e.target.value })}
                  placeholder="1300283513"
                  className="w-full bg-[#F0EFEC]/40 border-2 border-[#141414] px-3 py-2 text-xs text-[#141414] placeholder-[#141414]/40 focus:outline-none"
                />
              </div>

              <button
                type="button"
                id="btn-test-telegram"
                onClick={onSendTestTelegram}
                disabled={isTestingTelegram || !config.telegramToken || !config.telegramChatId}
                className="w-full py-2.5 bg-[#141414] hover:bg-neutral-800 text-white border-2 border-[#141414] text-[11px] font-bold uppercase tracking-wider transition-transform active:translate-y-0.5 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(20,20,20,0.15)]"
              >
                <span>{isTestingTelegram ? 'Mengirim Test...' : '📬 Kirim Test Telegram Message'}</span>
              </button>
            </div>
          )}
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
              🔒 <strong className="font-display uppercase tracking-tight">CORS & HTTPS Security:</strong> Browser secara bawaan memotong request HTTP ke local IP (192.168.x.x) jika diakses melalui cloud HTTPS.
            </p>
            <p>
              ✅ <strong className="text-emerald-700 font-bold uppercase tracking-tight">Solusi 1 (Terbaik):</strong> Jalankan aplikasi ini secara lokal di komputer Anda menggunakan perintah <code className="bg-[#F0EFEC] px-1 py-0.5 border border-[#141414] rounded">npm run dev</code>. Akses via <code className="font-bold">http://localhost:3000</code>. Hambatan keamanan CORS/HTTPS akan hilang sepenuhnya!
            </p>
            <p>
              ✅ <strong className="text-emerald-700 font-bold uppercase tracking-tight">Solusi 2 (Tunnel):</strong> Gunakan Ngrok atau LocalTunnel untuk mengekspos port serial ESP32 secara eksternal melingkupi koneksi HTTPS.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
