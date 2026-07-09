// auth/facade.ts — one sign-in/up surface for both cloud backends.
// API mode (VITE_API_URL set) talks to the Sliplane-native API; otherwise the
// Supabase client is used. The Login component depends only on this facade.

import { supabase } from "../supabase/client";
import { apiConfigured, apiSignIn, apiSignUp } from "../api/client";

export async function authSignIn(email: string, password: string): Promise<void> {
  if (apiConfigured) {
    await apiSignIn(email, password);
    return;
  }
  if (!supabase) throw new Error("No backend configured.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Returns true when the account still needs an email confirmation step. */
export async function authSignUp(email: string, password: string): Promise<boolean> {
  if (apiConfigured) {
    await apiSignUp(email, password); // signed in immediately, no email loop
    return false;
  }
  if (!supabase) throw new Error("No backend configured.");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return !data.session;
}
