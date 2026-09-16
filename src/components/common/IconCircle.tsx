import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../constants/theme';

type IconCircleProps = {
  icon: string;
  size?: number;
  backgroundColor?: string;
};

export default function IconCircle({
  icon,
  size = 48,
  backgroundColor = theme.colors.background,
}: IconCircleProps) {
  return (
    <View
      style={[
        styles.circle,
        {
          backgroundColor,
          borderRadius: size / 2,
          height: size,
          width: size,
        },
      ]}>
      <Text style={[styles.icon, { fontSize: size * 0.45 }]}>{icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    lineHeight: 28,
  },
});
