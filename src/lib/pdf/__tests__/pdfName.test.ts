import { describe, expect, it } from "vitest";
import type { Filing, Taxpayer } from "../../../types";
import { pdfBaseName } from "../pdfName";

const tp = {
  kind: "individual",
  lastName: "COMIA",
  firstName: "MERLITO",
  middleName: "CASTILLO",
} as Taxpayer;

const filing = (over: Partial<Filing> = {}): Filing =>
  ({
    id: "f1",
    form: "1701",
    taxpayerId: "t1",
    status: "draft",
    period: "2023",
    data: {},
    createdAt: 0,
    updatedAt: 0,
    ...over,
  }) as Filing;

describe("pdfBaseName — Form_Period_Full Name", () => {
  it("names the original filing Form_Year_Name", () => {
    expect(pdfBaseName(filing(), tp)).toBe("1701_2023_COMIA, MERLITO CASTILLO");
  });

  it("puts the amendment number beside the form code", () => {
    expect(pdfBaseName(filing({ data: { __version: "1" } }), tp)).toBe(
      "1701v1_2023_COMIA, MERLITO CASTILLO",
    );
    expect(pdfBaseName(filing({ data: { __version: "2" } }), tp)).toBe(
      "1701v2_2023_COMIA, MERLITO CASTILLO",
    );
  });

  it("uses the quarterly period segment as-is", () => {
    expect(pdfBaseName(filing({ form: "2551Q", period: "2024-Q1" }), tp)).toBe(
      "2551Q_2024-Q1_COMIA, MERLITO CASTILLO",
    );
  });

  it("uses the registered name for non-individuals", () => {
    const corp = { kind: "non-individual", regName: "NCV RICE TRADING" } as Taxpayer;
    expect(pdfBaseName(filing(), corp)).toBe("1701_2023_NCV RICE TRADING");
  });

  it("drops missing parts and illegal filename characters", () => {
    expect(pdfBaseName(filing({ period: "" }), null)).toBe("1701");
    const weird = { kind: "non-individual", regName: 'A/B:C*D?"E<F>G|H' } as Taxpayer;
    expect(pdfBaseName(filing(), weird)).toBe("1701_2023_A B C D E F G H");
  });
});
