import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import ScreenContainer from '../components/common/ScreenContainer';
import PrimaryBottomMenu from '../components/navigation/PrimaryBottomMenu';
import { goBackOrResetToMainTabs } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [favoriteTruckAlerts, setFavoriteTruckAlerts] = useState(true);
  const [nearbyTruckAlerts, setNearbyTruckAlerts] = useState(true);
  const [newTruckAlerts, setNewTruckAlerts] = useState(false);

  const goBackToProfile = () => {
    goBackOrResetToMainTabs(navigation, 'Profile');
  };

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        style={styles.scrollView}>
        <Pressable accessibilityRole="button" onPress={goBackToProfile} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>

        <Text style={styles.title}>Notification Settings</Text>

        <View style={styles.option}>
          <Text style={styles.optionLabel}>Favorite truck alerts</Text>
          <Switch value={favoriteTruckAlerts} onValueChange={setFavoriteTruckAlerts} />
        </View>
        <View style={styles.option}>
          <Text style={styles.optionLabel}>Nearby truck alerts</Text>
          <Switch value={nearbyTruckAlerts} onValueChange={setNearbyTruckAlerts} />
        </View>
        <View style={styles.option}>
          <Text style={styles.optionLabel}>New truck alerts</Text>
          <Switch value={newTruckAlerts} onValueChange={setNewTruckAlerts} />
        </View>
      </ScrollView>
      <PrimaryBottomMenu activeTab="profile" />
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
  backButtonText: {
    ...theme.typography.headingSmall,
    color: theme.colors.text,
    lineHeight: 24,
  },
  content: {
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  option: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  optionLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    ...theme.typography.headingLarge,
    color: theme.colors.text,
  },
});
