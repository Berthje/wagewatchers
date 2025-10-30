/**
 * Salary Entry Types
 * Domain models for salary data
 */

export interface BeSalaryTemplate {
    country?: string | null;
    subreddit?: string | null;
    age?: number | null;
    education?: string | null;
    workExperience?: number | null;
    civilStatus?: string | null;
    dependents?: number | null;
    sector?: string | null;
    employeeCount?: string | null;
    multinational?: boolean | null;
    jobTitle?: string | null;
    jobDescription?: string | null;
    seniority?: number | null;
    officialHours?: number | null;
    averageHours?: number | null;
    shiftDescription?: string | null;
    onCall?: string | null;
    vacationDays?: number | null;
    grossSalary?: number | null;
    netSalary?: number | null;
    netCompensation?: number | null;
    mobility?: string | null;
    thirteenthMonth?: string | null;
    mealVouchers?: number | null;
    ecoCheques?: number | null;
    groupInsurance?: string | null;
    otherInsurances?: string | null;
    otherBenefits?: string | null;
    workCity?: string | null;
    commuteDistance?: string | null;
    commuteMethod?: string | null;
    commuteCompensation?: string | null;
    teleworkDays?: number | null;
    dayOffEase?: string | null;
    stressLevel?: string | null;
    reports?: number | null;
    source?: string | null;
    [key: string]: any; // Allow dynamic field assignment
}
