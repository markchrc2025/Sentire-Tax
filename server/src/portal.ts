// portal.ts — server-side connector to the Accounting Firm Portal.
//
// Holds the Portal OAuth2 client-credentials and brokers every call so the
// browser never sees Portal secrets (design §7.2). A firm-scoped bearer token is
// cached and refreshed a minute before expiry. All requests go to the Portal's
// REST API at {PORTAL_BASE_URL} (which already includes /api/v1).

import { env, portalEnabled } from "./env.js";
import { HttpError } from "./auth.js";

let cached: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt - 60_000 > now) return cached.token;

  const res = await fetch(`${env.portal.baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: env.portal.clientId,
      client_secret: env.portal.clientSecret,
    }),
  });
  if (!res.ok) {
    throw new HttpError(502, `Portal auth failed (${res.status}).`);
  }
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    token: body.access_token,
    expiresAt: now + (body.expires_in ?? 3600) * 1000,
  };
  return cached.token;
}

async function portalFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  if (!portalEnabled()) {
    throw new HttpError(503, "Portal integration is not configured.");
  }
  const token = await getToken();
  const res = await fetch(`${env.portal.baseUrl}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
  });
  if (res.status === 401) {
    cached = null; // token rejected — force a refresh on the next call
    throw new HttpError(502, "Portal rejected the integration token.");
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new HttpError(
      res.status === 404 ? 404 : 502,
      `Portal request failed (${res.status}). ${detail}`.trim(),
    );
  }
  return (await res.json()) as T;
}

// --- Contract shapes (mirror @portal/shared; kept minimal for the connector) --

export interface PortalClient {
  id: string;
  businessName: string;
  tin: string | null;
  address: string | null;
  taxType: string | null;
  fiscalYearStart: string | null;
  currency: string;
  // Full BIR filer profile (mapped into a Taxpayer on import). Nullable.
  kind?: string | null;
  regName?: string | null;
  lastName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  tradeName?: string | null;
  branch?: string | null;
  rdo?: string | null;
  rdoName?: string | null;
  city?: string | null;
  zip?: string | null;
  birthdate?: string | null;
  incorpDate?: string | null;
  email?: string | null;
  phone?: string | null;
  citizenship?: string | null;
  civilStatus?: string | null;
  taxpayerType?: string | null;
  classification?: string | null;
  taxTypesJson?: { type?: string; form?: string; frequency?: string; startDate?: string }[] | null;
}

export interface PortalVatSummary {
  client: { id: string; tin: string; vatRegistered: true };
  period: { year: number; quarter: number; start: string; end: string };
  sales: {
    vatable: { net: number; outputVAT?: number };
    zeroRated: { net: number };
    exempt: { net: number };
    governmentSalesMemo?: { net: number; creditableVATWithheld5pct: number };
  };
  purchases: {
    domesticPurchases: { net: number; inputVAT: number };
    servicesNonResident: { net: number; inputVAT: number };
    importationGoods: { net: number; inputVAT: number };
    othersWithInputTax: { net: number; inputVAT: number };
    domesticNoInputTax: { net: number };
    vatExemptImportation: { net: number };
    capitalGoodsGT1M: {
      items: { acquiredOn: string; cost: number; inputVAT: number; usefulLifeMonths: number }[];
    };
  };
  exemptInputTax: { directlyAttributable: number; commonNotDirectlyAttributable: number };
  otherCredits: { creditableVATWithheld: number; advanceVATPayments: number };
}

// --- Typed endpoints ---------------------------------------------------------

export const portal = {
  listClients: (query?: string) =>
    portalFetch<PortalClient[]>(
      `/clients${query ? `?query=${encodeURIComponent(query)}` : ""}`,
    ),

  getClient: (clientId: string) =>
    portalFetch<PortalClient>(`/clients/${clientId}`),

  getVatSummary: (clientId: string, year: number, quarter: number) =>
    portalFetch<PortalVatSummary>(
      `/clients/${clientId}/vat-summary?year=${year}&quarter=${quarter}`,
    ),

  pushFiling: (clientId: string, payload: unknown) =>
    portalFetch<{ ref: string; status: string }>(
      `/clients/${clientId}/bir-filings`,
      { method: "POST", body: payload },
    ),

  bookInputTaxAsset: (clientId: string, payload: unknown) =>
    portalFetch<{ ref: string; totalInputTaxAsset: number }>(
      `/clients/${clientId}/input-tax-asset`,
      { method: "POST", body: payload },
    ),
};
