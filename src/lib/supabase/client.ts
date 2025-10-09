import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only validate on the client side or during runtime
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables');
}

// Singleton instances to prevent multiple client creation
let supabaseInstance: SupabaseClient<Database> | null = null;
let supabaseAdminInstance: SupabaseClient<Database> | null = null;

/**
 * Get or create Supabase client for browser usage (with RLS)
 * Uses singleton pattern to prevent multiple instances
 * CRITICAL FIX: Uses localStorage for client-side, cookies are server-only
 * The issue was trying to sync cookies between client and server incorrectly
 */
const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'pos-pro-auth',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          flowType: 'pkce', // Use PKCE flow for better security
        },
      }
    );
  }
  return supabaseInstance;
};

/**
 * Get or create Supabase admin client for server-side operations (bypasses RLS)
 * Only use on server-side! NOT for browser use.
 */
const getSupabaseAdmin = (): SupabaseClient<Database> => {
  // Don't create admin client in browser to avoid "multiple instances" warning
  if (typeof window !== 'undefined') {
    console.warn('supabaseAdmin should not be used in browser context. Use supabase client instead.');
    return getSupabaseClient();
  }
  
  if (!supabaseAdminInstance) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
                          
    supabaseAdminInstance = createClient<Database>(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          storageKey: 'pos-pro-auth-admin', // Different key to avoid conflicts
        },
      }
    );
  }
  return supabaseAdminInstance;
};

// Export singleton instances
export const supabase = getSupabaseClient();

// ✅ FIX: Only export admin client on server-side to prevent browser instantiation
// This prevents the "supabaseAdmin should not be used in browser context" warning
export const supabaseAdmin = typeof window === 'undefined' 
  ? getSupabaseAdmin() 
  : null as unknown as SupabaseClient<Database>; // Type assertion for compatibility

/**
 * Safe getter for admin client with explicit error handling
 * 
 * @throws {Error} If called from browser context
 * @returns {SupabaseClient<Database>} Admin client instance (bypasses RLS)
 * 
 * @example
 * // ✅ CORRECT: Use in API routes or server components
 * export async function POST(request: Request) {
 *   const admin = getAdminClient();
 *   await admin.auth.admin.createUser({...});
 * }
 * 
 * @example
 * // ❌ INCORRECT: Never use in client components
 * 'use client';
 * const admin = getAdminClient(); // Will throw error!
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (typeof window !== 'undefined') {
    throw new Error(
      '🚫 Admin client cannot be used in browser context.\n' +
      '💡 Use this function only in API routes or server components.\n' +
      '📖 For client-side operations, use the regular "supabase" client.'
    );
  }
  return getSupabaseAdmin();
}

// Helper function to create a client with a user's access token
export const createSupabaseClient = (accessToken?: string) => {
  if (accessToken) {
    return createClient<Database>(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key',
      {
        auth: {
          storageKey: 'pos-pro-auth',
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );
  }
  return supabase;
};

export type { Database };
