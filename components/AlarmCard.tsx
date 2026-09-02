import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import AlarmOptionsSheet from '@/components/AlarmOptionsSheet';
import PressableView from '@/components/PressableView';
import { ThemedText } from '@/components/ThemedText';
import WeekdayPicker from '@/components/WeekdayPicker';
import { useApp } from '@/context/AppContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Alarm } from '@/types';
import { formatAlarmTime, formatAlarmTimeParts, nextOccurrenceLabel, subtractHoursFromAlarmTime } from '@/utils/format';
import { formatUsd } from '@/utils/price';
import { formatSnoozeCountdown, useSnoozeRemaining } from '@/utils/snooze';
import { soundTitle } from '@/utils/sounds';

const DELETE_DISTANCE = 96;
/** Android/iOS switch thumb animation is ~200ms; wait it out before dimming/saving. */
const SWITCH_ANIMATION_MS = 280;

interface Props {
  alarm: Alarm;
  onToggle: (enabled: boolean) => void | Promise<void>;
}

export default function AlarmCard({ alarm, onToggle }: Props) {
  const { uses24Hour, deleteAlarm, userSounds, settings } = useApp();
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'muted');
  const errorBg = useThemeColor({}, 'errorBackground');
  const onError = useThemeColor({}, 'onErrorBackground');
  const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);
  const [effectsEnabled, setEffectsEnabled] = useState(alarm.enabled);
  const switchOn = pendingEnabled ?? alarm.enabled;
  const displayAlarm = { ...alarm, enabled: effectsEnabled };
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openTimePicker, setOpenTimePicker] = useState(false);
  const deleting = useRef(false);
  const onToggleRef = useRef(onToggle);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parts = formatAlarmTimeParts(alarm.hour, alarm.minute, uses24Hour);
  const snoozeRemaining = useSnoozeRemaining(alarm.snoozeUntil);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const cardWidth = useSharedValue(300);

  onToggleRef.current = onToggle;

  useEffect(() => {
    return () => {
      if (settleTimer.current) {
        clearTimeout(settleTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pendingEnabled == null) {
      setEffectsEnabled(alarm.enabled);
      return;
    }
    if (alarm.enabled === pendingEnabled) {
      setPendingEnabled(null);
      setEffectsEnabled(alarm.enabled);
    }
  }, [alarm.enabled, pendingEnabled]);

  const handleToggle = (value: boolean) => {
    setPendingEnabled(value);
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
    }
    settleTimer.current = setTimeout(() => {
      settleTimer.current = null;
      setEffectsEnabled(value);
      void Promise.resolve(onToggleRef.current(value)).catch(() => {
        setPendingEnabled(null);
      });
    }, SWITCH_ANIMATION_MS);
  };

  const remove = () => {
    if (deleting.current) {
      return;
    }
    deleting.current = true;
    setSheetOpen(false);
    void deleteAlarm(alarm.id);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-16, 16])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) >= DELETE_DISTANCE) {
        const offscreen = (translateX.value > 0 ? 1 : -1) * (cardWidth.value + 24);
        translateX.value = withTiming(offscreen, { duration: 160 }, (finished) => {
          if (finished) {
            runOnJS(remove)();
          }
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    });

  const cardMotion = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftBinStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 8 ? 1 : 0,
  }));

  const rightBinStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -8 ? 1 : 0,
  }));

  const openSheet = () => {
    setOpenTimePicker(false);
    setSheetOpen(true);
  };

  const openSheetWithTime = () => {
    setOpenTimePicker(true);
    setSheetOpen(true);
  };

  const comparisonLine = (() => {
    if (alarm.mode === 'once') {
      if (!effectsEnabled || alarm.baselinePriceUsd == null) {
        return null;
      }
      return `The price at alarm time will be compared to ${formatUsd(alarm.baselinePriceUsd)}.`;
    }
    const compareAt = subtractHoursFromAlarmTime(
      alarm.hour,
      alarm.minute,
      settings.comparisonLookbackHours
    );
    return `The price at alarm time will be compared to the price at ${formatAlarmTime(compareAt.hour, compareAt.minute, uses24Hour)}.`;
  })();

  return (
    <>
      <View
        style={styles.swipeWrap}
        onLayout={(event) => {
          cardWidth.value = event.nativeEvent.layout.width;
        }}
      >
        <View
          style={[styles.deleteUnderlay, { backgroundColor: errorBg }]}
          pointerEvents="none"
        >
          <Animated.View style={[styles.binLeft, leftBinStyle]}>
            <Ionicons name="trash" size={26} color={onError} />
          </Animated.View>
          <Animated.View style={[styles.binRight, rightBinStyle]}>
            <Ionicons name="trash" size={26} color={onError} />
          </Animated.View>
        </View>
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[styles.card, { backgroundColor: card }, cardMotion]}
          >
            <View style={styles.cardTop}>
              <PressableView
                onPress={openSheet}
                style={[styles.main, { opacity: effectsEnabled ? 1 : 0.55 }]}
                accessibilityLabel="Alarm options"
              >
                <ThemedText style={[styles.when, { color: muted }]}>{nextOccurrenceLabel(displayAlarm)}</ThemedText>
                <View style={styles.timeRow}>
                  <Pressable onPress={openSheetWithTime} accessibilityLabel="Change alarm time">
                    <ThemedText style={styles.time}>{parts.time}</ThemedText>
                  </Pressable>
                  {parts.period ? (
                    <ThemedText style={[styles.period, { color: muted }]}>{parts.period}</ThemedText>
                  ) : null}
                </View>
              </PressableView>
              <View style={styles.switchWrap}>
                <Switch value={switchOn} onValueChange={handleToggle} />
              </View>
            </View>
            {alarm.mode !== 'once' || alarm.nguSoundId || alarm.ngdSoundId ? (
              <PressableView
                onPress={openSheet}
                style={[styles.details, { opacity: effectsEnabled ? 1 : 0.55 }]}
                accessibilityLabel="Alarm options"
              >
                {alarm.mode === 'daily' ? (
                  <ThemedText style={[styles.detail, { color: muted }]}>Every day</ThemedText>
                ) : alarm.mode === 'custom' ? (
                  <WeekdayPicker selected={alarm.days} compact />
                ) : null}
                {alarm.nguSoundId ? (
                  <ThemedText style={[styles.detail, { color: muted }]} numberOfLines={1}>
                    Number Go Up Sound · {soundTitle(alarm.nguSoundId, userSounds)}
                  </ThemedText>
                ) : null}
                {alarm.ngdSoundId ? (
                  <ThemedText style={[styles.detail, { color: muted }]} numberOfLines={1}>
                    Number Go Down Sound · {soundTitle(alarm.ngdSoundId, userSounds)}
                  </ThemedText>
                ) : null}
              </PressableView>
            ) : null}
            {comparisonLine ? (
              <PressableView
                onPress={openSheet}
                style={[styles.comparison, { opacity: effectsEnabled ? 1 : 0.55 }]}
                accessibilityLabel="Alarm options"
              >
                <ThemedText style={[styles.detail, { color: muted }]}>{comparisonLine}</ThemedText>
              </PressableView>
            ) : null}
            {snoozeRemaining != null ? (
              <PressableView
                onPress={openSheet}
                style={styles.snoozeRow}
                accessibilityLabel={`Snoozed, ${formatSnoozeCountdown(snoozeRemaining)} remaining`}
              >
                <ThemedText style={[styles.when, { color: muted }]}>Snoozed</ThemedText>
                <ThemedText style={[styles.when, { color: muted }]}>
                  {formatSnoozeCountdown(snoozeRemaining)}
                </ThemedText>
              </PressableView>
            ) : null}
          </Animated.View>
        </GestureDetector>
      </View>
      <AlarmOptionsSheet
        alarm={alarm}
        visible={sheetOpen}
        openTimePicker={openTimePicker}
        onClose={() => {
          setSheetOpen(false);
          setOpenTimePicker(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  swipeWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  deleteUnderlay: {
    ...StyleSheet.absoluteFillObject,
  },
  binLeft: {
    position: 'absolute',
    left: 24,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  binRight: {
    position: 'absolute',
    right: 24,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  main: { flex: 1, gap: 2, minWidth: 0 },
  when: { fontSize: 16, lineHeight: 22 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  time: { fontSize: 40, fontWeight: '700', lineHeight: 46 },
  period: { fontSize: 18, fontWeight: '600', lineHeight: 28, marginBottom: 4 },
  snoozeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  details: { gap: 2, paddingTop: 4 },
  comparison: { paddingTop: 4 },
  detail: { fontSize: 14, lineHeight: 20 },
  switchWrap: {
    flexShrink: 0,
    marginLeft: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    transform: [{ scale: 1.4 }],
  },
});
