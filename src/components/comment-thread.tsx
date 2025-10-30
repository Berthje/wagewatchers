"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ChevronDown,
    ChevronRight,
    MessageSquare,
    ThumbsUp,
    User,
    ExternalLink,
} from "lucide-react";
import { Comment } from "@/types/models";
import { formatRelativeTime } from "@/lib/utils";

interface CommentThreadProps {
    comment: Comment;
    depth?: number;
}

function CommentItem({ comment, depth = 0 }: Readonly<CommentThreadProps>) {
    // Top-level comments (depth === 0) start expanded
    // All child comments (depth > 0) start collapsed
    const [isCollapsed, setIsCollapsed] = useState(depth > 0);
    const hasReplies = comment.replies && comment.replies.length > 0;

    // Indentation increases with depth, max 6 levels
    const indentLevel = Math.min(depth, 6);
    const marginLeft = indentLevel * 16; // 16px per level

    return (
        <div
            className="relative"
            style={{ marginLeft: depth > 0 ? `${marginLeft}px` : "0" }}
        >
            {/* Vertical line for nested comments */}
            {depth > 0 && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-stone-700" />
            )}

            <div className="mb-3">
                {/* Comment Header */}
                <div className="flex items-center gap-2 mb-2">
                    {hasReplies && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 hover:bg-stone-700"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-3 w-3" />
                            ) : (
                                <ChevronDown className="h-3 w-3" />
                            )}
                        </Button>
                    )}
                    {!hasReplies && <div className="w-6" />}
                    <div className="flex items-center gap-2 text-xs text-stone-400">
                        <User className="h-3 w-3" />
                        <span className="font-medium">
                            {comment.author || "Anonymous"}
                        </span>
                        <span>•</span>
                        <span>{formatRelativeTime(comment.createdAt)}</span>
                        {comment.score !== null && comment.score > 0 && (
                            <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" />
                                    <span>{comment.score}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Comment Body - Always show the comment itself */}
                <div className="text-sm text-stone-100 whitespace-pre-wrap break-words pl-8 mb-2">
                    {comment.body}
                </div>

                {/* Nested Replies - Only show when not collapsed */}
                {!isCollapsed && hasReplies && (
                    <div className="mt-3">
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface CommentSectionProps {
    comments: Comment[];
    totalCount: number;
    isLoading?: boolean;
    sourceUrl?: string | null;
    source?: string | null;
}

export function CommentSection({
    comments,
    totalCount,
    isLoading = false,
    sourceUrl,
    source,
}: Readonly<CommentSectionProps>) {
    if (isLoading) {
        return (
            <Card className="bg-stone-800 border-stone-700">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-pulse text-stone-400">
                            Loading comments...
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!comments || comments.length === 0) {
        return (
            <Card className="bg-stone-800 border-stone-700">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center py-8 text-stone-400">
                        <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
                        <p>No comments available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-stone-800 border-stone-700">
            <CardContent>
                {/* Comment Count Header */}
                <div className="mb-4 pb-4 border-b border-stone-700">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-5 w-5 text-stone-400" />
                        <h3 className="text-lg font-semibold text-stone-100">
                            Comments
                        </h3>
                        <Badge
                            variant="outline"
                            className="border-stone-600 text-stone-300"
                        >
                            {totalCount}
                        </Badge>
                    </div>
                    {/* Source information */}
                    {(sourceUrl || source) && (
                        <div className="flex flex-col gap-2 mt-3">
                            {sourceUrl && (
                                <a
                                    href={sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-100 transition-colors w-fit"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span className="underline">
                                        {source?.includes("reddit")
                                            ? "View Reddit Post"
                                            : "View Source"}
                                    </span>
                                    {source && (
                                        <span className="text-xs text-stone-500">
                                            Source: {source}
                                        </span>
                                    )}
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* Comment Thread */}
                <div className="space-y-1">
                    {comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
