export interface FieldConfig {
    labelKey: string;
    type:
    | "text"
    | "number"
    | "select"
    | "textarea"
    | "boolean"
    | "combobox"
    | "richtext";
    placeholder?: string;
    options?: { value: string; label: string }[];
    allowCustom?: boolean;
    helpKey?: string;
    width?: "full" | "half" | "third";
    optional?: boolean;
}

export type FieldConfigs = Record<string, FieldConfig>;

// Field configurations function generator that accepts translation function
export const createFieldConfigs = (
    t: (key: string) => string,
): FieldConfigs => ({
    age: {
        labelKey: "sections.personal.age",
        type: "number",
        placeholder: "e.g. 30",
        helpKey: "help.age",
        width: "half",
    },
    education: {
        labelKey: "sections.personal.education",
        type: "combobox",
        placeholder: "Select or enter education level",
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
        placeholder: "e.g. 5",
        helpKey: "help.workExperience",
        width: "half",
    },
    civilStatus: {
        labelKey: "sections.personal.civilStatus",
        type: "select",
        options: [
            { value: "single", label: t("formOptions.civilStatus.single") },
            { value: "cohabiting", label: t("formOptions.civilStatus.cohabiting") },
            { value: "civilUnion", label: t("formOptions.civilStatus.civilUnion") },
            { value: "married", label: t("formOptions.civilStatus.married") },
            { value: "divorced", label: t("formOptions.civilStatus.divorced") },
            { value: "widowed", label: t("formOptions.civilStatus.widowed") },
        ],
        helpKey: "help.civilStatus",
        width: "half",
    },
    dependents: {
        labelKey: "sections.personal.dependents",
        type: "number",
        placeholder: "e.g. 2",
        helpKey: "help.dependents",
        width: "full",
    },
    sector: {
        labelKey: "sections.employer.sector",
        type: "select",
        options: [
            { value: "IT", label: t("formOptions.sector.IT") },
            { value: "Finance", label: t("formOptions.sector.Finance") },
            { value: "Healthcare", label: t("formOptions.sector.Healthcare") },
            { value: "Pharmaceutical", label: t("formOptions.sector.Pharmaceutical") },
            { value: "Education", label: t("formOptions.sector.Education") },
            { value: "Manufacturing", label: t("formOptions.sector.Manufacturing") },
            { value: "Energy", label: t("formOptions.sector.Energy") },
            { value: "Consulting", label: t("formOptions.sector.Consulting") },
            { value: "Retail", label: t("formOptions.sector.Retail") },
            { value: "Public Sector", label: t("formOptions.sector.Public Sector") },
            { value: "Public Affairs", label: t("formOptions.sector.Public Affairs") },
            { value: "Transportation", label: t("formOptions.sector.Transportation") },
            { value: "Construction", label: t("formOptions.sector.Construction") },
            { value: "Telecommunications", label: t("formOptions.sector.Telecommunications") },
            { value: "Media", label: t("formOptions.sector.Media") },
            { value: "Hospitality", label: t("formOptions.sector.Hospitality") },
            { value: "Legal", label: t("formOptions.sector.Legal") },
            { value: "Research", label: t("formOptions.sector.Research") },
            { value: "Nonprofit", label: t("formOptions.sector.Nonprofit") },
            { value: "Agriculture", label: t("formOptions.sector.Agriculture") },
            { value: "Automotive", label: t("formOptions.sector.Automotive") },
            { value: "Aerospace", label: t("formOptions.sector.Aerospace") },
            { value: "RealEstate", label: t("formOptions.sector.RealEstate") },
            { value: "Entertainment", label: t("formOptions.sector.Entertainment") },
            { value: "Biotech", label: t("formOptions.sector.Biotech") },
            { value: "Other", label: t("formOptions.sector.Other") },
        ],
        helpKey: "help.sector",
        width: "half",
    },
    employeeCount: {
        labelKey: "sections.employer.employeeCount",
        type: "select",
        placeholder: "Select employee count range",
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
        placeholder: "e.g. Software Engineer",
        helpKey: "help.jobTitle",
        width: "half",
    },
    seniority: {
        labelKey: "sections.job.seniority",
        type: "number",
        placeholder: "e.g. 3",
        helpKey: "help.seniority",
        width: "half",
    },
    jobDescription: {
        labelKey: "sections.job.jobDescription",
        type: "textarea",
        placeholder: "Describe your job responsibilities",
        helpKey: "help.jobDescription",
        optional: true,
    },
    officialHours: {
        labelKey: "sections.workingHours.officialHours",
        type: "number",
        placeholder: "e.g. 40",
        helpKey: "help.officialHours",
        width: "half",
    },
    averageHours: {
        labelKey: "sections.workingHours.averageHours",
        type: "number",
        placeholder: "e.g. 45",
        helpKey: "help.averageHours",
        width: "half",
    },
    shiftDescription: {
        labelKey: "sections.workingHours.shiftDescription",
        type: "text",
        placeholder: "e.g. Standard office hours",
        helpKey: "help.shiftDescription",
        width: "half",
        optional: true,
    },
    onCall: {
        labelKey: "sections.workingHours.onCall",
        type: "text",
        placeholder: "e.g. Occasionally",
        helpKey: "help.onCall",
        width: "half",
        optional: true,
    },
    vacationDays: {
        labelKey: "sections.vacation.vacationDays",
        type: "number",
        placeholder: "e.g. 25",
        helpKey: "help.vacationDays",
        width: "third"
    },
    grossSalary: {
        labelKey: "sections.salary.grossSalary",
        type: "number",
        placeholder: "e.g. 5000",
        helpKey: "help.grossSalary",
        width: "third",
    },
    netSalary: {
        labelKey: "sections.salary.netSalary",
        type: "number",
        placeholder: "e.g. 3500",
        helpKey: "help.netSalary",
        width: "third",
    },
    netCompensation: {
        labelKey: "sections.salary.netCompensation",
        type: "number",
        placeholder: "e.g. 150",
        helpKey: "help.netCompensation",
        width: "third",
    },
    mobility: {
        labelKey: "sections.mobility.mobility",
        type: "text",
        placeholder: "e.g. Home office possible",
        helpKey: "help.mobility",
    },
    thirteenthMonth: {
        labelKey: "sections.benefits.thirteenthMonth",
        type: "select",
        placeholder: "Select 13th month option",
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
        placeholder: "e.g. 12",
        helpKey: "help.mealVouchers",
        width: "third",
    },
    ecoCheques: {
        labelKey: "sections.benefits.ecoCheques",
        type: "number",
        placeholder: "e.g. 250",
        helpKey: "help.ecoCheques",
        width: "third",
    },
    groupInsurance: {
        labelKey: "sections.benefits.groupInsurance",
        type: "text",
        placeholder: "e.g. Yes, comprehensive",
        helpKey: "help.groupInsurance",
        width: "half",
    },
    otherInsurances: {
        labelKey: "sections.benefits.otherInsurances",
        type: "text",
        placeholder: "e.g. Health insurance",
        helpKey: "help.otherInsurances",
        width: "half",
        optional: true,
    },
    otherBenefits: {
        labelKey: "sections.benefits.otherBenefits",
        type: "textarea",
        placeholder: t("sections.benefits.otherBenefitsPlaceholder"),
        helpKey: "help.otherBenefits",
        optional: true,
    },
    workCity: {
        labelKey: "sections.commute.workCity",
        type: "text",
        placeholder: "e.g. Brussels",
        helpKey: "help.workCity",
        width: "half",
        optional: true,
    },
    commuteDistance: {
        labelKey: "sections.commute.commuteDistance",
        type: "text",
        placeholder: "e.g. 15 km",
        helpKey: "help.commuteDistance",
        width: "half",
    },
    commuteMethod: {
        labelKey: "sections.commute.commuteMethod",
        type: "text",
        placeholder: "e.g. Car, Public transport",
        helpKey: "help.commuteMethod",
        width: "half",
    },
    commuteCompensation: {
        labelKey: "sections.commute.commuteCompensation",
        type: "text",
        placeholder: "e.g. Fuel allowance",
        helpKey: "help.commuteCompensation",
        width: "half",
    },
    teleworkDays: {
        labelKey: "sections.workLife.teleworkDays",
        type: "number",
        placeholder: "e.g. 2",
        helpKey: "help.teleworkDays",
        width: "third",
    },
    dayOffEase: {
        labelKey: "sections.workLife.dayOffEase",
        type: "select",
        placeholder: "Select ease of taking a day off",
        options: [
            { value: "veryEasy", label: t("formOptions.dayOffEase.veryEasy") },
            { value: "easy", label: t("formOptions.dayOffEase.easy") },
            { value: "moderate", label: t("formOptions.dayOffEase.moderate") },
            { value: "hard", label: t("formOptions.dayOffEase.hard") },
            { value: "veryHard", label: t("formOptions.dayOffEase.veryHard") },
            { value: "situational", label: t("formOptions.dayOffEase.situational") },
            { value: "impossible", label: t("formOptions.dayOffEase.impossible") },
        ],
        helpKey: "help.dayOffEase",
        width: "half",
    },
    stressLevel: {
        labelKey: "sections.workLife.stressLevel",
        type: "select",
        placeholder: "Select stress level",
        options: [
            { value: "veryLow", label: t("formOptions.stressLevel.veryLow") },
            { value: "low", label: t("formOptions.stressLevel.low") },
            { value: "moderate", label: t("formOptions.stressLevel.moderate") },
            { value: "high", label: t("formOptions.stressLevel.high") },
            { value: "veryHigh", label: t("formOptions.stressLevel.veryHigh") },
            { value: "situational", label: t("formOptions.stressLevel.situational") },
            { value: "none", label: t("formOptions.stressLevel.none") },
        ],
        helpKey: "help.stressLevel",
        width: "half",
    },
    reports: {
        labelKey: "sections.workLife.reports",
        type: "number",
        placeholder: "e.g. 5",
        helpKey: "help.reports",
        width: "third",
    },
    extraNotes: {
        labelKey: "sections.notes.extraNotes",
        type: "richtext",
        placeholder: "Add any additional notes about this salary entry...",
        helpKey: "help.extraNotes",
        width: "full",
        optional: true,
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
        "vacationDays",
        "reports",
        "dayOffEase",
        "stressLevel",
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
