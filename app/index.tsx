import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, FlatList, Linking, Pressable, StyleSheet, View } from 'react-native';
import { router, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AlarmCard from '@/components/AlarmCard';
import PermissionsSheet from '@/components/PermissionsSheet';
import { useApp } from '@/context/AppContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { applyOnceBaseline } from '@/utils/alarm';
import { newAlarmId } from '@/utils/format';
import { formatUsd, getCurrentBtcUsd, getLatestBtcUsd, subscribeLatestBtcUsd } from '@/utils/price';
import { soundTitle } from '@/utils/sounds';

const PRICE_REFRESH_MS = 60_000;

export default function HomeScreen() {
  const { ready, alarms, saveAlarm, settings, userSounds, permissions, refreshPermissions } = useApp();
  const tint = useThemeColor({}, 'tint');
  const onTint = useThemeColor({}, 'onTint');
  const muted = useThemeColor({}, 'muted');
  const card = useThemeColor({}, 'card');
  const [showPermissions, setShowPermissions] = useState(false);
  const [btcUsd, setBtcUsd] = useState<number | null>(() => getLatestBtcUsd()?.usd ?? null);
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => router.push('/settings')} hitSlop={12} accessibilityLabel="Settings">
          <Ionicons name="settings-outline" size={24} color={tint} />
        </Pressable>
      ),
    });
  }, [navigation, tint]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    (async () => {
      const seen = await AsyncStorage.getItem('asked_onboarding');
      const missingExact = permissions && !permissions.canScheduleExactAlarms;
      if (!seen || missingExact) {
        setShowPermissions(true);
      }
    })();
  }, [ready, permissions]);

  useEffect(() => {
    return subscribeLatestBtcUsd((value) => {
      setBtcUsd(value.usd);
    });
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      const latest = getLatestBtcUsd();
      if (latest && Date.now() - latest.collectedAt < PRICE_REFRESH_MS) {
        return;
      }
      try {
        await getCurrentBtcUsd();
      } catch {
        // Keep the last successful price on screen.
      }
    };

    const start = () => {
      void load();
      if (!interval) {
        interval = setInterval(load, PRICE_REFRESH_MS);
      }
    };

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    start();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        start();
      } else {
        stop();
      }
    });

    return () => {
      stop();
      appState.remove();
    };
  }, []);

  const addAlarm = useCallback(() => {
    const now = new Date();
    const id = newAlarmId();
    router.push({
      pathname: '/alarm/[id]',
      params: {
        id,
        isNew: '1',
        hour: String(now.getHours()),
        minute: String(now.getMinutes()),
      },
    });
  }, []);

  const dismissPermissions = useCallback(async () => {
    await AsyncStorage.setItem('asked_onboarding', '1');
    setShowPermissions(false);
    await refreshPermissions();
  }, [refreshPermissions]);

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={alarms.length === 0 ? styles.emptyList : styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="subtitle">Default sounds</ThemedText>
            <Pressable
              style={[styles.soundRow, { backgroundColor: card }]}
              onPress={() => router.push({ pathname: '/sounds', params: { mood: 'ngu', scope: 'default' } })}
            >
              <ThemedText>Number Go Up</ThemedText>
              <ThemedText style={{ color: muted, flex: 1, textAlign: 'right' }} numberOfLines={1}>
                {soundTitle(settings.defaultNguSoundId, userSounds)}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.soundRow, { backgroundColor: card }]}
              onPress={() => router.push({ pathname: '/sounds', params: { mood: 'ngd', scope: 'default' } })}
            >
              <ThemedText>Number Go Down</ThemedText>
              <ThemedText style={{ color: muted, flex: 1, textAlign: 'right' }} numberOfLines={1}>
                {soundTitle(settings.defaultNgdSoundId, userSounds)}
              </ThemedText>
            </Pressable>
            <ThemedText type="subtitle" style={{ marginTop: 8 }}>
              Alarms
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          ready ? (
            <ThemedText style={[styles.empty, { color: muted }]}>
              No alarms yet. Tap + to wake up to Bitcoin.
            </ThemedText>
          ) : (
            <ThemedText style={{ color: muted }}>Loading…</ThemedText>
          )
        }
        renderItem={({ item }) => (
          <AlarmCard
            alarm={item}
            onToggle={async (value) => {
              try {
                if (!value) {
                  await saveAlarm({ ...item, enabled: false });
                  return;
                }
                const next = await applyOnceBaseline({ ...item, enabled: true });
                await saveAlarm(next);
              } catch (error) {
                Alert.alert(
                  'Could not turn on alarm',
                  error instanceof Error ? error.message : 'Unknown error'
                );
                throw error;
              }
            }}
          />
        )}
        ListFooterComponent={
          <View style={styles.priceFooter}>
            <ThemedText style={[styles.empty, { color: muted }]}>
              {btcUsd != null
                ? `Current price: ${formatUsd(Math.round(btcUsd))}`
                : 'Current price: …'}
            </ThemedText>
            <ThemedText style={[styles.attribution, { color: muted }]}>
              Price data is collected from{' '}
              <ThemedText type="link" onPress={() => void Linking.openURL('https://kraken.com')}>
                Kraken.com
              </ThemedText>
              .
            </ThemedText>
            <View style={styles.about}>
              <ThemedText style={[styles.attribution, { color: muted }]}>
                Developed by{' '}
                <ThemedText
                  type="link"
                  style={styles.developedLink}
                  onPress={() => void Linking.openURL('https://ritrek.com')}
                  accessibilityRole="link"
                  accessibilityLabel="RITREK.com"
                >
                  RITREK.com
                </ThemedText>
              </ThemedText>
              <ThemedText style={[styles.aboutPitch, { color: muted }]}>
                One day, you won’t wake up again. Don’t leave your loved ones with cryptic instructions
                and passphrases. With the{' '}
                <ThemedText
                  type="link"
                  style={styles.inlineLink}
                  onPress={() =>
                    void Linking.openURL('https://play.google.com/store/apps/details?id=com.ritrek.app')
                  }
                  accessibilityRole="link"
                  accessibilityLabel="RITREK Android App"
                >
                  RITREK Android App
                </ThemedText>
                , you can create pre-signed Timelock Recovery transactions they can use to move your
                Bitcoin to their own wallet once a safety cancellation window has passed.
                The configurable cancellation window (for example, 90 days) gives you time to stop
                the transfer if it was initiated by mistake.
              </ThemedText>
              <ThemedText style={[styles.aboutTagline, { color: muted }]}>
                When Seeds Fail, RITREK Recovers.
              </ThemedText>
            </View>
          </View>
        }
      />
      <Pressable
        style={[styles.fab, { backgroundColor: tint }]}
        onPress={addAlarm}
        accessibilityLabel="Add alarm"
      >
        <Ionicons name="add" size={32} color={onTint} />
      </Pressable>
      <PermissionsSheet visible={showPermissions} onDone={dismissPermissions} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { gap: 10, marginBottom: 8 },
  soundRow: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  list: { padding: 16, paddingBottom: 96, gap: 12 },
  emptyList: { flexGrow: 1, padding: 16, paddingBottom: 96 },
  empty: { textAlign: 'center', marginTop: 16 },
  priceFooter: { alignItems: 'center', gap: 6, paddingTop: 8, paddingBottom: 8 },
  attribution: { textAlign: 'center' },
  about: {
    marginTop: 16,
    width: '100%',
    gap: 10,
    paddingHorizontal: 4,
  },
  aboutPitch: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
  },
  aboutTagline: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  developedLink: {
    lineHeight: 24,
  },
  inlineLink: {
    fontSize: 14,
    lineHeight: 21,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
