import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import type { Comment } from "@/lib/db/schema";

interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const entryId = Number.parseInt(id);

    if (Number.isNaN(entryId)) {
      return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 });
    }

    // Fetch all comments for this entry
    const commentList = await db
      .select()
      .from(comments)
      .where(eq(comments.salaryEntryId, entryId))
      .orderBy(asc(comments.createdAt));

    // Build threaded structure
    const commentMap = new Map<number, CommentWithReplies>();
    const topLevelComments: CommentWithReplies[] = [];

    // First pass: create map of all comments
    for (const comment of commentList) {
      commentMap.set(comment.id, {
        ...comment,
        replies: [],
      });
    }

    // Second pass: build tree structure
    for (const comment of commentList) {
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
    }

    return NextResponse.json({
      comments: topLevelComments,
      totalCount: commentList.length,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
