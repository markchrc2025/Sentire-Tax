import { describe, expect, it } from "vitest";
import { formatTin, normalizeTin, tin14 } from "../taxpayer";

describe("normalizeTin — plain 9 digits for storage", () => {
  it("strips dashes/spaces and caps at 9 digits", () => {
    expect(normalizeTin("474-079-835")).toBe("474079835");
    expect(normalizeTin("474 079 835")).toBe("474079835");
    expect(normalizeTin("474079835")).toBe("474079835");
    // a pasted 14-digit TIN (9 + 5 branch) keeps only the 9-digit TIN
    expect(normalizeTin("474-079-835-00000")).toBe("474079835");
  });
  it("handles empty/partial/invalid input", () => {
    expect(normalizeTin("")).toBe("");
    expect(normalizeTin(null)).toBe("");
    expect(normalizeTin(undefined)).toBe("");
    expect(normalizeTin("47a4")).toBe("474");
  });
});

describe("formatTin — dashed display only", () => {
  it("groups every 3 digits", () => {
    expect(formatTin("474079835")).toBe("474-079-835");
    expect(formatTin("474-079-835")).toBe("474-079-835");
  });
  it("groups progressively as the user types", () => {
    expect(formatTin("4")).toBe("4");
    expect(formatTin("474")).toBe("474");
    expect(formatTin("4740")).toBe("474-0");
    expect(formatTin("474079")).toBe("474-079");
  });
  it("renders empty input as empty string", () => {
    expect(formatTin("")).toBe("");
    expect(formatTin(undefined)).toBe("");
  });
});

describe("tin14 — 14 digits for the forms' digit boxes", () => {
  it("pads a 9-digit TIN with the default 00000 branch", () => {
    expect(tin14("474079835")).toBe("47407983500000");
    expect(tin14("474-079-835")).toBe("47407983500000");
  });
  it("uses the taxpayer's branch code, zero-padded to 5", () => {
    expect(tin14("474079835", "1")).toBe("47407983500001");
    expect(tin14("474079835", "00002")).toBe("47407983500002");
  });
  it("keeps a branch already typed into the TIN itself", () => {
    expect(tin14("474-079-835-00003")).toBe("47407983500003");
    // digits embedded in the TIN win over the separate branch field
    expect(tin14("47407983500003", "7")).toBe("47407983500003");
  });
  it("leaves partial or empty TINs alone (no phantom 00000)", () => {
    expect(tin14("")).toBe("");
    expect(tin14(null)).toBe("");
    expect(tin14(undefined)).toBe("");
    expect(tin14("474079")).toBe("474079");
  });
});
