import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Appearance, Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ClockFormat } from '@/types';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LOOKBACK_HOURS, SNOOZE_OPTIONS } from '@/constants/Sounds';
import { useApp } from '@/context/AppContext';
import { useThemeColor } from '@/hooks/useThemeColor';

function snoozeLabel(minutes: number) {
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function lookbackLabel(hours: number) {
  return `${hours} hours earlier`;
}

export default function SettingsScreen() {
  const { refreshPermissions, clockFormat, setClockFormat, settings, saveSettings } = useApp();
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [lookbackOpen, setLookbackOpen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('color_theme').then((value) => {
      if (value === 'light' || value === 'dark') {
        setTheme(value);
      }
    });
  }, []);

  const applyTheme = useCallback(async (next: 'light' | 'dark' | 'system') => {
    setTheme(next);
    if (next === 'system') {
      await AsyncStorage.removeItem('color_theme');
      Appearance.setColorScheme(null);
    } else {
      await AsyncStorage.setItem('color_theme', next);
      Appearance.setColorScheme(next);
    }
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Appearance</ThemedText>
        {(['system', 'light', 'dark'] as const).map((option) => {
          const selected = theme === option;
          return (
            <Pressable
              key={option}
              style={[
                styles.row,
                styles.choiceRow,
                { backgroundColor: card, borderColor: selected ? tint : 'transparent' },
              ]}
              onPress={() => applyTheme(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <ThemedText style={{ textTransform: 'capitalize' }}>{option}</ThemedText>
            </Pressable>
          );
        })}

        <ThemedText type="subtitle">Clock</ThemedText>
        {(
          [
            { id: 'system' as ClockFormat, label: 'System default' },
            { id: '12h' as ClockFormat, label: '12-hour (AM/PM)' },
            { id: '24h' as ClockFormat, label: '24-hour' },
          ]
        ).map((option) => {
          const selected = clockFormat === option.id;
          return (
            <Pressable
              key={option.id}
              style={[
                styles.row,
                styles.choiceRow,
                { backgroundColor: card, borderColor: selected ? tint : 'transparent' },
              ]}
              onPress={() => void setClockFormat(option.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <ThemedText>{option.label}</ThemedText>
            </Pressable>
          );
        })}

        <ThemedText type="subtitle">Snooze Time</ThemedText>
        <Pressable
          style={[styles.row, styles.snoozeTrigger, { backgroundColor: card }]}
          onPress={() => setSnoozeOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Snooze Time"
        >
          <ThemedText>{snoozeLabel(settings.snoozeMinutes)}</ThemedText>
          <View style={styles.snoozeChevron} pointerEvents="none">
            <Ionicons name="chevron-down" size={18} color={muted} />
          </View>
        </Pressable>

        <ThemedText type="subtitle">Vibration</ThemedText>
        <View style={[styles.row, { backgroundColor: card }]}>
          <ThemedText style={styles.rowLabel}>Vibrate when the alarm rings</ThemedText>
          <Switch
            value={settings.vibrationEnabled}
            onValueChange={(value) => void saveSettings({ ...settings, vibrationEnabled: value })}
            accessibilityLabel="Vibrate when the alarm rings"
          />
        </View>

        <ThemedText type="subtitle">Repeating alarms</ThemedText>
        <ThemedText style={{ color: muted }}>
          When a repeating alarm rings, compare Bitcoin’s price to the price from:
        </ThemedText>
        <Pressable
          style={[styles.row, styles.snoozeTrigger, { backgroundColor: card }]}
          onPress={() => setLookbackOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Comparison lookback"
        >
          <ThemedText>{lookbackLabel(settings.comparisonLookbackHours)}</ThemedText>
          <View style={styles.snoozeChevron} pointerEvents="none">
            <Ionicons name="chevron-down" size={18} color={muted} />
          </View>
        </Pressable>

        <ThemedText type="subtitle">Permissions</ThemedText>
        <Pressable
          style={[styles.row, { backgroundColor: card }]}
          onPress={async () => {
            await AsyncStorage.removeItem('asked_onboarding');
            await refreshPermissions();
            Alert.alert('Open the alarm list', 'The permissions sheet will show again on the home screen.');
          }}
        >
          <ThemedText>Review alarm permissions</ThemedText>
        </Pressable>

        <ThemedText type="subtitle">About</ThemedText>
        <View style={[styles.row, { backgroundColor: card }]}>
          <ThemedText>Version</ThemedText>
          <ThemedText style={{ color: muted }}>
            {Constants.expoConfig?.version ?? '—'}
          </ThemedText>
        </View>
        <Pressable
          style={[styles.row, { backgroundColor: card }]}
          onPress={() => router.push('/licenses')}
          accessibilityRole="button"
          accessibilityLabel="Licenses"
        >
          <ThemedText>Licenses</ThemedText>
          <Ionicons name="chevron-forward" size={18} color={muted} />
        </Pressable>
      </ScrollView>

      <Modal
        visible={snoozeOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSnoozeOpen(false)}
      >
        <View style={styles.dialogOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSnoozeOpen(false)} />
          <View style={[styles.dialog, { backgroundColor: card }]} accessibilityViewIsModal>
            <ThemedText type="subtitle" style={styles.dialogTitle}>
              Snooze Time
            </ThemedText>
            {SNOOZE_OPTIONS.map((minutes) => {
              const selected = settings.snoozeMinutes === minutes;
              return (
                <Pressable
                  key={minutes}
                  style={styles.dialogOption}
                  onPress={() => {
                    void saveSettings({ ...settings, snoozeMinutes: minutes });
                    setSnoozeOpen(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={selected ? tint : muted}
                  />
                  <ThemedText style={selected ? { color: tint, fontWeight: '600' } : undefined}>
                    {snoozeLabel(minutes)}
                  </ThemedText>
                </Pressable>
              );
            })}
            <Pressable
              style={styles.dialogCancel}
              onPress={() => setSnoozeOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <ThemedText type="link">Cancel</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={lookbackOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLookbackOpen(false)}
      >
        <View style={styles.dialogOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLookbackOpen(false)} />
          <View style={[styles.dialog, { backgroundColor: card }]} accessibilityViewIsModal>
            <ThemedText type="subtitle" style={styles.dialogTitle}>
              Compare to the price from
            </ThemedText>
            {LOOKBACK_HOURS.map((hours) => {
              const selected = settings.comparisonLookbackHours === hours;
              return (
                <Pressable
                  key={hours}
                  style={styles.dialogOption}
                  onPress={() => {
                    void saveSettings({ ...settings, comparisonLookbackHours: hours });
                    setLookbackOpen(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={selected ? tint : muted}
                  />
                  <ThemedText style={selected ? { color: tint, fontWeight: '600' } : undefined}>
                    {lookbackLabel(hours)}
                  </ThemedText>
                </Pressable>
              );
            })}
            <Pressable
              style={styles.dialogCancel}
              onPress={() => setLookbackOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <ThemedText type="link">Cancel</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  row: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    flex: 1,
  },
  choiceRow: {
    borderWidth: 2,
  },
  snoozeTrigger: {
    justifyContent: 'center',
  },
  snoozeChevron: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  dialogOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    paddingTop: 20,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  dialogTitle: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  dialogOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dialogCancel: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
