import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Explore:
    | {
        maxDistanceMiles?: string;
        categories?: string;
      }
    | undefined;
  Favorites: undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  LocationPermission: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Filters:
    | {
        maxDistanceMiles?: string;
        categories?: string;
      }
    | undefined;
  TruckDetail: { id: string };
  TruckMenu: { id: string };
  About: undefined;
  EditProfile: { name?: string } | undefined;
  NotificationSettings: undefined;
  PrivacyLocation: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
