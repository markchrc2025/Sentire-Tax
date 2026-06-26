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

/** Strip to a plain, digits-only 9-digit TIN for storage (no dashes/branch). */
export function normalizeTin(v: string | null | undefined): string {
  return String(v ?? "").replace(/\D/g, "").slice(0, 9);
}

/** Format a TIN as "123-456-789" for display (UI only). Partial input is
 *  grouped progressively; non-digits and anything past 9 digits are dropped. */
export function formatTin(v: string | null | undefined): string {
  const d = normalizeTin(v);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean).join("-");
}

/** Up-to-two-letter avatar initials. */
export function initials(name: string): string {
  if (!name) return "?";
  const parts = name.replace(/,/g, "").trim().split(/\s+/);
  const first = (parts[0] || "")[0] || "";
  const second = parts[1] ? parts[1][0] : "";
  return (first + second).toUpperCase().slice(0, 2) || name.slice(0, 2).toUpperCase();
}
