import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Type definition for Comment (matches Prisma schema)
interface Comment {
    id: number;
    externalId: string | null;
    body: string;
    author: string | null;
    score: number | null;
    createdAt: Date;
    depth: number;
    parentId: number | null;
    salaryEntryId: number;
}

interface CommentWithReplies extends Comment {
    replies: CommentWithReplies[];
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const entryId = Number.parseInt(id);

        if (Number.isNaN(entryId)) {
            return NextResponse.json(
                { error: "Invalid entry ID" },
                { status: 400 },
            );
        }

        // Fetch all comments for this entry
        const comments = await prisma.comment.findMany({
            where: {
                salaryEntryId: entryId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        // Build threaded structure
        const commentMap = new Map<number, CommentWithReplies>();
        const topLevelComments: CommentWithReplies[] = [];

        // First pass: create map of all comments
        comments.forEach((comment) => {
            commentMap.set(comment.id, {
                ...comment,
                replies: [],
            });
        });

        // Second pass: build tree structure
        comments.forEach((comment) => {
            const commentWithReplies = commentMap.get(comment.id);
            if (commentWithReplies) {
                if (comment.parentId === null) {
                    topLevelComments.push(commentWithReplies);
                } else {
                    const parent = commentMap.get(comment.parentId);
                    if (parent) {
                        parent.replies.push(commentWithReplies);
                    }
                }
            }
        });

        return NextResponse.json({
            comments: topLevelComments,
            totalCount: comments.length,
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 },
        );
    }
}
