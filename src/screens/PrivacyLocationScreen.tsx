import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ScreenContainer from '../components/common/ScreenContainer';
import PrimaryBottomMenu from '../components/navigation/PrimaryBottomMenu';
import { goBackOrResetToMainTabs } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';
import {
  getCurrentCoordinates,
  getLocationPermissionStatus,
  openDeviceLocationSettings,
  type LocationPermissionStatus,
} from '../services/location';

type PermissionViewState = LocationPermissionStatus | 'checking';

function getPermissionCopy(status: PermissionViewState) {
  if (status === 'granted') {
    return {
      label: 'Location is enabled',
      body: 'Explore can use your current location to center the map and show nearby truck pins.',
    };
  }

  if (status === 'checking') {
    return {
      label: 'Checking location',
      body: 'Reading your current device permission status.',
    };
  }

  if (status === 'unavailable') {
    return {
      label: 'Location is unavailable',
      body: 'Turn on device location services, then come back here to retry.',
    };
  }

  return {
    label: 'Location is off',
    body: 'Enable location permission to show Google Maps centered around you with nearby truck pins.',
  };
}

export default function PrivacyLocationScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [permissionStatus, setPermissionStatus] = useState<PermissionViewState>('checking');
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const goBackToProfile = () => {
    goBackOrResetToMainTabs(navigation, 'Profile');
  };

  const refreshPermissionStatus = async () => {
    setPermissionStatus('checking');

    try {
      setPermissionStatus(await getLocationPermissionStatus());
    } catch (error) {
      console.log('Could not read location permission status', error);
      setPermissionStatus('unavailable');
    }
  };

  useEffect(() => {
    refreshPermissionStatus();
  }, []);

  const enableLocation = async () => {
    try {
      setIsRequestingLocation(true);
      const coords = await getCurrentCoordinates();

      if (coords) {
        setPermissionStatus('granted');
        Alert.alert('Location enabled', 'Explore will now use your current location for nearby trucks.');
        return;
      }

      setPermissionStatus('denied');
      Alert.alert(
        'Location is still off',
        'Open device settings to allow location for FoodTruckFinderCLI.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openDeviceLocationSettings() },
        ]
      );
    } catch (error) {
      console.log('Could not enable location', error);
      setPermissionStatus('unavailable');
      Alert.alert('Location unavailable', 'Turn on device location services, then try again.');
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const openSettings = () => {
    openDeviceLocationSettings().catch((error) => {
      console.log('Could not open location settings', error);
    });
  };

  const permissionCopy = getPermissionCopy(permissionStatus);
  const showLocationActions = permissionStatus !== 'granted' || isRequestingLocation;

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        style={styles.scrollView}>
        <Pressable accessibilityRole="button" onPress={goBackToProfile} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>

        <Text style={styles.title}>Privacy and Location</Text>

        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <Text style={styles.label}>Location</Text>
            <View style={[
              styles.statusPill,
              permissionStatus === 'granted' ? styles.statusPillEnabled : undefined,
            ]}>
              <Text style={[
                styles.statusPillText,
                permissionStatus === 'granted' ? styles.statusPillTextEnabled : undefined,
              ]}>
                {permissionStatus === 'granted' ? 'On' : permissionStatus === 'checking' ? 'Checking' : 'Off'}
              </Text>
            </View>
          </View>
          <Text style={styles.statusTitle}>{permissionCopy.label}</Text>
          <Text style={styles.body}>{permissionCopy.body}</Text>

          {showLocationActions && (
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={isRequestingLocation}
                onPress={enableLocation}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !isRequestingLocation ? styles.buttonPressed : undefined,
                ]}>
                {isRequestingLocation ? (
                  <ActivityIndicator color={theme.colors.surface} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Enable Location</Text>
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isRequestingLocation}
                onPress={openSettings}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && !isRequestingLocation ? styles.buttonPressed : undefined,
                ]}>
                <Text style={styles.secondaryButtonText}>Open Device Settings</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Privacy note</Text>
          <Text style={styles.body}>
            Location is used only to show nearby trucks. We do not sell your location data.
          </Text>
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
  body: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
  },
  actions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  content: {
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.text,
    fontSize: 16,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonText: {
    ...theme.typography.label,
    color: theme.colors.surface,
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryButtonText: {
    ...theme.typography.label,
    color: theme.colors.text,
    fontSize: 15,
  },
  statusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  statusPill: {
    backgroundColor: '#F7E5DE',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5,
  },
  statusPillEnabled: {
    backgroundColor: '#E3F4EC',
  },
  statusPillText: {
    ...theme.typography.label,
    color: theme.colors.primaryDark,
    fontSize: 12,
  },
  statusPillTextEnabled: {
    color: theme.colors.success,
  },
  statusTitle: {
    ...theme.typography.label,
    color: theme.colors.text,
    fontSize: 18,
    marginTop: theme.spacing.sm,
  },
  title: {
    ...theme.typography.headingLarge,
    color: theme.colors.text,
  },
});
