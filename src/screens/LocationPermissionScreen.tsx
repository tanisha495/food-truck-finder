import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '../components/common/PrimaryButton';
import ScreenContainer from '../components/common/ScreenContainer';
import SecondaryButton from '../components/common/SecondaryButton';
import { resetToStackScreen } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';
import { getCurrentCoordinates, openDeviceLocationSettings } from '../services/location';

export default function LocationPermissionScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(false);

  const goToSignIn = () => {
    resetToStackScreen(navigation, 'SignIn');
  };

  const openLocationSettings = () => {
    openDeviceLocationSettings().catch((settingsError) => {
      console.log('Could not open location settings', settingsError);
    });
  };

  const handleEnableLocation = async () => {
    try {
      setIsLoading(true);

      const currentLocation = await getCurrentCoordinates();

      if (!currentLocation) {
        Alert.alert(
          'Location access was not granted',
          'You can still explore food trucks. Tap Maybe Later to continue without location.',
          [
            {
              text: 'OK',
              style: 'cancel',
            },
            {
              text: 'Maybe Later',
              onPress: goToSignIn,
            },
          ]
        );
        return;
      }

      console.log('Current location:', currentLocation);
      goToSignIn();
    } catch (error) {
      console.log('Location request failed:', error);
      const emulatorHint =
        Platform.OS === 'android'
          ? 'If this is the Android emulator, open Extended Controls > Location, choose a coordinate, and press Send.'
          : 'If this is a simulator, set a simulated location from the simulator location menu.';

      Alert.alert(
        'Location unavailable',
        `Location permission may be enabled, but the device did not return a GPS position. ${emulatorHint}`,
        [
          {
            text: 'Continue',
            onPress: goToSignIn,
          },
          {
            text: 'Open Settings',
            onPress: openLocationSettings,
          },
          {
            text: 'Retry',
            style: 'cancel',
            onPress: handleEnableLocation,
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <View style={styles.content}>
          <Text accessibilityLabel="Location pin" style={styles.icon}>
            📍
          </Text>

          <View style={styles.textGroup}>
            <Text style={styles.title}>We Need Your Location</Text>
            <Text style={styles.description}>
              Help us find the best food trucks near you. Your location helps us show nearby trucks,
              real-time updates, and local events in your area.
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <PrimaryButton
              disabled={isLoading}
              loading={isLoading}
              onPress={handleEnableLocation}
              title="Enable Location"
            />
            <SecondaryButton disabled={isLoading} onPress={goToSignIn} title="Maybe Later" />
          </View>
        </View>

        <Text style={styles.privacyNote}>Your privacy matters · Location is never sold</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonGroup: {
    gap: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    gap: theme.spacing.xxl,
    justifyContent: 'center',
    width: '100%',
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    maxWidth: 350,
    textAlign: 'center',
  },
  icon: {
    fontSize: 76,
    marginBottom: theme.spacing.md,
  },
  layout: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: theme.spacing.xxxl,
  },
  privacyNote: {
    ...theme.typography.bodySmall,
    bottom: theme.spacing.xxl,
    color: theme.colors.textMuted,
    fontSize: 12,
    left: 0,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
  },
  textGroup: {
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  title: {
    ...theme.typography.headingMedium,
    color: theme.colors.text,
    textAlign: 'center',
  },
});
