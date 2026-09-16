import { supabase } from './supabase';

export const PASSWORD_RESET_REDIRECT_URL = 'foodtruckfinder://reset-password';

/**
 * Ensures a profile row exists for the currently authenticated user.
 * Called after sign-in and after sign-up (when session is available).
 * Uses the authenticated session so RLS allows the insert/upsert.
 * Does NOT overwrite is_suspended — admin-set suspensions are preserved.
 */
export async function ensureProfileExists(
  userId: string,
  email: string,
  fullName: string,
  role: string = 'customer'
) {
  try {
    // Only upsert fields we own — never touch is_suspended here
    await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          role,
        },
        { onConflict: 'id', ignoreDuplicates: false }
      );
  } catch {
    // Non-fatal
  }
}

/**
 * Checks whether a user's profile is suspended in the DB.
 * Returns true if suspended, false if not (or if the check fails non-fatally).
 */
async function isUserSuspended(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_suspended')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return false;
    return data.is_suspended === true;
  } catch {
    return false;
  }
}

export async function signInWithEmail(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (result.error) {
    throw new Error(result.error.message || 'Unable to sign in. Please try again.');
  }

  if (result.data?.user) {
    const { id, email: userEmail, user_metadata } = result.data.user;
    const name = user_metadata?.full_name || user_metadata?.name || (userEmail?.split('@')[0] ?? '');
    const role = user_metadata?.role || 'customer';

    // Ensure profile row exists (handles users who registered before trigger)
    await ensureProfileExists(id, userEmail ?? '', name, role);

    // ── SUSPENSION GUARD ──────────────────────────────────────────────────────
    // Check AFTER ensuring profile exists so the row is always present.
    const suspended = await isUserSuspended(id);
    if (suspended) {
      // Immediately invalidate the session
      await supabase.auth.signOut();
      throw new Error(
        'Your account has been suspended by an administrator. Please contact support for assistance.'
      );
    }
  }

  return result;
}

export async function signUpWithEmail(fullName: string, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  // ── DUPLICATE EMAIL PRE-CHECK ─────────────────────────────────────────────
  // Check the profiles table first to catch accounts created by admin
  // (truck owners) that might not surface a clear error from supabase.auth.signUp.
  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
  } catch (preCheckErr: any) {
    // Only re-throw if it's our explicit duplicate message
    if (preCheckErr?.message?.includes('already exists')) {
      throw preCheckErr;
    }
    // Otherwise swallow — profiles table might not exist yet, let auth.signUp decide
  }

  const result = await supabase.auth.signUp({
    email: normalizedEmail,
    options: {
      data: {
        full_name: fullName.trim(),
        name: fullName.trim(),
        role: 'customer',
      },
    },
    password,
  });

  if (result.error) {
    const msg = result.error.message?.toLowerCase() ?? '';
    if (
      msg.includes('already registered') ||
      msg.includes('user already exists') ||
      msg.includes('email address is already')
    ) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    throw new Error(result.error.message || 'Unable to create your account. Please try again.');
  }

  // Supabase returns user but no session when email confirmation is enabled.
  // identities.length === 0 means the email is already registered (silent duplicate).
  if (result.data?.user && result.data.user.identities?.length === 0) {
    throw new Error('An account with this email already exists. Please sign in instead.');
  }

  // If we have a session (email confirmation disabled), create the profile row immediately
  if (result.data?.session && result.data?.user) {
    const { id, email: userEmail } = result.data.user;
    await ensureProfileExists(id, userEmail ?? normalizedEmail, fullName, 'customer');
  }

  return result;
}

export async function resetPasswordWithEmail(email: string) {
  const result = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: PASSWORD_RESET_REDIRECT_URL,
  });

  if (result.error) {
    throw new Error(result.error.message || 'Unable to send a password reset email.');
  }

  return result;
}
