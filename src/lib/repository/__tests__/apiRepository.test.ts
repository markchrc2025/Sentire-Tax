// apiRepository ordering tests. Reproduces the production race where a
// brand-new taxpayer's COR upload reached the server before the taxpayer
// insert committed, so the API's ownership check failed ("Not your
// taxpayer"). The repository must sequence: taxpayer PUT → COR PUT.

import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiRepository } from "../apiRepository";
import type { Taxpayer } from "../../../types";

const tp = { kind: "individual", lastName: "TEST", tin: "123456789" } as Taxpayer;

function deferred(): { promise: Promise<Response>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<Response>((res) => {
    resolve = () => res(new Response("{}", { status: 200 }));
  });
  return { promise, resolve };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiRepository write ordering", () => {
  it("COR upload waits for the in-flight taxpayer save", async () => {
    const calls: string[] = [];
    const taxpayerPut = deferred();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: RequestInfo | URL, init?: RequestInit) => {
        const path = String(url);
        const method = init?.method ?? "GET";
        calls.push(`${method} ${path}`);
        if (method === "PUT" && /\/api\/taxpayers\/[^/]+$/.test(path)) {
          return taxpayerPut.promise; // hold the insert open
        }
        return Promise.resolve(new Response("{}", { status: 200 }));
      }),
    );

    const repo = new ApiRepository();
    const saved = repo.taxpayers.save({ ...tp });
    const file = new File([new Uint8Array(10)], "cor.pdf", { type: "application/pdf" });
    const upload = repo.uploadCor(saved.id, file);

    // Give the microtask queue a chance — the COR call must NOT have fired
    // while the taxpayer insert is still in flight.
    await new Promise((r) => setTimeout(r, 20));
    expect(calls.some((c) => c.includes("/cor"))).toBe(false);

    taxpayerPut.resolve();
    await upload;
    const iPut = calls.findIndex((c) => /PUT \/api\/taxpayers\/[^/]+$/.test(c));
    const iCor = calls.findIndex((c) => c.includes("/cor"));
    expect(iPut).toBeGreaterThanOrEqual(0);
    expect(iCor).toBeGreaterThan(iPut);
  });

  it("COR upload still runs if the taxpayer save failed (server re-reports)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: RequestInfo | URL, init?: RequestInit) => {
        const path = String(url);
        const method = init?.method ?? "GET";
        if (method === "PUT" && /\/api\/taxpayers\/[^/]+$/.test(path)) {
          return Promise.resolve(new Response('{"error":"boom"}', { status: 500 }));
        }
        return Promise.resolve(new Response("{}", { status: 200 }));
      }),
    );
    const repo = new ApiRepository();
    repo.setErrorListener(() => {});
    const saved = repo.taxpayers.save({ ...tp });
    const file = new File([new Uint8Array(10)], "cor.pdf", { type: "application/pdf" });
    await expect(repo.uploadCor(saved.id, file)).resolves.toBeUndefined();
  });
});
