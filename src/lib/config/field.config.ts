/**
 * Field Configuration
 * Defines form field metadata and behavior
 */

import { FieldConfigs } from "@/types/config";

// Field configurations function generator that accepts translation function
export const createFieldConfigs = (
    t: (key: string) => string,
): FieldConfigs => ({
    age: {
        labelKey: "sections.personal.age",
        type: "number",
        placeholder: t("placeholders.age"),
        helpKey: "help.age",
        width: "half",
    },
    education: {
        labelKey: "sections.personal.education",
        type: "combobox",
        placeholder: t("placeholders.education"),
        allowCustom: true,
        options: [
            {
                value: "highSchool",
                label: t("formOptions.education.highSchool"),
            },
            {
                value: "associate",
                label: t("formOptions.education.associate"),
            },
            {
                value: "bachelor",
                label: t("formOptions.education.bachelor"),
            },
            { value: "master", label: t("formOptions.education.master") },
            { value: "phd", label: t("formOptions.education.phd") },
            {
                value: "professional",
                label: t("formOptions.education.professional"),
            },
            {
                value: "vocational",
                label: t("formOptions.education.vocational"),
            },
            {
                value: "someCollege",
                label: t("formOptions.education.someCollege"),
            },
        ],
        helpKey: "help.education",
        width: "half",
    },
    workExperience: {
        labelKey: "sections.personal.workExperience",
        type: "number",
        placeholder: t("placeholders.workExperience"),
        helpKey: "help.workExperience",
        width: "half",
    },
    civilStatus: {
        labelKey: "sections.personal.civilStatus",
        type: "select",
        options: [
            { value: "single", label: "Single" },
            { value: "married", label: "Married" },
            { value: "divorced", label: "Divorced" },
            { value: "widowed", label: "Widowed" },
        ],
        helpKey: "help.civilStatus",
        width: "half",
    },
    dependents: {
        labelKey: "sections.personal.dependents",
        type: "number",
        placeholder: t("placeholders.dependents"),
        helpKey: "help.dependents",
        width: "full",
    },
    sector: {
        labelKey: "sections.employer.sector",
        type: "select",
        options: [
            { value: "IT", label: "IT" },
            { value: "Finance", label: "Finance" },
            { value: "Healthcare", label: "Healthcare" },
            { value: "Education", label: "Education" },
            { value: "Manufacturing", label: "Manufacturing" },
            { value: "Consulting", label: "Consulting" },
            { value: "Retail", label: "Retail" },
            { value: "Other", label: "Other" },
        ],
        helpKey: "help.sector",
        width: "half",
    },
    employeeCount: {
        labelKey: "sections.employer.employeeCount",
        type: "select",
        placeholder: t("placeholders.employeeCount"),
        options: [
            { value: "1-10", label: t("formOptions.employeeCount.range1") },
            {
                value: "11-50",
                label: t("formOptions.employeeCount.range2"),
            },
            {
                value: "51-200",
                label: t("formOptions.employeeCount.range3"),
            },
            {
                value: "201-500",
                label: t("formOptions.employeeCount.range4"),
            },
            {
                value: "501-1000",
                label: t("formOptions.employeeCount.range5"),
            },
            {
                value: "1000+",
                label: t("formOptions.employeeCount.range6"),
            },
        ],
        helpKey: "help.employeeCount",
        width: "half",
    },
    multinational: {
        labelKey: "sections.employer.multinational",
        type: "boolean",
        options: [
            { value: "yes", label: t("options.yes") },
            { value: "no", label: t("options.no") },
        ],
        helpKey: "help.multinational",
    },
    jobTitle: {
        labelKey: "sections.job.jobTitle",
        type: "text",
        placeholder: t("placeholders.jobTitle"),
        helpKey: "help.jobTitle",
        width: "half",
    },
    seniority: {
        labelKey: "sections.job.seniority",
        type: "number",
        placeholder: t("placeholders.seniority"),
        helpKey: "help.seniority",
        width: "half",
    },
    jobDescription: {
        labelKey: "sections.job.jobDescription",
        type: "textarea",
        placeholder: t("placeholders.jobDescription"),
        helpKey: "help.jobDescription",
    },
    officialHours: {
        labelKey: "sections.workingHours.officialHours",
        type: "number",
        placeholder: t("placeholders.officialHours"),
        helpKey: "help.officialHours",
        width: "half",
    },
    averageHours: {
        labelKey: "sections.workingHours.averageHours",
        type: "number",
        placeholder: t("placeholders.averageHours"),
        helpKey: "help.averageHours",
        width: "half",
    },
    shiftDescription: {
        labelKey: "sections.workingHours.shiftDescription",
        type: "text",
        placeholder: t("placeholders.shiftDescription"),
        helpKey: "help.shiftDescription",
        width: "half",
    },
    onCall: {
        labelKey: "sections.workingHours.onCall",
        type: "text",
        placeholder: t("placeholders.onCall"),
        helpKey: "help.onCall",
        width: "half",
    },
    vacationDays: {
        labelKey: "sections.vacation.vacationDays",
        type: "number",
        placeholder: t("placeholders.vacationDays"),
        helpKey: "help.vacationDays",
    },
    grossSalary: {
        labelKey: "sections.salary.grossSalary",
        type: "number",
        placeholder: t("placeholders.grossSalary"),
        helpKey: "help.grossSalary",
        width: "third",
    },
    netSalary: {
        labelKey: "sections.salary.netSalary",
        type: "number",
        placeholder: t("placeholders.netSalary"),
        helpKey: "help.netSalary",
        width: "third",
    },
    netCompensation: {
        labelKey: "sections.salary.netCompensation",
        type: "number",
        placeholder: t("placeholders.netCompensation"),
        helpKey: "help.netCompensation",
        width: "third",
    },
    mobility: {
        labelKey: "sections.mobility.mobility",
        type: "text",
        placeholder: t("placeholders.mobility"),
        helpKey: "help.mobility",
    },
    thirteenthMonth: {
        labelKey: "sections.benefits.thirteenthMonth",
        type: "select",
        placeholder: t("placeholders.thirteenthMonth"),
        options: [
            { value: "Full", label: t("formOptions.thirteenthMonth.full") },
            {
                value: "Partial",
                label: t("formOptions.thirteenthMonth.partial"),
            },
            { value: "None", label: t("formOptions.thirteenthMonth.none") },
        ],
        helpKey: "help.thirteenthMonth",
        width: "third",
    },
    mealVouchers: {
        labelKey: "sections.benefits.mealVouchers",
        type: "number",
        placeholder: t("placeholders.mealVouchers"),
        helpKey: "help.mealVouchers",
        width: "third",
    },
    ecoCheques: {
        labelKey: "sections.benefits.ecoCheques",
        type: "number",
        placeholder: t("placeholders.ecoCheques"),
        helpKey: "help.ecoCheques",
        width: "third",
    },
    groupInsurance: {
        labelKey: "sections.benefits.groupInsurance",
        type: "text",
        placeholder: t("placeholders.groupInsurance"),
        helpKey: "help.groupInsurance",
        width: "half",
    },
    otherInsurances: {
        labelKey: "sections.benefits.otherInsurances",
        type: "text",
        placeholder: t("placeholders.otherInsurances"),
        helpKey: "help.otherInsurances",
        width: "half",
    },
    otherBenefits: {
        labelKey: "sections.benefits.otherBenefits",
        type: "textarea",
        placeholder: t("sections.benefits.otherBenefitsPlaceholder"),
        helpKey: "help.otherBenefits",
    },
    workCity: {
        labelKey: "sections.commute.workCity",
        type: "text",
        placeholder: t("placeholders.workCity"),
        helpKey: "help.workCity",
        width: "half",
    },
    commuteDistance: {
        labelKey: "sections.commute.commuteDistance",
        type: "text",
        placeholder: t("placeholders.commuteDistance"),
        helpKey: "help.commuteDistance",
        width: "half",
    },
    commuteMethod: {
        labelKey: "sections.commute.commuteMethod",
        type: "text",
        placeholder: t("placeholders.commuteMethod"),
        helpKey: "help.commuteMethod",
        width: "half",
    },
    commuteCompensation: {
        labelKey: "sections.commute.commuteCompensation",
        type: "text",
        placeholder: t("placeholders.commuteCompensation"),
        helpKey: "help.commuteCompensation",
        width: "half",
    },
    teleworkDays: {
        labelKey: "sections.workLife.teleworkDays",
        type: "number",
        placeholder: t("placeholders.teleworkDays"),
        helpKey: "help.teleworkDays",
        width: "half",
    },
    dayOffEase: {
        labelKey: "sections.workLife.dayOffEase",
        type: "text",
        placeholder: t("placeholders.dayOffEase"),
        helpKey: "help.dayOffEase",
        width: "half",
    },
    stressLevel: {
        labelKey: "sections.workLife.stressLevel",
        type: "text",
        placeholder: t("placeholders.stressLevel"),
        helpKey: "help.stressLevel",
        width: "half",
    },
    reports: {
        labelKey: "sections.workLife.reports",
        type: "number",
        placeholder: t("placeholders.reports"),
        helpKey: "help.reports",
        width: "half",
    },
    extraNotes: {
        labelKey: "sections.notes.extraNotes",
        type: "richtext",
        placeholder: t("placeholders.extraNotes"),
        helpKey: "help.extraNotes",
        width: "full",
    },
});

// Define which fields are available for each country
export const COUNTRY_FIELD_CONFIGS: Record<string, string[]> = {
    Belgium: [
        "age",
        "education",
        "workExperience",
        "civilStatus",
        "dependents",
        "sector",
        "employeeCount",
        "multinational",
        "jobTitle",
        "seniority",
        "jobDescription",
        "officialHours",
        "averageHours",
        "shiftDescription",
        "onCall",
        "vacationDays",
        "grossSalary",
        "netSalary",
        "netCompensation",
        "mobility",
        "thirteenthMonth",
        "mealVouchers",
        "ecoCheques",
        "groupInsurance",
        "otherInsurances",
        "otherBenefits",
        "workCity",
        "commuteDistance",
        "commuteMethod",
        "commuteCompensation",
        "teleworkDays",
        "dayOffEase",
        "stressLevel",
        "reports",
        "extraNotes",
    ],
};

// Helper function to get field configs for a specific country
export const getFieldConfigsForCountry = (
    country: string,
    allFieldConfigs: FieldConfigs,
): FieldConfigs => {
    const allowedFields = COUNTRY_FIELD_CONFIGS[country];
    if (!allowedFields) {
        return allFieldConfigs; // Return all configs if country not found
    }

    // Filter to only include fields allowed for this country
    return Object.keys(allFieldConfigs)
        .filter((key) => allowedFields.includes(key))
        .reduce((obj, key) => {
            obj[key] = allFieldConfigs[key];
            return obj;
        }, {} as FieldConfigs);
};
