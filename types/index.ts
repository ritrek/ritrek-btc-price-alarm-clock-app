export type RepeatMode = 'once' | 'daily' | 'custom';
export type Mood = 'ngu' | 'ngd';

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  mode: RepeatMode;
  enabled: boolean;
  days: number[];
  nguSoundId: string | null;
  ngdSoundId: string | null;
  baselinePriceUsd: number | null;
  baselineAt: string | null;
  snoozeUntil: number | null;
  createdAt: number;
}

export interface AppSettings {
  defaultNguSoundId: string;
  defaultNgdSoundId: string;
  snoozeMinutes: number;
  vibrationEnabled: boolean;
  comparisonLookbackHours: number;
}

export type ClockFormat = 'system' | '12h' | '24h';

export interface BundledSound {
  id: string;
  mood: Mood;
  title: string;
  composer: string;
  assetFile: string;
  rawName: string;
}

export interface UserSound {
  id: string;
  title: string;
  fileName: string;
}

export interface RingingHandoff {
  alarmId: string;
  mood: Mood;
  currentPriceUsd: number | null;
  comparePriceUsd: number | null;
  usedCachedPrice: boolean;
  isSnooze: boolean;
  startedAt: string;
}

export interface AlarmPermissions {
  canScheduleExactAlarms: boolean;
  canUseFullScreenIntent: boolean;
  notificationsGranted: boolean;
  ignoringBatteryOptimizations: boolean;
}

export interface BtcPrice {
  usd: number;
  at: string;
}
