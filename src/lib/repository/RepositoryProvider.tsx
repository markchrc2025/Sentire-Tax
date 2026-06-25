// RepositoryProvider.tsx — provides the repository to the component tree and a
// `refresh()` signal that re-renders consumers after a mutation (mirrors the
// prototype's tick/refresh pattern, but typed and import-based).

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Repository } from "./types";
import { getRepository } from "./localStorageRepository";

interface RepositoryContextValue {
  repo: Repository;
  /** Bump to force consumers that read from the repo to re-render. */
  revision: number;
  refresh: () => void;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

export function RepositoryProvider({
  children,
  repository,
}: {
  children: ReactNode;
  repository?: Repository;
}) {
  const repo = useMemo(() => repository ?? getRepository(), [repository]);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((r) => r + 1), []);
  const value = useMemo<RepositoryContextValue>(
    () => ({ repo, revision, refresh }),
    [repo, revision, refresh],
  );
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}

export function useRepository(): RepositoryContextValue {
  const ctx = useContext(RepositoryContext);
  if (!ctx) throw new Error("useRepository must be used within a RepositoryProvider");
  return ctx;
}
