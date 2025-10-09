import { supabase } from '../supabase/client';
import type { Database } from '../supabase/database.types';
import { auditService, AuditEventType } from './audit.service';

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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: params.email,
        password: params.password,
      });

      if (error) {
        // Log failed login attempt
        await auditService.logAuth(
          AuditEventType.LOGIN_FAILED,
          undefined,
          params.email,
          undefined, // IP will be added by middleware/client
          false,
          { error: error.message }
        );
        throw error;
      }

      // Update last login
      if (data.user) {
        await supabase
          .from('user_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);

        // Log successful login
        await auditService.logAuth(
          AuditEventType.LOGIN_SUCCESS,
          data.user.id,
          params.email,
          undefined, // IP will be added by middleware/client
          true
        );
      }

      return data;
    } catch (error) {
      // Ensure failed login is logged even if audit fails
      if (!(error as any).message?.includes('audit')) {
        await auditService.logAuth(
          AuditEventType.LOGIN_FAILED,
          undefined,
          params.email,
          undefined,
          false,
          { error: (error as any).message }
        ).catch(() => {}); // Silent fail for audit
      }
      throw error;
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    try {
      // Get current user before signing out
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Log successful logout
      if (user) {
        await auditService.logAuth(
          AuditEventType.LOGOUT,
          user.id,
          user.email,
          undefined,
          true
        );
      }
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
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
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;

      // Log password reset request
      await auditService.logAuth(
        AuditEventType.PASSWORD_RESET_REQUEST,
        undefined,
        email,
        undefined,
        true
      );
    } catch (error) {
      // Log failed password reset request
      await auditService.logAuth(
        AuditEventType.PASSWORD_RESET_REQUEST,
        undefined,
        email,
        undefined,
        false,
        { error: (error as any).message }
      ).catch(() => {}); // Silent fail for audit
      
      throw error;
    }
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
