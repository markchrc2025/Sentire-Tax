// App.tsx — BIRApp root: shell + in-memory routing. Ported from BIRApp in bir-shell.jsx.

import { useState } from "react";
import type { FormCode } from "./types";
import { useRepository } from "./lib/repository/RepositoryProvider";
import { Sidebar } from "./components/shell/Sidebar";
import { Dashboard } from "./components/shell/Dashboard";
import { NewFiling } from "./components/shell/NewFiling";
import { TaxpayersView } from "./components/shell/TaxpayersView";
import { Editor } from "./components/editor/Editor";
import type { Route } from "./components/route";

export function App() {
  const { repo, refresh } = useRepository();
  const [route, setRoute] = useState<Route>({ view: "dashboard" });

  const openFiling = (id: string) => setRoute({ view: "editor", filingId: id });
  const newFiling = (formCode: FormCode, taxpayerId: string) => {
    const f = repo.filings.create(formCode, taxpayerId);
    refresh();
    openFiling(f.id);
  };

  return (
    <div className="s-app">
      <Sidebar route={route} setRoute={setRoute} />
      <div className="s-main">
        {route.view === "dashboard" && <Dashboard setRoute={setRoute} openFiling={openFiling} />}
        {route.view === "taxpayers" && <TaxpayersView route={route} />}
        {route.view === "new" && <NewFiling setRoute={setRoute} newFiling={newFiling} />}
        {route.view === "editor" && route.filingId && (
          <Editor key={route.filingId} filingId={route.filingId} setRoute={setRoute} />
        )}
      </div>
    </div>
  );
}
