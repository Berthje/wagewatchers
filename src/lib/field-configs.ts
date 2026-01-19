export interface FieldConfig {
  labelKey: string;
  type: "text" | "number" | "select" | "textarea" | "boolean" | "combobox" | "richtext";
  placeholder?: string;
  options?: { value: string; label: string }[];
  allowCustom?: boolean;
  helpKey?: string;
  width?: "full" | "half" | "third";
  optional?: boolean;
}

export type FieldConfigs = Record<string, FieldConfig>;

// Field configurations function generator that accepts translation function
export const createFieldConfigs = (t: (key: string) => string): FieldConfigs => ({
  age: {
    labelKey: "sections.personal.age",
    type: "number",
    placeholder: t("placeholders.age"),
    helpKey: "help.age",
    width: "half",
  },
  education: {
    labelKey: "sections.personal.education",
    type: "select",
    placeholder: t("placeholders.education"),
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
    placeholder: t("placeholders.civilStatus"),
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
    placeholder: t("placeholders.dependents"),
    helpKey: "help.dependents",
    width: "full",
  },
  sector: {
    labelKey: "sections.employer.sector",
    type: "select",
    placeholder: t("placeholders.sector"),
    options: [
      { value: "Aerospace", label: t("formOptions.sector.Aerospace") },
      { value: "Agriculture", label: t("formOptions.sector.Agriculture") },
      { value: "Automotive", label: t("formOptions.sector.Automotive") },
      { value: "Biotech", label: t("formOptions.sector.Biotech") },
      { value: "Construction", label: t("formOptions.sector.Construction") },
      { value: "Consulting", label: t("formOptions.sector.Consulting") },
      { value: "Education", label: t("formOptions.sector.Education") },
      { value: "Energy", label: t("formOptions.sector.Energy") },
      { value: "Entertainment", label: t("formOptions.sector.Entertainment") },
      { value: "Finance", label: t("formOptions.sector.Finance") },
      { value: "FMCG", label: t("formOptions.sector.FMCG") },
      { value: "Healthcare", label: t("formOptions.sector.Healthcare") },
      { value: "Hospitality", label: t("formOptions.sector.Hospitality") },
      { value: "HR", label: t("formOptions.sector.HR") },
      { value: "IT", label: t("formOptions.sector.IT") },
      { value: "Legal", label: t("formOptions.sector.Legal") },
      { value: "Manufacturing", label: t("formOptions.sector.Manufacturing") },
      { value: "Media", label: t("formOptions.sector.Media") },
      { value: "Nonprofit", label: t("formOptions.sector.Nonprofit") },
      { value: "Other", label: t("formOptions.sector.Other") },
      { value: "Pharmaceutical", label: t("formOptions.sector.Pharmaceutical") },
      { value: "Public Affairs", label: t("formOptions.sector.Public Affairs") },
      { value: "Public Sector", label: t("formOptions.sector.Public Sector") },
      { value: "RealEstate", label: t("formOptions.sector.RealEstate") },
      { value: "Research", label: t("formOptions.sector.Research") },
      { value: "Retail", label: t("formOptions.sector.Retail") },
      { value: "Telecommunications", label: t("formOptions.sector.Telecommunications") },
      { value: "Technology/SaaS", label: t("formOptions.sector.Technology/SaaS") },
      { value: "Transportation", label: t("formOptions.sector.Transportation") },
      { value: "Chemical", label: t("formOptions.sector.Chemical") },
      { value: "Logistics", label: t("formOptions.sector.Logistics") },
    ].sort((a, b) => a.label.localeCompare(b.label)),
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
    optional: true,
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
    optional: true,
  },
  onCall: {
    labelKey: "sections.workingHours.onCall",
    type: "text",
    placeholder: t("placeholders.onCall"),
    helpKey: "help.onCall",
    width: "half",
    optional: true,
  },
  vacationDays: {
    labelKey: "sections.vacation.vacationDays",
    type: "number",
    placeholder: t("placeholders.vacationDays"),
    helpKey: "help.vacationDays",
    width: "third",
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
    placeholder: t("placeholders.workCity"),
    helpKey: "help.workCity",
    width: "half",
    optional: true,
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
    width: "third",
  },
  dayOffEase: {
    labelKey: "sections.workLife.dayOffEase",
    type: "select",
    placeholder: t("placeholders.dayOffEase"),
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
    placeholder: t("placeholders.stressLevel"),
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
    placeholder: t("placeholders.reports"),
    helpKey: "help.reports",
    width: "third",
  },
  extraNotes: {
    labelKey: "sections.notes.extraNotes",
    type: "richtext",
    placeholder: t("placeholders.extraNotes"),
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
  allFieldConfigs: FieldConfigs
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
