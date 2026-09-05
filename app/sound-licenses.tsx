import { type ReactNode } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

function LicenseLink({ url, children }: { url: string; children: string }) {
  const tint = useThemeColor({}, 'tint');
  return (
    <ThemedText
      type="link"
      style={[styles.fieldValue, styles.link, { color: tint }]}
      onPress={() => void Linking.openURL(url)}
    >
      {children}
    </ThemedText>
  );
}

function Recording({
  file,
  work,
  recording,
  license,
}: {
  file: string;
  work: string;
  recording: string;
  license: ReactNode;
}) {
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'muted');
  return (
    <View style={[styles.recording, { backgroundColor: card }]}>
      <ThemedText type="defaultSemiBold" style={styles.file}>
        {file}
      </ThemedText>
      <ThemedText style={[styles.fieldLabel, { color: muted }]}>Work</ThemedText>
      <ThemedText style={styles.fieldValue}>{work}</ThemedText>
      <ThemedText style={[styles.fieldLabel, { color: muted }]}>Recording</ThemedText>
      <ThemedText style={styles.fieldValue}>{recording}</ThemedText>
      <ThemedText style={[styles.fieldLabel, { color: muted }]}>License</ThemedText>
      {typeof license === 'string' ? (
        <ThemedText style={styles.fieldValue}>{license}</ThemedText>
      ) : (
        license
      )}
    </View>
  );
}

export default function SoundLicensesScreen() {
  const insets = useSafeAreaInsets();
  const muted = useThemeColor({}, 'muted');

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.intro}>
          Compositions are in the public domain. Each recording is a Wikimedia Commons file that is
          public domain, CC0, U.S. government work, or CC BY-SA (attribution below). Files are the
          full source recording (converted to 128 kbps MP3). William Tell starts at the finale of
          the Marine Band overture and runs to the end.
        </ThemedText>

        <ThemedText type="subtitle" style={styles.section}>
          Number Go Up
        </ThemedText>

        <Recording
          file="ngu/offenbach_cancan.mp3"
          work="Offenbach – Infernal Galop (Can-Can)"
          recording="Musopen / Wikimedia Commons"
          license="Public domain"
        />
        <Recording
          file="ngu/beethoven_ode_to_joy.mp3"
          work="Beethoven – Ode to Joy"
          recording="Wikimedia Commons Ode_to_Joy.ogg"
          license="Public domain"
        />
        <Recording
          file="ngu/mozart_alla_turca.mp3"
          work="Mozart – Rondo Alla Turca"
          recording="Mutopia MIDI realization, Rondo_Alla_Turka.ogg"
          license="Public domain"
        />
        <Recording
          file="ngu/vivaldi_spring.mp3"
          work="Vivaldi – Spring, 1st mov."
          recording="John Harrison, Wichita State University Chamber Players"
          license={
            <LicenseLink url="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</LicenseLink>
          }
        />
        <Recording
          file="ngu/rossini_william_tell.mp3"
          work="Rossini – William Tell Overture (finale)"
          recording="U.S. Marine Band, Grand Scenes (2000)"
          license="U.S. government work (public domain)"
        />
        <Recording
          file="ngu/handel_queen_of_sheba.mp3"
          work="Handel – Arrival of the Queen of Sheba"
          recording="Advent Chamber Orchestra (Al Goldstein / ibiblio Pandora)"
          license="Wikimedia Commons free license"
        />
        <Recording
          file="ngu/mozart_nachtmusik.mp3"
          work="Mozart – Eine kleine Nachtmusik, 1st mov."
          recording="Mozart_K525_Serenade_in_G_Major_1_-_Allegro.ogg"
          license="Public domain / Musopen"
        />
        <Recording
          file="ngu/strauss_blue_danube.mp3"
          work="Johann Strauss II – The Blue Danube"
          recording="U.S. Marine Band"
          license="U.S. government work (public domain)"
        />
        <Recording
          file="ngu/strauss_radetzky.mp3"
          work="Johann Strauss I – Radetzky March"
          recording="Wikimedia Commons Radetzky_March.ogg"
          license="Public domain"
        />
        <Recording
          file="ngu/handel_hallelujah.mp3"
          work="Handel – Hallelujah Chorus"
          recording="Oratorio chorus, 1916 (Edison)"
          license="Public domain (pre-1931 recording)"
        />

        <ThemedText type="subtitle" style={styles.section}>
          Number Go Down
        </ThemedText>
        <ThemedText style={[styles.intro, { marginBottom: 4 }]}>
          Where the originally listed recording could not be found as a free file, a different
          public-domain / CC work of similar mood is used (shown in the Work column).
        </ThemedText>

        <Recording
          file="ngd/chopin_funeral_march.mp3"
          work="Chopin – Funeral March (Sonata No. 2, 3rd mov.)"
          recording="Bernd Krueger, piano-midi.de"
          license={
            <LicenseLink url="https://creativecommons.org/licenses/by-sa/3.0/de/">
              CC BY-SA 3.0 DE
            </LicenseLink>
          }
        />
        <Recording
          file="ngd/mozart_lacrimosa.mp3"
          work="Chopin – Nocturne Op. 9 No. 2 (stand-in for Mozart Lacrimosa)"
          recording="Musopen Chopin collection"
          license="Musopen / public domain"
        />
        <Recording
          file="ngd/grieg_ases_death.mp3"
          work="Chopin – Nocturne Op. 9 No. 1 (stand-in for Grieg Åse's Death)"
          recording="Musopen Chopin collection"
          license="Musopen / public domain"
        />
        <Recording
          file="ngd/chopin_prelude_4.mp3"
          work="Satie – Gymnopédie No. 1 (stand-in for Chopin Prelude No. 4)"
          recording="Gymnopedie_No._1..ogg"
          license="Wikimedia Commons free license"
        />
        <Recording
          file="ngd/beethoven_moonlight.mp3"
          work="Beethoven – Moonlight Sonata, 1st mov."
          recording="Archive.org SonataNo.14MoonlightOp.27No.2"
          license="Public domain"
        />
        <Recording
          file="ngd/beethoven_symphony7.mp3"
          work="Tchaikovsky – Pathétique Symphony, 4th mov. (stand-in for Beethoven 7/II)"
          recording="Musopen Symphony"
          license="CC0 / Musopen"
        />
        <Recording
          file="ngd/tchaikovsky_swan_lake.mp3"
          work="Saint-Saëns – Le Cygne (stand-in for Swan Lake Scene)"
          recording="Judith Bokor, cello, 1925"
          license="Public domain (1925 recording)"
        />
        <Recording
          file="ngd/dvorak_largo.mp3"
          work="Chopin – Raindrop Prelude Op. 28 No. 15 (stand-in for Dvořák Largo)"
          recording="Musopen Chopin collection"
          license="Musopen / public domain"
        />
        <Recording
          file="ngd/handel_sarabande.mp3"
          work="Beethoven – Pathétique Sonata, 2nd mov. (stand-in for Handel Sarabande)"
          recording="Wikimedia Commons Beethoven_-_Pathétique_-_2e_mouvement_adagio_cantabile.ogg"
          license={
            <LicenseLink url="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</LicenseLink>
          }
        />
        <Recording
          file="ngd/bach_air.mp3"
          work="Bach – Concerto for Two Violins, 2nd mov. (stand-in for Air)"
          recording="Wikimedia Commons"
          license="Public domain / Musopen"
        />

        <ThemedText style={[styles.footer, { color: muted }]}>
          Converted with ffmpeg (full length, 128 kbps MP3).
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12 },
  intro: { fontSize: 14, lineHeight: 20 },
  section: { marginTop: 8 },
  recording: { padding: 16, borderRadius: 14, gap: 4 },
  file: { fontSize: 16, lineHeight: 22, marginBottom: 4 },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  fieldValue: { fontSize: 14, lineHeight: 20 },
  link: { lineHeight: 20 },
  footer: { fontSize: 14, lineHeight: 20, marginTop: 4 },
});
