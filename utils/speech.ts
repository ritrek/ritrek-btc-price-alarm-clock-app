import * as Speech from 'expo-speech';

import { usdToSpokenWords } from '@/utils/price';

function voiceLabel(voice: Speech.Voice): string {
  return `${voice.name} ${voice.identifier}`.toLowerCase();
}

function isFemaleVoice(voice: Speech.Voice): boolean {
  const label = voiceLabel(voice);
  if (/male|#male|\bmale_|\btpd\b|\biol\b|\biom\b/.test(label) && !/female/.test(label)) {
    return false;
  }
  return /female|#female|\bfemale_|\bsfg\b|\btpf\b|\biob\b|\biog\b|samantha|karen|moira|tessa|fiona|victoria|kate|susan|zira|hazel|jenny|aria|salli|joanna|ivy|kendra|kimberly|nicole|raveena|aditi|neural2-[cfgh]|wavenet-[cefgh]|standard-[cefgh]/.test(
    label
  );
}

function isHighQuality(voice: Speech.Voice): boolean {
  return /neural|wavenet|network|enhanced|natural/.test(voiceLabel(voice));
}

async function pickVoice(): Promise<string | undefined> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const en = voices.filter((voice) => voice.language?.toLowerCase().startsWith('en'));
    const pool = en.filter(isFemaleVoice);
    const candidates = pool.length > 0 ? pool : en;
    const neural = candidates.find(isHighQuality);
    const googleEnUs = candidates.find(
      (voice) => /en-us/i.test(voice.language) && /google|en-us-x-/.test(voiceLabel(voice))
    );
    const enUs = candidates.find((voice) => /en-us/i.test(voice.language));
    return (neural ?? googleEnUs ?? enUs ?? candidates[0])?.identifier;
  } catch {
    return undefined;
  }
}

export async function speakBitcoinPrice(usd: number): Promise<void> {
  const voice = await pickVoice();
  const text = `The Bitcoin price is ${usdToSpokenWords(usd)}.`;
  await Speech.stop();
  Speech.speak(text, {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.9,
    voice,
  });
}
