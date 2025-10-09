'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService } from '@/lib/services';
import type { Database } from '@/lib/supabase/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  sessionTimeLeft: number | null; // Time left in seconds before session expires
  isSessionExpiring: boolean; // True when session is about to expire (< 5 minutes)
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    roleId?: string;
    phone?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
  extendSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
  const [isSessionExpiring, setIsSessionExpiring] = useState(false);

  // Load user profile
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await authService.getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentSession = await authService.getSession();
        setSession(currentSession);

        if (currentSession?.user) {
          setUser(currentSession.user);
          await loadUserProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [loadUserProfile]);

  // Subscribe to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  // Session timeout management
  useEffect(() => {
    let timeoutInterval: NodeJS.Timeout;

    if (session && session.expires_at) {
      timeoutInterval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at!;
        const timeLeft = expiresAt - now;

        setSessionTimeLeft(timeLeft);
        
        // Check if session is expiring (less than 5 minutes)
        const isExpiring = timeLeft <= 300 && timeLeft > 0;
        setIsSessionExpiring(isExpiring);

        // Auto-refresh if session is about to expire (less than 2 minutes)
        if (timeLeft <= 120 && timeLeft > 60) {
          console.log('Auto-refreshing session...');
          refreshSession().catch(console.error);
        }

        // Force logout if session has expired
        if (timeLeft <= 0) {
          console.log('Session expired, logging out...');
          signOut().catch(console.error);
        }
      }, 30000); // Check every 30 seconds
    }

                       return () => {
          if (timeoutInterval) {
            clearInterval(timeoutInterval);
          }
        };
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [session]);

  // Refresh session function
  const refreshSession = useCallback(async () => {
    try {
      const currentSession = await authService.getSession();
      
      if (currentSession) {
        setSession(currentSession);
        console.log('Session refreshed successfully');
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  }, []);

  // Extend session function (manual refresh)
  const extendSession = useCallback(async () => {
    try {
      const session = await authService.getSession();
      if (!session) throw new Error('No session found');
      
      if (session) {
        setSession(session);
        setIsSessionExpiring(false);
        console.log('Session extended successfully');
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
      throw error;
    }
  }, []);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const data = await authService.signIn({ email, password });
      setSession(data.session);
      setUser(data.user);

      if (data.user) {
        await loadUserProfile(data.user.id);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  // Sign up
  const signUp = useCallback(
    async (params: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      organizationId: string;
      roleId?: string;
      phone?: string;
    }) => {
      try {
        setLoading(true);
        const { user: newUser, profile } = await authService.signUp({
          email: params.email,
          password: params.password,
          firstName: params.firstName,
          lastName: params.lastName,
          organizationId: params.organizationId,
          roleId: params.roleId,
          phone: params.phone,
        });

        setUser(newUser);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error signing up:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      setUserProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      await authService.updatePassword(newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }, []);

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  }, [user, loadUserProfile]);

  const value: AuthContextType = {
    user,
    userProfile,
    session,
    loading,
    sessionTimeLeft,
    isSessionExpiring,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
    refreshSession,
    extendSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
