import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { WEEKDAYS } from '@/utils/format';

interface Props {
  selected: number[];
  onChange: (days: number[]) => void;
}

export default function WeekdayPicker({ selected, onChange }: Props) {
  const tint = useThemeColor({}, 'tint');
  const onTint = useThemeColor({}, 'onTint');
  const card = useThemeColor({}, 'secondCard');
  const text = useThemeColor({}, 'text');

  return (
    <View style={styles.row}>
      {WEEKDAYS.map((day) => {
        const on = selected.includes(day.id);
        return (
          <Pressable
            key={day.id}
            onPress={() => {
              if (on) {
                onChange(selected.filter((value) => value !== day.id));
              } else {
                onChange([...selected, day.id].sort((a, b) => a - b));
              }
            }}
            style={[styles.chip, { backgroundColor: on ? tint : card }]}
            accessibilityLabel={day.label}
          >
            <ThemedText style={{ color: on ? onTint : text, fontWeight: '700' }}>
              {day.short}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  chip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
