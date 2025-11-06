/**
 * Entry Ownership Utilities
 * Anonymous entry ownership using tokens
 */

/**
 * Generate a cryptographically secure owner token
 */
export function generateOwnerToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCodePoint(...array))
    .replace("+", "-")
    .replace("+", "_")
    .replace(/=+$/, "");
}

/**
 * Get editable until date (1 day from now)
 */
export function getEditableUntilDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
}

/**
 * Check if entry is still editable
 */
export function isEntryEditable(editableUntil: Date | string): boolean {
  const until = new Date(editableUntil);
  return new Date() < until;
}

/**
 * Store entry token in localStorage
 */
export function storeEntryToken(entryId: number, token: string): void {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem("wagewatchers_entry_tokens");
  const tokens = stored ? JSON.parse(stored) : {};
  tokens[entryId] = token;
  localStorage.setItem("wagewatchers_entry_tokens", JSON.stringify(tokens));
}

/**
 * Get entry token from localStorage
 */
export function getEntryToken(entryId: number): string | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("wagewatchers_entry_tokens");
  if (!stored) return null;

  const tokens = JSON.parse(stored);
  return tokens[entryId] || null;
}

/**
 * Get all entry IDs that user owns
 */
export function getOwnedEntryIds(): number[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem("wagewatchers_entry_tokens");
  if (!stored) return [];

  const tokens = JSON.parse(stored);
  return Object.keys(tokens).map(Number);
}

/**
 * Remove entry token from localStorage
 */
export function removeEntryToken(entryId: number): void {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem("wagewatchers_entry_tokens");
  if (!stored) return;

  const tokens = JSON.parse(stored);
  delete tokens[entryId];
  localStorage.setItem("wagewatchers_entry_tokens", JSON.stringify(tokens));
}
