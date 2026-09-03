import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Modal, Pressable, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import WeekdayPicker from '@/components/WeekdayPicker';
import { useApp } from '@/context/AppContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Alarm, Mood, RepeatMode } from '@/types';
import { applyOnceBaseline } from '@/utils/alarm';
import { formatAlarmTime, nextOccurrenceLabel } from '@/utils/format';
import { soundTitle } from '@/utils/sounds';

const MODES: { id: RepeatMode; label: string }[] = [
  { id: 'once', label: 'Once' },
  { id: 'daily', label: 'Every day' },
  { id: 'custom', label: 'Custom days' },
];

const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 800;

interface Props {
  alarm: Alarm;
  visible: boolean;
  onClose: () => void;
  openTimePicker?: boolean;
}

export default function AlarmOptionsSheet({ alarm, visible, onClose, openTimePicker = false }: Props) {
  const { deleteAlarm, saveAlarm, uses24Hour, userSounds } = useApp();
  const insets = useSafeAreaInsets();
  const card = useThemeColor({}, 'card');
  const secondCard = useThemeColor({}, 'secondCard');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');
  const onTint = useThemeColor({}, 'onTint');
  const [showPicker, setShowPicker] = useState(false);
  const [hour, setHour] = useState(alarm.hour);
  const [minute, setMinute] = useState(alarm.minute);
  const translateY = useSharedValue(0);

  useEffect(() => {
    setHour(alarm.hour);
    setMinute(alarm.minute);
  }, [alarm.hour, alarm.minute]);

  useEffect(() => {
    if (!visible) {
      setShowPicker(false);
      return;
    }
    if (!openTimePicker) {
      return;
    }
    const id = setTimeout(() => setShowPicker(true), 250);
    return () => clearTimeout(id);
  }, [visible, openTimePicker]);

  const timeValue = new Date();
  timeValue.setHours(hour, minute, 0, 0);

  const commit = useCallback(
    async (next: Alarm, recaptureOnce: boolean) => {
      try {
        const saved = await saveAlarm(next);
        if (!recaptureOnce || saved.mode !== 'once') {
          return;
        }
        await saveAlarm(await applyOnceBaseline(saved));
      } catch (error) {
        Alert.alert('Could not save alarm', error instanceof Error ? error.message : 'Unknown error');
      }
    },
    [saveAlarm]
  );

  const persistTime = useCallback(
    (nextHour: number, nextMinute: number) => {
      if (nextHour === alarm.hour && nextMinute === alarm.minute) {
        return;
      }
      void commit({ ...alarm, hour: nextHour, minute: nextMinute }, alarm.mode === 'once');
    },
    [alarm, commit]
  );

  const handleClose = useCallback(() => {
    setShowPicker(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      translateY.value = 0;
    }
  }, [translateY, visible]);

  const pan = Gesture.Pan()
    .activeOffsetY([16, 1_000])
    .failOffsetX([-32, 32])
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    });

  const sheetMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const onTimeChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      setShowPicker(false);
      if (event.type === 'dismissed' || !date) {
        return;
      }
      setHour(date.getHours());
      setMinute(date.getMinutes());
      persistTime(date.getHours(), date.getMinutes());
    },
    [persistTime]
  );

  const setMode = (mode: RepeatMode) => {
    if (mode === alarm.mode) {
      return;
    }
    const days = mode === 'custom' && !alarm.days.length ? [1, 2, 3, 4, 5] : alarm.days;
    void commit({ ...alarm, mode, days }, mode === 'once');
  };

  const goSound = (mood: Mood) => {
    router.push({
      pathname: '/sounds',
      params: { alarmId: alarm.id, scope: 'alarm', mood },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <GestureHandlerRootView style={styles.modalRoot}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} accessibilityLabel="Dismiss" />
        <Animated.View
          style={[
            styles.sheet,
            sheetMotion,
            { backgroundColor: card, paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={styles.handleHit} accessibilityLabel="Swipe down to dismiss" collapsable={false}>
              <View style={[styles.handle, { backgroundColor: muted }]} />
            </View>
          </GestureDetector>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            bounces={false}
            contentContainerStyle={styles.sheetContent}
          >
            <Pressable
              onPress={() => setShowPicker(true)}
              accessibilityLabel="Change time"
            >
              <ThemedText style={styles.time}>
                {formatAlarmTime(hour, minute, uses24Hour)}
              </ThemedText>
              <ThemedText style={{ color: muted }}>{nextOccurrenceLabel(alarm)}</ThemedText>
            </Pressable>
            {showPicker ? (
              <DateTimePicker
                value={timeValue}
                mode="time"
                display="default"
                is24Hour={uses24Hour}
                onChange={onTimeChange}
              />
            ) : null}

            <View style={styles.modes}>
              {MODES.map((item) => {
                const active = alarm.mode === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setMode(item.id)}
                    hitSlop={6}
                    style={[styles.mode, { backgroundColor: active ? tint : secondCard }]}
                  >
                    <ThemedText style={{ color: active ? onTint : undefined, fontWeight: '600' }}>
                      {item.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {alarm.mode === 'custom' ? (
              <WeekdayPicker
                selected={alarm.days}
                onChange={(days) => {
                  if (days.length === 0) {
                    Alert.alert('Pick at least one day');
                    return;
                  }
                  void commit({ ...alarm, mode: 'custom', days }, false);
                }}
              />
            ) : null}

            <Pressable style={styles.row} onPress={() => goSound('ngu')}>
              <ThemedText style={styles.rowLabel}>Number Go Up Sound</ThemedText>
              <ThemedText style={[styles.rowValue, { color: muted }]} numberOfLines={1}>
                {soundTitle(alarm.nguSoundId, userSounds)}
              </ThemedText>
            </Pressable>
            <Pressable style={styles.row} onPress={() => goSound('ngd')}>
              <ThemedText style={styles.rowLabel}>Number Go Down Sound</ThemedText>
              <ThemedText style={[styles.rowValue, { color: muted }]} numberOfLines={1}>
                {soundTitle(alarm.ngdSoundId, userSounds)}
              </ThemedText>
            </Pressable>
            <Pressable
              style={styles.row}
              onPress={() => {
                onClose();
                void deleteAlarm(alarm.id);
              }}
            >
              <ThemedText style={{ color: '#c62828' }}>Delete</ThemedText>
            </Pressable>
            </ScrollView>
        </Animated.View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000088',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '90%',
  },
  sheetContent: { gap: 12, paddingBottom: 8 },
  handleHit: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  time: { fontSize: 32, fontWeight: '700', lineHeight: 38 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, zIndex: 1 },
  mode: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowLabel: { flexShrink: 0 },
  rowValue: { flex: 1, textAlign: 'right' },
});
