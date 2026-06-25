// Sidebar.tsx — fixed nav rail. Ported from Sidebar in bir-shell.jsx.

import { Icon, Mark, SIco, type IconName } from "../icons";
import type { Route, SetRoute, View } from "../route";

const NAV: Array<{ id: View; label: string; icon: IconName }> = [
  { id: "dashboard", label: "Filings", icon: "grid" },
  { id: "new", label: "New Form", icon: "plus" },
  { id: "taxpayers", label: "Taxpayers", icon: "users" },
];

export function Sidebar({ route, setRoute }: { route: Route; setRoute: SetRoute }) {
  const active: View = route.view === "editor" ? "dashboard" : route.view;
  return (
    <aside className="s-side">
      <div className="s-brand">
        <div className="s-brand-tile">
          <Mark size={26} />
        </div>
        <div className="s-brand-txt">
          <b>Sentire</b>
          <i>BIR Form Generator</i>
        </div>
      </div>
      <nav className="s-nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={"s-navitem" + (active === n.id ? " on" : "")}
            onClick={() => setRoute({ view: n.id })}
          >
            <Icon d={SIco[n.icon]} size={18} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      <div className="s-side-foot">
        <div className="s-side-note">
          Philippine Bureau of Internal Revenue forms. Auto-computed &amp; saved on this device.
        </div>
      </div>
    </aside>
  );
}
