import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import AppTextInput from '../components/common/AppTextInput';
import PrimaryButton from '../components/common/PrimaryButton';
import ScreenContainer from '../components/common/ScreenContainer';
import SecondaryButton from '../components/common/SecondaryButton';
import { resetToMainTabs } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';
import { signInWithEmail } from '../services/auth';

export default function SignInScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing information', 'Please enter both your email and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    try {
      setIsLoading(true);
      await signInWithEmail(email, password);
      resetToMainTabs(navigation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
      Alert.alert('Sign in failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const showGooglePlaceholder = () => {
    Alert.alert('Coming soon', 'Google login will be added in a later step.');
  };

  const showApplePlaceholder = () => {
    Alert.alert('Coming soon', 'Apple login will be added in a later step.');
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
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
            placeholder="Enter your password"
            secureTextEntry
            value={password}
          />
          <Pressable
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPasswordWrapper}>
            <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
          </Pressable>
        </View>

        <View style={styles.buttonGroup}>
          <PrimaryButton
            disabled={isLoading}
            loading={isLoading}
            onPress={handleSignIn}
            title="Sign In"
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
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <Pressable onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.footerLink}>Sign Up</Text>
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
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
    width: '100%',
  },
  forgotPasswordLink: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
  },
  forgotPasswordWrapper: {
    alignItems: 'flex-end',
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
