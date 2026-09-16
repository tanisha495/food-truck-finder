import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StyleSheet} from 'react-native';

import BottomTabIcon from '../components/navigation/BottomTabIcon';
import { bottomTabColors } from '../components/navigation/bottomTabColors';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LocationPermissionScreen from '../screens/LocationPermissionScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

import ExploreScreen from '../screens/ExploreScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ProfileScreen from '../screens/ProfileScreen';

import FiltersScreen from '../screens/FiltersScreen';
import TruckDetailScreen from '../screens/TruckDetailScreen';
import TruckMenuScreen from '../screens/TruckMenuScreen';
import AboutScreen from '../screens/AboutScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import PrivacyLocationScreen from '../screens/PrivacyLocationScreen';
import { theme } from '../constants/theme';
import type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcons = {
  Explore: 'explore',
  Favorites: 'favorites',
  Alerts: 'alerts',
  Profile: 'profile',
} as const;

function renderTabIcon(routeName: keyof MainTabParamList, focused: boolean) {
  return <BottomTabIcon focused={focused} name={tabIcons[routeName]} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: bottomTabColors.active,
        tabBarLabelPosition: 'below-icon',
        tabBarInactiveTintColor: bottomTabColors.inactive,
        tabBarIconStyle: styles.tabIcon,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused }) => renderTabIcon(route.name, focused),
      })}>
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        <Stack.Screen name="MainTabs" component={MainTabs} />

        <Stack.Screen name="Filters" component={FiltersScreen} />
        <Stack.Screen name="TruckDetail" component={TruckDetailScreen} />
        <Stack.Screen name="TruckMenu" component={TruckMenuScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="PrivacyLocation" component={PrivacyLocationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    elevation: 14,
    height: 84,
    paddingBottom: 10,
    paddingTop: 7,
    shadowColor: '#000',
    shadowOffset: {height: -2, width: 0},
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabIcon: {
    height: 32,
    marginBottom: 2,
    marginTop: 0,
    width: 36,
  },
  tabItem: {
    alignItems: 'center',
    height: 66,
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 2,
    textAlign: 'center',
  },
});
