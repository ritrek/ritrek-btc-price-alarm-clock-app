import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useApp } from '@/context/AppContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BtcAlarm } from '@/modules/btc-alarm/src';
import { RingingHandoff } from '@/types';
import { formatUsd } from '@/utils/price';
import { speakBitcoinPrice } from '@/utils/speech';
import { formatAlarmTime } from '@/utils/format';

export default function RingingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { alarms, refresh, uses24Hour, settings } = useApp();
  const alarm = alarms.find((item) => item.id === id);
  const insets = useSafeAreaInsets();
  const up = useThemeColor({}, 'up');
  const down = useThemeColor({}, 'down');
  const onError = useThemeColor({}, 'onErrorBackground');
  const [handoff, setHandoff] = useState<RingingHandoff | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    BtcAlarm.getPendingHandoff().then((next) => {
      if (next && next.alarmId === id) {
        setHandoff(next);
      }
    }).catch(() => undefined);
  }, [id]);

  const onSnooze = useCallback(async () => {
    if (!id || busy) {
      return;
    }
    setBusy(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await BtcAlarm.snooze(id);
      await refresh();
      router.replace('/');
    } finally {
      setBusy(false);
    }
  }, [id, busy, refresh]);

  const onStop = useCallback(async () => {
    if (!id || busy) {
      return;
    }
    setBusy(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const stopped = await BtcAlarm.stopAlarm(id);
      const price = stopped?.currentPriceUsd ?? handoff?.currentPriceUsd;
      await refresh();
      if (typeof price === 'number') {
        await speakBitcoinPrice(price);
      }
      router.replace('/');
    } finally {
      setBusy(false);
    }
  }, [id, busy, handoff, refresh]);

  const mood = handoff?.mood ?? 'ngd';
  const isUp = mood === 'ngu';
  const current = handoff?.currentPriceUsd;
  const compare = handoff?.comparePriceUsd;
  const delta =
    current != null && compare != null && compare !== 0
      ? ((current - compare) / compare) * 100
      : null;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <ThemedText style={styles.time}>
        {alarm ? formatAlarmTime(alarm.hour, alarm.minute, uses24Hour) : '--:--'}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: isUp ? up : down }}>
        {isUp ? 'Bitcoin is up' : 'Bitcoin is down'}
      </ThemedText>
      {current != null ? (
        <ThemedText style={styles.price}>{formatUsd(current)}</ThemedText>
      ) : (
        <ThemedText>Price unavailable — ringing anyway</ThemedText>
      )}
      {compare != null ? (
        <ThemedText>
          vs {formatUsd(compare)}
          {delta != null ? ` (${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%)` : ''}
        </ThemedText>
      ) : null}
      {handoff?.usedCachedPrice ? (
        <ThemedText>Used a cached price (network issue)</ThemedText>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.snooze]}
          onPress={onSnooze}
          disabled={busy}
          accessibilityLabel="Snooze"
        >
          <ThemedText style={styles.buttonLabel}>
            Snooze {settings.snoozeMinutes} min
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.button, styles.stop]}
          onPress={onStop}
          disabled={busy}
          accessibilityLabel="Stop"
        >
          <ThemedText style={[styles.buttonLabel, { color: onError }]}>Stop</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  time: { fontSize: 72, fontWeight: '700', lineHeight: 80 },
  price: { fontSize: 28, fontWeight: '600', marginTop: 8 },
  actions: { width: '100%', gap: 12, marginTop: 36 },
  button: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  snooze: { backgroundColor: '#2c3a42' },
  stop: { backgroundColor: '#c62828' },
  buttonLabel: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
});
