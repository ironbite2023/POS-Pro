import { supabase } from '../supabase/client';
import type { Database } from '../supabase/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export interface SignUpParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roleId?: string;
  phone?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export const authService = {
  /**
   * Sign up a new user
   */
  signUp: async (params: SignUpParams) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName,
        organization_id: params.organizationId,
        role_id: params.roleId || null,
        phone: params.phone || null,
        status: 'active',
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return { user: authData.user, profile };
  },

  /**
   * Sign in an existing user
   */
  signIn: async (params: SignInParams) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error) throw error;

    // Update last login
    if (data.user) {
      await supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    return data;
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get the current session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Get the current user
   */
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  /**
   * Get the current user's profile
   */
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (
    userId: string,
    updates: Partial<Omit<UserProfile, 'id' | 'email' | 'organization_id'>>
  ) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Reset password
   */
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  },

  /**
   * Update password
   */
  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange: (callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};
