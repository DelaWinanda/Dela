import React from 'react';
import { Thermometer, Droplets, Flame } from 'lucide-react';

interface SensorGaugesProps {
  temperature: number;
  humidity: number;
  heatIndex: number;
}

export default function SensorGauges({ temperature, humidity, heatIndex }: SensorGaugesProps) {
  // Determine temperature comfort label and coloring classes
  const getTempInfo = (temp: number) => {
    if (temp < 18) return { label: 'Dingin', color: 'text-sky-700 border-sky-600 bg-sky-50' };
    if (temp <= 25) return { label: 'Sejuk Nyaman', color: 'text-emerald-700 border-emerald-600 bg-emerald-50' };
    if (temp <= 30) return { label: 'Hangat Normal', color: 'text-amber-700 border-amber-600 bg-amber-50' };
    return { label: 'Panas Tinggi', color: 'text-rose-700 border-rose-600 bg-rose-50' };
  };

  // Determine humidity comfort label and coloring classes
  const getHumiInfo = (humi: number) => {
    if (humi < 40) return { label: 'Kering', color: 'text-amber-700 border-amber-600 bg-amber-50' };
    if (humi <= 65) return { label: 'Kelembapan Optimal', color: 'text-emerald-700 border-emerald-600 bg-emerald-50' };
    return { label: 'Sangat Lembap', color: 'text-sky-700 border-sky-600 bg-sky-50' };
  };

  // Determine Heat Index warning levels
  const getHeatIndexWarning = (hi: number) => {
    if (hi < 27) return { label: 'Normal / Nyaman', code: 'SAFE', desc: 'Suhu lingkungan normal tidak berisiko.', style: 'text-emerald-800 bg-emerald-100 border-emerald-400' };
    if (hi < 32) return { label: 'Waspada (Caution)', code: 'WARN', desc: 'Risiko kelelahan jika beraktivitas di luar.', style: 'text-amber-800 bg-amber-100 border-amber-400' };
    if (hi < 41) return { label: 'Waspada Tinggi (Extreme Warning)', code: 'EXT_WARN', desc: 'Risiko dehidrasi dan kram panas tinggi.', style: 'text-orange-800 bg-orange-100 border-orange-400' };
    return { label: '⚠️ Bahaya (Danger)', code: 'DANGER', desc: 'Segera lakukan pendinginan suhu ruangan!', style: 'text-rose-800 bg-rose-100 border-rose-400' };
  };

  const tempInfo = getTempInfo(temperature);
  const humiInfo = getHumiInfo(humidity);
  const hiWarning = getHeatIndexWarning(heatIndex);

  // Circular gauge percentage calculator
  const calcStrokeDashOffset = (val: number, max: number) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const clampedVal = Math.max(0, Math.min(val, max));
    const offset = circumference - (clampedVal / max) * circumference;
    return { offset, circumference };
  };

  const tempStroke = calcStrokeDashOffset(temperature, 50); // Scale 50C
  const humiStroke = calcStrokeDashOffset(humidity, 100); // Scale 100%

  return (
    <div className="bg-[#F0EFEC] border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col h-full justify-between text-[#141414]">
      <div>
        {/* Header Title */}
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-[#141414]/15">
          <div className="p-2 bg-[#141414] text-white">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider font-display">Status Lingkungan (DHT11)</h2>
            <p className="text-[10px] font-mono text-[#141414]/60">Live Updates via Ad-hoc Transmit</p>
          </div>
        </div>

        {/* Gauge Cards Container */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Temperature Circular Gauge */}
          <div className="bg-white border-2 border-[#141414] p-4 flex flex-col items-center relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <span className="absolute top-1 left-2 text-[8px] font-mono tracking-wider font-bold text-[#141414]/30 uppercase">TEMP_CELSIUS</span>
            
            <div className="relative w-24 h-24 flex items-center justify-center mt-3">
              {/* Back Circle */}
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="transparent"
                  stroke="#E4E3E0"
                  strokeWidth="8"
                />
                {/* Colored Circle */}
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="transparent"
                  stroke="#E11D48" /* Solid High-Contrast Red */
                  strokeWidth="8"
                  strokeDasharray={`${tempStroke.circumference}`}
                  strokeDashoffset={tempStroke.offset}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              
              {/* Center Content */}
              <div className="text-center z-10">
                <span className="text-2xl font-bold font-display text-[#141414]">{temperature.toFixed(1)}</span>
                <span className="text-[10px] font-mono text-[#141414]/60 block -mt-1">°C</span>
              </div>
            </div>

            <div className="mt-4 text-center w-full">
              <span className="text-[10px] uppercase font-bold text-[#141414]/60 font-mono">Suhu Ruangan</span>
              <span className={`block text-[10px] font-mono font-bold mt-1.5 px-2 py-0.5 rounded border border-[#141414] ${tempInfo.color}`}>
                {tempInfo.label.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Humidity Circular Gauge */}
          <div className="bg-white border-2 border-[#141414] p-4 flex flex-col items-center relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <span className="absolute top-1 left-2 text-[8px] font-mono tracking-wider font-bold text-[#141414]/30 uppercase">HUMID_PERCENT</span>

            <div className="relative w-24 h-24 flex items-center justify-center mt-3">
              {/* Back Circle */}
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="transparent"
                  stroke="#E4E3E0"
                  strokeWidth="8"
                />
                {/* Colored Circle */}
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="transparent"
                  stroke="#2563EB" /* Solid Blue */
                  strokeWidth="8"
                  strokeDasharray={`${humiStroke.circumference}`}
                  strokeDashoffset={humiStroke.offset}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>

              {/* Center Content */}
              <div className="text-center z-10">
                <span className="text-2xl font-bold font-display text-[#141414]">{humidity.toFixed(1)}</span>
                <span className="text-[10px] font-mono text-[#141414]/60 block -mt-1">%</span>
              </div>
            </div>

            <div className="mt-4 text-center w-full">
              <span className="text-[10px] uppercase font-bold text-[#141414]/60 font-mono">Kelembapan</span>
              <span className={`block text-[10px] font-mono font-bold mt-1.5 px-2 py-0.5 rounded border border-[#141414] ${humiInfo.color}`}>
                {humiInfo.label.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Heat Index Dashboard Comfort Gauge */}
      <div className="bg-white border-2 border-[#141414] p-4 flex items-start space-x-3 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] mt-2">
        <div className="p-1.5 bg-rose-500 text-white border border-[#141414] mt-0.5 flex-shrink-0">
          <Flame className="w-4 h-4" />
        </div>
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#141414]/60 uppercase">Heat Index (Suhu Terasa):</span>
            <span className="text-sm font-bold text-[#141414] font-mono">{heatIndex.toFixed(1)} °C</span>
          </div>

          {/* Progress Warning bar */}
          <div className="w-full bg-[#E4E3E0] h-2.5 border border-[#141414] overflow-hidden my-2">
            <div
              className={`h-full transition-all duration-500 ${
                heatIndex < 27 ? 'bg-emerald-500' :
                heatIndex < 32 ? 'bg-amber-500' :
                heatIndex < 41 ? 'bg-orange-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, (heatIndex / 50) * 100)}%` }}
            ></div>
          </div>

          <div className={`text-[10px] font-sans p-2 rounded border border-[#141414] uppercase ${hiWarning.style}`}>
            <span className="block font-mono text-[9px] font-bold tracking-wider mb-0.5">⚠️ STATUS INDEKS TERMAL</span>
            <span className="block font-bold">{hiWarning.label}</span>
            <span className="text-[9px] text-[#141414]/70 font-normal mt-0.5 block font-sans lowercase first-letter:uppercase">
              {hiWarning.desc}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
