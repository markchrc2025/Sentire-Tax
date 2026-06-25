// bir-formkit.jsx — shared faithful-form primitives
// Exports to window: BirBoxes, BirCk, BirAmt, BirText, BirVal, BirCkRow

function BirBoxes({ value, count, groups }) {
  const chars = String(value == null ? "" : value).replace(/[^0-9A-Za-z]/g, "").toUpperCase().split("");
  const cells = [];
  for (let i = 0; i < count; i++) cells.push(chars[i] || "");
  if (groups && groups.length) {
    const out = []; let idx = 0;
    groups.forEach((g, gi) => {
      out.push(
        <div className="grp" key={"g" + gi}>
          {Array.from({ length: g }).map((_, j) => (
            <div className="bir-box" key={j}>{cells[idx++] || ""}</div>
          ))}
        </div>
      );
      if (gi < groups.length - 1) out.push(<span className="sep" key={"s" + gi}>-</span>);
    });
    return <div className="bir-boxes">{out}</div>;
  }
  return (
    <div className="bir-boxes">
      {cells.map((c, i) => <div className="bir-box" key={i}>{c}</div>)}
    </div>
  );
}

// editable amount field bound to data
function BirAmt({ field, data, set, ro, value, dim }) {
  const { fmtAmt, num } = window.BIR;
  if (ro) {
    const v = value == null ? 0 : value;
    const neg = num(v) < 0;
    return (
      <input className={"bir-amt ro" + (neg ? " neg" : "")} value={fmtAmt(v)} readOnly tabIndex={-1}
        style={dim ? { opacity: 0.5 } : null} />
    );
  }
  const raw = data[field];
  return (
    <input
      className="bir-amt"
      inputMode="decimal"
      value={raw == null ? "" : raw}
      placeholder="0"
      onChange={(e) => set(field, e.target.value.replace(/[^0-9.\-]/g, ""))}
      onBlur={(e) => {
        const n = num(e.target.value);
        set(field, n === 0 && e.target.value.trim() === "" ? "" : String(window.BIR.roundPeso(n)));
      }}
    />
  );
}

// editable text field
function BirText({ field, data, set, placeholder, lower }) {
  return (
    <input
      className={"bir-in" + (lower ? " lower" : "")}
      value={data[field] == null ? "" : data[field]}
      placeholder={placeholder || ""}
      onChange={(e) => set(field, e.target.value)}
    />
  );
}

// read-only value (from taxpayer profile)
function BirVal({ value, lower }) {
  const empty = value == null || value === "";
  return (
    <span className={"bir-val" + (lower ? " lower" : "") + (empty ? " empty" : "")}>
      {empty ? "—" : value}
    </span>
  );
}

// a clickable / static checkbox with label
function BirCk({ on, onClick }) {
  return (
    <span
      className={"bir-ck" + (onClick ? " sel" : "") + (on ? " on" : "")}
      onClick={onClick || undefined}
    />
  );
}

function BirCkRow({ on, onClick, children, before }) {
  const ck = <BirCk on={on} onClick={onClick} />;
  return (
    <span className={"bir-ckwrap" + (onClick ? " click" : "")} onClick={onClick || undefined}>
      {before ? <><span>{children}</span>{ck}</> : <>{ck}<span>{children}</span></>}
    </span>
  );
}

Object.assign(window, { BirBoxes, BirAmt, BirText, BirVal, BirCk, BirCkRow });
