import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimeUntilRetry } from "@/lib/utils/format.utils";
import { useTranslations } from "next-intl";

interface ErrorPageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
  retryAfter?: Date | null;
}

export function ErrorPage({
  title = "Something went wrong",
  message,
  onRetry,
  onGoHome,
  showHomeButton = true,
  retryAfter,
}: Readonly<ErrorPageProps>) {
  const t = useTranslations("add");

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl font-semibold text-foreground">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {retryAfter && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
              {t("rateLimitRetry", { time: formatTimeUntilRetry(retryAfter) })}
            </p>
          )}
          <div className="flex gap-3">
            {onRetry && (
              <Button onClick={onRetry} className="flex-1" variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            {showHomeButton && onGoHome && (
              <Button onClick={onGoHome} className="flex-1" variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
