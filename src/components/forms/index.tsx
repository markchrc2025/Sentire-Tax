// forms/index.tsx — faithful-form dispatcher (replaces renderForm in bir-shell2.jsx).

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
import { Form1701A } from "./Form1701A";
import { Form1701 } from "./Form1701";
import { Form1701Q } from "./Form1701Q";
import { Form1702RT } from "./Form1702RT";
import { Form1702Q } from "./Form1702Q";
import { Form2550Q } from "./Form2550Q";
import { Form2551Q } from "./Form2551Q";
import { Form2307 } from "./Form2307";
import { Form2316 } from "./Form2316";

export function FormView({
  form,
  tp,
  data,
  set,
  comp,
}: {
  form: FormCode;
  tp: Taxpayer | null;
  data: FilingData;
  set: SetFn;
  comp: CompResult;
}) {
  switch (form) {
    case "1701A":
      return <Form1701A tp={tp} data={data} set={set} comp={comp as Comp1701A} />;
    case "1701":
      return <Form1701 tp={tp} data={data} set={set} comp={comp as Comp1701} />;
    case "1701Q":
      return <Form1701Q tp={tp} data={data} set={set} comp={comp as Comp1701Q} />;
    case "1702RT":
      return <Form1702RT tp={tp} data={data} set={set} comp={comp as Comp1702RT} />;
    case "1702Q":
      return <Form1702Q tp={tp} data={data} set={set} comp={comp as Comp1702Q} />;
    case "2550Q":
      return <Form2550Q tp={tp} data={data} set={set} comp={comp as Comp2550Q} />;
    case "2551Q":
      return <Form2551Q tp={tp} data={data} set={set} comp={comp as Comp2551Q} />;
    case "2307":
      return <Form2307 tp={tp} data={data} set={set} comp={comp as Comp2307} />;
    case "2316":
      return <Form2316 tp={tp} data={data} set={set} comp={comp as Comp2316} />;
  }
}
