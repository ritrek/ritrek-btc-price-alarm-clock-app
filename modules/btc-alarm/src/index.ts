import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

import {
  Alarm,
  AlarmPermissions,
  AppSettings,
  RingingHandoff,
  UserSound,
} from '@/types';

type NativeBtcAlarm = {
  getAlarms(): Promise<Alarm[]>;
  saveAlarm(alarm: Alarm): Promise<Alarm>;
  deleteAlarm(id: string): Promise<void>;
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<AppSettings>;
  getPendingHandoff(): Promise<RingingHandoff | null>;
  clearPendingHandoff(): Promise<void>;
  snooze(id: string): Promise<{ ok: boolean; triggerAt: number } | null>;
  stopAlarm(id: string): Promise<RingingHandoff | null>;
  getPermissions(): Promise<AlarmPermissions>;
  openExactAlarmSettings(): Promise<void>;
  openFullScreenIntentSettings(): Promise<void>;
  openBatteryOptimizationSettings(): Promise<void>;
  openNotificationSettings(): Promise<void>;
  rescheduleAll(): Promise<void>;
  getUserSounds(): Promise<UserSound[]>;
  importUserSound(sourcePath: string, title: string): Promise<UserSound & { path: string }>;
  deleteUserSound(id: string): Promise<void>;
  userSoundPath(id: string): Promise<string | null>;
  cachePrice(usd: number, at: string): Promise<void>;
  nextTriggerAt(id: string): Promise<number | null>;
  addListener(event: string, listener: (event: RingingHandoff | { alarmId: string; reason: string }) => void): { remove(): void };
};

const native: NativeBtcAlarm | null = (() => {
  if (Platform.OS !== 'android') {
    return null;
  }
  try {
    return requireNativeModule<NativeBtcAlarm>('BtcAlarm');
  } catch {
    return null;
  }
})();

function ensureNative(): NativeBtcAlarm {
  if (!native) {
    throw new Error('BTC Alarm native module requires an Android development or production build (not Expo Go).');
  }
  return native;
}

export const BtcAlarm = {
  isAvailable: native != null,
  getAlarms: () => ensureNative().getAlarms(),
  saveAlarm: (alarm: Alarm) => ensureNative().saveAlarm(alarm),
  deleteAlarm: (id: string) => ensureNative().deleteAlarm(id),
  getSettings: () => ensureNative().getSettings(),
  saveSettings: (settings: AppSettings) => ensureNative().saveSettings(settings),
  getPendingHandoff: () => ensureNative().getPendingHandoff(),
  clearPendingHandoff: () => ensureNative().clearPendingHandoff(),
  snooze: (id: string) => ensureNative().snooze(id),
  stopAlarm: (id: string) => ensureNative().stopAlarm(id),
  getPermissions: () => ensureNative().getPermissions(),
  openExactAlarmSettings: () => ensureNative().openExactAlarmSettings(),
  openFullScreenIntentSettings: () => ensureNative().openFullScreenIntentSettings(),
  openBatteryOptimizationSettings: () => ensureNative().openBatteryOptimizationSettings(),
  openNotificationSettings: () => ensureNative().openNotificationSettings(),
  rescheduleAll: () => ensureNative().rescheduleAll(),
  getUserSounds: () => ensureNative().getUserSounds(),
  importUserSound: (sourcePath: string, title: string) => ensureNative().importUserSound(sourcePath, title),
  deleteUserSound: (id: string) => ensureNative().deleteUserSound(id),
  userSoundPath: (id: string) => ensureNative().userSoundPath(id),
  cachePrice: (usd: number, at: string) => ensureNative().cachePrice(usd, at),
  nextTriggerAt: (id: string) => ensureNative().nextTriggerAt(id),
  addListener: (
    event: 'onAlarmFired' | 'onAlarmStopped',
    listener: (payload: RingingHandoff | { alarmId: string; reason: string }) => void
  ) => ensureNative().addListener(event, listener),
};

export default BtcAlarm;
