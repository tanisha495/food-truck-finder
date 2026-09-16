import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { resetToMainTabs, resetToStackScreen } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';
import { supabase } from '../services/supabase';

export default function SplashScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    let isMounted = true;

    const timer = setTimeout(async () => {
      const result = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (result.data.session) {
        resetToMainTabs(navigation);
        return;
      }

      resetToStackScreen(navigation, 'Onboarding');
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <View style={styles.depthOverlay} />

      <View style={styles.content}>
        <Text accessibilityLabel="Food truck" style={styles.icon}>
          🚚
        </Text>
        <Text style={styles.title}>Food Truck Finder</Text>
        <Text style={styles.subtitle}>Discover nearby food trucks</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    zIndex: 1,
  },
  depthOverlay: {
    backgroundColor: theme.colors.primaryDark,
    bottom: 0,
    opacity: 0.32,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '48%',
  },
  icon: {
    fontSize: 52,
    marginBottom: theme.spacing.lg,
  },
  screen: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.surface,
    fontSize: 15,
    textAlign: 'center',
  },
  title: {
    ...theme.typography.headingMedium,
    color: theme.colors.surface,
    textAlign: 'center',
  },
});
