"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { SmartCityInput } from "@/components/ui/smart-city-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";
import { getAllCountries, getFormConfigForCountry } from "@/lib/salary-config";
import {
    createFieldConfigs,
    getFieldConfigsForCountry,
} from "@/lib/field-configs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorPage } from "@/components/ui/error-page";
import {
    createSalaryEntrySchema,
    SalaryEntryFormData,
} from "@/lib/validations/salary-entry.schema";

const getSubmitButtonText = (isSubmitting: boolean, isEditMode: boolean) => {
    if (isSubmitting) {
        return isEditMode ? "Updating..." : "Submitting...";
    }
    return isEditMode ? "Update Entry" : "Submit Entry";
};

function AddEntryContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const locale = params.locale as string;
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSectionHelp, setShowSectionHelp] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editEntryId, setEditEntryId] = useState<number | null>(null);
    const [isLoadingEntry, setIsLoadingEntry] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations("add");
    const tNav = useTranslations("nav");
    const tCommon = useTranslations("common");

    const getSectionHelpContent = (
        sectionKey: string,
        sectionFields: string[]
    ) => {
        // Dynamically generate help content based on the section's fields
        return {
            title: t(`sections.${sectionKey}.title`),
            fields: sectionFields.map((fieldName) => ({
                name: t(fieldConfigs[fieldName]?.labelKey || fieldName),
                description: t(
                    fieldConfigs[fieldName]?.helpKey || `help.${fieldName}`
                ),
                example: fieldConfigs[fieldName]?.placeholder || "",
            })),
        };
    };

    // Create the validation schema with translations
    const salaryEntrySchema = createSalaryEntrySchema(t);

    const form = useForm<SalaryEntryFormData>({
        resolver: zodResolver(salaryEntrySchema),
        defaultValues: {
            multinational: false,
            currency: "EUR"
        },
    });

    const selectedCountry = form.watch("country");
    const formConfig = selectedCountry
        ? getFormConfigForCountry(selectedCountry)
        : null;

    // Load entry data when in edit mode
    useEffect(() => {
        const editId = searchParams.get("edit");
        if (editId) {
            const entryId = Number.parseInt(editId);
            setEditEntryId(entryId);
            setIsEditMode(true);
            setIsLoadingEntry(true);

            // Load the entry data
            fetch(`/api/entries/${entryId}`)
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to load entry");
                    return res.json();
                })
                .then((data) => {
                    // Populate the form with the entry data
                    form.reset({
                        country: data.country || undefined,
                        age: data.age || undefined,
                        education: data.education || undefined,
                        workExperience: data.workExperience || undefined,
                        civilStatus: data.civilStatus || undefined,
                        dependents: data.dependents || undefined,
                        sector: data.sector || undefined,
                        employeeCount: data.employeeCount || undefined,
                        multinational: data.multinational || false,
                        jobTitle: data.jobTitle || undefined,
                        jobDescription: data.jobDescription || undefined,
                        seniority: data.seniority || undefined,
                        officialHours: data.officialHours || undefined,
                        averageHours: data.averageHours || undefined,
                        shiftDescription: data.shiftDescription || undefined,
                        onCall: data.onCall || undefined,
                        vacationDays: data.vacationDays || undefined,
                        currency: data.currency || "EUR",
                        grossSalary: data.grossSalary || undefined,
                        netSalary: data.netSalary || undefined,
                        netCompensation: data.netCompensation || undefined,
                        mobility: data.mobility || undefined,
                        thirteenthMonth: data.thirteenthMonth || undefined,
                        mealVouchers: data.mealVouchers || undefined,
                        ecoCheques: data.ecoCheques || undefined,
                        groupInsurance: data.groupInsurance || undefined,
                        otherInsurances: data.otherInsurances || undefined,
                        otherBenefits: data.otherBenefits || undefined,
                        workCity: data.workCity || undefined,
                        commuteDistance: data.commuteDistance ? data.commuteDistance.toString() : undefined,
                        commuteMethod: data.commuteMethod || undefined,
                        commuteCompensation:
                            data.commuteCompensation || undefined,
                        teleworkDays: data.teleworkDays || undefined,
                        dayOffEase: data.dayOffEase || undefined,
                        stressLevel: data.stressLevel || undefined,
                        reports: data.reports || undefined,
                        extraNotes: data.extraNotes || undefined,
                    });
                    setIsLoadingEntry(false);
                })
                .catch((error) => {
                    console.error("Error loading entry:", error);
                    setIsLoadingEntry(false);
                    router.push(`/${locale}/dashboard`);
                });
        }
    }, [searchParams, form, router, locale]);

    const onSubmit = async (data: SalaryEntryFormData) => {
        setIsSubmitting(true);
        try {
            // Determine if we're editing or creating
            const url =
                isEditMode && editEntryId
                    ? `/api/entries/${editEntryId}`
                    : "/api/entries";
            const method = isEditMode ? "PUT" : "POST";

            // Get owner token if editing
            const bodyData: any = {
                ...data,
                source: "Manual submission",
                commuteDistance: data.commuteDistance ? data.commuteDistance.toString() : undefined
            };
            if (isEditMode && editEntryId) {
                const tokens = localStorage.getItem(
                    "wagewatchers_entry_tokens"
                );
                const tokenMap = tokens ? JSON.parse(tokens) : {};
                const ownerToken = tokenMap[editEntryId.toString()];
                if (ownerToken) {
                    bodyData.ownerToken = ownerToken;
                }
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData),
            });
            if (res.ok) {
                const entry = await res.json();

                // Store the owner token in localStorage for future access
                if (entry.ownerToken && entry.id) {
                    const tokens = localStorage.getItem(
                        "wagewatchers_entry_tokens"
                    );
                    const tokenMap = tokens ? JSON.parse(tokens) : {};
                    tokenMap[entry.id.toString()] = entry.ownerToken;
                    localStorage.setItem(
                        "wagewatchers_entry_tokens",
                        JSON.stringify(tokenMap)
                    );
                }

                // Trigger confetti celebration
                const duration = 3000;
                const animationEnd = Date.now() + duration;
                const defaults = {
                    startVelocity: 30,
                    spread: 360,
                    ticks: 60,
                    zIndex: 0,
                };

                function randomInRange(min: number, max: number) {
                    return Math.random() * (max - min) + min;
                }

                const interval: any = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: {
                            x: randomInRange(0.1, 0.3),
                            y: Math.random() - 0.2,
                        },
                    });
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: {
                            x: randomInRange(0.7, 0.9),
                            y: Math.random() - 0.2,
                        },
                    });
                }, 250);

                form.reset();
                const successMessage = isEditMode
                    ? "updated=true"
                    : "success=true";
                router.push(`/${locale}/my-entries?${successMessage}`);
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error("Submission failed:", errorData);
                setError(errorData.details || errorData.error || t("error"));
            }
        } catch (err) {
            console.error("Submission error:", err);
            setError(t("errorGeneric"));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Field rendering configurations - now loaded from external config
    // and filtered by country to only show relevant fields
    const allFieldConfigs = createFieldConfigs(t);
    const fieldConfigs = selectedCountry
        ? getFieldConfigsForCountry(selectedCountry, allFieldConfigs)
        : allFieldConfigs;

    const getSectionKey = (title: string): string => {
        const sectionMappings: Record<string, string> = {
            "2. Personal Information": "personal",
            "3. Employer Profile": "employer",
            "4. Job Profile": "job",
            "5. Working Hours": "workingHours",
            "6. Vacation": "vacation",
            "7. Salary": "salary",
            "8. Mobility": "mobility",
            "9. Benefits": "benefits",
            "10. Commute": "commute",
            "11. Work-Life Balance": "workLife",
            "12. Additional Notes": "notes",
        };
        return (
            sectionMappings[title] || title.toLowerCase().replace(/\s+/g, "")
        );
    };

    const selectedCurrency = form.watch("currency");

    const getFieldElement = (config: any, field: any, fieldName?: string) => {
        // Special handling for workCity field with smart city input
        if (fieldName === "workCity") {
            return (
                <SmartCityInput
                    value={field.value?.toString() || ""}
                    onChange={field.onChange}
                    location={selectedCountry}
                    locale={locale}
                    placeholder={config.placeholder}
                />
            );
        }

        // Special handling for money fields with currency selector
        const moneyFields = [
            "grossSalary",
            "netSalary",
            "netCompensation",
            "mealVouchers",
            "ecoCheques",
        ];
        if (fieldName && moneyFields.includes(fieldName)) {
            return (
                <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    currency={selectedCurrency || "EUR"}
                    onCurrencyChange={(currency) =>
                        form.setValue("currency", currency)
                    }
                    placeholder={config.placeholder}
                />
            );
        }

        switch (config.type) {
            case "text":
                return (
                    <Input
                        placeholder={config.placeholder}
                        className="bg-stone-700 border-stone-600 text-stone-100 placeholder:text-stone-400"
                        {...field}
                        value={field.value?.toString() || ""}
                    />
                );
            case "number":
                return (
                    <Input
                        type="number"
                        min="0"
                        placeholder={config.placeholder}
                        className="bg-stone-700 border-stone-600 text-stone-100 placeholder:text-stone-400"
                        {...field}
                        onChange={(e) =>
                            field.onChange(
                                e.target.value
                                    ? Number.parseInt(e.target.value)
                                    : undefined
                            )
                        }
                        value={field.value?.toString() || ""}
                    />
                );
            case "textarea":
                return (
                    <Textarea
                        placeholder={config.placeholder}
                        className="bg-stone-700 border-stone-600 text-stone-100 placeholder:text-stone-400"
                        {...field}
                        value={field.value?.toString() || ""}
                    />
                );
            case "richtext":
                return (
                    <RichTextEditor
                        content={field.value?.toString() || ""}
                        onChange={field.onChange}
                        placeholder={config.placeholder}
                    />
                );
            case "combobox":
                return (
                    <Combobox
                        options={config.options || []}
                        value={field.value?.toString()}
                        onValueChange={field.onChange}
                        placeholder={config.placeholder}
                        allowCustom={config.allowCustom}
                        className="bg-stone-700 border-stone-600 text-stone-100"
                    />
                );
            case "select":
                return (
                    <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                    >
                        <SelectTrigger className="bg-stone-700 border-stone-600 text-stone-100">
                            <SelectValue
                                placeholder={
                                    config.placeholder || "Select option"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent className="bg-stone-700 border-stone-600">
                            {config.options?.map((option: any) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case "boolean":
                return (
                    <Select
                        onValueChange={(value) =>
                            field.onChange(value === "yes")
                        }
                        defaultValue={field.value ? "yes" : "no"}
                    >
                        <SelectTrigger className="bg-stone-700 border-stone-600 text-stone-100">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-stone-700 border-stone-600">
                            {config.options?.map((option: any) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            default:
                return <div>Unknown field type</div>;
        }
    };

    const renderField = (fieldName: string) => {
        const config = fieldConfigs[fieldName];
        if (!config) return null;

        const getWidthClass = (width?: string) => {
            switch (width) {
                case "half":
                    return "w-full md:w-[calc(50%-0.5rem)]";
                case "third":
                    return "w-full md:w-[calc(33.333%-0.667rem)]";
                default:
                    return "w-full";
            }
        };

        const widthClass = getWidthClass(config.width);

        return (
            <FormField
                key={fieldName}
                control={form.control}
                name={fieldName as keyof SalaryEntryFormData}
                render={({ field, fieldState }) => (
                    <FormItem className={widthClass}>
                        <FormLabel className="text-stone-300">
                            {t(config.labelKey)}
                            {config.optional && (
                                <span className="text-stone-400 text-xs font-normal ml-2">
                                    ({tCommon("optional")})
                                </span>
                            )}
                        </FormLabel>
                        <FormControl>
                            <div
                                className="relative group"
                                title={fieldState.error?.message}
                            >
                                {getFieldElement(config, field, fieldName)}
                            </div>
                        </FormControl>
                    </FormItem>
                )}
            />
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-950 to-stone-900">
            {/* Header */}
            <div className="bg-stone-900 border-b border-stone-700 sticky top-0 z-50">
                <Navbar
                    locale={locale}
                    translations={{
                        dashboard: tNav("dashboard"),
                        statistics: tNav("statistics"),
                        feedback: tNav("feedback"),
                        status: tNav("status"),
                        donate: tNav("donate"),
                        addEntry: tNav("addEntry"),
                    }}
                />
            </div>

            <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
                <div className="mb-6 md:mb-8">
                    {isEditMode && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="mb-4 -ml-2 text-stone-400 hover:text-stone-100"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t("goBack")}
                        </Button>
                    )}
                    <h1 className="text-2xl md:text-3xl font-bold text-stone-100 mb-2">
                        {isEditMode ? t("editTitle") : t("title")}
                    </h1>
                    <p className="text-sm md:text-base text-stone-400">
                        {isEditMode ? t("editSubtitle") : t("subtitle")}
                    </p>
                </div>

                {error && (
                    <ErrorPage
                        title={t("error")}
                        message={error}
                        onRetry={() => {
                            if (isEditMode) {
                                setError(null);
                                router.back();
                            } else {
                                // Retry submission with the same form data
                                const formData = form.getValues();
                                onSubmit(formData);
                            }
                        }}
                        onGoHome={() => router.push(`/${locale}/dashboard`)}
                    />
                )}

                {!error && (isLoadingEntry ? (
                    <LoadingSpinner
                        message={t("loadingEntry")}
                        fullScreen={false}
                        size="lg"
                    />
                ) : (
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8"
                        >
                            {/* Location Information */}
                            <Card className="bg-stone-800 border-stone-700">
                                <CardHeader>
                                    <CardTitle className="text-stone-100 mb-3">
                                        {t("sections.location.title")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field, fieldState }) => (
                                            <FormItem>
                                                <FormLabel className="text-stone-300">
                                                    {t("fields.country.label")}
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <div
                                                            className="relative"
                                                            title={
                                                                fieldState.error
                                                                    ?.message
                                                            }
                                                        >
                                                            <SelectTrigger className="bg-stone-700 border-stone-600 text-stone-100">
                                                                <SelectValue
                                                                    placeholder={t(
                                                                        "fields.country.placeholder"
                                                                    )}
                                                                />
                                                            </SelectTrigger>
                                                        </div>
                                                    </FormControl>
                                                    <SelectContent className="bg-stone-700 border-stone-600">
                                                        {getAllCountries().map(
                                                            (country) => (
                                                                <SelectItem
                                                                    key={
                                                                        country
                                                                    }
                                                                    className="text-stone-100 focus:bg-stone-600"
                                                                    value={
                                                                        country
                                                                    }
                                                                >
                                                                    {t(
                                                                        `countries.${country.toLowerCase()}`
                                                                    )}
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Show remaining sections only when country is selected */}
                            {selectedCountry && formConfig && (
                                <>
                                    {formConfig.sections.map((section) => (
                                        <Card
                                            key={section.title}
                                            className="bg-stone-800 border-stone-700 relative"
                                        >
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute top-3 right-3 h-9 w-9 p-0 bg-stone-700 border-stone-600 rounded-lg hover:bg-stone-600 transition-colors z-10"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setShowSectionHelp(
                                                        showSectionHelp ===
                                                            getSectionKey(
                                                                section.title
                                                            )
                                                            ? null
                                                            : getSectionKey(
                                                                section.title
                                                            )
                                                    );
                                                }}
                                            >
                                                <HelpCircle className="h-5 w-5" />
                                            </Button>
                                            <CardHeader>
                                                <CardTitle className="text-stone-100 mb-3">
                                                    {t(
                                                        `sections.${getSectionKey(section.title)}.title`
                                                    )}
                                                </CardTitle>
                                            </CardHeader>
                                            {showSectionHelp ===
                                                getSectionKey(
                                                    section.title
                                                ) && (
                                                    <div className="px-6 pb-4 my-4 border-stone-700">
                                                        <div className="bg-stone-800/50 rounded-lg p-4 border-stone-600">
                                                            <h4 className="font-semibold text-stone-100 mb-3">
                                                                {t(
                                                                    "fieldExplanations"
                                                                )}
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {getSectionHelpContent(
                                                                    getSectionKey(
                                                                        section.title
                                                                    ),
                                                                    section.fields
                                                                )?.fields.map(
                                                                    (
                                                                        field
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                field.name
                                                                            }
                                                                            className="text-sm"
                                                                        >
                                                                            <div className="font-medium text-stone-200">
                                                                                {
                                                                                    field.name
                                                                                }
                                                                            </div>
                                                                            <div className="text-stone-300 mt-1">
                                                                                {
                                                                                    field.description
                                                                                }
                                                                            </div>
                                                                            <div className="text-stone-400 mt-1 font-mono text-xs bg-stone-700/50 px-2 py-1 rounded">
                                                                                {t(
                                                                                    "example"
                                                                                )}
                                                                                :{" "}
                                                                                {
                                                                                    field.example
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            <CardContent className="flex flex-wrap gap-4">
                                                {section.fields.map(
                                                    (fieldName) =>
                                                        renderField(fieldName)
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <div className="flex justify-end space-x-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.back()}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                        >
                                            {getSubmitButtonText(isSubmitting, isEditMode)}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </form>
                    </Form>
                ))}
            </main>
        </div>
    );
}



export default function AddClient() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AddEntryContent />
        </Suspense>
    );
}