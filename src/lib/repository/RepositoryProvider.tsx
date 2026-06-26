// RepositoryProvider.tsx — provides the active repository to the tree.
//
// Two modes, chosen at module load from the presence of Supabase env vars:
//   • "local"  → LocalStorageRepository (no login).
//   • "cloud"  → Supabase: requires a signed-in user (shows <Login/> otherwise),
//                then hydrates a SupabaseRepository scoped to that user.
// `refresh()` re-renders consumers after a mutation (the repos are cache-backed).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { Repository } from "./types";
import { getRepository } from "./localStorageRepository";
import { SupabaseRepository } from "./supabaseRepository";
import { supabase, supabaseConfigured } from "../supabase/client";
import { Login } from "../../components/auth/Login";
import { Mark } from "../../components/icons";

export type RepositoryMode = "local" | "cloud";

interface RepositoryContextValue {
  repo: Repository;
  revision: number;
  refresh: () => void;
  mode: RepositoryMode;
  userEmail?: string;
  signOut?: () => Promise<void>;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

function Splash({ label }: { label: string }) {
  return (
    <div className="s-splash">
      <Mark size={40} />
      <div className="s-spinner" />
      <p>{label}</p>
    </div>
  );
}

export function RepositoryProvider({ children }: { children: ReactNode }) {
  // The branch is constant for the app's lifetime (env is fixed at load), so
  // hook order stays stable across renders.
  return supabaseConfigured && supabase ? (
    <CloudProvider>{children}</CloudProvider>
  ) : (
    <LocalProvider>{children}</LocalProvider>
  );
}

function LocalProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => getRepository(), []);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((r) => r + 1), []);
  const value = useMemo<RepositoryContextValue>(
    () => ({ repo, revision, refresh, mode: "local" }),
    [repo, revision, refresh],
  );
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}

function CloudProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = loading
  const [repo, setRepo] = useState<SupabaseRepository | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((r) => r + 1), []);

  useEffect(() => {
    let mounted = true;
    supabase!.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });
    const { data: sub } = supabase!.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) {
      setRepo(null);
      setHydrated(false);
      return;
    }
    let active = true;
    const r = new SupabaseRepository(supabase!, userId);
    setHydrated(false);
    r.hydrate()
      .catch((e) => console.error("[supabase] hydrate failed", e))
      .finally(() => {
        if (active) {
          setRepo(r);
          setHydrated(true);
        }
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase!.auth.signOut();
  }, []);

  const value = useMemo<RepositoryContextValue>(
    () => ({
      repo: repo as Repository,
      revision,
      refresh,
      mode: "cloud",
      userEmail: session?.user?.email ?? undefined,
      signOut,
    }),
    [repo, revision, refresh, session, signOut],
  );

  if (session === undefined) return <Splash label="Loading…" />;
  if (!session) return <Login />;
  if (!repo || !hydrated) return <Splash label="Loading your data…" />;

  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}

export function useRepository(): RepositoryContextValue {
  const ctx = useContext(RepositoryContext);
  if (!ctx) throw new Error("useRepository must be used within a RepositoryProvider");
  return ctx;
}
