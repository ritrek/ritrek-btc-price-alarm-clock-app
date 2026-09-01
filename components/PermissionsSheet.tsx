import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useApp } from '@/context/AppContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BtcAlarm } from '@/modules/btc-alarm/src';
import * as NotificationsStub from '@/utils/notifications';

interface Props {
  visible: boolean;
  onDone: () => void;
}

export default function PermissionsSheet({ visible, onDone }: Props) {
  const { permissions, refreshPermissions } = useApp();
  const card = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const onTint = useThemeColor({}, 'onTint');
  const muted = useThemeColor({}, 'muted');

  const rows = [
    {
      title: 'Notifications',
      ok: permissions?.notificationsGranted,
      action: async () => {
        await NotificationsStub.requestNotifications();
        if (BtcAlarm.isAvailable) {
          await BtcAlarm.openNotificationSettings();
        }
        await refreshPermissions();
      },
    },
    {
      title: 'Exact alarms',
      ok: permissions?.canScheduleExactAlarms,
      action: async () => {
        await BtcAlarm.openExactAlarmSettings();
        await refreshPermissions();
      },
    },
    {
      title: 'Full-screen alarm',
      ok: permissions?.canUseFullScreenIntent,
      action: async () => {
        await BtcAlarm.openFullScreenIntentSettings();
        await refreshPermissions();
      },
    },
    {
      title: 'Ignore battery optimization',
      ok: permissions?.ignoringBatteryOptimizations,
      action: async () => {
        await BtcAlarm.openBatteryOptimizationSettings();
        await refreshPermissions();
      },
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <ThemedView style={[styles.sheet, { backgroundColor: card }]}>
          <ThemedText type="subtitle">Keep alarms reliable</ThemedText>
          <ThemedText style={{ color: muted, marginTop: 8 }}>
            Android needs these so an alarm can ring at the exact time, even if the app is closed
            or the screen is locked. Some phones (Xiaomi, Oppo, Vivo, Huawei) also hide apps from
            autostart — allow this app there if alarms miss.
          </ThemedText>
          {rows.map((row) => (
            <Pressable key={row.title} style={styles.row} onPress={row.action}>
              <ThemedText>{row.title}</ThemedText>
              <ThemedText type="link">{row.ok ? 'On' : 'Enable'}</ThemedText>
            </Pressable>
          ))}
          <Pressable style={[styles.done, { backgroundColor: tint }]} onPress={onDone}>
            <ThemedText style={{ color: onTint, fontWeight: '600' }}>Continue</ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000088',
  },
  sheet: {
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  done: {
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
});
