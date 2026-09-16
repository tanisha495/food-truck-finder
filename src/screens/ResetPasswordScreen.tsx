import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import AppTextInput from '../components/common/AppTextInput';
import PrimaryButton from '../components/common/PrimaryButton';
import ScreenContainer from '../components/common/ScreenContainer';
import { resetToStackScreen } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';
import { supabase } from '../services/supabase';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const goToSignIn = () => {
    resetToStackScreen(navigation, 'SignIn');
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Missing password', 'Please enter and confirm your new password.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Please use at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure both passwords match.');
      return;
    }

    try {
      setIsLoading(true);

      // TODO: If mobile testing shows the email link does not create a recovery session,
      // parse the deep link tokens and call supabase.auth.setSession before updateUser.
      const result = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (result.error) {
        throw result.error;
      }

      Alert.alert(
        'Password updated',
        'Password updated successfully. Please sign in again.',
        [
          {
            text: 'OK',
            onPress: goToSignIn,
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update your password. Please try again.';
      Alert.alert('Update failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Create a new password for your account</Text>
        </View>

        <View style={styles.form}>
          <AppTextInput
            label="New Password"
            onChangeText={setNewPassword}
            placeholder="Enter a new password"
            secureTextEntry
            value={newPassword}
          />
          <AppTextInput
            label="Confirm Password"
            onChangeText={setConfirmPassword}
            placeholder="Confirm your new password"
            secureTextEntry
            value={confirmPassword}
          />
        </View>

        <PrimaryButton
          disabled={isLoading}
          loading={isLoading}
          onPress={handleUpdatePassword}
          title="Update Password"
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
    gap: theme.spacing.xl,
    marginTop: theme.spacing.lg,
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
