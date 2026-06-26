// TaxpayersView.tsx — taxpayer grid + editor modal.
// Ported from TaxpayersView / TaxpayerEditor / Field in bir-shell2.jsx.

import { useEffect, useState } from "react";
import { displayName, initials } from "../../lib/taxpayer";
import { useRepository } from "../../lib/repository/RepositoryProvider";
import type { Taxpayer, TaxpayerKind } from "../../types";
import { Icon, SIco } from "../icons";
import type { Route } from "../route";

type TaxpayerDraft = Partial<Taxpayer> & { kind: TaxpayerKind };

export function TaxpayersView({ route }: { route: Route }) {
  const { repo, refresh } = useRepository();
  const [edit, setEdit] = useState<Taxpayer | "new" | null>(() =>
    route.editId ? repo.taxpayers.get(route.editId) : null,
  );
  const list = repo.taxpayers.all();

  return (
    <div className="s-page">
      <div className="s-head">
        <div>
          <h1>Taxpayers</h1>
          <p>Enter each filer&rsquo;s details once — every form auto-fills its background information.</p>
        </div>
        <button className="s-btn s-btn-primary" onClick={() => setEdit("new")}>
          <Icon d={SIco.plus} size={16} />
          Add Taxpayer
        </button>
      </div>

      {list.length === 0 ? (
        <div className="s-empty">
          <div className="s-empty-mark">
            <Icon d={SIco.users} size={26} />
          </div>
          <h3>No taxpayers yet</h3>
          <p>Add an individual or a company to start generating forms.</p>
          <button className="s-btn s-btn-primary" onClick={() => setEdit("new")}>
            <Icon d={SIco.plus} size={16} />
            Add Taxpayer
          </button>
        </div>
      ) : (
        <div className="s-tpgrid">
          {list.map((tp) => {
            const count = repo.filings.forTaxpayer(tp.id).length;
            return (
              <div className="s-tptile" key={tp.id} onClick={() => setEdit(tp)}>
                <div className="s-tptile-top">
                  <div className={"s-tpavatar lg " + tp.kind}>{initials(displayName(tp))}</div>
                  <span className={"s-kindtag " + tp.kind}>
                    {tp.kind === "individual" ? "Individual" : "Non-Individual"}
                  </span>
                </div>
                <b className="s-tptile-name">{displayName(tp)}</b>
                <div className="s-tptile-meta">
                  TIN {tp.tin || "—"}
                  {tp.rdo ? " · RDO " + tp.rdo : ""}
                </div>
                <div className="s-tptile-meta">{[tp.city, tp.zip].filter(Boolean).join(" ")}</div>
                <div className="s-tptile-foot">
                  {count} filing{count === 1 ? "" : "s"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {edit && (
        <TaxpayerEditor
          tp={edit === "new" ? null : edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            refresh();
          }}
          onDelete={(id) => {
            repo.taxpayers.remove(id);
            setEdit(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function TaxpayerEditor({
  tp,
  onClose,
  onSaved,
  onDelete,
}: {
  tp: Taxpayer | null;
  onClose: () => void;
  onSaved: () => void;
  onDelete: (id: string) => void;
}) {
  const { repo } = useRepository();
  const [f, setF] = useState<TaxpayerDraft>(() =>
    tp
      ? { ...tp }
      : {
          kind: "individual",
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
          incorpDate: "",
          email: "",
          phone: "",
          citizenship: "Filipino",
          civilStatus: "",
          taxpayerType: "",
          classification: "Small",
        },
  );
  const upd = (k: keyof TaxpayerDraft, v: string) => setF((o) => ({ ...o, [k]: v }));

  // BIR Certificate of Registration (COR) attachment — cloud mode only.
  const [corFile, setCorFile] = useState<File | null>(null);
  const [corUrl, setCorUrl] = useState<string | null>(null);
  const [corBusy, setCorBusy] = useState(false);
  const hasCor = Boolean(f.corPath) || Boolean(corFile);

  useEffect(() => {
    let active = true;
    if (repo.supportsFiles && tp?.corPath) {
      repo.corUrl(tp.id).then((u) => {
        if (active) setCorUrl(u);
      });
    }
    return () => {
      active = false;
    };
  }, [repo, tp]);

  async function save() {
    if (f.kind === "individual" && !f.lastName) {
      alert("Enter the last name.");
      return;
    }
    if (f.kind === "non-individual" && !f.regName) {
      alert("Enter the registered name.");
      return;
    }
    setCorBusy(true);
    const saved = repo.taxpayers.save(f as Taxpayer);
    try {
      if (corFile && repo.supportsFiles) await repo.uploadCor(saved.id, corFile);
      onSaved();
    } catch (e) {
      // The taxpayer itself is already saved; only the COR upload failed.
      alert(
        "The taxpayer was saved, but the COR file could not be uploaded: " +
          (e instanceof Error ? e.message : String(e)) +
          "\nYou can re-open the taxpayer to attach it.",
      );
      onSaved();
    }
  }

  async function removeCor() {
    if (!tp) return;
    setCorBusy(true);
    try {
      await repo.removeCor(tp.id);
      setF((o) => ({ ...o, corPath: undefined }));
      setCorUrl(null);
      setCorFile(null);
    } catch (e) {
      alert("Could not remove the COR: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setCorBusy(false);
    }
  }

  return (
    <div
      className="s-modal-wrap"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="s-modal">
        <div className="s-modal-head">
          <h3>{tp ? "Edit Taxpayer" : "Add Taxpayer"}</h3>
          <button className="s-iconbtn" onClick={onClose}>
            <Icon d={SIco.x} size={17} />
          </button>
        </div>
        <div className="s-modal-body">
          <div className="s-seg">
            <button className={f.kind === "individual" ? "on" : ""} onClick={() => upd("kind", "individual")}>
              Individual
            </button>
            <button
              className={f.kind === "non-individual" ? "on" : ""}
              onClick={() => upd("kind", "non-individual")}
            >
              Non-Individual (Company)
            </button>
          </div>

          {f.kind === "individual" ? (
            <div className="s-grid3">
              <Field lbl="Last Name" v={f.lastName} on={(v) => upd("lastName", v)} up />
              <Field lbl="First Name" v={f.firstName} on={(v) => upd("firstName", v)} up />
              <Field lbl="Middle Name" v={f.middleName} on={(v) => upd("middleName", v)} up />
            </div>
          ) : (
            <Field lbl="Registered Name" v={f.regName} on={(v) => upd("regName", v)} up />
          )}

          <div className="s-grid3">
            <Field lbl="TIN" v={f.tin} on={(v) => upd("tin", v)} placeholder="000-000-000" />
            <Field lbl="Branch Code" v={f.branch} on={(v) => upd("branch", v)} placeholder="00000" />
            <Field lbl="RDO Code" v={f.rdo} on={(v) => upd("rdo", v)} placeholder="050" />
          </div>

          <Field lbl="Registered Address" v={f.address} on={(v) => upd("address", v)} up />
          <div className="s-grid3">
            <Field lbl="City / Municipality" v={f.city} on={(v) => upd("city", v)} up />
            <Field lbl="ZIP Code" v={f.zip} on={(v) => upd("zip", v)} />
            <Field
              lbl="Classification"
              v={f.classification}
              on={(v) => upd("classification", v)}
              type="select"
              opts={["Micro", "Small", "Medium", "Large"]}
            />
          </div>
          <div className="s-grid3">
            <Field lbl="Email" v={f.email} on={(v) => upd("email", v)} />
            <Field lbl="Contact Number" v={f.phone} on={(v) => upd("phone", v)} />
            <Field lbl="Citizenship" v={f.citizenship} on={(v) => upd("citizenship", v)} up />
          </div>
          {f.kind === "individual" ? (
            <div className="s-grid3">
              <Field lbl="Date of Birth" v={f.birthdate} on={(v) => upd("birthdate", v)} type="date" />
              <Field
                lbl="Civil Status"
                v={f.civilStatus}
                on={(v) => upd("civilStatus", v)}
                type="select"
                opts={["", "Single", "Married", "Legally Separated", "Widow/er"]}
              />
              <Field
                lbl="Taxpayer Type"
                v={f.taxpayerType}
                on={(v) => upd("taxpayerType", v)}
                type="select"
                opts={["", "Single Proprietor", "Professional"]}
              />
            </div>
          ) : (
            <div className="s-grid3">
              <Field lbl="Date of Incorporation" v={f.incorpDate} on={(v) => upd("incorpDate", v)} type="date" />
            </div>
          )}

          {repo.supportsFiles && (
            <div className="s-cor">
              <span className="s-cor-label">BIR Certificate of Registration (COR)</span>
              <div className="s-cor-row">
                <label className="s-btn s-cor-pick">
                  <Icon d={SIco.file} size={14} />
                  {hasCor ? "Replace file" : "Attach file"}
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    style={{ display: "none" }}
                    onChange={(e) => setCorFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {corFile ? (
                  <span className="s-cor-name">{corFile.name}</span>
                ) : f.corPath ? (
                  <>
                    {corUrl && (
                      <a className="s-cor-name" href={corUrl} target="_blank" rel="noreferrer">
                        View current COR
                      </a>
                    )}
                    <button className="s-btn s-btn-danger" type="button" disabled={corBusy} onClick={removeCor}>
                      Remove
                    </button>
                  </>
                ) : (
                  <span className="s-cor-hint">PDF or image, stored privately for this taxpayer.</span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="s-modal-foot">
          {tp ? (
            <button
              className="s-btn s-btn-danger"
              onClick={() => {
                if (confirm("Delete this taxpayer and all its filings?")) onDelete(tp.id);
              }}
            >
              <Icon d={SIco.trash} size={15} />
              Delete
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="s-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="s-btn s-btn-primary" onClick={save} disabled={corBusy}>
              {corBusy ? "Saving…" : "Save Taxpayer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  lbl,
  v,
  on,
  placeholder,
  up,
  type,
  opts,
}: {
  lbl: string;
  v?: string;
  on: (v: string) => void;
  placeholder?: string;
  up?: boolean;
  type?: "text" | "date" | "select";
  opts?: string[];
}) {
  return (
    <label className="s-field">
      <span>{lbl}</span>
      {type === "select" ? (
        <select value={v || ""} onChange={(e) => on(e.target.value)}>
          {(opts || []).map((o) => (
            <option key={o} value={o}>
              {o || "—"}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type === "date" ? "date" : "text"}
          value={v || ""}
          placeholder={placeholder || ""}
          onChange={(e) => on(e.target.value)}
          style={up ? { textTransform: "uppercase" } : undefined}
        />
      )}
    </label>
  );
}
