/**
 * Country Form Configuration
 * Defines form sections and fields per country
 */

import { CountryFormConfig } from "@/types/config";

export const COUNTRY_FORM_CONFIGS: Record<string, CountryFormConfig> = {
    Belgium: {
        sections: [
            {
                title: "2. Personal Information",
                description: "Basic personal details",
                fields: [
                    "age",
                    "education",
                    "workExperience",
                    "civilStatus",
                    "dependents",
                ],
            },
            {
                title: "3. Employer Profile",
                description: "Information about your employer",
                fields: ["sector", "employeeCount", "multinational"],
            },
            {
                title: "4. Job Profile",
                description: "Details about your job position",
                fields: ["jobTitle", "seniority", "jobDescription"],
            },
            {
                title: "5. Working Hours",
                description: "Your working schedule and hours",
                fields: [
                    "officialHours",
                    "averageHours",
                    "shiftDescription",
                    "onCall",
                ],
            },
            {
                title: "6. Salary",
                description: "Your compensation details",
                fields: ["grossSalary", "netSalary", "netCompensation"],
            },
            {
                title: "7. Mobility",
                description: "Job mobility requirements",
                fields: ["mobility"],
            },
            {
                title: "8. Benefits",
                description: "Additional benefits and perks",
                fields: [
                    "thirteenthMonth",
                    "mealVouchers",
                    "ecoCheques",
                    "groupInsurance",
                    "otherInsurances",
                    "otherBenefits",
                ],
            },
            {
                title: "10. Commute",
                description: "Your daily commute details",
                fields: [
                    "workCity",
                    "commuteDistance",
                    "commuteMethod",
                    "commuteCompensation",
                ],
            },
            {
                title: "11. Work-Life Balance",
                description: "Work-life balance assessment",
                fields: [
                    "teleworkDays",
                    "dayOffEase",
                    "stressLevel",
                    "reports",
                ],
            },
            {
                title: "12. Additional Notes",
                description: "Optional notes for this entry",
                fields: ["extraNotes"],
            },
        ],
    },
};

export const getFormConfigForCountry = (
    country: string,
): CountryFormConfig | null => {
    return COUNTRY_FORM_CONFIGS[country] || null;
};

// Helper to get all fields that should be displayed for a country
export const getCountryFields = (country: string): Set<string> => {
    const config = getFormConfigForCountry(country);
    if (!config) return new Set();

    const fields = new Set<string>();
    config.sections.forEach((section) => {
        section.fields.forEach((field) => fields.add(field));
    });
    return fields;
};

// Helper to check if a field should be displayed for a country
export const shouldDisplayField = (
    country: string,
    fieldName: string,
): boolean => {
    const fields = getCountryFields(country);
    return fields.has(fieldName);
};
