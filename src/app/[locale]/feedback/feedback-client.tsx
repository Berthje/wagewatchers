"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/navbar";
import {
    Bug,
    Lightbulb,
    TrendingUp,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

export default function FeedbackClient() {
    const params = useParams();
    const locale = params.locale as string;
    const t = useTranslations("feedback");
    const tNav = useTranslations("nav");

    const feedbackSchema = z.object({
        title: z
            .string()
            .min(1, t("validation.titleRequired"))
            .max(200, t("validation.titleTooLong")),
        description: z
            .string()
            .min(1, t("validation.descriptionRequired"))
            .max(2000, t("validation.descriptionTooLong")),
        type: z.enum(["BUG", "FEATURE", "IMPROVEMENT"]),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
        email: z.email(t("form.emailInvalid")).optional().or(z.literal("")),
    });

    type FeedbackForm = z.infer<typeof feedbackSchema>;

    const typeOptions = [
        {
            value: "BUG",
            label: t("types.bug.label"),
            icon: Bug,
            description: t("types.bug.description"),
        },
        {
            value: "FEATURE",
            label: t("types.feature.label"),
            icon: Lightbulb,
            description: t("types.feature.description"),
        },
        {
            value: "IMPROVEMENT",
            label: t("types.improvement.label"),
            icon: TrendingUp,
            description: t("types.improvement.description"),
        },
    ];

    const priorityOptions = [
        {
            value: "LOW",
            label: t("priorities.low.label"),
            description: t("priorities.low.description"),
        },
        {
            value: "MEDIUM",
            label: t("priorities.medium.label"),
            description: t("priorities.medium.description"),
        },
        {
            value: "HIGH",
            label: t("priorities.high.label"),
            description: t("priorities.high.description"),
        },
        {
            value: "CRITICAL",
            label: t("priorities.critical.label"),
            description: t("priorities.critical.description"),
        },
    ];
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<
        "idle" | "success" | "error" | "rateLimit"
    >("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [trackingId, setTrackingId] = useState("");
    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
    const [rateLimitInfo, setRateLimitInfo] = useState<{
        resetAt: string;
        remaining: number;
    } | null>(null);

    const STORAGE_KEY = "wagewatchers_tracking_ids";

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm<FeedbackForm>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: {
            type: "BUG",
            priority: "MEDIUM",
        },
    });

    const selectedType = watch("type");

    const onSubmit = async (data: FeedbackForm) => {
        setIsSubmitting(true);
        setSubmitStatus("idle");
        setErrorMessage("");
        setTrackingId("");

        try {
            const response = await fetch(`/api/reports?locale=${locale}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...data,
                    email: data.email || undefined, // Convert empty string to undefined
                }),
            });

            if (response.ok) {
                const result = await response.json();
                setSubmitStatus("success");
                setTrackingId(result.trackingId);
                setSubmittedEmail(data.email || null);

                // Update rate limit info if provided
                if (result.rateLimit) {
                    setRateLimitInfo({
                        resetAt: result.rateLimit.resetAt,
                        remaining: result.rateLimit.remaining,
                    });
                }

                // Save tracking ID to localStorage
                try {
                    const storedIds = localStorage.getItem(STORAGE_KEY);
                    const ids = storedIds ? JSON.parse(storedIds) : [];
                    if (!ids.includes(result.trackingId)) {
                        ids.push(result.trackingId);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
                    }
                } catch (e) {
                    console.error(
                        "Failed to save tracking ID to localStorage",
                        e
                    );
                }

                reset();
            } else if (response.status === 429) {
                // Rate limit exceeded
                const errorData = await response.json();
                setSubmitStatus("rateLimit");
                setRateLimitInfo({
                    resetAt: errorData.resetAt,
                    remaining: errorData.remaining,
                });
            } else {
                const errorData = await response.json();
                setSubmitStatus("error");
                setErrorMessage(errorData.error || t("error"));
            }
        } catch {
            setSubmitStatus("error");
            setErrorMessage(t("networkError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-stone-950 to-stone-900">
            {/* Header */}
            <Navbar
                locale={locale}
                translations={{
                    dashboard: tNav("dashboard"),
                    statistics: tNav("statistics"),
                    feedback: tNav("feedback"),
                    status: tNav("status"),
                    donate: tNav("donate"),
                    addEntry: tNav("addEntry"),
                    changelog: tNav("changelog"),
                }}
            />

            <div className="container mx-auto p-6 max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 text-stone-100">
                        {t("title")}
                    </h1>
                    <p className="text-stone-400">
                        {t("subtitle")}
                    </p>
                </div>

                {submitStatus === "success" && trackingId && (
                    <Alert className="mb-6 border-green-800 bg-green-950/50">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <AlertDescription className="text-green-200">
                            <div className="space-y-3">
                                <p className="font-semibold">{t("success")}</p>
                                <div className="bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded">
                                    <p className="text-sm font-medium text-yellow-200 mb-1">
                                        {t("trackingId.title")}
                                    </p>
                                    <p className="font-mono text-lg font-bold text-yellow-100">
                                        {trackingId}
                                    </p>
                                    <p className="text-xs text-yellow-300 mt-2">
                                        {t("trackingId.instruction")}
                                    </p>
                                </div>
                                {submittedEmail ? (
                                    <p className="text-sm">
                                        {t("emailSent", {
                                            email: submittedEmail,
                                        })}
                                    </p>
                                ) : (
                                    <p className="text-sm">{t("noEmail")}</p>
                                )}
                                {rateLimitInfo &&
                                    rateLimitInfo.remaining >= 0 && (
                                        <p className="text-xs text-green-300 pt-2 border-t border-green-800">
                                            {t("rateLimit.remaining", {
                                                count: rateLimitInfo.remaining,
                                            })}
                                        </p>
                                    )}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {submitStatus === "error" && (
                    <Alert className="mb-6 border-red-800 bg-red-950/50">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-200">
                            {errorMessage}
                        </AlertDescription>
                    </Alert>
                )}

                {submitStatus === "rateLimit" && rateLimitInfo && (
                    <Alert className="mb-6 border-amber-800 bg-amber-950/50">
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                        <AlertDescription className="text-amber-200">
                            <div className="space-y-2">
                                <p className="font-semibold">
                                    {t("rateLimit.title")}
                                </p>
                                <p className="text-sm">
                                    {t("rateLimit.message")}
                                </p>
                                <p className="text-sm font-medium">
                                    {t("rateLimit.resetInfo", {
                                        resetTime: new Date(
                                            rateLimitInfo.resetAt
                                        ).toLocaleString(locale, {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        }),
                                    })}
                                </p>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="border-stone-800 bg-stone-900/60 backdrop-blur-sm">
                    <CardContent>
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            {/* Type Selection */}
                            <div>
                                <Label className="text-base font-medium text-stone-100">
                                    {t("form.type")}
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                    {typeOptions.map((option) => {
                                        const Icon = option.icon;
                                        const isSelected =
                                            selectedType === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 text-left w-full ${isSelected
                                                    ? "border-stone-100 bg-stone-100 text-stone-900 shadow-md"
                                                    : "border-stone-700 bg-stone-800/50 hover:border-stone-600 hover:bg-stone-800/70"
                                                    }`}
                                                onClick={() =>
                                                    setValue(
                                                        "type",
                                                        option.value as any
                                                    )
                                                }
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Icon
                                                        className={`w-5 h-5 ${isSelected ? "text-stone-900" : "text-stone-400"}`}
                                                    />
                                                    <span
                                                        className={`font-medium ${isSelected ? "text-stone-900" : "text-stone-100"}`}
                                                    >
                                                        {option.label}
                                                    </span>
                                                </div>
                                                <p
                                                    className={`text-sm ${isSelected ? "text-stone-700" : "text-stone-400"}`}
                                                >
                                                    {option.description}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.type && (
                                    <p className="text-sm text-red-400 mt-2">
                                        {errors.type.message}
                                    </p>
                                )}
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="title"
                                    className="text-stone-100"
                                >
                                    {t("form.title")}
                                </Label>
                                <Input
                                    id="title"
                                    {...register("title")}
                                    placeholder={t("form.titlePlaceholder")}
                                    className={`border-stone-700 bg-stone-800 text-stone-100 ${errors.title ? "border-red-400" : ""}`}
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-400">
                                        {errors.title.message}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="description"
                                    className="text-stone-100"
                                >
                                    {t("form.description")}
                                </Label>
                                <Textarea
                                    id="description"
                                    {...register("description")}
                                    placeholder={t(
                                        "form.descriptionPlaceholder"
                                    )}
                                    rows={6}
                                    className={`border-stone-700 bg-stone-800 text-stone-100 resize-none ${errors.description ? "border-red-400" : ""}`}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-400">
                                        {errors.description.message}
                                    </p>
                                )}
                            </div>

                            {/* Priority */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="priority"
                                    className="text-stone-100"
                                >
                                    {t("form.priority")}
                                </Label>
                                <Select
                                    onValueChange={(value) =>
                                        setValue("priority", value as any)
                                    }
                                    defaultValue="MEDIUM"
                                >
                                    <SelectTrigger className="w-full border-stone-700 bg-stone-800 text-stone-100">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent className="border-stone-700 bg-stone-800">
                                        {priorityOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                                className="text-stone-100 hover:bg-stone-700"
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.priority && (
                                    <p className="text-sm text-red-400">
                                        {errors.priority.message}
                                    </p>
                                )}
                            </div>

                            {/* Email (Optional) */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-stone-100"
                                >
                                    {t("form.email")}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register("email")}
                                    placeholder={t("form.emailPlaceholder")}
                                    className={`border-stone-700 bg-stone-800 text-stone-100 ${errors.email ? "border-red-400" : ""}`}
                                />
                                <p className="text-sm text-stone-400">
                                    {t("form.emailHint")}
                                </p>
                                {errors.email && (
                                    <p className="text-sm text-red-400">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full"
                            >
                                {isSubmitting
                                    ? t("form.submitting")
                                    : t("form.submit")}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}