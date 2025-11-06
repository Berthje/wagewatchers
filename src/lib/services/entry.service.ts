/**
 * Entry Service
 * Centralized service for salary entry API calls
 */

import type { SalaryEntry } from "@/lib/db/schema";

/**
 * Fetch all entries
 */
export async function fetchAllEntries(): Promise<SalaryEntry[]> {
    const response = await fetch("/api/entries");
    if (!response.ok) {
        throw new Error(`Failed to fetch entries: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Fetch a single entry by ID
 */
export async function fetchEntryById(id: number): Promise<SalaryEntry> {
    const response = await fetch(`/api/entries/${id}`);
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Entry not found");
        }
        throw new Error(`Failed to fetch entry: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Fetch multiple entries by IDs
 */
export async function fetchEntriesByIds(ids: number[]): Promise<SalaryEntry[]> {
    if (ids.length === 0) return [];

    const response = await fetch(`/api/entries?ids=${ids.join(",")}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch entries: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Delete an entry
 */
export async function deleteEntry(id: number, token: string): Promise<void> {
    const response = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete entry");
    }
}

/**
 * Create a new entry
 */
export async function createEntry(
    data: any,
): Promise<{ success: boolean; id?: number; token?: string; error?: string }> {
    const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    return response.json();
}

/**
 * Update an existing entry
 */
export async function updateEntry(
    id: number,
    data: any,
    token: string,
): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`/api/entries/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, token }),
    });

    return response.json();
}
