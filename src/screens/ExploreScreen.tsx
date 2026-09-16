import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet,
  Platform, Text, TextInput, View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import StatusBadge from '../components/common/StatusBadge';
import { theme } from '../constants/theme';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { getCurrentCoordinates, openDeviceLocationSettings } from '../services/location';
import { fetchTrucks, haversineKm } from '../services/trucksService';
import type { FoodTruck } from '../types/truck';

const gurugramRegion: Region = {
  latitude: 28.4595, longitude: 77.0266,
  latitudeDelta: 0.12, longitudeDelta: 0.12,
};

const KM_PER_MILE = 1.60934;
const DEFAULT_DISTANCE_MILES = 25; // generous default so all trucks show
const filterOptions = ['Cuisine', 'Mexican', 'BBQ', 'Asian', 'Vegan'] as const;
type FilterOption = (typeof filterOptions)[number];

function parseDistance(v: string | string[] | undefined) {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DISTANCE_MILES;
}
function parseCategories(v: string | string[] | undefined) {
  const raw = Array.isArray(v) ? v[0] : v;
  if (!raw) return [];
  return raw.split(',').filter((c): c is FilterOption => filterOptions.includes(c as FilterOption));
}
function truckMatchesCategory(truck: FoodTruck, cat: FilterOption) {
  if (cat === 'Cuisine') return true;
  const tags = [...(truck.cuisineTags || []), truck.cuisine].map((c) => c.toLowerCase());
  if (cat === 'Asian') return tags.some((t) => ['indian','korean','chinese','japanese','thai','asian'].includes(t));
  if (cat === 'Vegan') return tags.some((t) => ['vegan','vegetarian','plant-based'].includes(t));
  return tags.some((t) => t.includes(cat.toLowerCase()));
}
function getTruckEmoji(truck: FoodTruck) {
  const c = truck.cuisine.toLowerCase();
  if (c.includes('mexican') || c.includes('taco')) return '🌮';
  if (c.includes('indian')) return '🍛';
  if (c.includes('korean')) return '🍜';
  if (c.includes('bbq') || c.includes('barbecue')) return '🍖';
  if (c.includes('dessert') || c.includes('waffle') || c.includes('crepe')) return '🧇';
  if (c.includes('ice cream') || c.includes('shake')) return '🍦';
  if (c.includes('vegan') || c.includes('vegetarian')) return '🥗';
  return '🚚';
}

function hasValidTruckCoordinates(truck: FoodTruck) {
  return truck.latitude !== 0 &&
    truck.longitude !== 0 &&
    Math.abs(truck.latitude) <= 90 &&
    Math.abs(truck.longitude) <= 180;
}

function buildRegionForPoints(points: { latitude: number; longitude: number }[], fallback: Region): Region {
  if (points.length === 0) return fallback;

  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.08;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat + pad, 0.05),
    longitudeDelta: Math.max(maxLng - minLng + pad, 0.05),
  };
}

type LocationState = 'checking' | 'granted' | 'denied' | 'unavailable';

export default function ExploreScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'Explore'>>();
  const params = route.params ?? {};
  const mapRef = useRef<MapView>(null);
  const [searchText, setSearchText] = useState('');
  const [trucks, setTrucks] = useState<FoodTruck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<FoodTruck | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>('checking');

  const resolveCurrentLocation = useCallback(async () => {
    try {
      setLocationState('checking');
      const coords = await getCurrentCoordinates();

      if (!coords) {
        setUserLocation(null);
        setLocationState('denied');
        return;
      }

      setUserLocation(coords);
      setLocationState('granted');
    } catch (locationError) {
      console.log('Could not get current location', locationError);
      setUserLocation(null);
      setLocationState('unavailable');
    }
  }, []);

  useEffect(() => { resolveCurrentLocation(); }, [resolveCurrentLocation]);

  const loadTrucks = useCallback(async () => {
    if (!userLocation) {
      setTrucks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrucks(userLocation.lat, userLocation.lng);
      setTrucks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load trucks.');
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  useEffect(() => { loadTrucks(); }, [loadTrucks]);

  const maxDistanceMiles = useMemo(() => parseDistance(params.maxDistanceMiles), [params.maxDistanceMiles]);
  const selectedCategories = useMemo(() => parseCategories(params.categories), [params.categories]);
  const appliedFilterKey = `${maxDistanceMiles}-${selectedCategories.join(',')}`;

  const filteredTrucks = useMemo(() => {
    if (!userLocation) return [];

    const q = searchText.trim().toLowerCase();
    const maxKm = maxDistanceMiles * KM_PER_MILE;
    return trucks.filter((t) => {
      // Never show trucks that are currently offline (schedule ended or is_live = false)
      if (!t.isOpen) return false;
      const matchSearch = !q || t.name.toLowerCase().includes(q) ||
        t.cuisine.toLowerCase().includes(q) ||
        (t.cuisineTags || []).some((tag) => tag.toLowerCase().includes(q));
      const distanceKm = hasValidTruckCoordinates(t)
        ? haversineKm(userLocation.lat, userLocation.lng, t.latitude, t.longitude)
        : null;
      const matchDist = distanceKm != null && distanceKm <= maxKm;
      const matchCat = selectedCategories.length === 0 ||
        selectedCategories.some((c) => truckMatchesCategory(t, c));
      return matchSearch && matchDist && matchCat;
    });
  }, [maxDistanceMiles, searchText, selectedCategories, trucks, userLocation]);

  // When filter key changes, reset selected truck to first
  useEffect(() => {
    if (filteredTrucks.length > 0) setSelectedTruck(filteredTrucks[0]);
  }, [appliedFilterKey, filteredTrucks]);

  // If selected truck falls out of filtered list, pick first
  useEffect(() => {
    if (filteredTrucks.length === 0) {
      setSelectedTruck(null);
    } else if (selectedTruck && !filteredTrucks.some((t) => t.id === selectedTruck.id)) {
      setSelectedTruck(filteredTrucks[0]);
    }
  }, [filteredTrucks, selectedTruck]);

  // Set first truck as selected when trucks load
  useEffect(() => {
    if (filteredTrucks.length > 0 && !selectedTruck) setSelectedTruck(filteredTrucks[0]);
  }, [filteredTrucks, selectedTruck]);

  const trucksWithCoords = useMemo(() =>
    filteredTrucks.filter(hasValidTruckCoordinates),
    [filteredTrucks]
  );

  const mapRegion: Region = useMemo(() => {
    const truckPoints = trucksWithCoords.map((truck) => ({
      latitude: truck.latitude,
      longitude: truck.longitude,
    }));

    if (truckPoints.length > 0) {
      return buildRegionForPoints(
        truckPoints,
        {
          latitude: userLocation?.lat ?? gurugramRegion.latitude,
          longitude: userLocation?.lng ?? gurugramRegion.longitude,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }
      );
    }

    if (userLocation) {
      return {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }

    return {
      ...gurugramRegion,
    };
  }, [trucksWithCoords, userLocation]);

  useEffect(() => {
    if (!isMapReady || locationState === 'checking') return;

    mapRef.current?.animateToRegion(mapRegion, 700);
  }, [isMapReady, locationState, mapRegion]);

  // When a truck card is tapped, zoom map to that truck's pin
  const handleSelectTruck = useCallback((truck: FoodTruck) => {
    setSelectedTruck(truck);
    // Animate map to truck location if it has valid coordinates
    if (truck.latitude !== 0 && truck.longitude !== 0 &&
        Math.abs(truck.latitude) <= 90 && Math.abs(truck.longitude) <= 180) {
      mapRef.current?.animateToRegion(
        {
          latitude: truck.latitude,
          longitude: truck.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        600 // animation duration ms
      );
    }
  }, []);

  const openFilters = () =>
    navigation.navigate('Filters', {
      maxDistanceMiles: String(maxDistanceMiles),
      categories: selectedCategories.join(','),
    });
  const openLocationSettings = () => {
    openDeviceLocationSettings().catch((settingsError) => {
      console.log('Could not open location settings', settingsError);
    });
  };
  const openTruck = (truck: FoodTruck) =>
    navigation.navigate('TruckDetail', { id: truck.id });
  const getMiniDotStyle = (truck: FoodTruck) => [
    styles.miniDot,
    truck.closingSoon
      ? styles.miniDotClosing
      : truck.isOpen
      ? styles.miniDotOpen
      : styles.miniDotClosed,
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.searchArea}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setSearchText}
              placeholder="Search trucks..."
              placeholderTextColor={theme.colors.textMuted}
              style={styles.searchInput}
              value={searchText}
            />
            {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}
          </View>
          <Pressable onPress={openFilters} style={styles.filterButton}>
            <Text style={styles.filterIcon}>⚙️</Text>
          </Pressable>
        </View>
        {userLocation && (
          <Text style={styles.locationLabel}>
            📍 Showing trucks within {maxDistanceMiles} mi
          </Text>
        )}
      </SafeAreaView>

      <View style={styles.mapFrame}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={userLocation ? {
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          } : gurugramRegion}
          loadingEnabled
          loadingBackgroundColor={theme.colors.background}
          loadingIndicatorColor={theme.colors.primary}
          onMapReady={() => setIsMapReady(true)}
          showsUserLocation={Boolean(userLocation)}
          showsMyLocationButton={Boolean(userLocation)}
          toolbarEnabled={false}
        >
          {trucksWithCoords.map((truck) => (
            <Marker
              key={truck.id}
              coordinate={{ latitude: truck.latitude, longitude: truck.longitude }}
              onPress={() => handleSelectTruck(truck)}
              pinColor={truck.closingSoon ? '#EF4444' : truck.isOpen ? '#22C55E' : theme.colors.primary}
            />
          ))}
        </MapView>
      </View>

      <View pointerEvents="box-none" style={styles.bottomOverlay}>
        {error ? (
          <Pressable onPress={loadTrucks} style={styles.errorCard}>
            <Text style={styles.emptyTitle}>Failed to load trucks</Text>
            <Text style={styles.emptyText}>{error} · Tap to retry</Text>
          </Pressable>
        ) : locationState === 'checking' ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.emptyTitle}>Finding your location</Text>
            <Text style={styles.emptyText}>Distance filters need your current location.</Text>
          </View>
        ) : loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.emptyText}>Loading food trucks...</Text>
          </View>
        ) : locationState === 'denied' ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Location is off</Text>
            <Text style={styles.emptyText}>
              Enable location to show nearby trucks and place pins around you.
            </Text>
            <View style={styles.locationActions}>
              <Pressable onPress={resolveCurrentLocation} style={styles.primaryAction}>
                <Text style={styles.primaryActionText}>Enable Location</Text>
              </Pressable>
              <Pressable onPress={openLocationSettings} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>Device Settings</Text>
              </Pressable>
            </View>
          </View>
        ) : locationState === 'unavailable' ? (
          <Pressable onPress={resolveCurrentLocation} style={styles.errorCard}>
            <Text style={styles.emptyTitle}>Location unavailable</Text>
            <Text style={styles.emptyText}>Turn on device location services, then tap to retry.</Text>
          </Pressable>
        ) : filteredTrucks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No nearby trucks found</Text>
            <Text style={styles.emptyText}>
              Try increasing the distance filter or adjusting your cuisine filters.
            </Text>
          </View>
        ) : selectedTruck ? (
          <Pressable
            onPress={() => openTruck(selectedTruck)}
            style={({ pressed }) => [styles.truckCard, pressed && styles.truckCardPressed]}
          >
            <View style={styles.truckEmojiWrapper}>
              <Text style={styles.truckEmoji}>{getTruckEmoji(selectedTruck)}</Text>
              {selectedTruck.closingSoon && (
                <View style={styles.closingBadge}><Text style={styles.closingText}>⏰</Text></View>
              )}
            </View>
            <View style={styles.truckInfo}>
              <Text numberOfLines={1} style={styles.truckName}>{selectedTruck.name}</Text>
              <View style={styles.truckMetaRow}>
                <Text numberOfLines={1} style={styles.truckMeta}>
                  {selectedTruck.cuisine}
                  {selectedTruck.distanceKm > 0 ? ` · ${selectedTruck.distanceKm.toFixed(1)} km` : ''}
                  {selectedTruck.locationName ? ` · ${selectedTruck.locationName}` : ''}
                </Text>
                <StatusBadge isOpen={selectedTruck.isOpen} />
              </View>
              {selectedTruck.closingSoon && (
                <Text style={styles.closingLabel}>⏰ Closing soon – order now!</Text>
              )}
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ) : null}

        {!loading && !error && filteredTrucks.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={styles.miniList} contentContainerStyle={styles.miniListContent}>
            {filteredTrucks.map((truck) => (
              <Pressable key={truck.id} onPress={() => handleSelectTruck(truck)}
                style={[styles.miniCard, selectedTruck?.id === truck.id && styles.miniCardSelected]}>
                <Text style={styles.miniEmoji}>{getTruckEmoji(truck)}</Text>
                <Text numberOfLines={1} style={styles.miniName}>{truck.name}</Text>
                {truck.distanceKm > 0 && (
                  <Text style={styles.miniDist}>{truck.distanceKm.toFixed(1)}km</Text>
                )}
                <View style={getMiniDotStyle(truck)} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomOverlay: {
    bottom: theme.spacing.lg, left: 0, paddingHorizontal: theme.spacing.lg,
    position: 'absolute', right: 0, gap: theme.spacing.sm,
  },
  chevron: { color: theme.colors.textMuted, fontSize: 24, fontWeight: '300' },
  closingBadge: {
    position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444',
    borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  closingLabel: { color: '#EF4444', fontSize: 11, fontWeight: '700', marginTop: 2 },
  closingText: { fontSize: 8 },
  emptyCard: {
    ...theme.shadows.card, alignItems: 'center', backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border, borderRadius: theme.radius.lg,
    borderWidth: 1, gap: theme.spacing.xs, padding: theme.spacing.xl,
  },
  emptyText: { ...theme.typography.bodySmall, color: theme.colors.textMuted, textAlign: 'center' },
  emptyTitle: { ...theme.typography.label, color: theme.colors.text, fontSize: 16 },
  errorCard: {
    ...theme.shadows.card, alignItems: 'center', backgroundColor: '#FFF5F5',
    borderColor: '#FFCCCC', borderRadius: theme.radius.lg, borderWidth: 1,
    gap: theme.spacing.xs, padding: theme.spacing.xl,
  },
  filterButton: {
    alignItems: 'center', backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border, borderRadius: theme.radius.md,
    borderWidth: 1, height: 48, justifyContent: 'center', width: 48,
  },
  filterIcon: { fontSize: 24 },
  locationLabel: {
    ...theme.typography.bodySmall, color: theme.colors.textMuted,
    fontSize: 11, marginTop: 4, paddingHorizontal: 4,
  },
  locationActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  map: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  mapFrame: {
    backgroundColor: '#E8EFEA',
    flex: 1,
    minHeight: 280,
    overflow: 'hidden',
  },
  miniCard: {
    alignItems: 'center', backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border, borderRadius: theme.radius.md,
    borderWidth: 1, gap: 2, paddingHorizontal: 12, paddingVertical: 8, minWidth: 80,
  },
  miniCardSelected: { borderColor: theme.colors.primary, backgroundColor: '#FBE7E1' },
  miniDist: { ...theme.typography.bodySmall, color: theme.colors.primary, fontSize: 9, fontWeight: '700' },
  miniEmoji: { fontSize: 20 },
  miniList: { flexGrow: 0 },
  miniListContent: { gap: theme.spacing.sm, paddingVertical: 4 },
  miniName: { ...theme.typography.bodySmall, color: theme.colors.text, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  miniDot: { width: 6, height: 6, borderRadius: 3 },
  miniDotClosed: { backgroundColor: '#94A3B8' },
  miniDotClosing: { backgroundColor: '#EF4444' },
  miniDotOpen: { backgroundColor: '#22C55E' },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  primaryActionText: {
    ...theme.typography.label,
    color: theme.colors.surface,
    fontSize: 13,
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  secondaryActionText: {
    ...theme.typography.label,
    color: theme.colors.text,
    fontSize: 13,
  },
  screen: { backgroundColor: theme.colors.background, flex: 1 },
  searchArea: {
    backgroundColor: theme.colors.background,
    paddingBottom: theme.spacing.md, paddingHorizontal: theme.spacing.lg,
  },
  searchIcon: { color: theme.colors.textMuted, fontSize: 24 },
  searchInput: { ...theme.typography.body, color: theme.colors.text, flex: 1, padding: 0 },
  searchInputWrapper: {
    alignItems: 'center', backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border, borderRadius: theme.radius.md, borderWidth: 1,
    flex: 1, flexDirection: 'row', gap: theme.spacing.sm, height: 48, paddingHorizontal: theme.spacing.md,
  },
  searchRow: { flexDirection: 'row', gap: theme.spacing.md },
  truckCard: {
    ...theme.shadows.card, alignItems: 'center', backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border, borderRadius: theme.radius.lg, borderWidth: 1,
    flexDirection: 'row', gap: theme.spacing.md, padding: theme.spacing.lg,
  },
  truckCardPressed: { opacity: 0.86 },
  truckEmoji: { fontSize: 32 },
  truckEmojiWrapper: { position: 'relative' },
  truckInfo: { flex: 1, gap: 3 },
  truckMeta: { ...theme.typography.bodySmall, color: theme.colors.textMuted, flexShrink: 1 },
  truckMetaRow: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm },
  truckName: { ...theme.typography.headingSmall, color: theme.colors.text, fontSize: 18, lineHeight: 24 },
});
