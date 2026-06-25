// Editor.tsx — the core screen: mode toggle (Guided/Form), zoom, print, XML
// export, autosave, and the summary rail. Ported from Editor in bir-shell2.jsx.

import { useEffect, useRef, useState } from "react";
import { CATALOG, FORM_COLOR } from "../../lib/catalog";
import { computeFor } from "../../lib/compute";
import { compute1701A } from "../../lib/compute";
import { build1701A, download as downloadXml, fileName } from "../../lib/xml/build1701A";
import { displayName, initials } from "../../lib/taxpayer";
import { useRepository } from "../../lib/repository/RepositoryProvider";
import type { FilingData, XmlExport } from "../../types";
import { Icon, SIco, timeAgo } from "../icons";
import type { SetRoute } from "../route";
import type { SetFn } from "../formkit";
import { FormView } from "../forms";
import { GuidedView } from "../guided";
import { railSummary, SumRow } from "./railSummary";
import { validateFor } from "./validators";

export function Editor({
  filingId,
  setRoute,
}: {
  filingId: string;
  setRoute: SetRoute;
}) {
  const { repo, refresh } = useRepository();
  const filing = repo.filings.get(filingId);
  const [data, setData] = useState<FilingData>(() => (filing ? { ...(filing.data || {}) } : {}));
  const [saved, setSaved] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(true);
  const [mode, setMode] = useState<"guided" | "form">("guided");
  const [xmlMsg, setXmlMsg] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // fit-to-width (declared before the early return so hook order is stable)
  useEffect(() => {
    function recalc() {
      if (!fit || !stageRef.current) return;
      const avail = stageRef.current.clientWidth - 48;
      setZoom(Math.min(1, avail / 1044));
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [fit, mode]);

  if (!filing) {
    return (
      <div className="s-page">
        <button className="s-btn" onClick={() => setRoute({ view: "dashboard" })}>
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
      if (field === "year" && typeof val === "string") filing.period = val;
      repo.filings.save(filing);
      return nd;
    });
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(true), 450);
  };

  function doPrint() {
    if (guided) {
      setMode("form");
      setTimeout(() => window.print(), 250);
      return;
    }
    setTimeout(() => window.print(), 60);
  }

  function doXML() {
    if (!filing) return;
    if (filing.form !== "1701A") {
      alert("XML export is available for 1701A.");
      return;
    }
    const c = compute1701A(data);
    const xml = build1701A(filing, tp, c);
    const filename = fileName(filing, tp);
    const record: XmlExport = { at: Date.now(), filename, xml };
    filing.exports = [record, ...(filing.exports || [])].slice(0, 12);
    repo.filings.save(filing);
    refresh();
    downloadXml(filename, xml);
    setXmlMsg(filename);
    setTimeout(() => setXmlMsg(null), 3200);
  }

  const valid = validateFor(filing.form, data, comp);

  return (
    <div className="s-editor">
      <div className="s-ebar">
        <button className="s-iconbtn lg" onClick={() => setRoute({ view: "dashboard" })} title="Back to filings">
          <Icon d={SIco.back} size={18} />
        </button>
        <span className="s-formchip lg" style={{ ["--fc" as string]: (meta && FORM_COLOR[meta.cat]) || "#6B6259" }}>
          {filing.form}
        </span>
        <div className="s-ebar-title">
          <b>{meta?.name}</b>
          <i>
            {displayName(tp)} · TIN {tp ? tp.tin : "—"}
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
        {!guided && (
          <div className="s-zoom">
            <button
              className="s-iconbtn"
              onClick={() => {
                setFit(false);
                setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)));
              }}
            >
              <Icon d={SIco.zoomOut} size={15} />
            </button>
            <button className="s-zoom-val" onClick={() => setFit((v) => !v)}>
              {fit ? "Fit" : Math.round(zoom * 100) + "%"}
            </button>
            <button
              className="s-iconbtn"
              onClick={() => {
                setFit(false);
                setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)));
              }}
            >
              <Icon d={SIco.zoomIn} size={15} />
            </button>
          </div>
        )}
        <button className="s-btn s-btn-xml" onClick={doXML} title="Export eBIRForms XML">
          <Icon d={SIco.code} size={16} />
          Export XML
        </button>
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
          <div className="s-stage" ref={stageRef}>
            <div className="s-stage-inner" style={{ zoom }}>
              <div className="bir-doc" data-rate={(data.taxRate as string) || "graduated"}>
                <FormView form={filing.form} tp={tp} data={data} set={set} comp={comp} />
              </div>
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
              {valid.length === 0 ? (
                <div className="s-allgood">
                  <Icon d={SIco.check} size={15} />
                  Ready to print &amp; file.
                </div>
              ) : (
                <ul className="s-valid">
                  {valid.map((v, i) => (
                    <li key={i} className={v.level}>
                      <Icon d={v.level === "warn" ? SIco.warn : SIco.check} size={13} />
                      {v.msg}
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
                onClick={() => setRoute({ view: "taxpayers", editId: filing.taxpayerId })}
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
