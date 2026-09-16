import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '../../constants/theme';

type SecondaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function SecondaryButton({
  title,
  onPress,
  disabled = false,
}: SecondaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.buttonDisabled : undefined,
        pressed && !disabled ? styles.buttonPressed : undefined,
      ]}>
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.typography.label,
    color: theme.colors.text,
    fontSize: 16,
  },
});
