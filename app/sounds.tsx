import { Audio } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { NGU_SOUNDS, NGD_SOUNDS } from '@/constants/Sounds';
import { useApp } from '@/context/AppContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BtcAlarm } from '@/modules/btc-alarm/src';
import { BundledSound, Mood } from '@/types';
import { resolvePreviewUri } from '@/utils/sounds';

export default function SoundsScreen() {
  const { mood, scope, alarmId } = useLocalSearchParams<{
    mood?: Mood;
    scope?: string;
    alarmId?: string;
  }>();
  const { settings, saveSettings, alarms, saveAlarm, userSounds, refresh } = useApp();
  const alarm = alarms.find((item) => item.id === alarmId);
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'muted');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  const stopPreview = useCallback(async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    setPlayingId(null);
  }, [sound]);

  const playPreview = useCallback(async (id: string) => {
    await stopPreview();
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
    const source = await resolvePreviewUri(id, userSounds);
    const { sound: next } = await Audio.Sound.createAsync(source, { shouldPlay: true, isLooping: false });
    setSound(next);
    setPlayingId(id);
    next.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded || status.didJustFinish) {
        setPlayingId(null);
      }
    });
  }, [stopPreview, userSounds]);

  const select = async (id: string, which: Mood) => {
    if (scope === 'alarm' && alarm) {
      await saveAlarm({
        ...alarm,
        nguSoundId: which === 'ngu' ? id : alarm.nguSoundId,
        ngdSoundId: which === 'ngd' ? id : alarm.ngdSoundId,
      });
    } else if (which === 'ngu') {
      await saveSettings({ ...settings, defaultNguSoundId: id });
    } else {
      await saveSettings({ ...settings, defaultNgdSoundId: id });
    }
    await stopPreview();
  };

  const applyDefaultForAlarm = async (which: Mood) => {
    if (!alarm) {
      return;
    }
    await saveAlarm({
      ...alarm,
      nguSoundId: which === 'ngu' ? null : alarm.nguSoundId,
      ngdSoundId: which === 'ngd' ? null : alarm.ngdSoundId,
    });
  };

  const importSound = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*', 'video/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    const cache = FileSystem.cacheDirectory;
    if (!cache) {
      throw new Error('Cache directory unavailable');
    }
    let path = asset.uri;
    if (path.startsWith('content://')) {
      const dest = `${cache}${asset.name ?? 'import.mp3'}`;
      await FileSystem.copyAsync({ from: path, to: dest });
      path = dest;
    }
    const title = (asset.name ?? 'Custom sound').replace(/\.[^.]+$/, '');
    const imported = await BtcAlarm.importUserSound(path, title);
    const which: Mood = mood === 'ngd' ? 'ngd' : 'ngu';
    await select(imported.id, which);
    await refresh();
  };

  const renderList = (which: Mood) => {
    const bundled = which === 'ngu' ? NGU_SOUNDS : NGD_SOUNDS;
    const selected =
      scope === 'alarm'
        ? which === 'ngu'
          ? alarm?.nguSoundId
          : alarm?.ngdSoundId
        : which === 'ngu'
          ? settings.defaultNguSoundId
          : settings.defaultNgdSoundId;

    return (
      <View style={styles.section}>
        <ThemedText type="subtitle">{which === 'ngu' ? 'Number Go Up' : 'Number Go Down'}</ThemedText>
        {scope === 'alarm' ? (
          <Pressable
            onPress={() => applyDefaultForAlarm(which)}
            style={styles.defaultRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected == null }}
            accessibilityLabel="Use app default"
          >
            <Ionicons
              name={selected == null ? 'checkbox' : 'square-outline'}
              size={22}
              color={selected == null ? tint : muted}
            />
            <ThemedText type={selected == null ? undefined : 'link'} style={selected == null ? styles.defaultSelected : undefined}>
              Use app default
            </ThemedText>
          </Pressable>
        ) : null}
        {bundled.map((item: BundledSound) => (
          <SoundRow
            key={item.id}
            title={`${item.composer} – ${item.title}`}
            selected={selected === item.id}
            playing={playingId === item.id}
            onPlay={() => (playingId === item.id ? stopPreview() : playPreview(item.id))}
            onChoose={() => select(item.id, which)}
            card={card}
            tint={tint}
          />
        ))}
        {userSounds.map((item) => (
          <SoundRow
            key={item.id}
            title={item.title}
            selected={selected === item.id}
            playing={playingId === item.id}
            onPlay={() => (playingId === item.id ? stopPreview() : playPreview(item.id))}
            onChoose={() => select(item.id, which)}
            onDelete={() => {
              Alert.alert('Remove sound?', item.title, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await BtcAlarm.deleteUserSound(item.id);
                    await refresh();
                  },
                },
              ]);
            }}
            card={card}
            tint={tint}
          />
        ))}
      </View>
    );
  };

  const showNgu = !mood || mood === 'ngu';
  const showNgd = !mood || mood === 'ngd';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={{ color: muted }}>
          Tap a piece to select it. Play a preview first if you want.
        </ThemedText>
        {showNgu ? renderList('ngu') : null}
        {showNgd ? renderList('ngd') : null}
        <Pressable
          style={[styles.importBtn, { backgroundColor: card }]}
          onPress={importSound}
          accessibilityLabel="Add sound from file"
        >
          <Ionicons name="document-attach-outline" size={22} color={tint} />
          <ThemedText>Add sound from file…</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function SoundRow({
  title,
  selected,
  playing,
  onPlay,
  onChoose,
  onDelete,
  card,
  tint,
}: {
  title: string;
  selected: boolean;
  playing: boolean;
  onPlay: () => void;
  onChoose: () => void;
  onDelete?: () => void;
  card: string;
  tint: string;
}) {
  return (
    <Pressable
      onPress={onChoose}
      style={[styles.row, { backgroundColor: card, borderColor: selected ? tint : 'transparent', borderWidth: 2 }]}
    >
      <ThemedText style={styles.rowTitle}>{title}</ThemedText>
      <View style={styles.rowActions}>
        <Pressable onPress={onPlay} style={styles.playBtn} hitSlop={8}>
          <Ionicons name={playing ? 'stop' : 'play'} size={18} color={tint} />
          <ThemedText type="link">{playing ? 'Stop' : 'Play'}</ThemedText>
        </Pressable>
        {onDelete ? (
          <Pressable onPress={onDelete} style={styles.smallBtn} hitSlop={8}>
            <ThemedText style={{ color: '#c62828' }}>Delete</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  section: { gap: 10 },
  defaultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  defaultSelected: { fontWeight: '600' },
  row: { borderRadius: 14, padding: 12, gap: 8 },
  rowTitle: { fontWeight: '600' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  smallBtn: { paddingVertical: 6 },
  importBtn: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
