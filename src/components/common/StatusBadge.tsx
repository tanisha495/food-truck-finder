import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../constants/theme';

type StatusBadgeProps = {
  isOpen: boolean;
};

export default function StatusBadge({ isOpen }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, isOpen ? styles.openBadge : styles.closedBadge]}>
      <Text style={[styles.label, isOpen ? styles.openLabel : styles.closedLabel]}>
        {isOpen ? 'Open' : 'Closed'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  closedBadge: {
    backgroundColor: '#F8E9E6',
  },
  closedLabel: {
    color: theme.colors.danger,
  },
  label: {
    ...theme.typography.label,
    fontSize: 12,
  },
  openBadge: {
    backgroundColor: '#E7F3EE',
  },
  openLabel: {
    color: theme.colors.success,
  },
});
