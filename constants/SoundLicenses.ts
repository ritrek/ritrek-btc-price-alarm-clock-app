export type LicenseLink = {
  label: string;
  url: string;
};

export type SoundLicenseEntry = {
  file: string;
  work: string;
  recording: string;
  source: LicenseLink;
  license: LicenseLink;
  extraLinks?: LicenseLink[];
  changes: string;
  note?: string;
};

const TO_MP3 = 'Converted to 128 kbps MP3.';

const CC_BY_SA_4_0: LicenseLink = {
  label: 'CC BY-SA 4.0',
  url: 'https://creativecommons.org/licenses/by-sa/4.0/',
};

const CC_BY_SA_3_0: LicenseLink = {
  label: 'CC BY-SA 3.0',
  url: 'https://creativecommons.org/licenses/by-sa/3.0/',
};

const CC_BY_SA_3_0_DE: LicenseLink = {
  label: 'CC BY-SA 3.0 DE',
  url: 'https://creativecommons.org/licenses/by-sa/3.0/de/',
};

const CC_BY_SA_2_0: LicenseLink = {
  label: 'CC BY-SA 2.0',
  url: 'https://creativecommons.org/licenses/by-sa/2.0/',
};

const CC0: LicenseLink = {
  label: 'CC0 1.0',
  url: 'https://creativecommons.org/publicdomain/zero/1.0/',
};

const PD_US_GOV: LicenseLink = {
  label: 'U.S. government work (public domain)',
  url: 'https://www.usa.gov/government-works',
};

const PD_COMMONS: LicenseLink = {
  label: 'Public domain (as marked on Wikimedia Commons)',
  url: 'https://creativecommons.org/publicdomain/mark/1.0/',
};

export const NGU_RECORDING_LICENSES: SoundLicenseEntry[] = [
  {
    file: 'ngu/offenbach_cancan.mp3',
    work: 'Jacques Offenbach – Orpheus in the Underworld, Infernal Galop (Can-Can)',
    recording: 'Musopen recording, via Wikimedia Commons',
    source: {
      label: 'File:Offenbach - Orpheus in the Underworld - Overture, Can Can section.ogg',
      url: 'https://commons.wikimedia.org/wiki/File:Offenbach_-_Orpheus_in_the_Underworld_-_Overture,_Can_Can_section.ogg',
    },
    extraLinks: [
      {
        label: 'Musopen: Famous Overtures No. 3',
        url: 'https://musopen.org/music/1382/jacques-offenbach/famous-overtures-no3/',
      },
    ],
    license: PD_COMMONS,
    changes: TO_MP3,
  },
  {
    file: 'ngu/beethoven_ode_to_joy.mp3',
    work: 'Ludwig van Beethoven – Symphony No. 9, Ode to Joy (excerpt)',
    recording: 'Mutopia MIDI realization, converted to Ogg by Wikimedia user Raul654',
    source: {
      label: 'File:Ode to Joy.ogg',
      url: 'https://commons.wikimedia.org/wiki/File:Ode_to_Joy.ogg',
    },
    license: PD_COMMONS,
    changes: TO_MP3,
  },
  {
    file: 'ngu/mozart_alla_turca.mp3',
    work: 'Wolfgang Amadeus Mozart – Piano Sonata No. 11, Rondo Alla Turca',
    recording: 'Mutopia MIDI realization (KV331_3_RondoAllaTurca.mid)',
    source: {
      label: 'File:Rondo Alla Turka.ogg',
      url: 'https://commons.wikimedia.org/wiki/File:Rondo_Alla_Turka.ogg',
    },
    license: PD_COMMONS,
    changes: TO_MP3,
  },
  {
    file: 'ngu/vivaldi_spring.mp3',
    work: 'Antonio Vivaldi – The Four Seasons, Spring, 1st movement (Allegro)',
    recording:
      'John Harrison, violin; Robert Turizziani, conductor; Wichita State University Chamber Players. Live performance, Wiedemann Recital Hall, 6 February 2000. Recording copyright John Harrison (JohnHarrisonViolin.com).',
    source: {
      label: 'File:Vivaldi - Four Seasons 1 Spring mvt 1 Allegro - John Harrison violin.oga',
      url: 'https://commons.wikimedia.org/wiki/File:Vivaldi_-_Four_Seasons_1_Spring_mvt_1_Allegro_-_John_Harrison_violin.oga',
    },
    extraLinks: [{ label: 'JohnHarrisonViolin.com', url: 'https://johnharrisonviolin.com/' }],
    license: CC_BY_SA_4_0,
    changes: TO_MP3,
    note: 'John Harrison published this recording under CC BY-SA 1.0 and later versions; this app uses it under CC BY-SA 4.0.',
  },
  {
    file: 'ngu/rossini_william_tell.mp3',
    work: 'Gioachino Rossini – William Tell Overture, finale (transcribed for band by Wenzel Sedlak)',
    recording: 'United States Marine Band, directed by Timothy Foley. Album Grand Scenes (2000).',
    source: {
      label: 'File:Gioachino Rossini, William Tell Overture (military band version, 2000).ogg',
      url: 'https://commons.wikimedia.org/wiki/File:Gioachino_Rossini,_William_Tell_Overture_(military_band_version,_2000).ogg',
    },
    license: PD_US_GOV,
    changes: 'Excerpt of the finale (from 7:30 to the end of the source recording). Converted to 128 kbps MP3.',
  },
  {
    file: 'ngu/handel_queen_of_sheba.mp3',
    work: 'George Frideric Handel – Arrival of the Queen of Sheba (from Solomon, HWV 67)',
    recording:
      'Advent Chamber Orchestra, November 2006. Roxanna Pavel Goldstein, musical director; Elias Goldstein, orchestra manager; Humbert Lucarelli and Edino Biaggi, oboes. From the Al Goldstein collection in the Pandora Music repository at ibiblio.org.',
    source: {
      label: 'File:Handel - Arrival of the Queen of Sheba.ogg',
      url: 'https://commons.wikimedia.org/wiki/File:Handel_-_Arrival_of_the_Queen_of_Sheba.ogg',
    },
    extraLinks: [
      {
        label: 'ibiblio Pandora Music',
        url: 'https://music.ibiblio.org/pub/multimedia/pandora/vorbis/index.html',
      },
    ],
    license: CC_BY_SA_2_0,
    changes: TO_MP3,
  },
  {
    file: 'ngu/mozart_nachtmusik.mp3',
    work: 'Wolfgang Amadeus Mozart – Serenade No. 13, Eine kleine Nachtmusik, K. 525, 1st movement',
    recording: 'Musopen / European Archive, via Wikimedia Commons',
    source: {
      label: 'File:Mozart K525 Serenade in G Major 1 - Allegro.ogg',
      url: 'https://commons.wikimedia.org/wiki/File:Mozart_K525_Serenade_in_G_Major_1_-_Allegro.ogg',
    },
    extraLinks: [
      {
        label: 'Musopen: Eine kleine Nachtmusik',
        url: 'https://musopen.org/music/28074-serenade-no-13-a-little-night-music-eine-kleine-nachtmusik-k-525/',
      },
    ],
    license: PD_COMMONS,
    changes: TO_MP3,
  },
  {
    file: 'ngu/strauss_blue_danube.mp3',
    work: 'Johann Strauss II – An der schönen, blauen Donau (The Blue Danube), Op. 314',
    recording: 'United States Marine Band, conducted by Albert F. Schoepper (c. 1972).',
    source: {
      label: 'File:"An der schönen, blauen Donau" performed by the U.S. Marine Band.mp3',
      url: 'https://commons.wikimedia.org/wiki/File:%22An_der_sch%C3%B6nen,_blauen_Donau%22_performed_by_the_U.S._Marine_Band.mp3',
    },
    license: PD_US_GOV,
    changes: TO_MP3,
  },
  {
    file: 'ngu/strauss_radetzky.mp3',
    work: 'Johann Strauss I – Radetzky March, Op. 228',
    recording:
      'United States Marine Band, conducted by John R. Bourgeois. From Sound Off!, recorded 18–21 May 1992 at the Center for the Arts, George Mason University.',
    source: {
      label: 'File:Radetzky March.ogg',
      url: 'https://commons.wikimedia.org/wiki/File:Radetzky_March.ogg',
    },
    extraLinks: [
      {
        label: 'U.S. Marine Band audio',
        url: 'https://www.marineband.marines.mil/Portals/175/Docs/Audio/Educational_Series/sound_off/radetzky_march.mp3',
      },
    ],
    license: PD_US_GOV,
    changes: TO_MP3,
  },
  {
    file: 'ngu/handel_hallelujah.mp3',
    work: 'George Frideric Handel – Messiah, Hallelujah Chorus',
    recording: 'Oratorio Chorus, Edison recording, May 1916. Via Wikimedia Commons / Internet Archive.',
    source: {
      label: 'File:Handel Messiah Hallelujah by Oratorio Chorus.ogg',
      url: 'https://commons.wikimedia.org/wiki/File:Handel_Messiah_Hallelujah_by_Oratorio_Chorus.ogg',
    },
    license: PD_COMMONS,
    changes: TO_MP3,
  },
];

export const NGD_RECORDING_LICENSES: SoundLicenseEntry[] = [
  {
    file: 'ngd/chopin_funeral_march.mp3',
    work: 'Frédéric Chopin – Piano Sonata No. 2, 3rd movement (Marche funèbre)',
    recording:
      'Bernd Krueger (piano-midi.de). Created in MIDI and rendered on the virtual piano Pianoteq, 7 August 2010.',
    source: {
      label: 'File:Chopin Sonata no 2 3rd movement.ogg',
      url: 'https://commons.wikimedia.org/wiki/File:Chopin_Sonata_no_2_3rd_movement.ogg',
    },
    extraLinks: [{ label: 'piano-midi.de', url: 'http://www.piano-midi.de/' }],
    license: CC_BY_SA_3_0_DE,
    changes: TO_MP3,
  },
  {
    file: 'ngd/mozart_lacrimosa.mp3',
    work: 'Frédéric Chopin – Nocturne Op. 9 No. 2 in E-flat major (stand-in for Mozart Lacrimosa)',
    recording: 'Musopen Complete Chopin Collection (Aaron Dunn / Musopen)',
    source: {
      label: 'Internet Archive: musopen-chopin (Nocturne Op. 9 no. 2 in E flat major.ogg)',
      url: 'https://archive.org/details/musopen-chopin',
    },
    extraLinks: [{ label: 'Musopen', url: 'https://musopen.org/' }],
    license: CC0,
    changes: TO_MP3,
  },
  {
    file: 'ngd/grieg_ases_death.mp3',
    work: 'Frédéric Chopin – Nocturne Op. 9 No. 1 in B-flat minor (stand-in for Grieg Åse’s Death)',
    recording: 'Musopen Complete Chopin Collection (Aaron Dunn / Musopen)',
    source: {
      label: 'Internet Archive: musopen-chopin (NocturneOp.9No.1InBFlatMinor.ogg)',
      url: 'https://archive.org/details/musopen-chopin',
    },
    extraLinks: [{ label: 'Musopen', url: 'https://musopen.org/' }],
    license: CC0,
    changes: TO_MP3,
  },
  {
    file: 'ngd/chopin_prelude_4.mp3',
    work: 'Erik Satie – Gymnopédie No. 1 (stand-in for Chopin Prelude Op. 28 No. 4)',
    recording: 'Wikimedia user Teknopazzo',
    source: {
      label: 'File:Gymnopedie No. 1..ogg',
      url: 'https://commons.wikimedia.org/wiki/File:Gymnopedie_No._1..ogg',
    },
    license: CC0,
    changes: TO_MP3,
  },
  {
    file: 'ngd/beethoven_moonlight.mp3',
    work: 'Ludwig van Beethoven – Piano Sonata No. 14 “Moonlight”, Op. 27 No. 2, 1st movement (Adagio sostenuto)',
    recording: 'Paul Pitman, piano, for Musopen',
    source: {
      label:
        "File:Ludwig van Beethoven - sonata no. 14 in c sharp minor 'moonlight', op. 27 no. 2 - i. adagio sostenuto.ogg",
      url: "https://commons.wikimedia.org/wiki/File:Ludwig_van_Beethoven_-_sonata_no._14_in_c_sharp_minor_'moonlight',_op._27_no._2_-_i._adagio_sostenuto.ogg",
    },
    extraLinks: [
      {
        label: 'Musopen: Sonata No. 14 “Moonlight”',
        url: 'https://musopen.org/music/278/ludwig-van-beethoven/sonata-no-14-in-c-sharp-minor-moonlight-op-27-no-2/',
      },
    ],
    license: PD_COMMONS,
    changes: TO_MP3,
  },
  {
    file: 'ngd/beethoven_symphony7.mp3',
    work: 'Pyotr Ilyich Tchaikovsky – Symphony No. 6 “Pathétique”, 4th movement (stand-in for Beethoven Symphony No. 7, 2nd movement)',
    recording: 'Czech National Symphony Orchestra. Musopen Kickstarter project, 2012.',
    source: {
      label:
        "File:Tchaikovsky - Symphony No. 6 in B minor, Op. 74 'Pathétique' - IV. Finale – Adagio lamentoso (Musopen Symphony).flac",
      url: 'https://commons.wikimedia.org/wiki/File:Tchaikovsky_-_Symphony_No._6_in_B_minor,_Op._74_%27Path%C3%A9tique%27_-_IV._Finale_%E2%80%93_Adagio_lamentoso_(Musopen_Symphony).flac',
    },
    extraLinks: [
      {
        label: 'Musopen: Symphony No. 6',
        url: 'https://musopen.org/music/80-symphony-no-6-in-b-minor-pathetique-op-74/',
      },
    ],
    license: PD_COMMONS,
    changes: TO_MP3,
  },
  {
    file: 'ngd/tchaikovsky_swan_lake.mp3',
    work: 'Camille Saint-Saëns – Le Cygne (The Swan) (stand-in for Tchaikovsky Swan Lake Scene)',
    recording: 'Judith Bokor, cello, with piano. Columbia 78 rpm, recorded 5 June 1925.',
    source: {
      label: 'File:Judith Bokor plays Le Cygne by Saint-Saëns.flac',
      url: 'https://commons.wikimedia.org/wiki/File:Judith_Bokor_plays_Le_Cygne_by_Saint-Sa%C3%ABns.flac',
    },
    license: PD_COMMONS,
    changes: TO_MP3,
  },
  {
    file: 'ngd/dvorak_largo.mp3',
    work: 'Frédéric Chopin – Prelude Op. 28 No. 15 “Raindrop” (stand-in for Dvořák Largo)',
    recording: 'Musopen Complete Chopin Collection (Aaron Dunn / Musopen)',
    source: {
      label: 'Internet Archive: musopen-chopin (Prelude Op. 28 no. 15.ogg)',
      url: 'https://archive.org/details/musopen-chopin',
    },
    extraLinks: [{ label: 'Musopen', url: 'https://musopen.org/' }],
    license: CC0,
    changes: TO_MP3,
  },
  {
    file: 'ngd/handel_sarabande.mp3',
    work: 'Ludwig van Beethoven – Piano Sonata No. 8 “Pathétique”, 2nd movement (stand-in for Handel Sarabande)',
    recording: 'Wikimedia user Jmfayard',
    source: {
      label: 'File:Beethoven - Pathétique - 2e mouvement adagio cantabile.ogg',
      url: 'https://commons.wikimedia.org/wiki/File:Beethoven_-_Path%C3%A9tique_-_2e_mouvement_adagio_cantabile.ogg',
    },
    license: CC_BY_SA_3_0,
    changes: TO_MP3,
    note: 'Also offered under GFDL 1.2+ and CC BY-SA 2.5/2.0/1.0; this app uses CC BY-SA 3.0.',
  },
  {
    file: 'ngd/bach_air.mp3',
    work: 'Johann Sebastian Bach – Concerto for Two Violins in D minor, BWV 1043, 2nd movement (stand-in for Air on the G String)',
    recording:
      'Advent Chamber Orchestra with David Parry and Roxana Pavel Goldstein, violins. From the Al Goldstein collection in the Pandora Music repository at ibiblio.org.',
    source: {
      label: 'File:Johann Sebastian Bach - Concerto for Two Violins in D minor - 2. Largo ma non tanto.ogg',
      url: 'https://commons.wikimedia.org/wiki/File:Johann_Sebastian_Bach_-_Concerto_for_Two_Violins_in_D_minor_-_2._Largo_ma_non_tanto.ogg',
    },
    extraLinks: [
      {
        label: 'ibiblio Pandora Music',
        url: 'https://music.ibiblio.org/pub/multimedia/pandora/vorbis/index.html',
      },
    ],
    license: CC_BY_SA_2_0,
    changes: TO_MP3,
  },
];

export const OTHER_RECORDING_LICENSES: SoundLicenseEntry[] = [
  {
    file: 'fallback_chime.mp3',
    work: 'Original fallback chime for this app',
    recording: 'Generated sine tone (no third-party recording)',
    source: {
      label: 'This repository (scripts/fetch_sounds.py)',
      url: 'https://github.com/ritrek/ritrek-btc-price-alarm-clock-app',
    },
    license: {
      label: 'MIT (same as the app source)',
      url: 'https://opensource.org/licenses/MIT',
    },
    changes: 'None. Original generated audio.',
  },
];

export const ALL_RECORDING_LICENSES: SoundLicenseEntry[] = [
  ...NGU_RECORDING_LICENSES,
  ...NGD_RECORDING_LICENSES,
  ...OTHER_RECORDING_LICENSES,
];
