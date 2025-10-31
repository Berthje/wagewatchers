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
        <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-md bg-stone-800 border-stone-700">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-red-400" />
                        </div>
                        <CardTitle className="text-xl font-semibold text-stone-100">
                            {title}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-stone-400">
                        {message}
                    </p>
                    {retryAfter && (
                        <p className="text-sm text-amber-400 bg-amber-900/20 p-3 rounded-md border border-amber-800/30">
                            {t("rateLimitRetry", { time: formatTimeUntilRetry(retryAfter) })}
                        </p>
                    )}
                    <div className="flex gap-3">
                        {onRetry && (
                            <Button
                                onClick={onRetry}
                                className="flex-1"
                                variant="default"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                        )}
                        {showHomeButton && onGoHome && (
                            <Button
                                onClick={onGoHome}
                                className="flex-1"
                                variant="outline"
                            >
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
