// api/portal.ts — SPA client for the Accounting Firm Portal connector. Calls the
// Sentire server's /api/portal/* proxy (which holds the Portal OAuth creds); the
// browser never talks to the Portal directly.

import { apiFetch } from "./client";
import type {
  BirFilingPushback,
  PortalClient,
  PortalVatSummary,
} from "../portal/types";

async function json<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export const portalApi = {
  /** Whether the server has the Portal connector configured. */
  async status(): Promise<{ enabled: boolean }> {
    return json(await apiFetch("/api/portal/status"));
  },

  async listClients(query?: string): Promise<PortalClient[]> {
    const q = query ? `?query=${encodeURIComponent(query)}` : "";
    return json(await apiFetch(`/api/portal/clients${q}`));
  },

  async getClient(clientId: string): Promise<PortalClient> {
    return json(await apiFetch(`/api/portal/clients/${clientId}`));
  },

  async getVatSummary(
    clientId: string,
    year: number,
    quarter: number,
  ): Promise<PortalVatSummary> {
    return json(
      await apiFetch(
        `/api/portal/clients/${clientId}/vat-summary?year=${year}&quarter=${quarter}`,
      ),
    );
  },

  async pushFiling(
    clientId: string,
    payload: BirFilingPushback,
  ): Promise<{ ref: string; status: string }> {
    return json(
      await apiFetch(`/api/portal/clients/${clientId}/bir-filings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  },

  async bookInputTaxAsset(
    clientId: string,
    payload: Record<string, unknown>,
  ): Promise<{ ref: string; totalInputTaxAsset: number }> {
    return json(
      await apiFetch(`/api/portal/clients/${clientId}/input-tax-asset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  },
};
