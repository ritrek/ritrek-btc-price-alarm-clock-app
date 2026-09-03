import { useMemo } from 'react';
import Constants from 'expo-constants';

import { ALL_BUNDLED_SOUNDS, getBundledSound } from '@/constants/Sounds';
import { useApp } from '@/context/AppContext';
import { BtcAlarm } from '@/modules/btc-alarm/src';
import { Mood } from '@/types';

function bundledPreviewSource(id: string): { uri: string } | null {
  const bundled = getBundledSound(id);
  const androidPackage = Constants.expoConfig?.android?.package;
  if (!bundled || !androidPackage) {
    return null;
  }
  return { uri: `android.resource://${androidPackage}/raw/${bundled.rawName}` };
}

export function soundTitle(id: string | null | undefined, userSounds: { id: string; title: string }[]): string {
  if (!id) {
    return 'Default';
  }
  const bundled = getBundledSound(id);
  if (bundled) {
    return `${bundled.composer} – ${bundled.title}`;
  }
  return userSounds.find((sound) => sound.id === id)?.title ?? id;
}

export function useSoundLibrary() {
  const { userSounds } = useApp();
  return useMemo(() => ({ userSounds, bundled: ALL_BUNDLED_SOUNDS }), [userSounds]);
}

export async function resolvePreviewUri(id: string, userSounds: { id: string }[]): Promise<{ uri: string }> {
  const bundled = bundledPreviewSource(id);
  if (bundled) {
    return bundled;
  }
  if (userSounds.some((sound) => sound.id === id)) {
    const path = await BtcAlarm.userSoundPath(id);
    if (path) {
      return { uri: path.startsWith('file://') ? path : `file://${path}` };
    }
  }
  throw new Error('Sound not found');
}

export function soundsForMood(mood: Mood) {
  return ALL_BUNDLED_SOUNDS.filter((sound) => sound.mood === mood);
}
