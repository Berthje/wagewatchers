/**
 * Report Types
 * Domain models for bug reports and feature requests
 */

export interface Report {
    id: number;
    trackingId: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    status?: string;
    email?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface ReportFormData {
    title: string;
    description: string;
    type: string;
    priority: string;
    email?: string;
}
