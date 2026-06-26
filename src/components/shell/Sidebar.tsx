// Sidebar.tsx — fixed nav rail. Ported from Sidebar in bir-shell.jsx.

import { useRepository } from "../../lib/repository/RepositoryProvider";
import { Icon, Mark, SIco, type IconName } from "../icons";
import { initials } from "../../lib/taxpayer";
import type { Route, SetRoute, View } from "../route";

const NAV: Array<{ id: View; label: string; icon: IconName }> = [
  { id: "dashboard", label: "Filings", icon: "grid" },
  { id: "new", label: "New Form", icon: "plus" },
  { id: "taxpayers", label: "Taxpayers", icon: "users" },
];

export function Sidebar({ route, setRoute }: { route: Route; setRoute: SetRoute }) {
  const { mode, userEmail, signOut } = useRepository();
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
        {mode === "cloud" && userEmail ? (
          <div className="s-account">
            <div className="s-account-row">
              <div className="s-tpavatar" style={{ width: 30, height: 30, fontSize: 12 }}>
                {initials(userEmail)}
              </div>
              <span className="s-account-email" title={userEmail}>
                {userEmail}
              </span>
            </div>
            <button className="s-btn s-btn-ghost full" onClick={() => signOut?.()}>
              <Icon d={SIco.back} size={14} />
              Sign out
            </button>
          </div>
        ) : (
          <div className="s-side-note">
            Philippine Bureau of Internal Revenue forms. Auto-computed &amp; saved on this device.
          </div>
        )}
      </div>
    </aside>
  );
}
