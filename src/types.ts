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

export type ConnectionMode = 'simulation' | 'direct' | 'telegram' | 'cloud_sync';

export interface AppConfig {
  mode: ConnectionMode;
  directIp: string;
  telegramToken: string;
  telegramChatId: string;
  autoRefreshInterval: number; // in ms
  useVoiceSynth: boolean;
}

export interface VoiceCommand {
  phrases: string[];
  action: (utils: any) => void;
  description: string;
  lang: 'id' | 'en';
}
