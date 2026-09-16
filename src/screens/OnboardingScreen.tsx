import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '../components/common/PrimaryButton';
import ScreenContainer from '../components/common/ScreenContainer';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';

const onboardingSlides = [
  {
    icon: '🗺️',
    accessibilityLabel: 'Map',
    title: 'Find Food Trucks Near You',
    description:
      'Browse nearby food trucks in real time and discover amazing meals just around the corner.',
    buttonTitle: 'Next',
  },
  {
    icon: '⏰',
    accessibilityLabel: 'Alarm clock',
    title: 'See Who is Open Now',
    description: 'Check real-time hours and never miss your favorite food truck again.',
    buttonTitle: 'Get Started',
  },
] as const;

export default function OnboardingScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const currentSlide = onboardingSlides[currentSlideIndex];
  const isLastSlide = currentSlideIndex === onboardingSlides.length - 1;

  const handleButtonPress = () => {
    if (isLastSlide) {
      navigation.navigate('LocationPermission');
      return;
    }

    setCurrentSlideIndex(currentSlideIndex + 1);
  };

  return (
    <ScreenContainer centered>
      <View style={styles.content}>
        <Text accessibilityLabel={currentSlide.accessibilityLabel} style={styles.icon}>
          {currentSlide.icon}
        </Text>

        <View style={styles.textGroup}>
          <Text style={styles.title}>{currentSlide.title}</Text>
          <Text style={styles.description}>{currentSlide.description}</Text>
        </View>

        <View style={styles.pagination}>
          {onboardingSlides.map((slide, index) => (
            <View
              key={slide.title}
              style={[styles.dot, index === currentSlideIndex ? styles.activeDot : undefined]}
            />
          ))}
        </View>

        <PrimaryButton title={currentSlide.buttonTitle} onPress={handleButtonPress} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  content: {
    alignItems: 'center',
    gap: theme.spacing.xxl,
    width: '100%',
  },
  description: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
    maxWidth: 320,
    textAlign: 'center',
  },
  dot: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    height: 8,
    width: 8,
  },
  icon: {
    fontSize: 72,
    marginBottom: theme.spacing.md,
  },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
