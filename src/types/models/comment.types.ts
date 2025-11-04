/**
 * Comment Types
 * Domain models for comments and discussions
 */

export interface Comment {
    id: number;
    externalId: string | null;
    body: string;
    author: string | null;
    score: number | null;
    createdAt: string | Date;
    depth: number;
    parentId: number | null;
    replies: Comment[];
}
