// api/client.ts — client for the Sliplane-native Sentire BIR API (server/).
//
// Config resolution mirrors the Supabase client: window.__ENV (runtime
// /env.js, rendered by the container entrypoint) first, then the build-time
// import.meta.env. When VITE_API_URL is present the app runs in API mode and
// Supabase is not used at all.
//
// The session (JWT + user) is kept in localStorage — the same lifetime
// semantics supabase-js used (persistent until sign-out / expiry).

export interface ApiUser {
  id: string;
  email: string;
}

interface ApiSession {
  token: string;
  user: ApiUser;
}

const runtimeEnv = (typeof window !== "undefined" && window.__ENV) || {};
const rawUrl = runtimeEnv.VITE_API_URL || import.meta.env.VITE_API_URL;

/** Base URL of the API, without a trailing slash — or "" when not configured. */
export const apiUrl: string = rawUrl ? String(rawUrl).replace(/\/+$/, "") : "";

/** True when VITE_API_URL is set → the app runs against the Sliplane API. */
export const apiConfigured: boolean = Boolean(apiUrl);

const SESSION_KEY = "sentire_api_session";

type AuthListener = (session: ApiSession | null) => void;
const listeners = new Set<AuthListener>();

export function getApiSession(): ApiSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ApiSession;
    return s && s.token && s.user ? s : null;
  } catch {
    return null;
  }
}

function setSession(session: ApiSession | null): void {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode — session just won't persist */
  }
  listeners.forEach((cb) => cb(session));
}

/** Subscribe to sign-in/out; returns an unsubscribe function. */
export function onApiAuthChange(cb: AuthListener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Fetch against the API with auth + JSON error handling. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = getApiSession();
  const headers = new Headers(init.headers);
  if (session) headers.set("Authorization", `Bearer ${session.token}`);
  const res = await fetch(apiUrl + path, { ...init, headers });
  if (res.status === 401 && session) setSession(null); // token expired/revoked
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  return res;
}

async function authCall(path: string, email: string, password: string): Promise<ApiSession> {
  const res = await fetch(apiUrl + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = (await res.json()) as { token?: string; user?: ApiUser; error?: string };
  if (!res.ok || !body.token || !body.user) {
    throw new Error(body.error || "Something went wrong.");
  }
  const session = { token: body.token, user: body.user };
  setSession(session);
  return session;
}

export const apiSignIn = (email: string, password: string) => authCall("/auth/signin", email, password);
export const apiSignUp = (email: string, password: string) => authCall("/auth/signup", email, password);

export function apiSignOut(): void {
  setSession(null);
}

/** Validate the stored token against the server (handles expiry on boot). */
export async function apiValidateSession(): Promise<ApiSession | null> {
  const session = getApiSession();
  if (!session) return null;
  try {
    const res = await fetch(apiUrl + "/auth/me", {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (!res.ok) {
      setSession(null);
      return null;
    }
    return session;
  } catch {
    // Network failure — keep the session; the repository hydrate will surface
    // a retry screen rather than silently signing the user out.
    return session;
  }
}
