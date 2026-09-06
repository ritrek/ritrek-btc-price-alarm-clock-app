import { StyleSheet, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { WEEKDAYS } from '@/utils/format';

interface Props {
  selected: number[];
  onChange?: (days: number[]) => void;
  compact?: boolean;
}

export default function WeekdayPicker({ selected, onChange, compact = false }: Props) {
  const tint = useThemeColor({}, 'tint');
  const onTint = useThemeColor({}, 'onTint');
  const card = useThemeColor({}, 'secondCard');
  const text = useThemeColor({}, 'text');
  const size = compact ? 28 : 40;

  return (
    <View
      style={styles.row}
      pointerEvents={onChange ? 'auto' : 'none'}
      accessibilityRole="text"
      accessibilityLabel={WEEKDAYS.filter((day) => selected.includes(day.id))
        .map((day) => day.label)
        .join(', ')}
    >
      {WEEKDAYS.map((day) => {
        const on = selected.includes(day.id);
        const chip = (
          <View
            style={[
              styles.chip,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: on ? tint : card,
              },
            ]}
          >
            <ThemedText style={{ color: on ? onTint : text, fontWeight: '700', ...(compact ? { fontSize: 12 } : null) }}>
              {day.short}
            </ThemedText>
          </View>
        );
        if (!onChange) {
          return (
            <View key={day.id} accessibilityElementsHidden>
              {chip}
            </View>
          );
        }
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
            accessibilityLabel={day.label}
            accessibilityState={{ selected: on }}
          >
            {chip}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
