// supabase/client.ts — lazily creates the Supabase client from env vars.
// When the env vars are absent (e.g. local dev without a backend), the app
// falls back to the localStorage store and `supabase` is null.
//
// Config resolution order:
//   1. window.__ENV (runtime config — /env.js, rewritten by the container
//      entrypoint on Docker hosts like Sliplane; lets env changes apply on
//      restart without a rebuild)
//   2. import.meta.env (baked at build time — Vercel / local dev)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare global {
  interface Window {
    __ENV?: Record<string, string | undefined>;
  }
}

const runtimeEnv = (typeof window !== "undefined" && window.__ENV) || {};
const url = runtimeEnv.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const anonKey = runtimeEnv.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

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
