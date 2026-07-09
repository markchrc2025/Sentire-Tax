// RepositoryProvider.tsx — provides the active repository to the tree.
//
// Three modes, chosen at module load from the environment:
//   • "cloud" via API      → VITE_API_URL set: the Sliplane-native API
//                            (ApiRepository) with its own JWT auth.
//   • "cloud" via Supabase → Supabase env vars set: SupabaseRepository.
//   • "local"              → neither: LocalStorageRepository (no login).
// Cloud modes require a signed-in user (shows <Login/> otherwise), then
// hydrate a per-user repository. A hydrate failure shows a retry screen
// (never a misleading empty account), and background write failures surface
// as a banner. `refresh()` re-renders consumers after a mutation (the repos
// are cache-backed).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { Repository } from "./types";
import { getRepository } from "./localStorageRepository";
import { SupabaseRepository } from "./supabaseRepository";
import { ApiRepository } from "./apiRepository";
import { supabase, supabaseConfigured } from "../supabase/client";
import {
  apiConfigured,
  apiSignOut,
  apiValidateSession,
  getApiSession,
  onApiAuthChange,
} from "../api/client";
import { Login } from "../../components/auth/Login";
import { Icon, Mark, SIco } from "../../components/icons";

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

function Splash({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="s-splash">
      <Mark size={40} />
      {children ?? <div className="s-spinner" />}
      <p>{label}</p>
    </div>
  );
}

export function RepositoryProvider({ children }: { children: ReactNode }) {
  // The branch is constant for the app's lifetime (env is fixed at load), so
  // hook order stays stable across renders. API mode wins when configured.
  if (apiConfigured) return <ApiProvider>{children}</ApiProvider>;
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

type HydrateState = "loading" | "ready" | "error";

/** Cloud mode backed by the Sliplane-native API (server/). */
function ApiProvider({ children }: { children: ReactNode }) {
  type ApiSessionState = ReturnType<typeof getApiSession> | undefined; // undefined = validating
  const [session, setSession] = useState<ApiSessionState>(undefined);
  const [repo, setRepo] = useState<ApiRepository | null>(null);
  const [hydrate, setHydrate] = useState<HydrateState>("loading");
  const [attempt, setAttempt] = useState(0);
  const [revision, setRevision] = useState(0);
  const [writeError, setWriteError] = useState<string | null>(null);
  const refresh = useCallback(() => setRevision((r) => r + 1), []);
  const repoRef = useRef<ApiRepository | null>(null);

  // Validate the stored token once, then follow sign-in/out events.
  useEffect(() => {
    let mounted = true;
    apiValidateSession().then((s) => {
      if (mounted) setSession(s);
    });
    const unsub = onApiAuthChange((s) => setSession(s));
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // Build + hydrate the repository for the current user.
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) {
      setRepo(null);
      repoRef.current = null;
      setHydrate("loading");
      return;
    }
    let active = true;
    const r = new ApiRepository();
    r.setErrorListener((msg) => setWriteError(msg));
    setHydrate("loading");
    r.hydrate()
      .then(() => {
        if (!active) return;
        repoRef.current = r;
        setRepo(r);
        setHydrate("ready");
      })
      .catch((e) => {
        console.error("[api] hydrate failed", e);
        if (active) setHydrate("error");
      });
    return () => {
      active = false;
      void r.flush();
    };
  }, [userId, attempt]);

  // Flush pending writes if the tab is closed/hidden.
  useEffect(() => {
    const flush = () => {
      void repoRef.current?.flush();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  const signOut = useCallback(async () => {
    await repoRef.current?.flush();
    apiSignOut();
  }, []);

  const value = useMemo<RepositoryContextValue>(
    () => ({
      repo: repo as Repository,
      revision,
      refresh,
      mode: "cloud",
      userEmail: session?.user?.email,
      signOut,
    }),
    [repo, revision, refresh, session, signOut],
  );

  if (session === undefined) return <Splash label="Loading…" />;
  if (!session) return <Login />;
  if (hydrate === "error") {
    return (
      <Splash label="Couldn't load your data. Check your connection and try again.">
        <div style={{ display: "flex", gap: 10 }}>
          <button className="s-btn s-btn-primary" onClick={() => setAttempt((a) => a + 1)}>
            Retry
          </button>
          <button className="s-btn" onClick={() => apiSignOut()}>
            Sign out
          </button>
        </div>
      </Splash>
    );
  }
  if (!repo || hydrate !== "ready") return <Splash label="Loading your data…" />;

  return (
    <RepositoryContext.Provider value={value}>
      {children}
      {writeError && (
        <div className="s-errbar" role="alert">
          <Icon d={SIco.warn} size={16} />
          <span>{writeError}</span>
          <button className="s-errbar-x" onClick={() => setWriteError(null)} aria-label="Dismiss">
            <Icon d={SIco.x} size={14} />
          </button>
        </div>
      )}
    </RepositoryContext.Provider>
  );
}

function CloudProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = loading
  const [repo, setRepo] = useState<SupabaseRepository | null>(null);
  const [hydrate, setHydrate] = useState<HydrateState>("loading");
  const [attempt, setAttempt] = useState(0);
  const [revision, setRevision] = useState(0);
  const [writeError, setWriteError] = useState<string | null>(null);
  const refresh = useCallback(() => setRevision((r) => r + 1), []);
  const repoRef = useRef<SupabaseRepository | null>(null);

  // Track the session.
  useEffect(() => {
    let mounted = true;
    supabase!.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });
    const { data: sub } = supabase!.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Build + hydrate the repository for the current user.
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) {
      setRepo(null);
      repoRef.current = null;
      setHydrate("loading");
      return;
    }
    let active = true;
    const r = new SupabaseRepository(supabase!, userId);
    r.setErrorListener((msg) => setWriteError(msg));
    setHydrate("loading");
    r.hydrate()
      .then(() => {
        if (!active) return;
        repoRef.current = r;
        setRepo(r);
        setHydrate("ready");
      })
      .catch((e) => {
        console.error("[supabase] hydrate failed", e);
        if (active) setHydrate("error");
      });
    return () => {
      active = false;
      // Persist any pending edits before this repo instance is discarded.
      void r.flush();
    };
  }, [userId, attempt]);

  // Flush pending writes if the tab is closed/hidden.
  useEffect(() => {
    const flush = () => {
      void repoRef.current?.flush();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  const signOut = useCallback(async () => {
    await repoRef.current?.flush();
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
  if (hydrate === "error") {
    return (
      <Splash label="Couldn't load your data. Check your connection and try again.">
        <div style={{ display: "flex", gap: 10 }}>
          <button className="s-btn s-btn-primary" onClick={() => setAttempt((a) => a + 1)}>
            Retry
          </button>
          <button className="s-btn" onClick={() => supabase!.auth.signOut()}>
            Sign out
          </button>
        </div>
      </Splash>
    );
  }
  if (!repo || hydrate !== "ready") return <Splash label="Loading your data…" />;

  return (
    <RepositoryContext.Provider value={value}>
      {children}
      {writeError && (
        <div className="s-errbar" role="alert">
          <Icon d={SIco.warn} size={16} />
          <span>{writeError}</span>
          <button className="s-errbar-x" onClick={() => setWriteError(null)} aria-label="Dismiss">
            <Icon d={SIco.x} size={14} />
          </button>
        </div>
      )}
    </RepositoryContext.Provider>
  );
}

export function useRepository(): RepositoryContextValue {
  const ctx = useContext(RepositoryContext);
  if (!ctx) throw new Error("useRepository must be used within a RepositoryProvider");
  return ctx;
}
