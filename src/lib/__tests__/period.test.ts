import { describe, expect, it } from "vitest";
import { filingVersion, formSegment, splitFormSegment, versionLabel } from "../period";
import type { Filing } from "../../types";

const filing = (data: Record<string, string>) => ({ data }) as unknown as Filing;

describe("filing versions (amended returns)", () => {
  it("filingVersion — 0 for originals, the stored number for amended", () => {
    expect(filingVersion(filing({}))).toBe(0);
    expect(filingVersion(filing({ year: "2023" }))).toBe(0);
    expect(filingVersion(filing({ __version: "1" }))).toBe(1);
    expect(filingVersion(filing({ __version: "3" }))).toBe(3);
    expect(filingVersion(filing({ __version: "junk" }))).toBe(0);
  });

  it("versionLabel — empty for originals, v1/v2 for amended", () => {
    expect(versionLabel(0)).toBe("");
    expect(versionLabel(1)).toBe("v1");
    expect(versionLabel(2)).toBe("v2");
  });

  it("formSegment/splitFormSegment round-trip", () => {
    expect(formSegment("1701", 0)).toBe("1701");
    expect(formSegment("1701", 1)).toBe("1701v1");
    expect(splitFormSegment("1701")).toEqual({ form: "1701", version: 0 });
    expect(splitFormSegment("1701v1")).toEqual({ form: "1701", version: 1 });
    expect(splitFormSegment("1701Av2")).toEqual({ form: "1701A", version: 2 });
    expect(splitFormSegment("2551Q")).toEqual({ form: "2551Q", version: 0 });
    expect(splitFormSegment("2551Qv10")).toEqual({ form: "2551Q", version: 10 });
    expect(splitFormSegment(undefined)).toEqual({ form: "", version: 0 });
  });
});
