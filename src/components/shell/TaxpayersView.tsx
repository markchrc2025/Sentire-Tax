// TaxpayersView.tsx — taxpayer grid + editor modal.
// Ported from TaxpayersView / TaxpayerEditor / Field in bir-shell2.jsx.

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { displayName, formatTin, initials, normalizeTin } from "../../lib/taxpayer";
import { useRepository } from "../../lib/repository/RepositoryProvider";
import type { Taxpayer, TaxpayerKind, TaxType } from "../../types";
import type { ExtractedCor } from "../../lib/cor/parseCor";
import { Icon, SIco } from "../icons";

type TaxpayerDraft = Partial<Taxpayer> & { kind: TaxpayerKind };

export function TaxpayersView() {
  const { repo, refresh } = useRepository();
  const [searchParams, setSearchParams] = useSearchParams();
  const [edit, setEdit] = useState<Taxpayer | "new" | null>(() => {
    const editId = searchParams.get("edit");
    return editId ? repo.taxpayers.get(editId) : null;
  });
  const list = repo.taxpayers.all();

  function closeEditor() {
    setEdit(null);
    if (searchParams.has("edit")) {
      searchParams.delete("edit");
      setSearchParams(searchParams, { replace: true });
    }
  }

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
                  TIN {formatTin(tp.tin) || "—"}
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
          onClose={closeEditor}
          onSaved={() => {
            closeEditor();
            refresh();
          }}
          onDelete={(id) => {
            repo.taxpayers.remove(id);
            closeEditor();
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
          tradeName: "",
          tin: "",
          branch: "00000",
          rdo: "",
          taxTypes: [],
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
  const setTaxTypes = (rows: TaxType[]) => setF((o) => ({ ...o, taxTypes: rows }));

  // BIR Certificate of Registration (COR) attachment — cloud mode only.
  const [corFile, setCorFile] = useState<File | null>(null);
  const [corUrl, setCorUrl] = useState<string | null>(null);
  const [corBusy, setCorBusy] = useState(false);
  const hasCor = Boolean(f.corPath) || Boolean(corFile);

  // Client-side OCR auto-extract of the picked COR (runs in the browser).
  const [extracting, setExtracting] = useState(false);
  const [extractStage, setExtractStage] = useState("");
  const [extractPct, setExtractPct] = useState(0);
  const [extracted, setExtracted] = useState<ExtractedCor | null>(null);
  const [extractErr, setExtractErr] = useState<string | null>(null);

  async function onPickCor(file: File | null) {
    setCorFile(file);
    setExtracted(null);
    setExtractErr(null);
    if (!file) return;
    setExtracting(true);
    setExtractStage("Preparing document");
    setExtractPct(0);
    try {
      // Lazy-load so pdf.js + Tesseract stay out of the main bundle.
      const { extractCorFromFile } = await import("../../lib/cor/extractCor");
      const res = await extractCorFromFile(file, (stage, pct) => {
        setExtractStage(stage);
        setExtractPct(pct);
      });
      setExtracted(res);
    } catch (e) {
      setExtractErr(e instanceof Error ? e.message : String(e));
    } finally {
      setExtracting(false);
    }
  }

  /** Apply non-empty extracted values into the draft (user-reviewed). */
  function applyExtracted(x: ExtractedCor) {
    setF((o) => {
      const n = { ...o };
      if (x.kind) n.kind = x.kind;
      if (x.regName) n.regName = x.regName;
      if (x.lastName) n.lastName = x.lastName;
      if (x.firstName) n.firstName = x.firstName;
      if (x.middleName) n.middleName = x.middleName;
      if (x.tradeName) n.tradeName = x.tradeName;
      if (x.tin) n.tin = x.tin;
      if (x.branch) n.branch = x.branch;
      if (x.rdo) n.rdo = x.rdo;
      if (x.address) n.address = x.address;
      if (x.zip) n.zip = x.zip;
      if (x.taxTypes && x.taxTypes.length) n.taxTypes = x.taxTypes;
      return n;
    });
    setExtracted(null);
  }

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
    // The UI shows the name/address fields in caps (textTransform), so store
    // them in caps too. TIN is stored as plain 9 digits (dashes are display-only).
    const up = (s?: string) => (s ? s.toUpperCase() : s);
    const saved = repo.taxpayers.save({
      ...f,
      tin: normalizeTin(f.tin),
      regName: up(f.regName),
      lastName: up(f.lastName),
      firstName: up(f.firstName),
      middleName: up(f.middleName),
      tradeName: up(f.tradeName),
      taxTypes: (f.taxTypes || []).filter((t) => t.type || t.form || t.frequency || t.startDate),
      address: up(f.address),
      city: up(f.city),
      citizenship: up(f.citizenship),
    } as Taxpayer);
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

          <Field
            lbl="Trade Name / Business Name"
            v={f.tradeName}
            on={(v) => upd("tradeName", v)}
            placeholder="As shown on the BIR COR (optional)"
            up
          />

          <div className="s-grid3">
            <Field
              lbl="TIN"
              v={f.tin}
              on={(v) => upd("tin", v)}
              placeholder="000-000-000"
              display={formatTin}
              transform={normalizeTin}
            />
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

          <TaxTypesEditor value={f.taxTypes || []} onChange={setTaxTypes} />

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
                    onChange={(e) => onPickCor(e.target.files?.[0] ?? null)}
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
                  <span className="s-cor-hint">PDF or image. Read on your device — we auto-fill the fields below.</span>
                )}
              </div>

              {extracting && (
                <div className="s-cor-extract">
                  <span className="s-cor-extract-stage">
                    Reading COR… {extractStage} ({Math.round(extractPct * 100)}%)
                  </span>
                  <div className="s-cor-extract-bar">
                    <div style={{ width: `${Math.round(extractPct * 100)}%` }} />
                  </div>
                </div>
              )}

              {extractErr && !extracting && (
                <span className="s-cor-hint">
                  Couldn&rsquo;t read the COR automatically ({extractErr}). You can still fill the fields by hand.
                </span>
              )}

              {extracted && !extracting && (
                <div className="s-cor-extract review">
                  <div className="s-cor-extract-head">
                    <b>Details read from the COR</b>
                    <span>Review and apply — always double-check against the document.</span>
                  </div>
                  <ul className="s-cor-extract-list">
                    {extractSummary(extracted).map((row) => (
                      <li key={row.label}>
                        <span className="k">{row.label}</span>
                        <span className="v">{row.value}</span>
                      </li>
                    ))}
                    {extractSummary(extracted).length === 0 && (
                      <li>
                        <span className="v">No fields could be read confidently — please enter them manually.</span>
                      </li>
                    )}
                  </ul>
                  <div className="s-cor-extract-acts">
                    <button className="s-btn" type="button" onClick={() => setExtracted(null)}>
                      Dismiss
                    </button>
                    <button
                      className="s-btn s-btn-primary"
                      type="button"
                      disabled={extractSummary(extracted).length === 0}
                      onClick={() => applyExtracted(extracted)}
                    >
                      Apply to form
                    </button>
                  </div>
                </div>
              )}
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

/** Human-readable summary of the fields OCR read from a COR, for the review panel. */
function extractSummary(x: ExtractedCor): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  const name = x.regName || [x.lastName, x.firstName].filter(Boolean).join(", ");
  if (name) rows.push({ label: "Name", value: name });
  if (x.tradeName) rows.push({ label: "Trade Name", value: x.tradeName });
  if (x.tin) rows.push({ label: "TIN", value: formatTin(x.tin) + (x.branch ? " · " + x.branch : "") });
  if (x.rdo) rows.push({ label: "RDO", value: x.rdo });
  if (x.address) rows.push({ label: "Address", value: x.address + (x.zip ? " " + x.zip : "") });
  if (x.taxTypes?.length) {
    rows.push({
      label: `Tax Types (${x.taxTypes.length})`,
      value: x.taxTypes.map((t) => t.type + (t.form ? ` (${t.form})` : "")).join(", "),
    });
  }
  return rows;
}

// Suggestions for the COR "Tax Types" table — free text is still allowed.
const TAX_TYPE_SUGGESTIONS = [
  "Income Tax",
  "Value-Added Tax",
  "Percentage Tax",
  "Registration Fee",
  "Withholding Tax - Compensation",
  "Withholding Tax - Expanded",
  "Withholding Tax - Final",
  "Documentary Stamp Tax",
];
const FORM_SUGGESTIONS = [
  "1701",
  "1701A",
  "1701Q",
  "1702RT",
  "1702Q",
  "2550M",
  "2550Q",
  "2551Q",
  "0605",
  "1601C",
  "0619E",
  "1601EQ",
];
const FREQUENCY_OPTS = ["", "Annually", "Quarterly", "Monthly", "One-time"];

/**
 * Editor for a taxpayer's COR "Tax Types" table — a repeating list of
 * {type, form, frequency, startDate} rows. Defined at module scope and rendered
 * with `.map()` over stable element types so typing never loses focus.
 */
function TaxTypesEditor({ value, onChange }: { value: TaxType[]; onChange: (rows: TaxType[]) => void }) {
  const rows = value;
  const updRow = (i: number, key: keyof TaxType, val: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  const addRow = () => onChange([...rows, { type: "", form: "", frequency: "", startDate: "" }]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className="s-tt">
      <span className="s-cor-label">Tax Types (from the BIR COR)</span>
      {rows.length > 0 && (
        <div className="s-tt-row s-tt-head">
          <span>Tax Type</span>
          <span>Form</span>
          <span>Filing Frequency</span>
          <span>Start Date</span>
          <span />
        </div>
      )}
      {rows.map((r, i) => (
        <div className="s-tt-row" key={i}>
          <input
            list="tt-type-list"
            value={r.type || ""}
            placeholder="e.g. Income Tax"
            onChange={(e) => updRow(i, "type", e.target.value)}
          />
          <input
            list="tt-form-list"
            value={r.form || ""}
            placeholder="e.g. 1701"
            onChange={(e) => updRow(i, "form", e.target.value)}
          />
          <select value={r.frequency || ""} onChange={(e) => updRow(i, "frequency", e.target.value)}>
            {FREQUENCY_OPTS.map((o) => (
              <option key={o} value={o}>
                {o || "—"}
              </option>
            ))}
          </select>
          <input type="date" value={r.startDate || ""} onChange={(e) => updRow(i, "startDate", e.target.value)} />
          <button
            type="button"
            className="s-iconbtn s-tt-del"
            title="Remove this tax type"
            onClick={() => removeRow(i)}
          >
            <Icon d={SIco.x} size={15} />
          </button>
        </div>
      ))}
      <datalist id="tt-type-list">
        {TAX_TYPE_SUGGESTIONS.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      <datalist id="tt-form-list">
        {FORM_SUGGESTIONS.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      <button type="button" className="s-btn s-tt-add" onClick={addRow}>
        <Icon d={SIco.plus} size={14} />
        Add tax type
      </button>
      {rows.length === 0 && <span className="s-cor-hint">Add the tax types listed on the taxpayer&rsquo;s COR.</span>}
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
  display,
  transform,
}: {
  lbl: string;
  v?: string;
  on: (v: string) => void;
  placeholder?: string;
  up?: boolean;
  type?: "text" | "date" | "select";
  opts?: string[];
  /** Format the stored value for display (UI only, e.g. TIN dashes). */
  display?: (v: string) => string;
  /** Normalize typed input before it's stored (e.g. strip TIN dashes). */
  transform?: (raw: string) => string;
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
          value={display ? display(v || "") : v || ""}
          placeholder={placeholder || ""}
          onChange={(e) => on(transform ? transform(e.target.value) : e.target.value)}
          style={up ? { textTransform: "uppercase" } : undefined}
        />
      )}
    </label>
  );
}
