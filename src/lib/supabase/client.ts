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
          storageKey: 'pos-pro-auth', // Custom storage key
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      }
    );
  }
  return supabaseInstance;
};

/**
 * Get or create Supabase admin client for server-side operations (bypasses RLS)
 * Only use on server-side!
 */
const getSupabaseAdmin = (): SupabaseClient<Database> => {
  if (!supabaseAdminInstance) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          'placeholder-key';
                          
    supabaseAdminInstance = createClient<Database>(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return supabaseAdminInstance;
};

// Export singleton instances
export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdmin();

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
