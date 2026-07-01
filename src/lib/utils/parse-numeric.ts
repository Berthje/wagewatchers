/**
 * Parse user-entered numeric text into a number, or `undefined` when the input
 * is empty or not a number.
 *
 * Why this exists: the salary form binds money / hours inputs that were
 * previously `<input type="number">`. That element's value sanitization is NOT
 * consistent across browsers — Firefox tends to keep the raw text (including a
 * comma), while Chromium-based browsers (Chrome, Brave, Edge) blank the value
 * entirely when it isn't a valid US-style float, so a European user typing
 * "2500,50" or "38,5" silently lost their input on submit. By parsing text
 * ourselves we get identical behaviour in every browser and accept BOTH the
 * comma and the dot as the decimal separator.
 *
 * Rules:
 * - Strips anything that isn't a digit, separator or leading minus.
 * - If both "," and "." appear, the right-most one is the decimal separator and
 *   the other is treated as a thousands grouping ("2.500,50" and "2,500.50"
 *   both -> 2500.5).
 * - A lone separator, "" or "-" -> undefined (nothing entered yet).
 * - Integer fields still call this (not parseInt), so a decimal like "38.5"
 *   reaches the schema and surfaces its `.int()` error instead of being
 *   silently truncated to 38.
 */
export function parseNumeric(raw: string | null | undefined): number | undefined {
  if (raw == null) return undefined;
  let s = raw.replace(/[^\d.,-]/g, "").trim();
  if (s === "" || s === "-" || s === "." || s === ",") return undefined;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma > -1 && lastDot > -1) {
    // Both present: right-most char is the decimal point, the other groups.
    const decimal = lastComma > lastDot ? "," : ".";
    const grouping = decimal === "," ? "." : ",";
    s = s.split(grouping).join("").replace(decimal, ".");
  } else if (lastComma > -1) {
    const commaCount = (s.match(/,/g) || []).length;
    // A single comma is a decimal separator ("38,5"); multiple commas are
    // thousands separators ("2,500,000").
    s = commaCount > 1 ? s.split(",").join("") : s.replace(",", ".");
  } else if (lastDot > -1) {
    const dotCount = (s.match(/\./g) || []).length;
    // Multiple dots can only be thousands grouping ("2.500.000").
    if (dotCount > 1) s = s.split(".").join("");
  }

  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
}
