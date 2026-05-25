export interface RelayState {
  id: number;
  name: string;
  pin: number;
  state: boolean;
}

export interface SensorData {
  temperature: number;
  humidity: number;
  heatIndex: number;
  timestamp: string; // ISO string or simple time
}

export type ConnectionMode = 'direct';

export interface AppConfig {
  mode: ConnectionMode;
  directIp: string;
  autoRefreshInterval: number; // in ms
  useVoiceSynth: boolean;
}

export interface VoiceCommand {
  phrases: string[];
  action: (utils: any) => void;
  description: string;
  lang: 'id' | 'en';
}
