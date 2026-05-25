import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Play, Pause, Trash2, ChartLine } from 'lucide-react';

interface LiveChartProps {
  data: any[];
  onClearHistory: () => void;
}

export default function LiveChart({ data, onClearHistory }: LiveChartProps) {
  const [isLive, setIsLive] = useState(true);
  const [frozenData, setFrozenData] = useState<any[] | null>(null);

  const displayData = isLive ? data : (frozenData || data);

  const handleTogglePlay = () => {
    if (isLive) {
      setFrozenData([...data]);
    }
    setIsLive(!isLive);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-[#141414] p-3 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] font-mono text-xs text-[#141414]">
          <p className="font-sans font-bold uppercase tracking-wider text-[9px] text-[#141414]/60 mb-1">{label}</p>
          <p className="text-[#E11D48] font-bold"> Sump: {payload[0].value} °C</p>
          {payload[1] && (
            <p className="text-[#2563EB] font-bold mt-0.5"> Humid: {payload[1].value} %</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#F0EFEC] border-2 border-[#141414] p-6 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col h-full text-[#141414]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-[#141414]/15">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#141414] text-white">
            <ChartLine className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider font-display">Log Grafik Transmisi</h2>
            <p className="text-[10px] font-mono text-[#141414]/60">Suhu (°C) vs Kelembapan (%)</p>
          </div>
        </div>

        {/* Chart Actions */}
        <div className="flex items-center space-x-2">
          {/* Pause/Resume Live Streaming */}
          <button
            id="btn-toggle-live-chart"
            onClick={handleTogglePlay}
            className={`flex items-center space-x-1.5 px-3 py-1.5 border-2 border-[#141414] text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-transform active:translate-y-0.5 ${
              isLive
                ? 'bg-white hover:bg-[#F0EFEC] text-[#141414]'
                : 'bg-amber-400 text-[#141414]'
            }`}
          >
            {isLive ? (
              <>
                <Pause className="w-3 h-3" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-white fill-white" />
                <span>Live</span>
              </>
            )}
          </button>

          {/* Reset Chart */}
          <button
            id="btn-clear-chart"
            onClick={onClearHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 border-2 border-[#141414] bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-transform active:translate-y-0.5 hover:bg-rose-600"
          >
            <Trash2 className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 min-h-[250px] w-full mt-2 select-none">
        {displayData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-[#141414]/30 p-8 bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]">
            <Activity className="w-8 h-8 text-[#141414]/50 animate-pulse mb-2" />
            <p className="text-sm font-bold font-display uppercase tracking-wide">Belum Ada Data Transmisi</p>
            <p className="text-[9px] font-mono text-[#141414]/60 mt-1 select-none">Mengambil data dari simulator atau ESP32...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={displayData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E11D48" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#E11D48" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHumi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#141414" strokeOpacity={0.15} />
              <XAxis 
                dataKey="timestamp" 
                stroke="#141414" 
                fontSize={9} 
                tickLine={true}
                fontFamily="monospace"
              />
              <YAxis 
                yAxisId="left"
                domain={[15, 45]} 
                stroke="#E11D48" 
                fontSize={9} 
                tickLine={true}
                fontFamily="monospace"
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[30, 100]} 
                stroke="#2563EB" 
                fontSize={9} 
                tickLine={true}
                fontFamily="monospace"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', textTransform: 'uppercase' }} />
              <Area 
                yAxisId="left"
                type="monotone" 
                name="Suhu (°C)"
                dataKey="temperature" 
                stroke="#E11D48" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTemp)" 
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#141414' }}
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                name="Kelembapan (%)"
                dataKey="humidity" 
                stroke="#2563EB" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorHumi)" 
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#141414' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
