import Geolocation, {
  type GeolocationError,
  type GeolocationResponse,
} from '@react-native-community/geolocation';
import { Linking, PermissionsAndroid, Platform } from 'react-native';

export type Coordinates = {
  lat: number;
  lng: number;
};

export type LocationPermissionStatus = 'granted' | 'denied' | 'unavailable';

Geolocation.setRNConfiguration({
  authorizationLevel: 'whenInUse',
  skipPermissionRequests: false,
});

export async function getLocationPermissionStatus(): Promise<LocationPermissionStatus> {
  if (Platform.OS === 'android') {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    return hasPermission ? 'granted' : 'denied';
  }

  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      Geolocation.requestAuthorization(
        () => resolve('granted'),
        () => resolve('denied')
      );
    });
  }

  return 'unavailable';
}

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      Geolocation.requestAuthorization(
        () => resolve(true),
        () => resolve(false)
      );
    });
  }

  return false;
}

function getCurrentPosition() {
  return new Promise<GeolocationResponse>((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 10_000,
      timeout: 20_000,
    });
  });
}

function isPermissionDeniedError(error: unknown) {
  const locationError = error as Partial<GeolocationError> | undefined;
  return locationError?.code === 1 || locationError?.code === locationError?.PERMISSION_DENIED;
}

export async function getCurrentCoordinates(): Promise<Coordinates | null> {
  if (Platform.OS === 'android') {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      return null;
    }
  }

  let position: GeolocationResponse;
  try {
    position = await getCurrentPosition();
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return null;
    }

    throw error;
  }

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
}

export async function openDeviceLocationSettings() {
  if (Platform.OS === 'android' && typeof Linking.sendIntent === 'function') {
    try {
      await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      return;
    } catch {
      // Fall back to the app settings page below.
    }
  }

  await Linking.openSettings();
}
