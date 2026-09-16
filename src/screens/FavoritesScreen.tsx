import {
  useFocusEffect,
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

import ScreenContainer from '../components/common/ScreenContainer';
import { bottomTabColors } from '../components/navigation/bottomTabColors';
import { theme } from '../constants/theme';
import type { RootStackParamList } from '../navigation/types';
import {
  getFavoriteTrucks,
  removeFavoriteTruck,
  type FavoriteTruck,
} from '../services/favorites';

function savedTruckLabel(count: number) {
  return `${count} saved ${count === 1 ? 'truck' : 'trucks'}`;
}

export default function FavoritesScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [favoriteTrucks, setFavoriteTrucks] = useState<FavoriteTruck[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [removingTruckIds, setRemovingTruckIds] = useState<Set<string>>(new Set());

  const loadFavorites = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getFavoriteTrucks();
      setFavoriteTrucks(result.trucks);
      setIsLoggedIn(result.isLoggedIn);
    } catch (error) {
      console.error('Could not load favorites', error);
      const message = error instanceof Error ? error.message : 'Failed to load favorites.';
      Alert.alert('Could not load favorites', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadFavorites();
  }, [loadFavorites]));

  const openTruck = (truckId: string) => {
    navigation.navigate('TruckDetail', { id: truckId });
  };

  const handleRemoveFavorite = async (
    event: GestureResponderEvent,
    truck: FavoriteTruck
  ) => {
    event.stopPropagation();
    if (removingTruckIds.has(truck.id)) return;

    setRemovingTruckIds((current) => new Set(current).add(truck.id));
    setFavoriteTrucks((current) => current.filter((favorite) => favorite.id !== truck.id));

    try {
      await removeFavoriteTruck(truck.id);
    } catch (error) {
      console.error('Could not remove favorite', error);
      const message = error instanceof Error ? error.message : 'Failed to remove favorite.';
      setFavoriteTrucks((current) =>
        current.some((favorite) => favorite.id === truck.id) ? current : [truck, ...current]
      );
      Alert.alert('Could not remove favorite', message);
    } finally {
      setRemovingTruckIds((current) => {
        const next = new Set(current);
        next.delete(truck.id);
        return next;
      });
    }
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.primary} size="small" />
          <Text style={styles.stateText}>Loading favorites...</Text>
        </View>
      );
    }

    if (!isLoggedIn) {
      return (
        <View style={styles.stateCard}>
          <Text style={styles.emptyTitle}>Please sign in to view your saved trucks.</Text>
        </View>
      );
    }

    if (favoriteTrucks.length === 0) {
      return (
        <View style={styles.stateCard}>
          <Text style={styles.emptyTitle}>No favorite trucks yet</Text>
          <Text style={styles.stateText}>Tap the heart on a truck to save it here.</Text>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {favoriteTrucks.map((truck) => {
          const isRemoving = removingTruckIds.has(truck.id);

          return (
            <Pressable
              accessibilityLabel={`View ${truck.name}`}
              accessibilityRole="button"
              key={truck.id}
              onPress={() => openTruck(truck.id)}
              style={({ pressed }) => [
                styles.card,
                pressed ? styles.cardPressed : undefined,
              ]}>
              {truck.imageUrl ? (
                <Image
                  accessibilityLabel={`${truck.name} image`}
                  resizeMode="cover"
                  source={{ uri: truck.imageUrl }}
                  style={styles.truckImage}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.placeholderIcon}>🚚</Text>
                </View>
              )}

              <View style={styles.cardContent}>
                <Text numberOfLines={1} style={styles.truckName}>
                  {truck.name}
                </Text>

                <View style={styles.cuisineBadge}>
                  <Text numberOfLines={1} style={styles.cuisineText}>
                    {truck.cuisine}
                  </Text>
                </View>

                <Text style={styles.distanceText}>{truck.distanceLabel}</Text>

                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, truck.isOpen ? styles.openDot : styles.closedDot]} />
                  <Text
                    numberOfLines={1}
                    style={[styles.statusText, truck.isOpen ? styles.openText : styles.closedText]}>
                    {truck.statusLabel}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityLabel={`Remove ${truck.name} from favorites`}
                accessibilityRole="button"
                disabled={isRemoving}
                hitSlop={12}
                onPress={(event) => handleRemoveFavorite(event, truck)}
                style={({ pressed }) => [
                  styles.heartButton,
                  pressed || isRemoving ? styles.heartButtonPressed : undefined,
                ]}>
                <Text style={styles.heartIcon}>♥</Text>
              </Pressable>
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>{savedTruckLabel(favoriteTrucks.length)}</Text>
        </View>

        {renderBody()}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    ...theme.shadows.card,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(231, 224, 214, 0.72)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardContent: {
    flex: 1,
    gap: 5,
    minWidth: 0,
    paddingRight: theme.spacing.xs,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  closedDot: {
    backgroundColor: '#7E7E7E',
  },
  closedText: {
    color: '#6F6B66',
  },
  content: {
    gap: 18,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  cuisineBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FCEAE4',
    borderRadius: theme.radius.sm,
    maxWidth: '100%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 3,
  },
  cuisineText: {
    ...theme.typography.label,
    color: theme.colors.primaryDark,
    fontSize: 13,
    lineHeight: 17,
  },
  distanceText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 18,
  },
  emptyTitle: {
    ...theme.typography.headingSmall,
    color: theme.colors.text,
    textAlign: 'center',
  },
  header: {
    gap: theme.spacing.xs,
  },
  heartButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 40,
    justifyContent: 'center',
    marginTop: 2,
    width: 40,
  },
  heartButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.94 }],
  },
  heartIcon: {
    color: bottomTabColors.heartActive,
    fontSize: 31,
    lineHeight: 34,
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: '#F7E3D7',
    borderRadius: theme.radius.md,
    height: 92,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 92,
  },
  list: {
    gap: 13,
  },
  openDot: {
    backgroundColor: '#3D8A45',
  },
  openText: {
    color: '#2F7A38',
  },
  placeholderIcon: {
    fontSize: 30,
  },
  stateCard: {
    ...theme.shadows.subtle,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  stateText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  statusDot: {
    borderRadius: theme.radius.pill,
    height: 9,
    width: 9,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statusText: {
    ...theme.typography.bodySmall,
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 18,
  },
  title: {
    ...theme.typography.headingLarge,
    color: theme.colors.text,
    fontSize: 32,
    lineHeight: 38,
  },
  truckImage: {
    backgroundColor: '#F7E3D7',
    borderRadius: theme.radius.md,
    height: 92,
    width: 92,
  },
  truckName: {
    ...theme.typography.headingSmall,
    color: theme.colors.text,
    fontSize: 19,
    lineHeight: 23,
  },
});
