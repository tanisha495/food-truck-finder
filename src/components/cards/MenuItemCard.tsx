import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../constants/theme';

type MenuItemCardProps = {
  name: string;
  description?: string;
  price: number;
};

export default function MenuItemCard({ name, description, price }: MenuItemCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.textGroup}>
        <Text style={styles.name}>{name}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Text style={styles.price}>${price.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.lg,
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    width: '100%',
  },
  description: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
  },
  name: {
    ...theme.typography.label,
    color: theme.colors.text,
    fontSize: 15,
  },
  price: {
    ...theme.typography.label,
    color: theme.colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  textGroup: {
    flex: 1,
    gap: theme.spacing.xs,
  },
});
