import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { User } from '@supabase/supabase-js';
import { launchImageLibrary } from 'react-native-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ProfileOptionCard from '../components/cards/ProfileOptionCard';
import ScreenContainer from '../components/common/ScreenContainer';
import { resetToMainTabs, resetToStackScreen } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';
import { resetPasswordWithEmail } from '../services/auth';
import { uploadProfileAvatar } from '../services/profile';
import { supabase } from '../services/supabase';

// TODO: Extended profile details can later be stored in a Supabase profiles table.
// TODO: Production apps may use a private avatar bucket and signed URLs.

function getDisplayName(user: User | null) {
  const fullName = user?.user_metadata?.full_name;
  const name = user?.user_metadata?.name;

  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName;
  }

  if (typeof name === 'string' && name.trim()) {
    return name;
  }

  return 'Food Truck User';
}

function getAvatarUrl(user: User | null) {
  const avatarUrl = user?.user_metadata?.avatar_url;

  if (typeof avatarUrl === 'string' && avatarUrl.trim()) {
    return avatarUrl;
  }

  return null;
}

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [user, setUser] = useState<User | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const result = await supabase.auth.getUser();

      if (isMounted) {
        setUser(result.data.user);
        setAvatarUri(getAvatarUrl(result.data.user));
        setIsLoading(false);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAvatarUri(getAvatarUrl(session?.user ?? null));
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const pickProfilePhoto = async () => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in before adding a profile photo.');
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      Alert.alert('Photo picker failed', result.errorMessage || 'Unable to choose a profile photo.');
      return;
    }

    const selectedImage = result.assets?.[0];

    if (selectedImage?.uri) {

      try {
        setIsUploadingAvatar(true);

        const publicUrl = await uploadProfileAvatar({
          fileName: selectedImage.fileName,
          mimeType: selectedImage.type,
          uri: selectedImage.uri,
          userId: user.id,
        });

        const updateResult = await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            avatar_url: publicUrl,
          },
        });

        if (updateResult.error) {
          throw updateResult.error;
        }

        setUser(updateResult.data.user);
        setAvatarUri(publicUrl);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to save your profile photo. Please try again.';
        Alert.alert('Upload failed', message);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const sendResetPasswordEmail = async () => {
    if (!user?.email) {
      Alert.alert('No email found for this account.');
      return;
    }

    try {
      // Full in-app reset flow requires deep linking and will be configured later.
      await resetPasswordWithEmail(user.email);
      Alert.alert('Password reset email sent. Please check your inbox.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to send a reset link. Please try again.';
      Alert.alert('Reset failed', message);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          resetToStackScreen(navigation, 'SignIn');
        },
      },
    ]);
  };

  const displayName = getDisplayName(user);
  const email = user?.email ?? 'No email found';

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarShell}>
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarIcon}>👤</Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isUploadingAvatar}
              onPress={pickProfilePhoto}
              style={styles.avatarEditButton}>
              {isUploadingAvatar ? (
                <ActivityIndicator color={theme.colors.surface} size="small" />
              ) : (
                <Text style={styles.editIcon}>✎</Text>
              )}
            </Pressable>
          </View>

          {isLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <View style={styles.identity}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{displayName}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    navigation.navigate('EditProfile', {
                      name: displayName,
                    })
                  }
                  style={styles.nameEditButton}>
                  <Text style={styles.nameEditIcon}>✎</Text>
                </Pressable>
              </View>
              <Text style={styles.email}>{email}</Text>
            </View>
          )}
        </View>

        <View style={styles.optionList}>
          <ProfileOptionCard
            icon="❤️"
            label="Saved Trucks"
            onPress={() => resetToMainTabs(navigation, 'Favorites')}
          />
          <ProfileOptionCard
            icon="🔔"
            label="Notification Settings"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          <ProfileOptionCard
            icon="🔒"
            label="Privacy and Location"
            onPress={() => navigation.navigate('PrivacyLocation')}
          />
          <ProfileOptionCard
            icon="🔑"
            label="Reset Password"
            onPress={sendResetPasswordEmail}
          />
          <ProfileOptionCard
            icon="ℹ️"
            label="About App"
            onPress={() => navigation.navigate('About')}
          />
        </View>

        <Pressable accessibilityRole="button" onPress={confirmSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#FCEBE7',
    borderRadius: theme.radius.pill,
    height: 92,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 92,
  },
  avatarEditButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    bottom: 0,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 30,
  },
  avatarIcon: {
    fontSize: 36,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarShell: {
    position: 'relative',
  },
  content: {
    gap: theme.spacing.xxl,
    padding: theme.spacing.xl,
  },
  editIcon: {
    color: theme.colors.surface,
    fontSize: 16,
    lineHeight: 18,
  },
  email: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  identity: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  name: {
    ...theme.typography.headingMedium,
    color: theme.colors.text,
    textAlign: 'center',
  },
  nameEditButton: {
    padding: theme.spacing.xs,
  },
  nameEditIcon: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  optionList: {
    gap: theme.spacing.md,
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: theme.spacing.xxl,
    minHeight: 52,
  },
  signOutText: {
    ...theme.typography.label,
    color: theme.colors.primary,
    fontSize: 16,
  },
});
