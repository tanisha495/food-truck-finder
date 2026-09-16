import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import AlertCard from '../components/cards/AlertCard';
import ScreenContainer from '../components/common/ScreenContainer';
import { theme } from '../constants/theme';
import type { RootStackParamList } from '../navigation/types';
import { fetchAlerts } from '../services/alertsService';
import type { FoodTruckAlert } from '../types/alert';

export default function AlertsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [alerts, setAlerts] = useState<FoodTruckAlert[]>([]);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchAlerts();
      setAlerts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAlerts();
  }, [loadAlerts]);

  const handleAlertPress = (alert: FoodTruckAlert) => {
    setReadAlertIds((prev) => new Set([...prev, alert.id]));
    if (alert.relatedTruckId) {
      navigation.navigate('TruckDetail', { id: alert.relatedTruckId });
    }
  };

  const unreadCount = alerts.filter((a) => !readAlertIds.has(a.id) && !a.isRead).length;

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Alerts</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>Pull down to refresh for live closing-soon updates.</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.centerText}>Loading alerts...</Text>
          </View>
        ) : error ? (
          <Pressable onPress={loadAlerts} style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        ) : alerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptyText}>
              {"You'll see closing-soon warnings and new truck announcements here."}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                icon={alert.icon}
                isRead={readAlertIds.has(alert.id) || (alert.isRead ?? false)}
                onPress={() => handleAlertPress(alert)}
                time={alert.timeLabel}
                title={alert.title}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { ...theme.typography.bodySmall, color: 'white', fontSize: 12, fontWeight: '700' },
  center: { alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.xl },
  centerText: { ...theme.typography.bodySmall, color: theme.colors.textMuted },
  content: { gap: theme.spacing.lg, padding: theme.spacing.xl },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: { ...theme.typography.bodySmall, color: theme.colors.textMuted, textAlign: 'center' },
  emptyTitle: { ...theme.typography.headingSmall, color: theme.colors.text },
  errorCard: {
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderColor: '#FFCCCC',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.xl,
  },
  errorText: { color: '#C0392B', ...theme.typography.body },
  header: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.md },
  list: { gap: theme.spacing.lg },
  retryText: { ...theme.typography.bodySmall, color: theme.colors.textMuted },
  subtitle: { ...theme.typography.bodySmall, color: theme.colors.textMuted, marginTop: -theme.spacing.md },
  title: { ...theme.typography.headingLarge, color: theme.colors.text },
});
