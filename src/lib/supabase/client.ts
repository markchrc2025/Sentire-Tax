// supabase/client.ts — lazily creates the Supabase client from env vars.
// When the env vars are absent (e.g. local dev without a backend), the app
// falls back to the localStorage store and `supabase` is null.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when both Supabase env vars are present → the app runs in "cloud" mode. */
export const supabaseConfigured: boolean = Boolean(url && anonKey);

/** The shared Supabase client, or null when not configured. */
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/** Storage bucket holding each taxpayer's BIR Certificate of Registration. */
export const COR_BUCKET = "cor";
