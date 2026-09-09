import { type ReactNode } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {
  NGD_RECORDING_LICENSES,
  NGU_RECORDING_LICENSES,
  OTHER_RECORDING_LICENSES,
  type LicenseLink,
  type SoundLicenseEntry,
} from '@/constants/SoundLicenses';
import { useThemeColor } from '@/hooks/useThemeColor';

function LicenseLinkText({ link }: { link: LicenseLink }) {
  const tint = useThemeColor({}, 'tint');
  return (
    <ThemedText
      type="link"
      style={[styles.fieldValue, styles.link, { color: tint }]}
      onPress={() => void Linking.openURL(link.url)}
      accessibilityRole="link"
      accessibilityLabel={link.label}
    >
      {link.label}
    </ThemedText>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const muted = useThemeColor({}, 'muted');
  return (
    <>
      <ThemedText style={[styles.fieldLabel, { color: muted }]}>{label}</ThemedText>
      {children}
    </>
  );
}

function Recording({ entry }: { entry: SoundLicenseEntry }) {
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'muted');
  return (
    <View style={[styles.recording, { backgroundColor: card }]}>
      <ThemedText type="defaultSemiBold" style={styles.file}>
        {entry.file}
      </ThemedText>
      <Field label="Work">
        <ThemedText style={styles.fieldValue}>{entry.work}</ThemedText>
      </Field>
      <Field label="Recording">
        <ThemedText style={styles.fieldValue}>{entry.recording}</ThemedText>
      </Field>
      <Field label="Source">
        <LicenseLinkText link={entry.source} />
      </Field>
      {entry.extraLinks?.map((link) => (
        <LicenseLinkText key={link.url} link={link} />
      ))}
      <Field label="License">
        <LicenseLinkText link={entry.license} />
      </Field>
      <Field label="Changes">
        <ThemedText style={styles.fieldValue}>{entry.changes}</ThemedText>
      </Field>
      {entry.note ? (
        <ThemedText style={[styles.note, { color: muted }]}>{entry.note}</ThemedText>
      ) : null}
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
          The compositions are in the public domain. Each bundled recording keeps its own license.
          They are not MIT-licensed with the app source. Creative Commons BY-SA recordings require
          attribution, a link to the license, a link to the source, and a note of any changes. Using
          a recording here does not mean the artist or licensor endorses this app.
        </ThemedText>
        <ThemedText style={[styles.intro, { color: muted }]}>
          Converting a file to MP3 is a format change, not an adaptation, so ShareAlike does not
          relicense the app. William Tell is an excerpt of a U.S. government recording.
        </ThemedText>

        <ThemedText type="subtitle" style={styles.section}>
          Number Go Up
        </ThemedText>
        {NGU_RECORDING_LICENSES.map((entry) => (
          <Recording key={entry.file} entry={entry} />
        ))}

        <ThemedText type="subtitle" style={styles.section}>
          Number Go Down
        </ThemedText>
        <ThemedText style={[styles.intro, { marginBottom: 4 }]}>
          Where the originally listed recording could not be found as a free file, a different work
          of similar mood is used (shown in the Work line).
        </ThemedText>
        {NGD_RECORDING_LICENSES.map((entry) => (
          <Recording key={entry.file} entry={entry} />
        ))}

        <ThemedText type="subtitle" style={styles.section}>
          Other
        </ThemedText>
        {OTHER_RECORDING_LICENSES.map((entry) => (
          <Recording key={entry.file} entry={entry} />
        ))}
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
  note: { fontSize: 13, lineHeight: 18, marginTop: 8 },
});
