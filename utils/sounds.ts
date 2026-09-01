import { useMemo } from 'react';

import { ALL_BUNDLED_SOUNDS, getBundledSound } from '@/constants/Sounds';
import { useApp } from '@/context/AppContext';
import { BtcAlarm } from '@/modules/btc-alarm/src';
import { Mood } from '@/types';

export const bundledSoundAssets: Record<string, number> = {
  ngu_offenbach_cancan: require('@/assets/sounds/ngu/offenbach_cancan.mp3'),
  ngu_beethoven_ode_to_joy: require('@/assets/sounds/ngu/beethoven_ode_to_joy.mp3'),
  ngu_mozart_alla_turca: require('@/assets/sounds/ngu/mozart_alla_turca.mp3'),
  ngu_vivaldi_spring: require('@/assets/sounds/ngu/vivaldi_spring.mp3'),
  ngu_rossini_william_tell: require('@/assets/sounds/ngu/rossini_william_tell.mp3'),
  ngu_handel_queen_of_sheba: require('@/assets/sounds/ngu/handel_queen_of_sheba.mp3'),
  ngu_mozart_nachtmusik: require('@/assets/sounds/ngu/mozart_nachtmusik.mp3'),
  ngu_strauss_blue_danube: require('@/assets/sounds/ngu/strauss_blue_danube.mp3'),
  ngu_strauss_radetzky: require('@/assets/sounds/ngu/strauss_radetzky.mp3'),
  ngu_handel_hallelujah: require('@/assets/sounds/ngu/handel_hallelujah.mp3'),
  ngd_chopin_funeral_march: require('@/assets/sounds/ngd/chopin_funeral_march.mp3'),
  ngd_mozart_lacrimosa: require('@/assets/sounds/ngd/mozart_lacrimosa.mp3'),
  ngd_grieg_ases_death: require('@/assets/sounds/ngd/grieg_ases_death.mp3'),
  ngd_chopin_prelude_4: require('@/assets/sounds/ngd/chopin_prelude_4.mp3'),
  ngd_beethoven_moonlight: require('@/assets/sounds/ngd/beethoven_moonlight.mp3'),
  ngd_beethoven_symphony7: require('@/assets/sounds/ngd/beethoven_symphony7.mp3'),
  ngd_tchaikovsky_swan_lake: require('@/assets/sounds/ngd/tchaikovsky_swan_lake.mp3'),
  ngd_dvorak_largo: require('@/assets/sounds/ngd/dvorak_largo.mp3'),
  ngd_handel_sarabande: require('@/assets/sounds/ngd/handel_sarabande.mp3'),
  ngd_bach_air: require('@/assets/sounds/ngd/bach_air.mp3'),
};

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

export async function resolvePreviewUri(id: string, userSounds: { id: string }[]): Promise<number | { uri: string }> {
  if (bundledSoundAssets[id]) {
    return bundledSoundAssets[id];
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
