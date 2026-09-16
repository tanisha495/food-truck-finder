import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import ScreenContainer from '../components/common/ScreenContainer';
import PrimaryBottomMenu from '../components/navigation/PrimaryBottomMenu';
import { goBackOrResetToMainTabs } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';

export default function AboutAppScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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

        <Text style={styles.title}>About App</Text>

        <View style={styles.card}>
          <Text style={styles.appName}>Food Truck Finder</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.body}>
            Food Truck Finder helps users discover nearby food trucks, check open status, view menus, and save their favorite trucks in one simple app.
          </Text>

          <Text style={styles.body}>
            The motive of this app is to connect customers with local food truck owners more easily.
            Instead of searching across social media or guessing where a truck is parked, users can
            open the app and instantly find food trucks around them.
          </Text>

          <Text style={styles.body}>
            Our goal is to support local food businesses and make food truck discovery faster,
            easier, and more enjoyable.
          </Text>
          
        </View>
      </ScrollView>
      <PrimaryBottomMenu activeTab="profile" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  appName: {
    ...theme.typography.headingSmall,
    color: theme.colors.text,
  },
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
    ...theme.typography.body,
    color: theme.colors.textMuted,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  content: {
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    ...theme.typography.headingLarge,
    color: theme.colors.text,
  },
  version: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
  },
});
