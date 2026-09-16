import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';

import ScreenContainer from '../components/common/ScreenContainer';
import PrimaryBottomMenu from '../components/navigation/PrimaryBottomMenu';
import { goBackOrResetToMainTabs } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';
import { fetchTruckById } from '../services/trucksService';
import type { FoodTruck, MenuItem } from '../types/truck';

function getTruckId(id: string | string[] | undefined) {
  return Array.isArray(id) ? id[0] : id;
}

const fallbackItemImage = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=70';

export default function FullMenuScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TruckMenu'>>();
  const truckId = getTruckId(route.params?.id);

  const [truck, setTruck] = useState<FoodTruck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!truckId) return;
    setLoading(true);
    fetchTruckById(truckId)
      .then((data) => { setTruck(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [truckId]);

  const goBack = () => {
    goBackOrResetToMainTabs(navigation, 'Explore');
  };

  const groupedMenu = truck?.menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const cat = item.category || 'Menu';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {}) ?? {};

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        style={styles.scrollView}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>

        <Text style={styles.title}>{truck ? `${truck.name} — Menu` : 'Menu'}</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.centerText}>Loading menu...</Text>
          </View>
        ) : error || !truck ? (
          <View style={styles.center}>
            <Text style={styles.centerText}>{error || 'Truck not found.'}</Text>
          </View>
        ) : truck.menuItems.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.centerTitle}>No menu items yet</Text>
            <Text style={styles.centerText}>{"The truck owner hasn't added items yet."}</Text>
          </View>
        ) : (
          Object.entries(groupedMenu).map(([category, items]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryLabel}>{category.toUpperCase()}</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.menuItem}>
                  {/* Item image */}
                  <Image
                    source={{ uri: item.imageUrl || fallbackItemImage }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                  <View style={styles.itemBody}>
                    <View style={styles.itemNameRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.isPopular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>⭐ Popular</Text>
                        </View>
                      )}
                    </View>
                    {item.description ? (
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    ) : null}
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
      <PrimaryBottomMenu activeTab="explore" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backButtonText: { ...theme.typography.headingSmall, color: theme.colors.text, lineHeight: 24 },
  categoryLabel: {
    ...theme.typography.label,
    color: theme.colors.textMuted,
    fontSize: 13,
    letterSpacing: 1.2,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  categorySection: { gap: 0 },
  center: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  centerText: { ...theme.typography.bodySmall, color: theme.colors.textMuted, textAlign: 'center' },
  centerTitle: { ...theme.typography.headingSmall, color: theme.colors.text, textAlign: 'center' },
  content: { gap: theme.spacing.xl, padding: theme.spacing.xl },
  itemBody: { flex: 1, gap: theme.spacing.xs, padding: theme.spacing.md },
  itemDescription: { ...theme.typography.body, color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 },
  itemImage: {
    backgroundColor: theme.colors.border,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    height: 160,
    width: '100%',
  },
  itemName: { ...theme.typography.label, color: theme.colors.text, flex: 1, fontSize: 16, lineHeight: 22 },
  itemNameRow: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm },
  itemPrice: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  menuItem: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  popularBadge: {
    backgroundColor: '#FBE7E1',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  popularText: { ...theme.typography.bodySmall, color: theme.colors.primary, fontSize: 11 },
  scrollView: { flex: 1 },
  title: { ...theme.typography.headingLarge, color: theme.colors.text },
});
