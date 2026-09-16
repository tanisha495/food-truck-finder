import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import AppTextInput from '../components/common/AppTextInput';
import PrimaryButton from '../components/common/PrimaryButton';
import ScreenContainer from '../components/common/ScreenContainer';
import PrimaryBottomMenu from '../components/navigation/PrimaryBottomMenu';
import { goBackOrResetToMainTabs } from '../navigation/actions';
import type { RootStackParamList } from '../navigation/types';
import { theme } from '../constants/theme';
import { supabase } from '../services/supabase';

export default function EditProfileScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditProfile'>>();
  const initialName = route.params?.name;
  const [fullName, setFullName] = useState(initialName ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialName) return;

    const loadCurrentName = async () => {
      const result = await supabase.auth.getUser();
      const fullNameMetadata = result.data.user?.user_metadata?.full_name;
      const nameMetadata = result.data.user?.user_metadata?.name;

      if (typeof fullNameMetadata === 'string' && fullNameMetadata.trim()) {
        setFullName(fullNameMetadata);
        return;
      }
      if (typeof nameMetadata === 'string' && nameMetadata.trim()) {
        setFullName(nameMetadata);
      }
    };

    loadCurrentName();
  }, [initialName]);

  const goBackToProfile = () => {
    goBackOrResetToMainTabs(navigation, 'Profile');
  };

  const saveName = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing name', 'Please enter your full name.');
      return;
    }

    try {
      setIsSaving(true);

      // 1. Update auth user metadata (name visible in auth session)
      const authResult = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          name: fullName.trim(),
        },
      });

      if (authResult.error) throw authResult.error;

      const userId = authResult.data.user?.id;

      // 2. ── CRITICAL: sync the name to the profiles table ──────────────────
      //    This prevents a truck-owner name edit from being treated as a new
      //    registration by the admin panel, which would incorrectly create a
      //    duplicate truck row. We update owner_name AND full_name so both
      //    lookup paths in the admin's mapTruck() function see the right value.
      if (userId) {
        await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            owner_name: fullName.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
        // Non-fatal if this fails — auth metadata is the primary source for the app
      }

      goBackToProfile();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update your profile right now.';
      Alert.alert('Update failed', message);
    } finally {
      setIsSaving(false);
    }
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

        <Text style={styles.title}>Edit Profile</Text>
        <AppTextInput
          label="Full Name"
          onChangeText={setFullName}
          placeholder="Enter your full name"
          value={fullName}
        />
        <PrimaryButton
          disabled={isSaving}
          loading={isSaving}
          title="Save"
          onPress={saveName}
        />
      </ScrollView>
      <PrimaryBottomMenu activeTab="profile" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
});
