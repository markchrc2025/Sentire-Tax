// summary.ts — headline "amount payable" per form (for the filings dashboard).

import type { FilingData, FormCode } from "../types";
import { computeFor } from "./compute";

/**
 * The single headline figure shown for a filing in the dashboard. Returns null
 * for certificates (2307/2316) which have no "amount payable".
 */
export function headlineAmount(form: FormCode, data: FilingData): number | null {
  const c = computeFor(form, data);
  switch (form) {
    case "1701A":
      return (c as ReturnType<typeof computeFor<"1701A">>).i30;
    case "1701":
      return (c as ReturnType<typeof computeFor<"1701">>).aggregate;
    case "1701Q":
      return (c as ReturnType<typeof computeFor<"1701Q">>).aggregate;
    case "1702RT":
      return (c as ReturnType<typeof computeFor<"1702RT">>).i21;
    case "1702Q":
      return (c as ReturnType<typeof computeFor<"1702Q">>).i25;
    case "2550Q":
      return (c as ReturnType<typeof computeFor<"2550Q">>).i26;
    case "2551Q":
      return (c as ReturnType<typeof computeFor<"2551Q">>).i24;
    case "2307":
    case "2316":
      return null;
  }
}
