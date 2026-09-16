import Slider from '@react-native-community/slider';
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '../components/common/PrimaryButton';
import ScreenContainer from '../components/common/ScreenContainer';
import SecondaryButton from '../components/common/SecondaryButton';
import PrimaryBottomMenu from '../components/navigation/PrimaryBottomMenu';
import { goBackOrResetToMainTabs } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';

const defaultDistanceMiles = 25;
const maxDistanceMilesAllowed = 50;
const filterOptions = ['Cuisine', 'Mexican', 'BBQ', 'Asian', 'Vegan'] as const;

type FilterOption = (typeof filterOptions)[number];

function parseDistance(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const numberValue = Number(rawValue);

  if (!Number.isFinite(numberValue)) {
    return defaultDistanceMiles;
  }

  return Math.min(Math.max(numberValue, 0), maxDistanceMilesAllowed);
}

function parseCategories(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(',')
    .filter((category): category is FilterOption =>
      filterOptions.includes(category as FilterOption)
    );
}

export default function FiltersScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Filters'>>();
  const params = route.params ?? {};

  const initialDistance = useMemo(() => parseDistance(params.maxDistanceMiles), [params.maxDistanceMiles]);
  const initialCategories = useMemo(() => parseCategories(params.categories), [params.categories]);

  const [distanceMiles, setDistanceMiles] = useState(initialDistance);
  const [selectedCategories, setSelectedCategories] = useState<FilterOption[]>(initialCategories);

  const roundedDistance = Math.round(distanceMiles);

  const goBack = () => {
    goBackOrResetToMainTabs(navigation, 'Explore');
  };

  const toggleCategory = (category: FilterOption) => {
    setSelectedCategories((currentCategories) => {
      const isSelected = currentCategories.includes(category);

      if (isSelected) {
        return currentCategories.filter((item) => item !== category);
      }

      return [...currentCategories, category];
    });
  };

  const applyFilters = () => {
    navigation.navigate('MainTabs', {
      screen: 'Explore',
      params: {
        maxDistanceMiles: String(roundedDistance),
        categories: selectedCategories.join(','),
      },
    });
  };

  const clearAll = () => {
    setDistanceMiles(defaultDistanceMiles);
    setSelectedCategories([]);
  };

  return (
    <ScreenContainer padded={false}>
      <View style={styles.content}>
        <Pressable accessibilityRole="button" onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>

        <Text style={styles.title}>Advanced Filters</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Distance (up to {roundedDistance} miles)</Text>
          <Slider
            maximumTrackTintColor={theme.colors.border}
            maximumValue={maxDistanceMilesAllowed}
            minimumTrackTintColor={theme.colors.primary}
            minimumValue={1}
            onValueChange={setDistanceMiles}
            step={1}
            style={styles.slider}
            thumbTintColor={theme.colors.primary}
            value={distanceMiles}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Open Now</Text>
          <View style={styles.optionGrid}>
            {filterOptions.map((option) => {
              const isSelected = selectedCategories.includes(option);

              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  key={option}
                  onPress={() => toggleCategory(option)}
                  style={styles.optionRow}>
                  <View style={[styles.checkbox, isSelected ? styles.checkboxSelected : undefined]}>
                    {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  <Text style={[styles.optionLabel, isSelected ? styles.optionLabelSelected : undefined]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <PrimaryButton onPress={applyFilters} title="Apply Filters" />
          <SecondaryButton onPress={clearAll} title="Clear All" />
        </View>
      </View>
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
    marginBottom: theme.spacing.sm,
    width: 40,
  },
  backButtonText: {
    ...theme.typography.headingSmall,
    color: theme.colors.text,
    lineHeight: 24,
  },
  buttonGroup: {
    gap: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    width: '100%',
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.textMuted,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    ...theme.typography.label,
    color: theme.colors.surface,
    fontSize: 13,
    lineHeight: 16,
  },
  content: {
    flex: 1,
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
    width: '100%',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: theme.spacing.lg,
  },
  optionLabel: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
  },
  optionLabelSelected: {
    color: theme.colors.text,
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '50%',
  },
  section: {
    gap: theme.spacing.lg,
  },
  sectionLabel: {
    ...theme.typography.label,
    color: theme.colors.text,
    fontSize: 16,
  },
  sectionTitle: {
    ...theme.typography.headingSmall,
    color: theme.colors.text,
    fontSize: 20,
  },
  slider: {
    height: 36,
    width: '100%',
  },
  title: {
    ...theme.typography.headingLarge,
    color: theme.colors.text,
  },
});
