// Editor.tsx — the core screen: mode toggle (Guided fill / Form preview),
// print, XML export, autosave, and the summary rail. Data entry is Guided-only;
// the Form view is a read-only PDF preview of the faithful form.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATALOG, FORM_COLOR } from "../../lib/catalog";
import { computeFor } from "../../lib/compute";
import { download as downloadXml } from "../../lib/xml/build1701A";
import { buildXml, xmlFileName, xmlSupported } from "../../lib/xml/buildXml";
import { filingVersion, versionLabel } from "../../lib/period";
import { pdfBaseName } from "../../lib/pdf/pdfName";
import { displayName, formatTin, initials } from "../../lib/taxpayer";
import { useRepository } from "../../lib/repository/RepositoryProvider";
import type { FilingData, XmlExport } from "../../types";
import { Icon, SIco, timeAgo } from "../icons";
import type { SetFn } from "../formkit";
import { FormView } from "../forms";
import { GuidedView } from "../guided";
import { railSummary, SumRow } from "./railSummary";
import { validateFor } from "./validators";

export function Editor({ filingId }: { filingId: string }) {
  const { repo, refresh } = useRepository();
  const navigate = useNavigate();
  const filing = repo.filings.get(filingId);
  const [data, setData] = useState<FilingData>(() => (filing ? { ...(filing.data || {}) } : {}));
  const [saved, setSaved] = useState(true);
  const [mode, setMode] = useState<"guided" | "form">("guided");
  const [xmlMsg, setXmlMsg] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Form mode is a read-only PDF preview of the faithful form. All data entry
  // happens in Guided, so the printed form can never diverge from the wizard.
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);
  const pdfReq = useRef(0);

  // Live PDF preview: render the faithful form sheets to a real PDF whenever
  // Form mode is open, debounced so rapid edits collapse into one render.
  useEffect(() => {
    if (!filing || mode !== "form") return;
    setPdfBusy(true);
    const timer = setTimeout(async () => {
      const req = ++pdfReq.current;
      try {
        const root = docRef.current;
        if (!root) return;
        const found = Array.from(root.querySelectorAll<HTMLElement>(".bir-sheet"));
        const sheets = found.length ? found : [root];
        const { sheetsToPdfBlob } = await import("../../lib/pdf/renderPdf");
        const blob = await sheetsToPdfBlob(sheets, pdfBaseName(filing, repo.taxpayers.get(filing.taxpayerId)));
        if (req !== pdfReq.current) return; // a newer edit superseded this render
        const url = URL.createObjectURL(blob);
        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setPdfErr(false);
      } catch (e) {
        console.error("[pdf preview]", e);
        if (req === pdfReq.current) setPdfErr(true);
      } finally {
        if (req === pdfReq.current) setPdfBusy(false);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, data, filing?.form]);

  // Release the preview blob URL when it changes or the editor unmounts.
  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );

  if (!filing) {
    return (
      <div className="s-page">
        <button className="s-btn" onClick={() => navigate("/filings")}>
          <Icon d={SIco.back} size={16} />
          Back
        </button>
        <p style={{ marginTop: 20 }}>Filing not found.</p>
      </div>
    );
  }

  const tp = repo.taxpayers.get(filing.taxpayerId);
  const meta = CATALOG.find((c) => c.code === filing.form);
  const comp = computeFor(filing.form, data);
  const guidedSupported = !!computeFor(filing.form, {});
  const guided = guidedSupported && mode === "guided";

  const set: SetFn = (field, val) => {
    setData((d) => {
      const nd: FilingData = { ...d, [field]: val };
      filing.data = nd;
      // period is fixed by the URL (/{form}/{period}/{tin}); the year field
      // edits data.year for the printed form but never re-keys the filing.
      repo.filings.save(filing);
      return nd;
    });
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(true), 450);
  };

  function doPrint() {
    // Print / Save as PDF suggests the page title as the filename — swap in
    // the convention name (Form_Period_Full Name) for the duration.
    const printNow = () => {
      const prev = document.title;
      document.title = pdfBaseName(filing!, tp);
      const restore = () => {
        document.title = prev;
        window.removeEventListener("afterprint", restore);
      };
      window.addEventListener("afterprint", restore);
      window.print();
    };
    if (guided) {
      setMode("form");
      setTimeout(printNow, 250);
      return;
    }
    setTimeout(printNow, 60);
  }

  // Download the PDF with the convention filename. The embedded viewer's own
  // download button names the file after the blob URL's random id (a browser
  // limitation — a blob URL has no filename), so we trigger the save ourselves
  // via an <a download> with the proper name.
  async function doDownloadPdf() {
    if (!filing) return;
    const name = pdfBaseName(filing, tp) + ".pdf";
    let url = pdfUrl;
    let temp = false;
    try {
      if (!url) {
        // The PDF preview hasn't rendered yet (e.g. the Edit tab) — render the
        // laid-out sheets on demand.
        const root = docRef.current;
        if (!root) return;
        const found = Array.from(root.querySelectorAll<HTMLElement>(".bir-sheet"));
        const sheets = found.length ? found : [root];
        const { sheetsToPdfBlob } = await import("../../lib/pdf/renderPdf");
        const blob = await sheetsToPdfBlob(sheets, pdfBaseName(filing, tp));
        url = URL.createObjectURL(blob);
        temp = true;
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("[pdf download]", e);
    } finally {
      if (temp && url) setTimeout(() => URL.revokeObjectURL(url!), 4000);
    }
  }

  function doXML() {
    if (!filing) return;
    const xml = buildXml(filing.form, filing, tp, comp);
    const filename = xmlFileName(filing.form, filing, tp);
    const record: XmlExport = { at: Date.now(), filename, xml };
    repo.filings.addExport(filing.id, record);
    refresh();
    downloadXml(filename, xml);
    setXmlMsg(filename);
    setTimeout(() => setXmlMsg(null), 3200);
  }

  const valid = validateFor(filing.form, data, comp, { tp: tp ?? null, period: filing.period });
  const blocking = valid.filter((v) => v.level === "error" || v.level === "warn");
  // 2307/2316 are certificates (printed/PDF), not e-filed — no eBIRForms XML.
  const xmlOk = xmlSupported(filing.form);

  return (
    <div className="s-editor">
      <div className="s-ebar">
        <button className="s-iconbtn lg" onClick={() => navigate("/filings")} title="Back to filings">
          <Icon d={SIco.back} size={18} />
        </button>
        <span className="s-formchip lg" style={{ ["--fc" as string]: (meta && FORM_COLOR[meta.cat]) || "#6B6259" }}>
          {filing.form}
        </span>
        {filingVersion(filing) > 0 && (
          <span className="s-verchip lg" title="Amended return version">
            {versionLabel(filingVersion(filing))}
          </span>
        )}
        <div className="s-ebar-title">
          <b>{meta?.name}</b>
          <i>
            {displayName(tp)} · TIN {tp ? formatTin(tp.tin) || "—" : "—"}
          </i>
        </div>
        {guidedSupported && (
          <div className="g-mode">
            <button className={guided ? "on" : ""} onClick={() => setMode("guided")}>
              <Icon d={SIco.users} size={14} />
              Guided
            </button>
            <button className={!guided ? "on" : ""} onClick={() => setMode("form")}>
              <Icon d={SIco.file} size={14} />
              Form
            </button>
          </div>
        )}
        <span className={"s-savechip" + (saved ? " ok" : "")}>
          {saved ? (
            <>
              <Icon d={SIco.check} size={13} />
              Saved
            </>
          ) : (
            "Saving…"
          )}
        </span>
        {xmlOk && (
          <button className="s-btn s-btn-xml" onClick={doXML} title="Export eBIRForms XML">
            <Icon d={SIco.code} size={16} />
            Export XML
          </button>
        )}
        {!guided && (
          <button className="s-btn" onClick={doDownloadPdf} title="Download the PDF (named Form_Year_Full Name)">
            <Icon d={SIco.download} size={16} />
            Download PDF
          </button>
        )}
        <button className="s-btn s-btn-primary" onClick={doPrint}>
          <Icon d={SIco.print} size={16} />
          Print / Save as PDF
        </button>
      </div>

      <div className="s-ebody" style={{ gridTemplateColumns: guided ? "1fr 268px" : "1fr" }}>
        {guided ? (
          <GuidedView
            form={filing.form}
            tp={tp}
            data={data}
            set={set}
            comp={comp}
            onViewForm={() => setMode("form")}
            onPrint={doPrint}
          />
        ) : (
          <div className="s-stage">
            {/* The faithful form is rendered off-screen (but laid out) purely so
                it can be captured to PDF. `inert` keeps its fields out of the tab
                order — the form is a preview, never a data-entry surface. */}
            <div className="s-pdf-source" {...({ inert: "" } as Record<string, string>)}>
              <div className="bir-doc" ref={docRef} data-rate={(data.taxRate as string) || "graduated"}>
                <FormView form={filing.form} tp={tp} data={data} set={set} comp={comp} />
              </div>
            </div>
            <div className="s-pdfwrap">
              {pdfUrl ? (
                <iframe className="s-pdfframe" title="Form PDF preview" src={pdfUrl + "#view=FitH"} />
              ) : (
                <div className="s-pdf-msg">{pdfErr ? "Couldn't render the PDF preview." : "Rendering PDF…"}</div>
              )}
              {pdfBusy && pdfUrl && <span className="s-pdf-badge">Updating…</span>}
            </div>
          </div>
        )}

        {guided && (
          <aside className="s-rail">
            <div className="s-rail-sec">
              <h4>Summary</h4>
              <div className="s-sum">
                {railSummary(filing.form, data, comp).map((r, i) =>
                  "div" in r ? <div className="s-sum-div" key={i} /> : <SumRow key={i} {...r} />,
                )}
              </div>
            </div>

            <div className="s-rail-sec">
              <h4>Checklist</h4>
              {blocking.length === 0 && (
                <div className="s-allgood">
                  <Icon d={SIco.check} size={15} />
                  Ready to print &amp; file.
                </div>
              )}
              {valid.length > 0 && (
                <ul className="s-valid">
                  {valid.map((v, i) => (
                    <li key={i} className={v.level}>
                      <Icon d={v.level === "info" ? SIco.info : v.level === "ok" ? SIco.check : SIco.warn} size={13} />
                      {v.msg}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {xmlOk && (
              <div className="s-rail-sec">
                <h4>
                  XML Exports <span className="s-rail-count">{(filing.exports || []).length}</span>
                </h4>
                <button className="s-btn s-btn-xml full" onClick={doXML}>
                  <Icon d={SIco.code} size={14} />
                  Generate eBIRForms XML
                </button>
                {(filing.exports || []).length === 0 ? (
                  <p className="s-muted-sm" style={{ marginTop: 8 }}>
                    No XML generated yet. Exports are saved here for reference.
                  </p>
                ) : (
                  <ul className="s-exports">
                    {(filing.exports || []).map((x, i) => (
                      <li key={i}>
                        <div className="s-exp-info">
                          <b title={x.filename}>{x.filename}</b>
                          <i>{timeAgo(x.at)}</i>
                        </div>
                        <button
                          className="s-iconbtn"
                          title="Download again"
                          onClick={() => downloadXml(x.filename, x.xml)}
                        >
                          <Icon d={SIco.download} size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="s-rail-sec">
              <h4>Taxpayer</h4>
              <div className="s-rail-tp">
                <div className={"s-tpavatar " + (tp ? tp.kind : "individual")}>{initials(displayName(tp))}</div>
                <div>
                  <b>{displayName(tp)}</b>
                  <i>{tp && tp.email}</i>
                </div>
              </div>
              <button
                className="s-btn s-btn-ghost full"
                onClick={() => navigate("/taxpayers?edit=" + filing.taxpayerId)}
              >
                <Icon d={SIco.edit} size={14} />
                Edit taxpayer details
              </button>
            </div>
          </aside>
        )}
      </div>

      {xmlMsg && (
        <div className="s-toast">
          <Icon d={SIco.check} size={16} />
          <div>
            <b>XML exported</b>
            <span>{xmlMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
