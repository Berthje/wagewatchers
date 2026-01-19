import { z } from "zod";

/**
 * Salary Entry Form Validation Schema
 * Comprehensive validation for manual salary entry submissions
 */

// Custom URL validation - checks for common URL patterns
const noUrls = (fieldName: string) =>
  z.string().refine(
    (value) => {
      if (!value) return true; // Allow empty strings
      return !z.url().safeParse(value).success;
    },
    {
      message: `URLs are not allowed in ${fieldName}`,
    }
  );

export const createSalaryEntrySchema = (t: (key: string) => string) => {
  return z.preprocess(
    (data: any) => {
      // Trim all string fields
      const trimmedData = { ...data };
      for (const key of Object.keys(trimmedData)) {
        if (typeof trimmedData[key] === "string") {
          trimmedData[key] = trimmedData[key].trim();
        }
      }
      return trimmedData;
    },
    z
      .object({
        // Country (Required)
        country: z.string().min(1, { message: t("validation.countryRequired") }),

        // Personal Information
        age: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(18, { message: t("validation.ageMin") })
          .max(100, { message: t("validation.ageMax") }),
        education: z
          .string()
          .min(1, { message: t("validation.educationRequired") })
          .max(200),
        workExperience: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(0)
          .max(82, { message: t("validation.workExperienceMax") }),
        civilStatus: z.string().min(1, { message: t("validation.civilStatusRequired") }),
        dependents: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(0)
          .max(20, { message: t("validation.dependentsMax") }),

        // Employer Profile
        sector: z.string().min(1, { message: t("validation.sectorRequired") }),
        employeeCount: z.string().min(1, { message: t("validation.employeeCountRequired") }),
        multinational: z.boolean(),

        // Job Profile
        jobTitle: noUrls("job title")
          .min(1, { message: t("validation.jobTitleRequired") })
          .max(200, { message: t("validation.jobTitleMax") }),
        jobDescription: noUrls("job description")
          .max(5000, { message: t("validation.jobDescriptionMax") })
          .optional(),
        seniority: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(0)
          .max(50, { message: t("validation.seniorityMax") }),

        // Working Hours
        officialHours: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(1, { message: t("validation.hoursMin") })
          .max(80, { message: t("validation.hoursMax") }),
        averageHours: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(1, { message: t("validation.hoursMin") })
          .max(80, { message: t("validation.hoursMax") }),
        shiftDescription: noUrls("shift description")
          .max(1000, { message: t("validation.shiftDescriptionMax") })
          .optional(),
        onCall: z.string().optional(),
        // Vacation
        vacationDays: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(0)
          .max(365, { message: t("validation.vacationDaysMax") }),

        // Salary & Currency
        currency: z.string().min(1, { message: t("validation.currencyRequired") }),
        grossSalary: z.union([
          z.number().positive({ message: t("validation.grossSalaryPositive") }),
          z.string(),
        ]),
        netSalary: z.union([
          z.number().positive({ message: t("validation.grossSalaryPositive") }),
          z.string(),
        ]),
        netCompensation: z.union([z.number().min(0), z.string()]),

        // Benefits
        thirteenthMonth: z.string().min(1, { message: t("validation.thirteenthMonthRequired") }),
        mealVouchers: z.union([
          z
            .number()
            .min(0)
            .max(12, { message: t("validation.mealVouchersMax") }),
          z.string(),
        ]),
        ecoCheques: z.union([
          z
            .number()
            .min(0)
            .max(10000, { message: t("validation.ecoChequesMax") }),
          z.string(),
        ]),
        groupInsurance: z.string().min(1, { message: t("validation.groupInsuranceRequired") }),
        otherInsurances: noUrls("other insurances")
          .max(2000, { message: t("validation.otherInsurancesMax") })
          .optional(),
        otherBenefits: noUrls("other benefits")
          .max(2000, { message: t("validation.otherBenefitsMax") })
          .optional(),
        // Commute
        workCity: z
          .string()
          .max(200, { message: t("validation.workCityMax") })
          .optional(),
        commuteDistance: z
          .string()
          .min(1, { message: t("validation.commuteDistanceRequired") })
          .max(50, { message: t("validation.commuteDistanceMax") })
          .refine(
            (val) => {
              // Allow single numbers or ranges like "10-30"
              const rangeRegex = /^\d+(\.\d+)?-\d+(\.\d+)?$/;
              const singleRegex = /^\d+(\.\d+)?$/;
              return rangeRegex.test(val) || singleRegex.test(val);
            },
            { message: t("validation.commuteDistanceFormat") }
          ),
        commuteMethod: z.string().min(1, { message: t("validation.commuteMethodRequired") }),
        commuteCompensation: noUrls("commute compensation")
          .min(1, { message: t("validation.commuteCompensationRequired") })
          .max(1000, { message: t("validation.commuteCompensationMax") }),
        // Work-Life Balance
        teleworkDays: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(0)
          .max(7, { message: t("validation.teleworkMax") }),
        dayOffEase: z.string().min(1, { message: t("validation.dayOffEaseRequired") }),
        stressLevel: z.string().min(1, { message: t("validation.stressLevelRequired") }),
        reports: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(0)
          .max(1000, { message: t("validation.reportsMax") }),

        // Additional
        sourceUrl: z.string().optional(),
        extraNotes: noUrls("extra notes")
          .max(5000, { message: t("validation.extraNotesMax") })
          .optional(),

        // Validation
        honestyConfirmation: z.boolean().refine((val) => val === true, {
          message: t("validation.honestyRequired"),
        }),
      })
      .refine(
        (data) => {
          // At least one salary field is required
          const hasGross = data.grossSalary !== undefined && data.grossSalary !== "";
          const hasNet = data.netSalary !== undefined && data.netSalary !== "";
          const hasNetComp = data.netCompensation !== undefined && data.netCompensation !== "";
          return hasGross || hasNet || hasNetComp;
        },
        {
          message: t("validation.atLeastOneSalary"),
          path: ["grossSalary"], // Show error on first salary field
        }
      )
      .refine(
        (data) => {
          // Work experience cannot exceed years since age 18
          if (data.age && data.workExperience) {
            const maxPossibleExperience = data.age - 18;
            return data.workExperience <= maxPossibleExperience;
          }
          return true;
        },
        {
          message: t("validation.workExperienceVsAge"),
          path: ["workExperience"],
        }
      )
      .refine(
        (data) => {
          // Seniority cannot exceed total work experience
          if (data.seniority && data.workExperience) {
            return data.seniority <= data.workExperience;
          }
          return true;
        },
        {
          message: t("validation.seniorityVsExperience"),
          path: ["seniority"],
        }
      )
  );
};

export type SalaryEntryFormData = z.infer<ReturnType<typeof createSalaryEntrySchema>>;
