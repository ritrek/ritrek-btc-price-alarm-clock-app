import { BundledSound } from '@/types';

export const NGU_SOUNDS: BundledSound[] = [
  {
    id: 'ngu_offenbach_cancan',
    mood: 'ngu',
    title: 'Infernal Galop (“Can-Can”)',
    composer: 'Offenbach',
    assetFile: 'ngu/offenbach_cancan.mp3',
    rawName: 'ngu_offenbach_cancan',
  },
  {
    id: 'ngu_beethoven_ode_to_joy',
    mood: 'ngu',
    title: 'Ode to Joy',
    composer: 'Beethoven',
    assetFile: 'ngu/beethoven_ode_to_joy.mp3',
    rawName: 'ngu_beethoven_ode_to_joy',
  },
  {
    id: 'ngu_mozart_alla_turca',
    mood: 'ngu',
    title: 'Rondo Alla Turca (Turkish March)',
    composer: 'Mozart',
    assetFile: 'ngu/mozart_alla_turca.mp3',
    rawName: 'ngu_mozart_alla_turca',
  },
  {
    id: 'ngu_vivaldi_spring',
    mood: 'ngu',
    title: 'Spring, 1st movement',
    composer: 'Vivaldi',
    assetFile: 'ngu/vivaldi_spring.mp3',
    rawName: 'ngu_vivaldi_spring',
  },
  {
    id: 'ngu_rossini_william_tell',
    mood: 'ngu',
    title: 'William Tell Overture Finale',
    composer: 'Rossini',
    assetFile: 'ngu/rossini_william_tell.mp3',
    rawName: 'ngu_rossini_william_tell',
  },
  {
    id: 'ngu_handel_queen_of_sheba',
    mood: 'ngu',
    title: 'Arrival of the Queen of Sheba',
    composer: 'Handel',
    assetFile: 'ngu/handel_queen_of_sheba.mp3',
    rawName: 'ngu_handel_queen_of_sheba',
  },
  {
    id: 'ngu_mozart_nachtmusik',
    mood: 'ngu',
    title: 'Eine kleine Nachtmusik, 1st mov.',
    composer: 'Mozart',
    assetFile: 'ngu/mozart_nachtmusik.mp3',
    rawName: 'ngu_mozart_nachtmusik',
  },
  {
    id: 'ngu_strauss_blue_danube',
    mood: 'ngu',
    title: 'The Blue Danube',
    composer: 'Johann Strauss II',
    assetFile: 'ngu/strauss_blue_danube.mp3',
    rawName: 'ngu_strauss_blue_danube',
  },
  {
    id: 'ngu_strauss_radetzky',
    mood: 'ngu',
    title: 'Radetzky March',
    composer: 'Johann Strauss I',
    assetFile: 'ngu/strauss_radetzky.mp3',
    rawName: 'ngu_strauss_radetzky',
  },
  {
    id: 'ngu_handel_hallelujah',
    mood: 'ngu',
    title: 'Hallelujah Chorus',
    composer: 'Handel',
    assetFile: 'ngu/handel_hallelujah.mp3',
    rawName: 'ngu_handel_hallelujah',
  },
];

export const NGD_SOUNDS: BundledSound[] = [
  {
    id: 'ngd_chopin_funeral_march',
    mood: 'ngd',
    title: 'Funeral March',
    composer: 'Chopin',
    assetFile: 'ngd/chopin_funeral_march.mp3',
    rawName: 'ngd_chopin_funeral_march',
  },
  {
    id: 'ngd_mozart_lacrimosa',
    mood: 'ngd',
    title: 'Nocturne Op. 9 No. 2',
    composer: 'Chopin',
    assetFile: 'ngd/mozart_lacrimosa.mp3',
    rawName: 'ngd_mozart_lacrimosa',
  },
  {
    id: 'ngd_grieg_ases_death',
    mood: 'ngd',
    title: 'Nocturne Op. 9 No. 1',
    composer: 'Chopin',
    assetFile: 'ngd/grieg_ases_death.mp3',
    rawName: 'ngd_grieg_ases_death',
  },
  {
    id: 'ngd_chopin_prelude_4',
    mood: 'ngd',
    title: 'Gymnopédie No. 1',
    composer: 'Satie',
    assetFile: 'ngd/chopin_prelude_4.mp3',
    rawName: 'ngd_chopin_prelude_4',
  },
  {
    id: 'ngd_beethoven_moonlight',
    mood: 'ngd',
    title: 'Moonlight Sonata, 1st mov.',
    composer: 'Beethoven',
    assetFile: 'ngd/beethoven_moonlight.mp3',
    rawName: 'ngd_beethoven_moonlight',
  },
  {
    id: 'ngd_beethoven_symphony7',
    mood: 'ngd',
    title: 'Symphony No. 6 “Pathétique”, 4th mov.',
    composer: 'Tchaikovsky',
    assetFile: 'ngd/beethoven_symphony7.mp3',
    rawName: 'ngd_beethoven_symphony7',
  },
  {
    id: 'ngd_tchaikovsky_swan_lake',
    mood: 'ngd',
    title: 'Le Cygne (The Swan)',
    composer: 'Saint-Saëns',
    assetFile: 'ngd/tchaikovsky_swan_lake.mp3',
    rawName: 'ngd_tchaikovsky_swan_lake',
  },
  {
    id: 'ngd_dvorak_largo',
    mood: 'ngd',
    title: 'Prelude Op. 28 No. 15 (“Raindrop”)',
    composer: 'Chopin',
    assetFile: 'ngd/dvorak_largo.mp3',
    rawName: 'ngd_dvorak_largo',
  },
  {
    id: 'ngd_handel_sarabande',
    mood: 'ngd',
    title: 'Pathétique Sonata, 2nd mov.',
    composer: 'Beethoven',
    assetFile: 'ngd/handel_sarabande.mp3',
    rawName: 'ngd_handel_sarabande',
  },
  {
    id: 'ngd_bach_air',
    mood: 'ngd',
    title: 'Concerto for Two Violins, 2nd mov. (Largo)',
    composer: 'Bach',
    assetFile: 'ngd/bach_air.mp3',
    rawName: 'ngd_bach_air',
  },
];

export const ALL_BUNDLED_SOUNDS: BundledSound[] = [...NGU_SOUNDS, ...NGD_SOUNDS];

export const DEFAULT_NGU_SOUND_ID = NGU_SOUNDS[0].id;
export const DEFAULT_NGD_SOUND_ID = NGD_SOUNDS[0].id;
export const SNOOZE_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 30];
export const DEFAULT_SNOOZE_MINUTES = 5;

export function getBundledSound(id: string): BundledSound | undefined {
  return ALL_BUNDLED_SOUNDS.find((sound) => sound.id === id);
}
