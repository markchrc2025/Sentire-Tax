// ImportFromPortal.tsx — pull a client + VAT quarter from the Accounting Firm
// Portal and open a pre-filled 2550Q. Renders nothing when the server has no
// Portal connector configured. The write-back ("Sync to Portal") lives in the
// editor as a follow-up; this component covers the import (read) path.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { portalApi } from "../../lib/api/portal";
import type { PortalClient } from "../../lib/portal/types";
import {
  portalClientToTaxpayer,
  suggestedForm,
  vatSummaryToFilingData,
} from "../../lib/portal/mapping";
import { buildPeriod } from "../../lib/period";
import { useRepository } from "../../lib/repository/RepositoryProvider";
import { normalizeTin } from "../../lib/taxpayer";
import type { Taxpayer } from "../../types";
import { Icon, SIco } from "../icons";

function fullTaxpayer(client: PortalClient, existing?: Taxpayer): Taxpayer {
  const base: Taxpayer =
    existing ??
    ({
      id: crypto.randomUUID(),
      kind: "non-individual",
      regName: "",
      lastName: "",
      firstName: "",
      middleName: "",
      tin: "",
      branch: "00000",
      rdo: "",
      address: "",
      city: "",
      zip: "",
      birthdate: "",
      email: "",
      phone: "",
      citizenship: "",
      civilStatus: "",
      taxpayerType: "",
      classification: "",
      createdAt: Date.now(),
    } satisfies Taxpayer);
  return { ...base, ...portalClientToTaxpayer(client), id: base.id, createdAt: base.createdAt };
}

export function ImportFromPortal() {
  const { repo, refresh } = useRepository();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<PortalClient[]>([]);
  const [clientId, setClientId] = useState("");
  const [year, setYear] = useState("");
  const [quarter, setQuarter] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    portalApi
      .status()
      .then((s) => setEnabled(s.enabled))
      .catch(() => setEnabled(false));
  }, []);

  async function openDialog() {
    setOpen(true);
    setError(null);
    try {
      setClients(await portalApi.listClients());
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function doImport() {
    const client = clients.find((c) => c.id === clientId);
    if (!client || !year.trim()) return;
    if (suggestedForm(client) !== "2550Q") {
      setError("This slice imports VAT (2550Q) clients only.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const q = Number(quarter);
      const summary = await portalApi.getVatSummary(client.id, Number(year), q);

      // Reuse an existing taxpayer with the same TIN, else create one.
      const tin = normalizeTin(client.tin);
      const existing = repo.taxpayers.all().find((t) => normalizeTin(t.tin) === tin && tin);
      const taxpayer = fullTaxpayer(client, existing);
      repo.taxpayers.save(taxpayer);

      const filing = repo.filings.create("2550Q", taxpayer.id);
      filing.period = buildPeriod(year, `Q${q}`);
      filing.data = vatSummaryToFilingData(summary);
      repo.filings.save(filing);
      refresh();

      setOpen(false);
      navigate(`/2550Q/${encodeURIComponent(filing.period)}/${tin}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <>
      <button className="s-btn s-btn-ghost" onClick={openDialog} type="button">
        <Icon d={SIco.download} /> Import from Portal
      </button>

      {open && (
        <div className="s-modal-backdrop" onClick={() => !busy && setOpen(false)}>
          <div className="s-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Import from Accounting Firm Portal</h2>
            <p className="s-muted">
              Pull a client and its VAT quarter to pre-fill a 2550Q. Figures are net of
              VAT; the engine derives Item 31B and you review before filing.
            </p>

            <label className="s-field">
              <span>Client</span>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName}
                    {c.tin ? ` · ${c.tin}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: "flex", gap: 11 }}>
              <label className="s-field" style={{ flex: 1 }}>
                <span>Year</span>
                <input
                  inputMode="numeric"
                  placeholder="2026"
                  value={year}
                  onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </label>
              <label className="s-field" style={{ flex: 1 }}>
                <span>Quarter</span>
                <select value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                  <option value="1">Q1</option>
                  <option value="2">Q2</option>
                  <option value="3">Q3</option>
                  <option value="4">Q4</option>
                </select>
              </label>
            </div>

            {error && <p className="s-error">{error}</p>}

            <div className="s-modal-actions">
              <button
                className="s-btn s-btn-ghost"
                onClick={() => setOpen(false)}
                disabled={busy}
                type="button"
              >
                Cancel
              </button>
              <button
                className="s-btn s-btn-primary"
                onClick={doImport}
                disabled={busy || !clientId || !year.trim()}
                type="button"
              >
                {busy ? "Importing…" : "Import 2550Q"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
