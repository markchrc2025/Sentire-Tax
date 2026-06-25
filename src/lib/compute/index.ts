// compute/index.ts — pure tax-computation engine.
// Re-exports every compute module + result type and the `computeFor` dispatcher
// (replaces window.BIR.computeFor from the prototype).

import type { FilingData, FormCode } from "../../types";

import { compute1701A, type Comp1701A } from "./compute1701A";
import { compute1701, type Comp1701 } from "./compute1701";
import { compute1701Q, type Comp1701Q } from "./compute1701Q";
import { compute1702RT, type Comp1702RT } from "./compute1702RT";
import { compute1702Q, type Comp1702Q } from "./compute1702Q";
import { compute2550Q, type Comp2550Q } from "./compute2550Q";
import { compute2551Q, type Comp2551Q } from "./compute2551Q";
import { compute2307, type Comp2307 } from "./compute2307";
import { compute2316, type Comp2316 } from "./compute2316";

export { compute1701A, compute1701, compute1701Q, compute1702RT, compute1702Q };
export { compute2550Q, compute2551Q, compute2307, compute2316 };
export type {
  Comp1701A,
  Side1701A,
} from "./compute1701A";
export type { Comp1701, Side1701 } from "./compute1701";
export type { Comp1701Q, Side1701Q } from "./compute1701Q";
export type { Comp1702RT } from "./compute1702RT";
export type { Comp1702Q } from "./compute1702Q";
export type { Comp2550Q } from "./compute2550Q";
export type { Comp2551Q, Comp2551QRow } from "./compute2551Q";
export type { Comp2307, Comp2307Row } from "./compute2307";
export type { Comp2316 } from "./compute2316";

/** Maps each form code to its computation-result type. */
export interface CompResultMap {
  "1701A": Comp1701A;
  "1701": Comp1701;
  "1701Q": Comp1701Q;
  "1702RT": Comp1702RT;
  "1702Q": Comp1702Q;
  "2550Q": Comp2550Q;
  "2551Q": Comp2551Q;
  "2307": Comp2307;
  "2316": Comp2316;
}

export type CompResult = CompResultMap[FormCode];

/**
 * Compute the result object for a given form. Strongly typed per form code via
 * an overload set; the general signature returns the union (used by the editor).
 */
export function computeFor<K extends FormCode>(form: K, data: FilingData): CompResultMap[K];
export function computeFor(form: FormCode, data: FilingData): CompResult;
export function computeFor(form: FormCode, data: FilingData): CompResult {
  switch (form) {
    case "1701A":
      return compute1701A(data);
    case "1701":
      return compute1701(data);
    case "1701Q":
      return compute1701Q(data);
    case "1702RT":
      return compute1702RT(data);
    case "1702Q":
      return compute1702Q(data);
    case "2550Q":
      return compute2550Q(data);
    case "2551Q":
      return compute2551Q(data);
    case "2307":
      return compute2307(data);
    case "2316":
      return compute2316(data);
  }
}
