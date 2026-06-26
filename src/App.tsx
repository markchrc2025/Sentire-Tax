// App.tsx — application shell + URL routing.
//
// Sidebar pages each have their own path; a filing's editor is addressed by
// /{form}/{period}/{tin} (e.g. /1701A/2024/474079835). Visiting that URL
// opens the matching draft for that taxpayer, creating it if it doesn't exist.

import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import type { FormCode } from "./types";
import { isFormCode } from "./lib/catalog";
import { parsePeriod } from "./lib/period";
import { formatTin, normalizeTin } from "./lib/taxpayer";
import { useRepository } from "./lib/repository/RepositoryProvider";
import { Sidebar } from "./components/shell/Sidebar";
import { Dashboard } from "./components/shell/Dashboard";
import { NewFiling } from "./components/shell/NewFiling";
import { TaxpayersView } from "./components/shell/TaxpayersView";
import { Editor } from "./components/editor/Editor";
import { Icon, SIco } from "./components/icons";

export function App() {
  return (
    <div className="s-app">
      <Sidebar />
      <div className="s-main">
        <Routes>
          <Route path="/" element={<Navigate to="/filings" replace />} />
          <Route path="/filings" element={<Dashboard />} />
          <Route path="/new" element={<NewFiling />} />
          <Route path="/taxpayers" element={<TaxpayersView />} />
          <Route path="/:form/:period/:tin" element={<FilingEditor />} />
          <Route path="*" element={<Navigate to="/filings" replace />} />
        </Routes>
      </div>
    </div>
  );
}

/** Resolves /{form}/{period}/{tin} to a filing (creating the draft if needed). */
function FilingEditor() {
  const { form, period, tin } = useParams();
  const { repo, refresh } = useRepository();
  const navigate = useNavigate();
  const [filingId, setFilingId] = useState<string | null>(null);

  const validForm = isFormCode(form);
  const wantTin = normalizeTin(tin);
  const tp = validForm ? repo.taxpayers.all().find((t) => normalizeTin(t.tin) === wantTin) ?? null : null;

  useEffect(() => {
    setFilingId(null);
    if (!validForm || !period || !tp) return;
    // Find this taxpayer's draft for the form+period, or create one.
    let f = repo.filings
      .all()
      .find((x) => x.form === form && x.taxpayerId === tp.id && x.period === period);
    if (!f) {
      const { year, quarter } = parsePeriod(period);
      f = repo.filings.create(form as FormCode, tp.id);
      f.period = period;
      f.data = { ...f.data, year, ...(quarter ? { quarter } : {}) };
      repo.filings.save(f);
      refresh();
    }
    setFilingId(f.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, period, tp?.id]);

  if (!validForm) return <Navigate to="/filings" replace />;
  if (!tp) return <TaxpayerNotFound tin={tin} onBack={() => navigate("/filings")} />;
  if (!filingId) return null;
  return <Editor key={filingId} filingId={filingId} />;
}

function TaxpayerNotFound({ tin, onBack }: { tin?: string; onBack: () => void }) {
  return (
    <div className="s-page">
      <button className="s-btn" onClick={onBack}>
        <Icon d={SIco.back} size={16} />
        Back to filings
      </button>
      <div className="s-empty" style={{ marginTop: 20 }}>
        <div className="s-empty-mark">
          <Icon d={SIco.users} size={26} />
        </div>
        <h3>No taxpayer with TIN {formatTin(tin) || "—"}</h3>
        <p>Add this taxpayer first, then generate the form.</p>
        <Link className="s-btn s-btn-primary" to="/taxpayers">
          <Icon d={SIco.plus} size={16} />
          Go to Taxpayers
        </Link>
      </div>
    </div>
  );
}
