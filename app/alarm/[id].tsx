import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import WeekdayPicker from '@/components/WeekdayPicker';
import { useApp } from '@/context/AppContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { RepeatMode } from '@/types';
import { applyOnceBaseline } from '@/utils/alarm';
import { formatAlarmTime } from '@/utils/format';

const MODES: { id: RepeatMode; label: string }[] = [
  { id: 'once', label: 'Once' },
  { id: 'daily', label: 'Every day' },
  { id: 'custom', label: 'Custom days' },
];

export default function AlarmEditorScreen() {
  const { id, isNew, hour: hourParam, minute: minuteParam } = useLocalSearchParams<{
    id: string;
    isNew?: string;
    hour?: string;
    minute?: string;
  }>();
  const { alarms, saveAlarm, uses24Hour } = useApp();
  const existing = alarms.find((alarm) => alarm.id === id);
  const tint = useThemeColor({}, 'tint');
  const onTint = useThemeColor({}, 'onTint');
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'muted');

  const initialDate = useMemo(() => {
    const date = new Date();
    date.setHours(existing?.hour ?? Number(hourParam ?? date.getHours()));
    date.setMinutes(existing?.minute ?? Number(minuteParam ?? date.getMinutes()));
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }, [existing, hourParam, minuteParam]);

  const [time, setTime] = useState(initialDate);
  const [mode, setMode] = useState<RepeatMode>(existing?.mode ?? 'once');
  const [days, setDays] = useState<number[]>(existing?.days?.length ? existing.days : [1, 2, 3, 4, 5]);
  const [saving, setSaving] = useState(false);
  // Android's DateTimePicker is a dialog. Keep it mounted only while open,
  // otherwise every re-render (e.g. toggling a weekday) opens it again.
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  useEffect(() => {
    if (existing) {
      const date = new Date();
      date.setHours(existing.hour);
      date.setMinutes(existing.minute);
      setTime(date);
      setMode(existing.mode);
      setDays(existing.days?.length ? existing.days : [1, 2, 3, 4, 5]);
    }
  }, [existing]);

  const onTimeChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'dismissed' || !date) {
      return;
    }
    setTime(date);
  }, []);

  const save = async () => {
    if (!id) {
      return;
    }
    if (mode === 'custom' && days.length === 0) {
      Alert.alert('Pick at least one day');
      return;
    }
    setSaving(true);
    try {
      const next = await applyOnceBaseline({
        id,
        hour: time.getHours(),
        minute: time.getMinutes(),
        mode,
        enabled: true,
        days: mode === 'custom' ? days : [],
        nguSoundId: existing?.nguSoundId ?? null,
        ngdSoundId: existing?.ngdSoundId ?? null,
        baselinePriceUsd: existing?.baselinePriceUsd ?? null,
        baselineAt: existing?.baselineAt ?? null,
        snoozeUntil: null,
        createdAt: existing?.createdAt ?? Date.now(),
      });
      await saveAlarm(next);
      router.back();
    } catch (error) {
      Alert.alert('Could not save alarm', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={{ color: muted, textAlign: 'center' }}>Local time</ThemedText>
        {Platform.OS === 'android' ? (
          <Pressable onPress={() => setShowPicker(true)} style={styles.timeTap} accessibilityLabel="Change time">
            <ThemedText style={styles.timeDisplay}>
              {formatAlarmTime(time.getHours(), time.getMinutes(), uses24Hour)}
            </ThemedText>
            <ThemedText style={{ color: muted, textAlign: 'center' }}>Tap to change</ThemedText>
          </Pressable>
        ) : null}
        {showPicker ? (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            is24Hour={uses24Hour}
            onChange={onTimeChange}
          />
        ) : null}
        <ThemedText type="subtitle">Repeat</ThemedText>
        <View style={styles.modes}>
          {MODES.map((item) => {
            const active = mode === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setMode(item.id)}
                style={[styles.mode, { backgroundColor: active ? tint : card }]}
              >
                <ThemedText style={{ color: active ? onTint : undefined, fontWeight: '600' }}>
                  {item.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        {mode === 'custom' ? (
          <>
            <WeekdayPicker selected={days} onChange={setDays} />
            <ThemedText style={{ color: muted }}>
              One time is used for every selected day.
            </ThemedText>
          </>
        ) : null}
        {mode === 'once' ? (
          <ThemedText style={{ color: muted }}>
            Saving captures the current Bitcoin price. When this alarm rings, it will compare
            against that price.
          </ThemedText>
        ) : (
          <ThemedText style={{ color: muted }}>
            Repeating alarms compare the live price to the price from 8 hours earlier.
          </ThemedText>
        )}
        <Pressable
          style={[styles.save, { backgroundColor: tint, opacity: saving ? 0.6 : 1 }]}
          onPress={save}
          disabled={saving}
        >
          <ThemedText style={{ color: onTint, fontWeight: '700' }}>
            {saving ? 'Saving…' : isNew ? 'Set alarm' : 'Save'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  timeTap: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  timeDisplay: { fontSize: 56, fontWeight: '700', lineHeight: 64, textAlign: 'center' },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mode: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  save: { marginTop: 12, borderRadius: 14, padding: 16, alignItems: 'center' },
});
