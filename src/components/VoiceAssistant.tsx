import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Keyboard, HelpCircle, Terminal } from 'lucide-react';

interface VoiceAssistantProps {
  onCommand: (commandText: string) => string; // returns matched/action explanation to speak
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function VoiceAssistant({ onCommand, isMuted, onToggleMute }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responseLog, setResponseLog] = useState<Array<{ text: string; type: 'user' | 'bot' | 'err'; time: string }>>([
    { text: 'Sistem pengenalan suara aktif. Siap menerima instruksi Anda.', type: 'bot', time: new Date().toLocaleTimeString('id-ID', { hour12: false }) }
  ]);
  const [typedInput, setTypedInput] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'id-ID';

      rec.onstart = () => {
        setIsListening(true);
        setTranscript('Mendengarkan suara Anda...');
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          addLog('Izin Mikrofon Ditolak. Silakan gunakan input manual.', 'err');
        } else {
          addLog(`Error mic: ${event.error}`, 'err');
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);
        handleProcessCommand(resultText);
      };

      recognitionRef.current = rec;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  const addLog = (text: string, type: 'user' | 'bot' | 'err') => {
    setResponseLog(prev => [
      ...prev,
      { text, type, time: new Date().toLocaleTimeString('id-ID', { hour12: false }) }
    ].slice(-10)); // Keep last 10
  };

  const handleProcessCommand = (text: string) => {
    addLog(`"${text}"`, 'user');
    const speechResult = onCommand(text);
    
    if (speechResult) {
      addLog(speechResult, 'bot');
      if (!isMuted) {
        speakResponse(speechResult);
      }
    } else {
      const errText = 'Perintah tidak dikenali. Coba: "Nyalakan Relay 1" atau "Bantuan".';
      addLog(errText, 'bot');
      if (!isMuted) {
        speakResponse(errText);
      }
    }
  };

  // Text-To-Speech
  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#─✏️🟢🔴🔌✅❌✨⏱⏹🌡📊💧🔥]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'id-ID';
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang.startsWith('id'));
      if (idVoice) utterance.voice = idVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startStopListening = () => {
    if (!speechSupported) {
      addLog('Fitur Audio Mic tidak di-support browser Anda. Harap ketik manual.', 'err');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        recognitionRef.current?.stop();
        setTimeout(() => recognitionRef.current?.start(), 100);
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const text = typedInput.trim();
    setTranscript(text);
    setTypedInput('');
    handleProcessCommand(text);
  };

  return (
    <div className="bg-[#F0EFEC] border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col h-full justify-between text-[#141414]">
      <div>
        {/* Header Title */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-[#141414]/15">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#141414] text-white">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider font-display">Asisten Kopilot Suara</h2>
              <p className="text-[10px] font-mono text-[#141414]/60">Web Speech & Triggers API (ID/EN)</p>
            </div>
          </div>

          <button
            onClick={onToggleMute}
            className={`p-2 border-2 border-[#141414] transition shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] ${
              isMuted ? 'bg-rose-500 text-white' : 'bg-white text-[#141414]'
            }`}
            title={isMuted ? "Aktifkan suara" : "Bisukan suara"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Listening Circle Section */}
        <div className="flex flex-col items-center justify-center py-5 bg-white border-2 border-[#141414] mb-4 select-none shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <div className="absolute w-20 h-20 bg-rose-500/20 rounded-full animate-ping"></div>
                <div className="absolute w-16 h-16 bg-rose-500/30 rounded-full animate-pulse"></div>
              </>
            )}

            <button
              id="voice-mic-trigger"
              onClick={startStopListening}
              className={`w-14 h-14 rounded-full flex items-center justify-center border-2 border-[#141414] text-white transition-all duration-300 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 ${
                isListening ? 'bg-rose-500' : 'bg-[#141414]'
              }`}
            >
              {isListening ? (
                <MicOff className="w-6 h-6 animate-pulse" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
          </div>

          <p className="mt-4 text-[10px] font-mono tracking-wider font-bold uppercase text-[#141414]">
            {isListening ? '🎙️ MENDENGARKAN... KATAKAN PERINTAH' : 'KLIK UNTUK BICARA'}
          </p>
          <p className="text-[10px] text-[#141414]/70 text-center max-w-[220px] mt-1 font-sans italic">
            {transcript || '"nyalakan semua relay"'}
          </p>
        </div>

        {/* Bot Response Terminal Console */}
        <div className="bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] p-3.5 h-40 overflow-y-auto font-mono text-[11px] flex flex-col space-y-2 select-text custom-scrollbar shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)]">
          <div className="flex items-center justify-between border-b border-[#E4E3E0]/15 pb-2 mb-2">
            <span className="flex items-center space-x-1.5 text-[9px] uppercase tracking-wider font-bold text-teal-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>TERMINAL LOGS</span>
            </span>
            <span className="text-[9px] text-white/50 tracking-widest font-bold">1300283513</span>
          </div>

          {responseLog.map((log, index) => (
            <div key={index} className={`leading-relaxed ${
              log.type === 'user' ? 'text-sky-300' :
              log.type === 'err' ? 'text-rose-400' : 'text-emerald-300'
            }`}>
              <span className="text-white/40 text-[9px] mr-1.5">[{log.time}]</span>
              <span className="font-bold">{log.type === 'user' ? '👤 USER: ' : log.type === 'err' ? '⚠️ SYSTEM: ' : '🤖 BOT: '}</span>
              {log.text}
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Command Input / Fallback */}
      <div className="mt-4">
        <form onSubmit={handleTextSubmit} className="flex space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder="Ketik instruksi di sini..."
              className="w-full bg-white border-2 border-[#141414] px-4 py-2.5 text-xs text-[#141414] placeholder-[#141414]/50 focus:outline-none focus:ring-0 transition font-sans shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
            />
            <span className="absolute right-3 top-3.5 text-[#141414]/50 pointer-events-none">
              <Keyboard className="w-3.5 h-3.5" />
            </span>
          </div>
          <button
            type="submit"
            className="px-4 bg-[#141414] border-2 border-[#141414] text-white hover:bg-neutral-800 transition text-[11px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(20,20,20,0.15)]"
          >
            Kirim
          </button>
        </form>

        {/* Small helpers list tracker */}
        <div className="mt-3 flex items-center justify-between border-t border-[#141414]/15 pt-2">
          <span className="text-[9px] text-[#141414]/60 font-mono font-bold uppercase flex items-center space-x-1 select-none">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ketik "Bantuan" untuk info perintah</span>
          </span>
          {!speechSupported && (
            <span className="text-[9px] text-amber-800 font-mono bg-amber-100 px-1.5 py-0.5 border border-amber-400 uppercase font-bold">
              MIC OFF
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
