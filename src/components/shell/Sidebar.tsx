// Sidebar.tsx — fixed nav rail with URL-based active state.

import { NavLink, useLocation } from "react-router-dom";
import { useRepository } from "../../lib/repository/RepositoryProvider";
import { initials } from "../../lib/taxpayer";
import { Icon, Mark, SIco, type IconName } from "../icons";

const NAV: Array<{ to: string; label: string; icon: IconName }> = [
  { to: "/filings", label: "Filings", icon: "grid" },
  { to: "/new", label: "New Form", icon: "plus" },
  { to: "/taxpayers", label: "Taxpayers", icon: "users" },
];

const TOP_LEVEL = ["/", "/filings", "/new", "/taxpayers"];

export function Sidebar() {
  const { mode, userEmail, signOut } = useRepository();
  const { pathname } = useLocation();
  // Editor routes (/:form/:period/:tin) keep "Filings" highlighted.
  const onEditor = !TOP_LEVEL.includes(pathname);

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
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              "s-navitem" + (isActive || (onEditor && n.to === "/filings") ? " on" : "")
            }
          >
            <Icon d={SIco[n.icon]} size={18} />
            <span>{n.label}</span>
          </NavLink>
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
