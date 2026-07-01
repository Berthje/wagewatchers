import { describe, it, expect } from "vitest";
import { parseNumeric } from "../parse-numeric";

describe("parseNumeric", () => {
  describe("empty / non-values → undefined", () => {
    it.each([
      ["", undefined],
      ["   ", undefined],
      ["-", undefined],
      [".", undefined],
      [",", undefined],
      ["abc", undefined],
      ["€", undefined],
      ["km", undefined],
      [null, undefined],
      [undefined, undefined],
    ])("parseNumeric(%o) === %o", (input, expected) => {
      expect(parseNumeric(input as string)).toBe(expected);
    });
  });

  describe("plain integers and dot decimals", () => {
    it.each([
      ["0", 0],
      ["3500", 3500],
      ["38", 38],
      ["38.5", 38.5],
      ["2500.50", 2500.5],
      ["0.5", 0.5],
    ])("parseNumeric(%o) === %o", (input, expected) => {
      expect(parseNumeric(input)).toBe(expected);
    });
  });

  describe("comma as decimal separator (European locale)", () => {
    // This is the cross-browser bug fix: Chromium blanks these in a
    // type="number" input, Firefox keeps them. We normalize both consistently.
    it.each([
      ["38,5", 38.5],
      ["2500,50", 2500.5],
      ["0,5", 0.5],
      ["3500,00", 3500],
    ])("parseNumeric(%o) === %o", (input, expected) => {
      expect(parseNumeric(input)).toBe(expected);
    });
  });

  describe("thousands separators with a decimal", () => {
    it.each([
      ["2.500,50", 2500.5], // European: dot groups, comma decimal
      ["2,500.50", 2500.5], // US: comma groups, dot decimal
      ["1.234.567,89", 1234567.89],
      ["1,234,567.89", 1234567.89],
    ])("parseNumeric(%o) === %o", (input, expected) => {
      expect(parseNumeric(input)).toBe(expected);
    });
  });

  describe("grouping-only values (no decimal)", () => {
    it.each([
      ["2,500,000", 2500000],
      ["2.500.000", 2500000],
    ])("parseNumeric(%o) === %o", (input, expected) => {
      expect(parseNumeric(input)).toBe(expected);
    });
  });

  describe("currency symbols and stray characters are stripped", () => {
    it.each([
      ["€2500", 2500],
      ["2500 €", 2500],
      ["$ 1,200.00", 1200],
    ])("parseNumeric(%o) === %o", (input, expected) => {
      expect(parseNumeric(input)).toBe(expected);
    });
  });

  it("preserves negatives so schema .positive()/.min(0) can reject them (not silently dropped)", () => {
    expect(parseNumeric("-5")).toBe(-5);
    expect(parseNumeric("-100")).toBe(-100);
  });

  it("returns a non-integer for a decimal typed in an integer field, so .int() can flag it", () => {
    // We deliberately do NOT truncate here (unlike the old Number.parseInt),
    // so the schema surfaces the error instead of storing a silently-wrong value.
    expect(parseNumeric("38.5")).toBe(38.5);
    expect(parseNumeric("38,5")).toBe(38.5);
  });
});
