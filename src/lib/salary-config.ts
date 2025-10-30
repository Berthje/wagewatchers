export interface SubredditConfig {
    country: string;
    currency: string;
    templateSections: string[];
    fieldMappings: Record<string, RegExp>;
}

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
            "7. MOBILITY",
            "8. BENEFITS",
            "9. COMMUTE",
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
            mobility: /Mobility:\s*(.+?)(?=\n|$)/,
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

export const getConfigForSubreddit = (
    subreddit: string,
): SubredditConfig | null => {
    return SUBREDDIT_CONFIGS[subreddit] || null;
};

export const getAllCountries = (): string[] => {
    return Array.from(
        new Set(
            Object.values(SUBREDDIT_CONFIGS).map((config) => config.country),
        ),
    );
};

export const getSubredditsForCountry = (country: string): string[] => {
    return Object.entries(SUBREDDIT_CONFIGS)
        .filter(([, config]) => config.country === country)
        .map(([subreddit]) => subreddit);
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
                title: "6. Vacation",
                description: "Vacation and time off information",
                fields: ["vacationDays"],
            },
            {
                title: "7. Salary",
                description: "Your compensation details",
                fields: ["grossSalary", "netSalary", "netCompensation"],
            },
            {
                title: "8. Mobility",
                description: "Job mobility requirements",
                fields: ["mobility"],
            },
            {
                title: "9. Benefits",
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
    Netherlands: {
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
                title: "6. Vacation",
                description: "Vacation and time off information",
                fields: ["vacationDays"],
            },
            {
                title: "7. Salary",
                description: "Your compensation details",
                fields: ["grossSalary", "netSalary", "netCompensation"],
            },
            {
                title: "8. Mobility",
                description: "Job mobility requirements",
                fields: ["mobility"],
            },
            {
                title: "9. Benefits",
                description: "Additional benefits and perks",
                fields: [
                    "thirteenthMonth",
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
    Spain: {
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
                title: "6. Vacation",
                description: "Vacation and time off information",
                fields: ["vacationDays"],
            },
            {
                title: "7. Salary",
                description: "Your compensation details",
                fields: ["grossSalary", "netSalary", "netCompensation"],
            },
            {
                title: "8. Mobility",
                description: "Job mobility requirements",
                fields: ["mobility"],
            },
            {
                title: "9. Benefits",
                description: "Additional benefits and perks",
                fields: [
                    "thirteenthMonth",
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
