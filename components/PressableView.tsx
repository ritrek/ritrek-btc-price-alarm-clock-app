import { useThemeColor } from '@/hooks/useThemeColor';
import { useCallback } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';

interface PressableViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export default function PressableView({ children, style, onPress, accessibilityLabel, disabled }: PressableViewProps) {
  const tintColor = useThemeColor({}, 'tint');

  const pressableStyle = useCallback(({ pressed }: { pressed: boolean }) => {
    return {
      opacity: pressed ? 0.8 : 1,
      backgroundColor: pressed ? `${tintColor}20` : 'transparent',
    };
  }, [tintColor]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [style, pressableStyle({ pressed })]}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
    >
      {children}
    </Pressable>
  );
}
