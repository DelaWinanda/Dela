import React, { useState, useEffect } from 'react';
import { Cpu, Radio } from 'lucide-react';
import RelayControls from './components/RelayControls';
import SensorGauges from './components/SensorGauges';
import LiveChart from './components/LiveChart';
import VoiceAssistant from './components/VoiceAssistant';
import ConfigPanel from './components/ConfigPanel';
import FirmwareGuide from './components/FirmwareGuide';
import { RelayState, SensorData, AppConfig } from './types';

export default function App() {
  // 1. Config management
  const [config, setConfig] = useState<AppConfig>({
    mode: 'simulation',
    directIp: 'http://192.168.1.50',
    telegramToken: '8611614379:AAESo7Y4Fh1_V27YYqh-yCfLT19sB8ztkkI',
    telegramChatId: '1300283513',
    autoRefreshInterval: 3000,
    useVoiceSynth: true
  });

  // 2. Hardware States
  const [relays, setRelays] = useState<RelayState[]>([
    { id: 1, name: 'Relay 1', pin: 23, state: false },
    { id: 2, name: 'Relay 2', pin: 19, state: false },
    { id: 3, name: 'Relay 3', pin: 18, state: false },
    { id: 4, name: 'Relay 4', pin: 5, state: false }
  ]);
  const [variMode, setVariMode] = useState<number>(0);
  const [latestSensor, setLatestSensor] = useState<SensorData>({
    temperature: 27.5,
    humidity: 62.1,
    heatIndex: 28.2,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour12: false })
  });
  const [history, setHistory] = useState<SensorData[]>([]);

  // 3. UI and loader state triggers
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('online');

  // Custom alert state for neobrutalist non-blocking dialogues
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const triggerNotification = (text: string, type: 'success' | 'error') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Load initial simulated data into history
  useEffect(() => {
    const initialHistory: SensorData[] = [];
    const now = new Date();
    for (let i = 15; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 60000).toLocaleTimeString('id-ID', { hour12: false });
      const temp = 26.5 + Math.sin(i / 2) * 1.5 + Math.random() * 0.2;
      const humi = 61.2 + Math.cos(i / 3) * 3 + Math.random() * 0.4;
      const hi = temp + 0.5 * (temp + 61.0 + ((temp - 68.0) * 1.2) + (humi * 0.094));
      
      initialHistory.push({
        temperature: parseFloat(temp.toFixed(1)),
        humidity: parseFloat(humi.toFixed(1)),
        heatIndex: parseFloat(hi.toFixed(1)),
        timestamp: timeStr
      });
    }
    setHistory(initialHistory);
  }, []);

  // 4. Polling effect: Pull state updates from backend when NOT in local simulation
  useEffect(() => {
    if (config.mode === 'simulation') {
      setConnectionStatus('online');
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/status');
        if (response.ok) {
          const data = await response.json();
          
          if (config.mode === 'cloud_sync') {
            setRelays(prev => prev.map((r, i) => ({ ...r, state: data.relays[i] })));
            setVariMode(data.variMode);
          }
          
          if (data.latestSensor) {
            setLatestSensor(data.latestSensor);
          }
          if (data.history && data.history.length > 0) {
            setHistory(data.history);
          }
          setConnectionStatus('online');
        } else {
          setConnectionStatus('offline');
        }
      } catch (err) {
        setConnectionStatus('offline');
      }
    }, config.autoRefreshInterval);

    return () => clearInterval(interval);
  }, [config.mode, config.autoRefreshInterval]);

  // 5. Local simulation generator (only active in 'simulation' mode)
  useEffect(() => {
    if (config.mode !== 'simulation') return;

    const interval = setInterval(() => {
      setLatestSensor(prev => {
        const deltaTemp = (Math.random() - 0.5) * 0.4;
        const deltaHumi = (Math.random() - 0.5) * 0.8;
        
        let newTemp = Math.max(16, Math.min(42, prev.temperature + deltaTemp));
        let newHumi = Math.max(30, Math.min(95, prev.humidity + deltaHumi));
        const hi = newTemp + 0.5 * (newTemp + 61.0 + ((newTemp - 68.0) * 1.2) + (newHumi * 0.094));

        const newReading = {
          temperature: parseFloat(newTemp.toFixed(1)),
          humidity: parseFloat(newHumi.toFixed(1)),
          heatIndex: parseFloat(hi.toFixed(1)),
          timestamp: new Date().toLocaleTimeString('id-ID', { hour12: false })
        };

        setHistory(hist => {
          const nextHist = [...hist, newReading];
          if (nextHist.length > 30) nextHist.shift();
          return nextHist;
        });

        return newReading;
      });

      // Simulate step variMode sequence on relays (only if active in simulation)
      if (variMode > 0) {
        setRelays(prev => {
          const activeIdx = prev.findIndex(r => r.state === true);
          let nextIdx = 0;
          
          if (variMode === 1) {
            nextIdx = (activeIdx + 1) % 4;
          } else {
            nextIdx = activeIdx === -1 || activeIdx === 0 ? 3 : activeIdx - 1;
          }

          return prev.map((r, i) => ({
            ...r,
            state: i === nextIdx
          }));
        });
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [config.mode, variMode]);

  // Relay click toggle trigger
  const handleToggleRelay = async (index: number) => {
    const targetRelay = relays[index];
    const newState = !targetRelay.state;
    
    setRelays(prev => prev.map((r, i) => i === index ? { ...r, state: newState } : r));
    setVariMode(0);

    if (config.mode === 'simulation') return;

    setIsLoading(true);
    try {
      if (config.mode === 'cloud_sync') {
        const response = await fetch('/api/relay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: index, state: newState })
        });
        if (!response.ok) throw new Error('REST API post update failed');
      } 
      else if (config.mode === 'telegram') {
        const commandStr = `/relay${index + 1}_${newState ? 'on' : 'off'}`;
        await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: config.telegramToken,
            chatId: config.telegramChatId,
            message: commandStr
          })
        });
      }
      else if (config.mode === 'direct') {
        const directUrl = `${config.directIp}/toggle?id=${index}&state=${newState ? '1' : '0'}`;
        await fetch('/api/proxy/direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: directUrl })
        });
      }
    } catch (e) {
      console.error('Failed toggling relay', e);
      setRelays(prev => prev.map((r, i) => i === index ? { ...r, state: !newState } : r));
    } finally {
      setIsLoading(false);
    }
  };

  // Master all toggles
  const handleAllRelays = async (state: boolean) => {
    setRelays(prev => prev.map(r => ({ ...r, state })));
    setVariMode(0);

    if (config.mode === 'simulation') return;

    setIsLoading(true);
    try {
      if (config.mode === 'cloud_sync') {
        const response = await fetch('/api/relay/all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state })
        });
        if (!response.ok) throw new Error('REST API master toggles failed');
      } 
      else if (config.mode === 'telegram') {
        const commandStr = state ? '/all_on' : '/all_off';
        await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: config.telegramToken,
            chatId: config.telegramChatId,
            message: commandStr
          })
        });
      }
      else if (config.mode === 'direct') {
        const actionIdx = state ? '1' : '0';
        for (let idx = 0; idx < 4; idx++) {
          const directUrl = `${config.directIp}/toggle?id=${idx}&state=${actionIdx}`;
          await fetch('/api/proxy/direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: directUrl })
          });
        }
      }
    } catch (e) {
      console.error('Failed setting master relays', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger sequence mode
  const handleSetVariMode = async (mode: number) => {
    setVariMode(mode);
    if (mode > 0) {
      setRelays(prev => prev.map((r, i) => ({ ...r, state: i === 0 })));
    } else {
      setRelays(prev => prev.map(r => ({ ...r, state: false })));
    }

    if (config.mode === 'simulation') return;

    setIsLoading(true);
    try {
      if (config.mode === 'cloud_sync') {
        await fetch('/api/relay/variMode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode })
        });
      } 
      else if (config.mode === 'telegram') {
        const cmdStr = mode === 0 ? '/vari_stop' : (mode === 1 ? '/vari1' : '/vari2');
        await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: config.telegramToken,
            chatId: config.telegramChatId,
            message: cmdStr
          })
        });
      }
      else if (config.mode === 'direct') {
        const directUrl = `${config.directIp}/variasi?mode=${mode}`;
        await fetch('/api/proxy/direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: directUrl })
        });
      }
    } catch (e) {
      console.error('Failed setting variation mode', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Tester utilities
  const handleSendTestTelegram = async () => {
    setIsTestingTelegram(true);
    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: config.telegramToken,
          chatId: config.telegramChatId,
          message: '🚀 *Pesan Tes dari Web Dashboard*\n\nKonektivitas Telegram Bot Anda sukses terintegrasi! Web interface siap mengontrol IoT Relay Anda.'
        })
      });
      if (!response.ok) {
        throw new Error('Telegram bot communication failed.');
      }
      triggerNotification('Koneksi Telegram Sukses! Periksa chat bot Telegram Anda.', 'success');
    } catch (err: any) {
      triggerNotification(`Gagal Tes Telegram: ${err.message || err}`, 'error');
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleTestPing = async () => {
    setIsTestingPing(true);
    try {
      const response = await fetch('/api/proxy/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: config.directIp })
      });
      const data = await response.json();
      if (data.success) {
        triggerNotification(`Ping Sukses! ESP32 merespon: ${JSON.stringify(data.data)}`, 'success');
      } else {
        throw new Error(data.error || 'Server unreachable');
      }
    } catch (err: any) {
      triggerNotification(`Ping Gagal: Perangkat gagal dijangkau.\nDetail: ${err.message || err}`, 'error');
    } finally {
      setIsTestingPing(false);
    }
  };

  // Reset Chart Data
  const handleClearHistory = () => {
    setHistory([]);
    triggerNotification('Status grafik history berhasil dikosongkan.', 'success');
  };

  // Change individual configs
  const handleUpdateConfig = (newConfig: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // ==========================================
  //  VOICE COMMAND HANDLER (NLP)
  // ==========================================
  const handleVoiceCommand = (commandText: string): string => {
    const rawClean = commandText.toLowerCase().trim();
    
    const matches = (...keywords: string[]) => {
      return keywords.some(kw => rawClean.includes(kw));
    };

    if (matches('bantuan', 'bantu', 'help', 'fitur', 'daftar perintah')) {
      return 'Daftar Perintah: Katakan "Nyalakan Relay satu", "Matikan Relay dua", "Nyalakan Semua", "Matikan Semua", "Mulai Variasi satu", "Hentikan", atau "Baca Sensor".';
    }

    if (matches('nyalakan relay 1', 'hidupkan relay 1', 'relay 1 hidup', 'relay 1 nyala', 'relay satu nyala', 'relay satu on')) {
      handleToggleRelay(0);
      return 'Menjalankan perintah: Menyalakan Relay 1.';
    }
    if (matches('matikan relay 1', 'matikan relay satu', 'relay 1 mati', 'relay 1 off', 'relay satu off')) {
      handleToggleRelay(0);
      return 'Menjalankan perintah: Mematikan Relay 1.';
    }

    if (matches('nyalakan relay 2', 'hidupkan relay 2', 'relay 2 hidup', 'relay 2 nyala', 'relay dua nyala', 'relay dua on')) {
      handleToggleRelay(1);
      return 'Menjalankan perintah: Menyalakan Relay 2.';
    }
    if (matches('matikan relay 2', 'matikan relay dua', 'relay 2 mati', 'relay 2 off', 'relay dua off')) {
      handleToggleRelay(1);
      return 'Menjalankan perintah: Mematikan Relay 2.';
    }

    if (matches('nyalakan relay 3', 'hidupkan relay 3', 'relay 3 hidup', 'relay 3 nyala', 'relay tiga nyala', 'relay tiga on')) {
      handleToggleRelay(2);
      return 'Menjalankan perintah: Menyalakan Relay 3.';
    }
    if (matches('matikan relay 3', 'matikan relay tiga', 'relay 3 mati', 'relay 3 off', 'relay tiga off')) {
      handleToggleRelay(2);
      return 'Menjalankan perintah: Mematikan Relay 3.';
    }

    if (matches('nyalakan relay 4', 'hidupkan relay 4', 'relay 4 hidup', 'relay 4 nyala', 'relay empat nyala', 'relay empat on')) {
      handleToggleRelay(3);
      return 'Menjalankan perintah: Menyalakan Relay 4.';
    }
    if (matches('matikan relay 4', 'matikan relay empat', 'relay 4 mati', 'relay 4 off', 'relay empat off')) {
      handleToggleRelay(3);
      return 'Menjalankan perintah: Mematikan Relay 4.';
    }

    if (matches('nyalakan semua', 'hidupkan semua', 'nyala semua', 'all on', 'turn on all')) {
      handleAllRelays(true);
      return 'Menjalankan perintah: Menyalakan seluruh relay.';
    }
    if (matches('matikan semua', 'mati semua', 'all off', 'turn off all')) {
      handleAllRelays(false);
      return 'Menjalankan perintah: Mematikan seluruh relay.';
    }

    if (matches('variasi 1', 'variasi satu', 'mulai variasi 1', 'jalankan variasi 1')) {
      handleSetVariMode(1);
      return 'Menjalankan perintah: Memulai mode variasi satu, relay berjalan serentak bergantian.';
    }
    if (matches('variasi 2', 'variasi dua', 'mulai variasi 2', 'jalankan variasi 2')) {
      handleSetVariMode(2);
      return 'Menjalankan perintah: Memulai mode variasi dua, relay berjalan mundur bergantian.';
    }
    if (matches('hentikan variasi', 'stop variasi', 'hentikan musik', 'mati variasi', 'stop', 'hentikan')) {
      handleSetVariMode(0);
      return 'Menjalankan perintah: Menghentikan seluruh mode variasi relay.';
    }

    if (matches('baca dht', 'baca sensor', 'suhu kelembapan', 'cek status dht', 'status dht', 'suhu berapa', 'baca dht11')) {
      return `Hasil Sensor DHT11: Suhu saat ini adalah ${latestSensor.temperature.toFixed(1)} derajat Celcius, dengan tingkat kelembapan udara mencapai ${latestSensor.humidity.toFixed(1)} persen. Tingkat kenyamanan termal berada pada kategori ${latestSensor.heatIndex < 27 ? 'Sangat Aman' : 'Waspada Hangat'}.`;
    }

    return '';
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col font-sans transition-colors duration-200">
      
      {/* Dynamic Header */}
      <header className="border-b-4 border-[#141414] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-[#141414] text-white border-2 border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,0.15)] flex-shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider font-display text-[#141414]">
                IoT Relay Control & DHT11 Monitor
              </h1>
              <p className="text-[10px] text-[#141414]/60 font-mono uppercase font-bold">
                PRO-SERIES ESP32 & ESP8266 TRANSMITTER CONTROL
              </p>
            </div>
          </div>

          {/* Connection Mode Badges & Ping states */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white border-2 border-[#141414] px-3 py-1.5 text-xs font-mono font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] uppercase">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              <span>MODE:</span>
              <span className="text-[#141414]">{config.mode.replace('_', ' ')}</span>
            </div>

            <div className={`flex items-center space-x-2 border-2 border-[#141414] px-3 py-1.5 text-xs font-mono font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] ${
              connectionStatus === 'online' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-rose-500 text-white'
            }`}>
              <span className="font-bold">{connectionStatus === 'online' ? 'LIVE' : 'MOCK'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Real-time Custom Dialog notification overlay */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn select-none max-w-sm">
          <div className={`border-2 border-[#141414] p-4 font-mono font-bold text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] ${
            notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
            <p className="font-display font-medium text-xs leading-normal">{notification.text}</p>
          </div>
        </div>
      )}

      {/* Main Container Bento Grid layouts */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col space-y-6">
        
        {/* Row 1: Controller, Gauges & Voice Assistant */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Primary Switches */}
          <section className="lg:col-span-1 h-full">
            <RelayControls
              relays={relays}
              variMode={variMode}
              connectionMode={config.mode}
              onToggleRelay={handleToggleRelay}
              onAllRelays={handleAllRelays}
              onSetVariMode={handleSetVariMode}
              isLoading={isLoading}
            />
          </section>

          {/* Col 2: Ambient gauges */}
          <section className="lg:col-span-1 h-full">
            <SensorGauges
              temperature={latestSensor.temperature}
              humidity={latestSensor.humidity}
              heatIndex={latestSensor.heatIndex}
            />
          </section>

          {/* Col 3: Voice NLP Console */}
          <section className="lg:col-span-1 h-full">
            <VoiceAssistant
              onCommand={handleVoiceCommand}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
            />
          </section>
        </div>

        {/* Row 2: Charts Area & Configuration drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recharts real time statistics */}
          <section className="lg:col-span-2 h-full">
            <LiveChart 
              data={history}
              onClearHistory={handleClearHistory}
            />
          </section>

          {/* Configurations forms */}
          <section className="lg:col-span-1 h-full">
            <ConfigPanel
              config={config}
              onChangeConfig={handleUpdateConfig}
              onSendTestTelegram={handleSendTestTelegram}
              onTestPing={handleTestPing}
              isTestingTelegram={isTestingTelegram}
              isTestingPing={isTestingPing}
            />
          </section>
        </div>

        {/* Row 3: Arduino Firmware Instructions Code documentation */}
        <section id="firmware-guide-block" className="w-full">
          <FirmwareGuide />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-[#141414] bg-white py-6 text-xs text-[#141414]/70 font-mono font-bold uppercase select-none mt-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-1 tracking-tight">
            <span>🔌 IoT Control Handshakes & Voice Commands</span>
            <span>• Built for ESP32 & ESP8266</span>
          </div>
          <div className="flex items-center space-x-1 text-[10px] tracking-tight">
            <span>Device Polling Interval: 3000ms</span>
            <span>•</span>
            <span className="text-emerald-600">Localhost CORS enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
