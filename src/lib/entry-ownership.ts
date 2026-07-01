/**
 * Entry Ownership Management
 *
 * This module provides anonymous user tracking for salary entries using browser-stored tokens.
 * Users can manage their own entries without traditional authentication.
 */

import jwt from "jsonwebtoken";

import { logError } from "@/lib/logger";

const STORAGE_KEY = "wagewatchers_entry_tokens";
export const EDIT_WINDOW_DAYS = 7; // Users can edit entries for 7 days after submission

// JWT secret from env
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Generate a secure JWT token for entry ownership
 */
export function generateOwnerToken(entryId: number): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  const payload = {
    entryId,
    editableUntil: getEditableUntilDate().toISOString(),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${EDIT_WINDOW_DAYS}d` });
}

/**
 * Calculate the editableUntil timestamp (EDIT_WINDOW_DAYS from now)
 */
export function getEditableUntilDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + EDIT_WINDOW_DAYS);
  return date;
}

/**
 * Check if an entry is still editable based on editableUntil timestamp
 */
export function isEntryEditable(editableUntil: Date | null): boolean {
  if (!editableUntil) return false;
  return new Date() < new Date(editableUntil);
}

/**
 * Compute how much of the edit window is left for an entry. Shared by the
 * my-entries badge and the edit-form banner so the countdown stays consistent.
 */
export function getEditTimeRemaining(editableUntil: Date | null): {
  editable: boolean;
  msLeft: number;
  hoursLeft: number;
  daysLeft: number;
} {
  if (!editableUntil) return { editable: false, msLeft: 0, hoursLeft: 0, daysLeft: 0 };
  const msLeft = new Date(editableUntil).getTime() - Date.now();
  if (msLeft <= 0) return { editable: false, msLeft: 0, hoursLeft: 0, daysLeft: 0 };
  return {
    editable: true,
    msLeft,
    hoursLeft: Math.ceil(msLeft / (1000 * 60 * 60)),
    daysLeft: Math.ceil(msLeft / (1000 * 60 * 60 * 24)),
  };
}

/**
 * Client-side: Store an entry token in localStorage
 */
export function storeEntryToken(entryId: number, token: string): void {
  if (globalThis.window === undefined) return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const tokens: Record<string, string> = stored ? JSON.parse(stored) : {};
    tokens[entryId.toString()] = token;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    logError("Failed to store entry token", error);
  }
}

/**
 * Client-side: Retrieve a specific entry token from localStorage
 */
export function getEntryToken(entryId: number): string | null {
  if (globalThis.window === undefined) return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const tokens: Record<string, string> = JSON.parse(stored);
    return tokens[entryId.toString()] || null;
  } catch (error) {
    logError("Failed to retrieve entry token", error);
    return null;
  }
}

/**
 * Client-side: Get all entry tokens from localStorage
 */
export function getAllEntryTokens(): Record<string, string> {
  if (globalThis.window === undefined) return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    logError("Failed to retrieve entry tokens", error);
    return {};
  }
}

/**
 * Client-side: Get all entry IDs that the user owns
 */
export function getOwnedEntryIds(): number[] {
  const tokens = getAllEntryTokens();
  return Object.keys(tokens).map(Number);
}

/**
 * Client-side: Remove a specific entry token (e.g., if entry is deleted)
 */
export function removeEntryToken(entryId: number): void {
  if (globalThis.window === undefined) return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const tokens: Record<string, string> = JSON.parse(stored);
    delete tokens[entryId.toString()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    logError("Failed to remove entry token", error);
  }
}

/**
 * Client-side: Clear all entry tokens
 */
export function clearAllEntryTokens(): void {
  if (globalThis.window === undefined) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    logError("Failed to clear entry tokens", error);
  }
}

/**
 * Verify an owner token (JWT or legacy plain token)
 */
export function verifyOwnerToken(
  token: string,
  entryId: number,
  storedToken: string | null,
  editableUntil: Date | null
): boolean {
  if (!JWT_SECRET) {
    // If no JWT_SECRET, fall back to legacy comparison
    return !!storedToken && token === storedToken && isEntryEditable(editableUntil);
  }
  try {
    // Try to verify as JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { entryId: number; editableUntil: string };
    // Check if entryId matches and still editable
    return decoded.entryId === entryId && isEntryEditable(new Date(decoded.editableUntil));
  } catch {
    // If JWT verification fails, fall back to legacy plain token comparison
    return !!storedToken && token === storedToken && isEntryEditable(editableUntil);
  }
}
