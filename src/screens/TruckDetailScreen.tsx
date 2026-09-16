import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryBottomMenu from '../components/navigation/PrimaryBottomMenu';
import { bottomTabColors } from '../components/navigation/bottomTabColors';
import { goBackOrResetToMainTabs } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';
import {
  addFavoriteTruck,
  isFavoriteTruck as checkIsFavoriteTruck,
  removeFavoriteTruck,
} from '../services/favorites';
import { supabase } from '../services/supabase';
import {
  getValidScheduleStops,
  isScheduleStopActiveNow,
} from '../utils/schedule';

type TruckRow = {
  id: string;
  name?: string | null;
  description?: string | null;
  cover_url?: string | null;
  logo_url?: string | null;
  cuisine_tags?: unknown;
  status?: string | null;
  is_live?: boolean | null;
  distance_miles?: number | string | null;
  distance_mi?: number | string | null;
  distance?: number | string | null;
  distance_km?: number | string | null;
};

type MenuItemRow = {
  id: string;
  name?: string | null;
  description?: string | null;
  price?: number | string | null;
  is_available?: boolean | null;
  created_at?: string | null;
};

type ScheduleStopRow = {
  id: string;
  day_of_week?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location_name?: string | null;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_enabled?: boolean | null;
  repeat_weekly?: boolean | null;
  created_at?: string | null;
};

type TruckDetailData = {
  truck: TruckRow;
  menuItems: MenuItemRow[];
  scheduleStops: ScheduleStopRow[];
};

const fallbackTruckImage =
  'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=1200&q=80';

const CLOSED_STATUSES = new Set(['closed', 'offline', 'suspended', 'inactive']);
const OPEN_STATUSES = new Set(['open', 'online', 'live', 'active']);
const EMPTY_MENU_ITEMS: MenuItemRow[] = [];
const EMPTY_SCHEDULE_STOPS: ScheduleStopRow[] = [];

function getTruckId(id: string | string[] | undefined) {
  return Array.isArray(id) ? id[0] : id;
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function firstNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    const text = cleanString(value);
    if (text.length > 0) return text;
  }

  return null;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(cleanString).filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return toStringArray(parsed);
      } catch {
        return [];
      }
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

function numberFromValue(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatPrice(value: unknown) {
  const price = numberFromValue(value) ?? 0;
  return price % 1 === 0 ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`;
}

function minutesFromTime(value: string | null | undefined) {
  if (!value) return null;

  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  return hours * 60 + minutes;
}

function formatTime(value: string | null | undefined) {
  const minutes = minutesFromTime(value);
  if (minutes === null) return cleanString(value);

  const hours24 = Math.floor(minutes / 60);
  const minutePart = minutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  const minuteLabel = minutePart > 0 ? `:${String(minutePart).padStart(2, '0')}` : '';

  return `${hours12}${minuteLabel} ${period}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatDistance(truck: TruckRow) {
  const miles =
    numberFromValue(truck.distance_miles) ??
    numberFromValue(truck.distance_mi) ??
    numberFromValue(truck.distance);

  if (miles !== null && miles > 0) return `${miles.toFixed(1)} mi away`;

  const kilometers = numberFromValue(truck.distance_km);
  if (kilometers !== null && kilometers > 0) return `${(kilometers * 0.621371).toFixed(1)} mi away`;

  return 'Nearby';
}

function getStatusLabel(truck: TruckRow, scheduleStops: ScheduleStopRow[]) {
  const status = cleanString(truck.status).toLowerCase();
  const isClosed = CLOSED_STATUSES.has(status);
  const isOnline = truck.is_live === true || OPEN_STATUSES.has(status);
  const activeStop = scheduleStops.find((stop) => isScheduleStopActiveNow(stop));
  const isOpen = !isClosed && isOnline && Boolean(activeStop);
  const closingTime = formatTime(activeStop?.end_time);

  return {
    isOpen,
    label: isOpen && closingTime ? `Open until ${closingTime}` : isOpen ? 'Open' : 'Closed',
  };
}

function getValidCoordinate(stop: ScheduleStopRow) {
  const latitude = numberFromValue(stop.latitude);
  const longitude = numberFromValue(stop.longitude);

  if (
    latitude === null ||
    longitude === null ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

async function fetchTruckDetailData(truckId: string): Promise<TruckDetailData | null> {
  const [truckResult, menuResult, scheduleResult] = await Promise.all([
    supabase
      .from('trucks')
      .select('id, name, description, cover_url, logo_url, cuisine_tags, status, is_live')
      .eq('id', truckId)
      .maybeSingle(),
    supabase
      .from('menu_items')
      .select('id, name, description, price, is_available, created_at')
      .eq('truck_id', truckId)
      .eq('is_available', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('schedule_stops')
      .select('id, day_of_week, date, start_time, end_time, location_name, address, latitude, longitude, is_enabled, repeat_weekly, created_at')
      .eq('truck_id', truckId)
      .eq('is_enabled', true)
      .order('date', { ascending: true })
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true }),
  ]);

  if (truckResult.error) throw new Error(truckResult.error.message);
  if (!truckResult.data) return null;
  if (menuResult.error) throw new Error(menuResult.error.message);
  if (scheduleResult.error) throw new Error(scheduleResult.error.message);

  const menuItems = ((menuResult.data ?? []) as MenuItemRow[]).sort((a, b) => {
    if (a.is_available === false && b.is_available !== false) return 1;
    if (a.is_available !== false && b.is_available === false) return -1;
    return cleanString(a.name).localeCompare(cleanString(b.name));
  });

  return {
    truck: truckResult.data as TruckRow,
    menuItems,
    scheduleStops: getValidScheduleStops((scheduleResult.data ?? []) as ScheduleStopRow[]),
  };
}

export default function TruckDetailScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TruckDetail'>>();
  const truckId = getTruckId(route.params?.id);

  const [detailData, setDetailData] = useState<TruckDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteUpdating, setFavoriteUpdating] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);

  useEffect(() => {
    if (!truckId) {
      setLoading(false);
      setError('Truck not found.');
      return;
    }

    let isMounted = true;

    setLoading(true);

    (async () => {
      try {
        const [data, favoriteStatus] = await Promise.all([
          fetchTruckDetailData(truckId),
          checkIsFavoriteTruck(truckId).catch((favoriteError) => {
            console.error('Failed to check favorite status', favoriteError);
            return false;
          }),
        ]);

        if (!isMounted) return;

        setDetailData(data);
        setIsFavorite(favoriteStatus);
        setError(data ? null : 'Truck not found.');
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Failed to load truck details.';
        setError(message);
        setDetailData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [truckId]);

  const truck = detailData?.truck ?? null;
  const menuItems = detailData?.menuItems ?? EMPTY_MENU_ITEMS;
  const scheduleStops = detailData?.scheduleStops ?? EMPTY_SCHEDULE_STOPS;
  const status = useMemo(
    () => (truck ? getStatusLabel(truck, scheduleStops) : { isOpen: false, label: 'Closed' }),
    [scheduleStops, truck]
  );

  const imageUrl = firstNonEmptyString(truck?.cover_url, truck?.logo_url) ?? fallbackTruckImage;
  const cuisine = toStringArray(truck?.cuisine_tags)[0] ?? 'Food Truck';
  const description =
    firstNonEmptyString(truck?.description) ?? 'No description available.';
  const distanceLabel = truck ? formatDistance(truck) : 'Nearby';
  const directionStop =
    scheduleStops.find((stop) => isScheduleStopActiveNow(stop) && getValidCoordinate(stop)) ??
    scheduleStops.find((stop) => getValidCoordinate(stop));

  const goBack = () => {
    goBackOrResetToMainTabs(navigation, 'Explore');
  };

  const toggleFavorite = async () => {
    if (!truck || favoriteUpdating) return;

    setFavoriteUpdating(true);

    try {
      if (isFavorite) {
        await removeFavoriteTruck(truck.id);
        setIsFavorite(false);
      } else {
        await addFavoriteTruck(truck.id);
        setIsFavorite(true);
      }
    } catch (favoriteError) {
      console.error('Failed to update favorite', favoriteError);
      const message = favoriteError instanceof Error ? favoriteError.message : '';
      Alert.alert(
        message === 'Please sign in to save favorites.'
          ? 'Please sign in to save favorites.'
          : 'Could not update favorite',
        message === 'Please sign in to save favorites.'
          ? undefined
          : 'Please try again in a moment.'
      );
    } finally {
      setFavoriteUpdating(false);
    }
  };

  const openDirections = async () => {
    if (!truck || !directionStop) {
      Alert.alert('Location unavailable', 'Location is not available for this truck.');
      return;
    }

    const coordinates = getValidCoordinate(directionStop);
    if (!coordinates) {
      Alert.alert('Location unavailable', 'Location is not available for this truck.');
      return;
    }

    const label = encodeURIComponent(
      firstNonEmptyString(directionStop.location_name, truck.name) ?? 'Food Truck'
    );
    const { latitude, longitude } = coordinates;
    const mapsUrl =
      Platform.OS === 'android'
        ? `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`
        : `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`;
    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    try {
      const canOpenMaps = await Linking.canOpenURL(mapsUrl);
      await Linking.openURL(canOpenMaps ? mapsUrl : fallbackUrl);
    } catch {
      try {
        await Linking.openURL(fallbackUrl);
      } catch {
        Alert.alert('Could not open maps', 'Please try again in a moment.');
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.stateText}>Loading truck details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !truck) {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <Text style={styles.stateTitle}>Truck not found</Text>
        <Text style={styles.stateText}>{error || 'We could not find details for this food truck.'}</Text>
        <Pressable accessibilityRole="button" onPress={goBack} style={styles.stateButton}>
          <Text style={styles.stateButtonText}>Back to Explore</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        style={styles.scrollView}>
        <ImageBackground resizeMode="cover" source={{ uri: imageUrl }} style={styles.heroImage}>
          <SafeAreaView edges={['top']} style={styles.headerControls}>
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              onPress={goBack}
              style={({ pressed }) => [styles.backTapTarget, pressed ? styles.buttonPressed : undefined]}>
              <View style={styles.topCircleButton}>
                <Text style={styles.backIcon}>‹</Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              accessibilityRole="button"
              disabled={favoriteUpdating}
              onPress={toggleFavorite}
              style={({ pressed }) => [
                styles.heartButton,
                pressed || favoriteUpdating ? styles.buttonPressed : undefined,
              ]}>
              <Text style={[styles.heartIcon, isFavorite ? undefined : styles.heartIconOutline]}>
                {isFavorite ? '♥' : '♡'}
              </Text>
            </Pressable>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.detailsPanel}>
          <Text style={styles.title}>{truck.name || 'Unnamed Truck'}</Text>

          <View style={styles.statusLine}>
            <View style={[styles.statusDot, status.isOpen ? styles.openDot : styles.closedDot]} />
            <Text style={[styles.statusText, status.isOpen ? styles.openText : styles.closedText]}>
              {status.label}
            </Text>
            <Text style={styles.metaDivider}>|</Text>
            <Text style={styles.distanceText}>{distanceLabel}</Text>
          </View>

          <View style={styles.cuisineBadge}>
            <Text style={styles.cuisineText}>{cuisine}</Text>
          </View>

          <Text style={styles.description}>{description}</Text>

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              onPress={openDirections}
              style={({ pressed }) => [styles.primaryAction, pressed ? styles.buttonPressed : undefined]}>
              <Text style={styles.primaryActionIcon}>➤</Text>
              <Text style={styles.primaryActionText}>Get Directions</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setScheduleVisible(true)}
              style={({ pressed }) => [styles.secondaryAction, pressed ? styles.buttonPressed : undefined]}>
              <Text style={styles.secondaryActionIcon}>□</Text>
              <Text style={styles.secondaryActionText}>View Schedule</Text>
            </Pressable>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.menuTitle}>Menu</Text>

            {menuItems.length === 0 ? (
              <Text style={styles.emptyMenuText}>Menu not available yet.</Text>
            ) : (
              <View style={styles.menuList}>
                {menuItems.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.menuItem,
                      index === menuItems.length - 1 ? styles.lastMenuItem : undefined,
                    ]}>
                    <View style={styles.menuItemHeader}>
                      <Text numberOfLines={2} style={styles.menuItemName}>
                        {item.name || 'Menu item'}
                      </Text>
                      <Text style={styles.menuPrice}>{formatPrice(item.price)}</Text>
                    </View>
                    {firstNonEmptyString(item.description) ? (
                      <Text style={styles.menuDescription}>{item.description}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.menuNote}>Menu is for reference only. Prices may vary.</Text>
          </View>
        </View>
      </ScrollView>

      <PrimaryBottomMenu activeTab="explore" />

      <Modal
        animationType="fade"
        onRequestClose={() => setScheduleVisible(false)}
        transparent
        visible={scheduleVisible}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule</Text>
              <Pressable
                accessibilityLabel="Close schedule"
                accessibilityRole="button"
                onPress={() => setScheduleVisible(false)}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            {scheduleStops.length === 0 ? (
              <Text style={styles.noScheduleText}>No schedule available.</Text>
            ) : (
              <ScrollView contentContainerStyle={styles.scheduleModalList}>
                {scheduleStops.map((stop) => (
                  <View key={stop.id} style={styles.scheduleModalItem}>
                    <Text style={styles.scheduleDay}>
                      {firstNonEmptyString(stop.day_of_week) ?? 'Scheduled stop'}
                    </Text>
                    {stop.date ? <Text style={styles.scheduleMeta}>{formatDate(stop.date)}</Text> : null}
                    <Text style={styles.scheduleTime}>
                      {formatTime(stop.start_time)} - {formatTime(stop.end_time)}
                    </Text>
                    {firstNonEmptyString(stop.location_name) ? (
                      <Text style={styles.scheduleMeta}>{stop.location_name}</Text>
                    ) : null}
                    {firstNonEmptyString(stop.address) ? (
                      <Text style={styles.scheduleAddress}>{stop.address}</Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      <StatusBar barStyle="light-content" />
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 24,
  },
  buttonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  backTapTarget: {
    alignItems: 'center',
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  backIcon: {
    color: '#1F1F1F',
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 38,
    marginTop: -2,
  },
  closeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  closeButtonText: {
    color: '#666666',
    fontSize: 32,
    lineHeight: 36,
  },
  closedDot: {
    backgroundColor: '#8B8580',
  },
  closedText: {
    color: '#666666',
  },
  cuisineBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBE5DE',
    borderRadius: 12,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  cuisineText: {
    ...theme.typography.label,
    color: '#EF3D22',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
  },
  description: {
    ...theme.typography.body,
    color: '#666666',
    fontSize: 18,
    lineHeight: 29,
    marginBottom: 26,
  },
  detailsPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: theme.spacing.none,
    marginTop: -28,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  distanceText: {
    ...theme.typography.bodySmall,
    color: '#666666',
    fontSize: 18,
    lineHeight: 25,
  },
  emptyMenuText: {
    ...theme.typography.body,
    color: '#666666',
    paddingVertical: 10,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 18,
    zIndex: 10,
  },
  heartButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  heartIcon: {
    color: bottomTabColors.heartActive,
    fontSize: 45,
    fontWeight: '800',
    lineHeight: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.12)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 4,
  },
  heartIconOutline: {
    color: bottomTabColors.heartActive,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuDescription: {
    ...theme.typography.bodySmall,
    color: '#777777',
    fontSize: 16,
    lineHeight: 23,
  },
  menuItem: {
    borderBottomColor: '#E8DDD4',
    borderBottomWidth: 1,
    gap: 5,
    paddingVertical: 14,
  },
  menuItemHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  menuItemName: {
    ...theme.typography.label,
    color: '#1F1F1F',
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 25,
  },
  menuList: {
    gap: theme.spacing.none,
  },
  menuNote: {
    ...theme.typography.bodySmall,
    color: '#777777',
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 2,
  },
  menuPrice: {
    ...theme.typography.headingSmall,
    color: '#1F1F1F',
    fontSize: 20,
    lineHeight: 25,
  },
  menuSection: {
    borderTopColor: '#E8DDD4',
    borderTopWidth: 1,
    gap: 4,
    paddingBottom: 24,
    paddingTop: 24,
  },
  menuTitle: {
    ...theme.typography.headingSmall,
    color: '#1F1F1F',
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 4,
  },
  metaDivider: {
    ...theme.typography.bodySmall,
    color: '#8F8780',
    fontSize: 19,
    lineHeight: 25,
    paddingHorizontal: 8,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 31, 31, 0.44)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  modalCard: {
    ...theme.shadows.card,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    gap: theme.spacing.lg,
    maxHeight: '78%',
    padding: 22,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTitle: {
    ...theme.typography.headingSmall,
    color: '#1F1F1F',
    fontSize: 26,
    lineHeight: 31,
  },
  noScheduleText: {
    ...theme.typography.body,
    color: '#666666',
  },
  openDot: {
    backgroundColor: '#2E8B57',
  },
  openText: {
    color: '#2E8B57',
  },
  heroImage: {
    backgroundColor: '#E9D5C8',
    height: 360,
    justifyContent: 'flex-start',
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: '#EF3D22',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 12,
  },
  primaryActionText: {
    ...theme.typography.label,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  primaryActionIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 23,
  },
  scheduleAddress: {
    ...theme.typography.bodySmall,
    color: '#777777',
    fontSize: 14,
    lineHeight: 20,
  },
  scheduleDay: {
    ...theme.typography.label,
    color: '#1F1F1F',
    fontSize: 16,
    lineHeight: 22,
  },
  scheduleMeta: {
    ...theme.typography.bodySmall,
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
  },
  scheduleModalItem: {
    borderBottomColor: '#E8DDD4',
    borderBottomWidth: 1,
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },
  scheduleModalList: {
    gap: theme.spacing.md,
  },
  scheduleTime: {
    ...theme.typography.bodySmall,
    color: '#EF3D22',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  screen: {
    backgroundColor: '#FFFDF8',
    flex: 1,
  },
  scrollContent: {
    backgroundColor: '#FFFDF8',
  },
  scrollView: {
    flex: 1,
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EF3D22',
    borderRadius: 8,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    ...theme.typography.label,
    color: '#EF3D22',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  secondaryActionIcon: {
    color: '#EF3D22',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 23,
  },
  stateScreen: {
    alignItems: 'center',
    backgroundColor: '#FFFDF8',
    flex: 1,
    gap: theme.spacing.lg,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  stateText: {
    ...theme.typography.body,
    color: '#666666',
    textAlign: 'center',
  },
  stateTitle: {
    ...theme.typography.headingMedium,
    color: '#1F1F1F',
    textAlign: 'center',
  },
  stateButton: {
    alignItems: 'center',
    backgroundColor: '#EF3D22',
    borderRadius: 10,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  stateButtonText: {
    ...theme.typography.label,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  statusDot: {
    borderRadius: theme.radius.pill,
    height: 11,
    width: 11,
  },
  statusLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },
  statusText: {
    ...theme.typography.bodySmall,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
  },
  title: {
    ...theme.typography.headingLarge,
    color: '#1F1F1F',
    fontSize: 40,
    lineHeight: 48,
    marginBottom: 8,
  },
  topCircleButton: {
    ...theme.shadows.subtle,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(31, 31, 31, 0.08)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    elevation: 8,
    height: 50,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
    width: 50,
  },
});
