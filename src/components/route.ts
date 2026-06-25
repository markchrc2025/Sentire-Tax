// route.ts — in-memory routing state (not URL-based), as in the prototype.

export type View = "dashboard" | "taxpayers" | "new" | "editor";

export interface Route {
  view: View;
  filingId?: string;
  editId?: string;
}

export type SetRoute = (r: Route) => void;
