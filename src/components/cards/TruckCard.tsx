import { Pressable, StyleSheet, Text, View } from 'react-native';

import IconCircle from '../common/IconCircle';
import StatusBadge from '../common/StatusBadge';
import { theme } from '../../constants/theme';
import type { FoodTruck } from '../../types/truck';

type TruckCardProps = {
  truck: FoodTruck;
  onPress?: () => void;
  compact?: boolean;
};

export default function TruckCard({ truck, onPress, compact = false }: TruckCardProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.compactCard : undefined,
        pressed && onPress ? styles.cardPressed : undefined,
      ]}>
      <View style={styles.header}>
        <IconCircle icon="🚚" backgroundColor={theme.colors.background} size={compact ? 44 : 56} />

        <View style={styles.titleGroup}>
          <Text numberOfLines={1} style={styles.name}>
            {truck.name}
          </Text>
          <Text numberOfLines={1} style={styles.cuisine}>
            {truck.cuisine}
          </Text>
        </View>

        <StatusBadge isOpen={truck.isOpen} />
      </View>

      <View style={styles.detailGroup}>
        <Text numberOfLines={1} style={styles.detailText}>
          {truck.locationName}
        </Text>
        <Text style={styles.detailText}>{truck.distanceKm.toFixed(1)} km away</Text>
        {!compact ? <Text style={styles.detailText}>Today: {truck.todayHours}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...theme.shadows.card,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    width: '100%',
  },
  cardPressed: {
    opacity: 0.86,
  },
  compactCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  cuisine: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
  },
  detailGroup: {
    gap: theme.spacing.xs,
  },
  detailText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  name: {
    ...theme.typography.headingSmall,
    color: theme.colors.text,
  },
  titleGroup: {
    flex: 1,
    gap: theme.spacing.xs,
  },
});
