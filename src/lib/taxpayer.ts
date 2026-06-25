// taxpayer.ts — pure helpers for taxpayer display.

import type { Taxpayer } from "../types";

/** "LAST, FIRST MIDDLE" for individuals; registered name for companies. */
export function displayName(tp: Taxpayer | null | undefined): string {
  if (!tp) return "—";
  if (tp.kind === "individual") {
    return (
      [tp.lastName, tp.firstName].filter(Boolean).join(", ") +
      (tp.middleName ? " " + tp.middleName : "")
    );
  }
  return tp.regName || "—";
}

/** Full "LAST, FIRST, MIDDLE" name as printed on the forms. */
export function formName(tp: Taxpayer | null | undefined): string {
  if (!tp) return "";
  return tp.kind === "individual"
    ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ")
    : tp.regName;
}

/** Up-to-two-letter avatar initials. */
export function initials(name: string): string {
  if (!name) return "?";
  const parts = name.replace(/,/g, "").trim().split(/\s+/);
  const first = (parts[0] || "")[0] || "";
  const second = parts[1] ? parts[1][0] : "";
  return (first + second).toUpperCase().slice(0, 2) || name.slice(0, 2).toUpperCase();
}
