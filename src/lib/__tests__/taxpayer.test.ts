import { describe, expect, it } from "vitest";
import { formatTin, normalizeTin } from "../taxpayer";

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
