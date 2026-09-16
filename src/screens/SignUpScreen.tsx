import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import AppTextInput from '../components/common/AppTextInput';
import PrimaryButton from '../components/common/PrimaryButton';
import ScreenContainer from '../components/common/ScreenContainer';
import SecondaryButton from '../components/common/SecondaryButton';
import { resetToMainTabs, resetToStackScreen } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';
import { signUpWithEmail } from '../services/auth';

export default function SignUpScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAccount = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing name', 'Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!password) {
      Alert.alert('Missing password', 'Please create a password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password too short', 'Please create a password with at least 6 characters.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await signUpWithEmail(fullName, email, password);

      if (result.data.session) {
        resetToMainTabs(navigation);
        return;
      }

      Alert.alert(
        'Account created',
        'Account created. Please check your email to confirm your account.',
        [
          {
            text: 'OK',
            onPress: () => resetToStackScreen(navigation, 'SignIn'),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create your account. Please try again.';
      Alert.alert('Sign up failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const showGooglePlaceholder = () => {
    Alert.alert('Coming soon', 'Google sign up will be added in a later step.');
  };

  const showApplePlaceholder = () => {
    Alert.alert('Coming soon', 'Apple sign up will be added in a later step.');
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Food Truck Finder</Text>
        </View>

        <View style={styles.form}>
          <AppTextInput
            label="Full Name"
            onChangeText={setFullName}
            placeholder="Enter your full name"
            value={fullName}
          />
          <AppTextInput
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="Enter your email"
            value={email}
          />
          <AppTextInput
            label="Password"
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry
            value={password}
          />
        </View>

        <View style={styles.buttonGroup}>
          <PrimaryButton
            disabled={isLoading}
            loading={isLoading}
            onPress={handleCreateAccount}
            title="Create Account"
          />
          <SecondaryButton
            disabled={isLoading}
            onPress={showGooglePlaceholder}
            title="Continue with Google"
          />
          <SecondaryButton
            disabled={isLoading}
            onPress={showApplePlaceholder}
            title="Continue with Apple"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonGroup: {
    gap: theme.spacing.lg,
    width: '100%',
  },
  content: {
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  footerLink: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  footerText: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
  },
  form: {
    gap: theme.spacing.xl,
    marginTop: theme.spacing.md,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  title: {
    ...theme.typography.headingLarge,
    color: theme.colors.text,
    textAlign: 'center',
  },
});
