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
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { Bug, Lightbulb, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { logError } from "@/lib/logger";

export default function FeedbackClient() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("feedback");

  const feedbackSchema = z.object({
    title: z.string().min(1, t("validation.titleRequired")).max(200, t("validation.titleTooLong")),
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
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error" | "rateLimit">(
    "idle"
  );
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
          logError("Failed to save tracking ID to localStorage", e, {
            trackingId: result.trackingId,
          });
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
    <PageShell width="sm">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      {submitStatus === "success" && trackingId && (
        <Alert className="mb-6 border-green-500/30 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-foreground">
            <div className="space-y-3">
              <p className="font-semibold">{t("success")}</p>
              <div className="rounded-lg border-l-4 border-brand bg-brand/10 p-3">
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  {t("trackingId.title")}
                </p>
                <p className="font-mono text-lg font-bold text-brand">{trackingId}</p>
                <p className="mt-2 text-xs text-muted-foreground">{t("trackingId.instruction")}</p>
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
              {rateLimitInfo && rateLimitInfo.remaining >= 0 && (
                <p className="border-t border-border pt-2 text-xs text-muted-foreground">
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
        <Alert className="mb-6 border-destructive/40 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-foreground">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {submitStatus === "rateLimit" && rateLimitInfo && (
        <Alert className="mb-6 border-amber-500/30 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-foreground">
            <div className="space-y-2">
              <p className="font-semibold">{t("rateLimit.title")}</p>
              <p className="text-sm">{t("rateLimit.message")}</p>
              <p className="text-sm font-medium">
                {t("rateLimit.resetInfo", {
                  resetTime: new Date(rateLimitInfo.resetAt).toLocaleString(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                })}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border bg-card/80 backdrop-blur-sm">
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Type Selection */}
            <div>
              <Label className="text-base font-medium text-foreground">{t("form.type")}</Label>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                {typeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-brand bg-brand/10 shadow-sm"
                          : "border-border bg-card/60 hover:border-foreground/20 hover:bg-accent"
                      }`}
                      onClick={() => setValue("type", option.value as any)}
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <Icon
                          className={`h-5 w-5 ${isSelected ? "text-brand" : "text-muted-foreground"}`}
                        />
                        <span className="font-medium text-foreground">{option.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </button>
                  );
                })}
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">
                {t("form.title")}
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder={t("form.titlePlaceholder")}
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">
                {t("form.description")}
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder={t("form.descriptionPlaceholder")}
                rows={6}
                className={`resize-none ${errors.description ? "border-destructive" : ""}`}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-foreground">
                {t("form.priority")}
              </Label>
              <Select
                onValueChange={(value) => setValue("priority", value as any)}
                defaultValue="MEDIUM"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-destructive">{errors.priority.message}</p>
              )}
            </div>

            {/* Email (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                {t("form.email")}
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder={t("form.emailPlaceholder")}
                className={errors.email ? "border-destructive" : ""}
              />
              <p className="text-sm text-muted-foreground">{t("form.emailHint")}</p>
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? t("form.submitting") : t("form.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
