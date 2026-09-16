import { Pressable, StyleSheet, Text } from 'react-native';

import IconCircle from '../common/IconCircle';
import { theme } from '../../constants/theme';

type ProfileOptionCardProps = {
  icon: string;
  label: string;
  onPress?: () => void;
};

export default function ProfileOptionCard({ icon, label, onPress }: ProfileOptionCardProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.cardPressed : undefined]}>
      <IconCircle icon={icon} size={40} backgroundColor={theme.colors.background} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.chevron}>{'>'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    width: '100%',
  },
  cardPressed: {
    opacity: 0.86,
  },
  chevron: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.text,
    flex: 1,
    fontSize: 15,
  },
});
