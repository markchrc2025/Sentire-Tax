// guided/index.tsx — guided-wizard dispatcher (replaces renderGuided in bir-shell2.jsx).

import type { FilingData, FormCode, Taxpayer } from "../../types";
import type {
  Comp1701,
  Comp1701A,
  Comp1701Q,
  Comp1702Q,
  Comp1702RT,
  Comp2307,
  Comp2316,
  Comp2550Q,
  Comp2551Q,
  CompResult,
} from "../../lib/compute";
import type { SetFn } from "../formkit";
import { Guided1701A } from "./Guided1701A";
import { Guided1701 } from "./Guided1701";
import { Guided1701Q } from "./Guided1701Q";
import { Guided1702RT } from "./Guided1702RT";
import { Guided1702Q } from "./Guided1702Q";
import { Guided2550Q } from "./Guided2550Q";
import { Guided2551Q } from "./Guided2551Q";
import { Guided2307 } from "./Guided2307";
import { Guided2316 } from "./Guided2316";

export function GuidedView({
  form,
  tp,
  data,
  set,
  comp,
  onViewForm,
  onPrint,
}: {
  form: FormCode;
  tp: Taxpayer | null;
  data: FilingData;
  set: SetFn;
  comp: CompResult;
  onViewForm: () => void;
  onPrint: () => void;
}) {
  const common = { tp, data, set, onViewForm, onPrint };
  switch (form) {
    case "1701A":
      return <Guided1701A {...common} comp={comp as Comp1701A} />;
    case "1701":
      return <Guided1701 {...common} comp={comp as Comp1701} />;
    case "1701Q":
      return <Guided1701Q {...common} comp={comp as Comp1701Q} />;
    case "1702RT":
      return <Guided1702RT {...common} comp={comp as Comp1702RT} />;
    case "1702Q":
      return <Guided1702Q {...common} comp={comp as Comp1702Q} />;
    case "2550Q":
      return <Guided2550Q {...common} comp={comp as Comp2550Q} />;
    case "2551Q":
      return <Guided2551Q {...common} comp={comp as Comp2551Q} />;
    case "2307":
      return <Guided2307 {...common} comp={comp as Comp2307} />;
    case "2316":
      return <Guided2316 {...common} comp={comp as Comp2316} />;
  }
}
