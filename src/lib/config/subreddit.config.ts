/**
 * Subreddit Configuration
 * Configuration for Reddit scraping per country
 */

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
