/**
 * Entry Ownership Management
 *
 * This module provides anonymous user tracking for salary entries using browser-stored tokens.
 * Users can manage their own entries without traditional authentication.
 */

import { randomBytes } from "node:crypto";

const STORAGE_KEY = "wagewatchers_entry_tokens";
const EDIT_WINDOW_DAYS = 1; // Users can edit entries for 1 day

/**
 * Generate a secure random token for entry ownership
 */
export function generateOwnerToken(): string {
    return randomBytes(32).toString("base64url");
}

/**
 * Calculate the editableUntil timestamp (1 days from now)
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
        console.error("Failed to store entry token:", error);
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
        console.error("Failed to retrieve entry token:", error);
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
        console.error("Failed to retrieve entry tokens:", error);
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
        console.error("Failed to remove entry token:", error);
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
        console.error("Failed to clear entry tokens:", error);
    }
}
