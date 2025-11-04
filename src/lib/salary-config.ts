import { SubredditConfig } from "@/types/config";

export const SUBREDDIT_CONFIGS: Record<string, SubredditConfig> = {
    "BESalary": {
        country: "Belgium",
        currency: "EUR",
        templateSections: [
            "1. PERSONALIA",
            "2. EMPLOYER PROFILE",
            "3. JOB PROFILE",
            "4. WORKING HOURS",
            "5. VACATION",
            "6. SALARY",
            "7. BENEFITS",
            "8. COMMUTE",
            "10. WORK-LIFE BALANCE",
        ],
        fieldMappings: {
            age: /Age:\s*(\d+)/,
            education: /Education:\s*(.+?)(?=\n|$)/,
            workExperience: /Work experience:\s*(\d+)/,
            civilStatus: /Civil status:\s*(.+?)(?=\n|$)/,
            dependents: /Dependents:\s*(\d+)/,
            sector: /Sector:\s*(.+?)(?=\n|$)/,
            employeeCount: /Employee count:\s*(\d+)/,
            multinational: /Multinational:\s*(.+?)(?=\n|$)/,
            jobTitle: /Job title:\s*(.+?)(?=\n|$)/,
            jobDescription: /Job description:\s*(.+?)(?=\n|$)/,
            seniority: /Seniority:\s*(\d+)/,
            officialHours: /Official hours per week:\s*(\d+)/,
            averageHours: /Average hours per week:\s*(\d+)/,
            shiftDescription: /Shift description:\s*(.+?)(?=\n|$)/,
            onCall: /On-call:\s*(.+?)(?=\n|$)/,
            vacationDays: /Vacation days per year:\s*(\d+)/,
            grossSalary: /Gross salary per month:\s*([\d.,]+)/,
            netSalary: /Net salary per month:\s*([\d.,]+)/,
            netCompensation: /Net compensation per month:\s*([\d.,]+)/,
            thirteenthMonth: /13th month:\s*(.+?)(?=\n|$)/,
            mealVouchers: /Meal vouchers per month:\s*([\d.,]+)/,
            ecoCheques: /Eco-cheques per year:\s*([\d.,]+)/,
            groupInsurance: /Group insurance:\s*(.+?)(?=\n|$)/,
            otherInsurances: /Other insurances:\s*(.+?)(?=\n|$)/,
            otherBenefits: /Other benefits:\s*(.+?)(?=\n|$)/,
            workCity: /Work city:\s*(.+?)(?=\n|$)/,
            commuteDistance: /Commute distance:\s*(.+?)(?=\n|$)/,
            commuteMethod: /Commute method:\s*(.+?)(?=\n|$)/,
            commuteCompensation: /Commute compensation:\s*(.+?)(?=\n|$)/,
            teleworkDays: /Telework days per week:\s*(\d+)/,
            dayOffEase: /Ease of taking a day off:\s*(.+?)(?=\n|$)/,
            stressLevel: /Stress level:\s*(.+?)(?=\n|$)/,
            reports: /Reports:\s*(\d+)/,
        },
    },
};

export const getAllCountries = (): string[] => {
    return Array.from(
        new Set(
            Object.values(SUBREDDIT_CONFIGS).map((config) => config.country),
        ),
    );
};

export interface FormSection {
    title: string;
    description: string;
    fields: string[];
}

export interface CountryFormConfig {
    sections: FormSection[];
}

export const COUNTRY_FORM_CONFIGS: Record<string, CountryFormConfig> = {
    Belgium: {
        sections: [
            {
                title: "Personal Information",
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
                title: "Employer Profile",
                description: "Information about your employer",
                fields: ["sector", "employeeCount", "multinational"],
            },
            {
                title: "Job Profile",
                description: "Details about your job position",
                fields: ["jobTitle", "seniority", "jobDescription"],
            },
            {
                title: "Working Hours",
                description: "Your working schedule and hours",
                fields: [
                    "officialHours",
                    "averageHours",
                    "shiftDescription",
                    "onCall",
                ],
            },
            {
                title: "Salary",
                description: "Your compensation details",
                fields: ["grossSalary", "netSalary", "netCompensation"],
            },
            {
                title: "Benefits",
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
                title: "Commute",
                description: "Your daily commute details",
                fields: [
                    "workCity",
                    "commuteDistance",
                    "commuteMethod",
                    "commuteCompensation",
                ],
            },
            {
                title: "Work-Life Balance",
                description: "Work-life balance assessment",
                fields: [
                    "teleworkDays",
                    "vacationDays",
                    "reports",
                    "dayOffEase",
                    "stressLevel",
                ],
            },
            {
                title: "Additional Notes",
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
