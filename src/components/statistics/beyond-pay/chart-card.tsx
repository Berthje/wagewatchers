"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
  readonly title: string;
  readonly description: string;
  /** Small "based on N entries" note shown under the chart. */
  readonly caption?: string;
  readonly loading?: boolean;
  /** Message shown in place of the chart when there is no data to plot. */
  readonly emptyMessage?: string;
  readonly isEmpty?: boolean;
  readonly height?: string;
  readonly children: ReactNode;
}

/**
 * Shared card + header + loading/empty states for the "Beyond Pay" charts, so each
 * chart component only owns its Recharts body. Mirrors the look of the existing
 * statistics chart cards.
 */
export function ChartCard({
  title,
  description,
  caption,
  loading = false,
  emptyMessage,
  isEmpty = false,
  height = "h-64 md:h-80",
  children,
}: ChartCardProps) {
  return (
    <Card className="border-border bg-card space-y-3">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`w-full ${height} text-muted-foreground`}>
          {loading ? (
            <div className="w-full h-full bg-muted rounded animate-pulse" />
          ) : isEmpty ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            children
          )}
        </div>
        {caption && !loading && !isEmpty ? (
          <p className="mt-3 text-xs text-muted-foreground">{caption}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
