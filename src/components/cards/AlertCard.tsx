import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '../../constants/theme';

type AlertCardProps = {
  icon: string;
  title: string;
  time: string;
  isRead?: boolean;
  onPress?: () => void;
};

export default function AlertCard({ icon, title, time, isRead = false, onPress }: AlertCardProps) {
  const fadeValue = useRef(new Animated.Value(0)).current;
  const slideValue = useRef(new Animated.Value(12)).current;
  const borderValue = useRef(new Animated.Value(isRead ? 0 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeValue, {
        duration: 260,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(slideValue, {
        duration: 260,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeValue, slideValue]);

  useEffect(() => {
    if (isRead) {
      Animated.timing(borderValue, {
        duration: 220,
        toValue: 0,
        useNativeDriver: false,
      }).start();
      return;
    }

    Animated.sequence([
      Animated.timing(borderValue, {
        duration: 450,
        toValue: 1,
        useNativeDriver: false,
      }),
      Animated.timing(borderValue, {
        duration: 450,
        toValue: 0.45,
        useNativeDriver: false,
      }),
    ]).start();
  }, [borderValue, isRead]);

  const borderColor = borderValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.primary],
  });

  return (
    <Animated.View
      style={[
        styles.animatedWrapper,
        {
          opacity: fadeValue,
          transform: [{ translateY: slideValue }],
        },
      ]}>
      <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress}>
        <Animated.View style={[styles.card, { borderColor }]}>
          <Text style={styles.icon}>{icon}</Text>
          <Animated.View style={styles.textGroup}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.time}>{time}</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedWrapper: {
    width: '100%',
  },
  card: {
    ...theme.shadows.subtle,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.lg,
    minHeight: 90,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    width: '100%',
  },
  icon: {
    fontSize: 28,
    width: 40,
  },
  textGroup: {
    flex: 1,
    gap: theme.spacing.md,
  },
  time: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
  },
  title: {
    ...theme.typography.label,
    color: theme.colors.text,
    fontSize: 16,
  },
});
