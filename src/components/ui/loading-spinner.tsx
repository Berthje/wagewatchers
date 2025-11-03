import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    message?: string;
    fullScreen?: boolean;
    size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
    message = "Loading...",
    fullScreen = false,
    size = "md",
}: Readonly<LoadingSpinnerProps>) {
    const sizeClasses = {
        sm: "w-5 h-5",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    };

    const content = (
        <div className="flex flex-col items-center justify-center gap-3">
            <Loader2
                className={`${sizeClasses[size]} animate-spin text-amber-400`}
            />
            {message && (
                <p className="text-sm text-stone-400">
                    {message}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen bg-linear-to-br from-stone-950 to-stone-900 flex items-center justify-center">
                {content}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-8">{content}</div>
    );
}
