import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import AppTextInput from '../components/common/AppTextInput';
import PrimaryButton from '../components/common/PrimaryButton';
import ScreenContainer from '../components/common/ScreenContainer';
import { resetToStackScreen } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';
import { resetPasswordWithEmail } from '../services/auth';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const goToSignIn = () => {
    resetToStackScreen(navigation, 'SignIn');
  };

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }

    try {
      setIsLoading(true);
      await resetPasswordWithEmail(email);

      Alert.alert(
        'Reset email sent',
        'Password reset email sent. Please check your inbox.',
        [
          {
            text: 'OK',
            onPress: goToSignIn,
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to send a reset link. Please try again.';
      Alert.alert('Reset failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email to reset</Text>
        </View>

        <View style={styles.form}>
          <AppTextInput
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="Enter your email"
            value={email}
          />
        </View>

        <PrimaryButton
          disabled={isLoading}
          loading={isLoading}
          onPress={handleSendResetLink}
          title="Send Reset Link"
        />

        <Pressable onPress={goToSignIn} style={styles.backLinkWrapper}>
          <Text style={styles.backLink}>Back to Sign In</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backLink: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  backLinkWrapper: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  content: {
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    width: '100%',
  },
  form: {
    marginTop: theme.spacing.xxl,
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
