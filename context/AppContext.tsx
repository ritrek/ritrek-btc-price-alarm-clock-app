import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, usePathname } from 'expo-router';

import { DEFAULT_NGU_SOUND_ID, DEFAULT_NGD_SOUND_ID, DEFAULT_SNOOZE_MINUTES, DEFAULT_LOOKBACK_HOURS, LOOKBACK_HOURS, SNOOZE_OPTIONS } from '@/constants/Sounds';
import { BtcAlarm } from '@/modules/btc-alarm/src';
import { Alarm, AlarmPermissions, AppSettings, ClockFormat, RingingHandoff, UserSound } from '@/types';
import { noteLiveBtcUsd } from '@/utils/price';
import { compareAlarms, enableIfAlarmEdited, normalizeAlarm, withCreatedAt } from '@/utils/alarm';
import { uses24HourClock } from '@/utils/format';
import { syncOtaUpdates } from '@/utils/otaUpdates';

interface AppContextValue {
  ready: boolean;
  alarms: Alarm[];
  settings: AppSettings;
  userSounds: UserSound[];
  permissions: AlarmPermissions | null;
  refresh: () => Promise<void>;
  saveAlarm: (alarm: Alarm) => Promise<Alarm>;
  deleteAlarm: (id: string) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  refreshPermissions: () => Promise<AlarmPermissions | null>;
  clockFormat: ClockFormat;
  uses24Hour: boolean;
  setClockFormat: (format: ClockFormat) => Promise<void>;
}

const defaultSettings: AppSettings = {
  defaultNguSoundId: DEFAULT_NGU_SOUND_ID,
  defaultNgdSoundId: DEFAULT_NGD_SOUND_ID,
  snoozeMinutes: DEFAULT_SNOOZE_MINUTES,
  vibrationEnabled: true,
  comparisonLookbackHours: DEFAULT_LOOKBACK_HOURS,
};

function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    defaultNguSoundId: settings.defaultNguSoundId || DEFAULT_NGU_SOUND_ID,
    defaultNgdSoundId: settings.defaultNgdSoundId || DEFAULT_NGD_SOUND_ID,
    snoozeMinutes: SNOOZE_OPTIONS.includes(settings.snoozeMinutes)
      ? settings.snoozeMinutes
      : DEFAULT_SNOOZE_MINUTES,
    vibrationEnabled: settings.vibrationEnabled !== false,
    comparisonLookbackHours: LOOKBACK_HOURS.includes(settings.comparisonLookbackHours)
      ? settings.comparisonLookbackHours
      : DEFAULT_LOOKBACK_HOURS,
  };
}

const CLOCK_FORMAT_KEY = 'clock_format';

const AppContext = createContext<AppContextValue | null>(null);

async function routeToHandoff(): Promise<boolean> {
  if (!BtcAlarm.isAvailable) {
    return false;
  }
  const handoff = await BtcAlarm.getPendingHandoff();
  if (handoff?.alarmId) {
    router.replace(`/ringing/${handoff.alarmId}`);
    return true;
  }
  return false;
}

async function syncOtaIfDirectOpen(isRinging: boolean) {
  if (isRinging) {
    return;
  }
  const alarmWake = await routeToHandoff();
  if (alarmWake) {
    return;
  }
  await syncOtaUpdates();
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRingingRef = useRef(pathname.startsWith('/ringing'));
  isRingingRef.current = pathname.startsWith('/ringing');
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [ready, setReady] = useState(false);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [userSounds, setUserSounds] = useState<UserSound[]>([]);
  const [permissions, setPermissions] = useState<AlarmPermissions | null>(null);
  const [clockFormat, setClockFormatState] = useState<ClockFormat>('system');

  const refresh = useCallback(async () => {
    if (!BtcAlarm.isAvailable) {
      setReady(true);
      return;
    }
    const [nextAlarms, nextSettings, nextSounds] = await Promise.all([
      BtcAlarm.getAlarms(),
      BtcAlarm.getSettings(),
      BtcAlarm.getUserSounds(),
    ]);
    setAlarms(
      nextAlarms
        .map(normalizeAlarm)
        .sort(compareAlarms)
    );
    setSettings(normalizeSettings(nextSettings));
    setUserSounds(nextSounds);
    setReady(true);
  }, []);

  const refreshPermissions = useCallback(async () => {
    if (!BtcAlarm.isAvailable) {
      return null;
    }
    const next = await BtcAlarm.getPermissions();
    setPermissions(next);
    return next;
  }, []);

  const saveAlarm = useCallback(async (alarm: Alarm) => {
    let next = normalizeAlarm(alarm);
    if (BtcAlarm.isAvailable) {
      const existing = (await BtcAlarm.getAlarms())
        .map(normalizeAlarm)
        .find((item) => item.id === alarm.id);
      next = withCreatedAt(next, existing);
      next = await enableIfAlarmEdited(existing, next);
    } else {
      next = withCreatedAt(next);
    }
    const saved = await BtcAlarm.saveAlarm(next);
    await refresh();
    return saved;
  }, [refresh]);

  const deleteAlarm = useCallback(async (id: string) => {
    await BtcAlarm.deleteAlarm(id);
    await refresh();
  }, [refresh]);

  const saveSettings = useCallback(async (next: AppSettings) => {
    const saved = await BtcAlarm.saveSettings(normalizeSettings(next));
    setSettings(normalizeSettings(saved));
  }, []);

  const setClockFormat = useCallback(async (format: ClockFormat) => {
    setClockFormatState(format);
    await AsyncStorage.setItem(CLOCK_FORMAT_KEY, format);
  }, []);

  useEffect(() => {
    refresh();
    refreshPermissions();
    AsyncStorage.getItem(CLOCK_FORMAT_KEY).then((value) => {
      if (value === 'system' || value === '12h' || value === '24h') {
        setClockFormatState(value);
      }
    });
  }, [refresh, refreshPermissions]);

  useEffect(() => {
    if (!BtcAlarm.isAvailable) {
      return;
    }
    const fired = BtcAlarm.addListener('onAlarmFired', (payload) => {
      const handoff = payload as RingingHandoff;
      if (typeof handoff.currentPriceUsd === 'number' && !handoff.usedCachedPrice) {
        noteLiveBtcUsd(handoff.currentPriceUsd);
      }
      if (handoff.alarmId) {
        router.replace(`/ringing/${handoff.alarmId}`);
      }
    });
    const stopped = BtcAlarm.addListener('onAlarmStopped', () => {
      refresh();
    });
    const appState = AppState.addEventListener('change', (state) => {
      const fromBackground = appStateRef.current === 'background';
      appStateRef.current = state;
      if (state === 'active') {
        refresh();
        refreshPermissions();
        if (fromBackground) {
          syncOtaIfDirectOpen(isRingingRef.current).catch(() => undefined);
        } else {
          routeToHandoff().catch(() => undefined);
        }
      }
    });
    syncOtaIfDirectOpen(isRingingRef.current).catch(() => undefined);
    AsyncStorage.getItem('asked_onboarding').catch(() => undefined);
    return () => {
      fired.remove();
      stopped.remove();
      appState.remove();
    };
  }, [refresh, refreshPermissions]);

  const uses24Hour = uses24HourClock(clockFormat);

  const value = useMemo(
    () => ({
      ready,
      alarms,
      settings,
      userSounds,
      permissions,
      refresh,
      saveAlarm,
      deleteAlarm,
      saveSettings,
      refreshPermissions,
      clockFormat,
      uses24Hour,
      setClockFormat,
    }),
    [
      ready,
      alarms,
      settings,
      userSounds,
      permissions,
      refresh,
      saveAlarm,
      deleteAlarm,
      saveSettings,
      refreshPermissions,
      clockFormat,
      uses24Hour,
      setClockFormat,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
