// Field type definitions for parsing
export type FieldType = 'text' | 'integer' | 'currency' | 'boolean';

export interface FieldMapping {
  pattern: RegExp;
  type: FieldType;
  required?: boolean; // Critical fields that must be present
}

export interface SubredditConfig {
  country: string;
  currency: string;
  templateSections: string[];
  fieldMappings: Record<string, FieldMapping>;
}

export const SUBREDDIT_CONFIGS: Record<string, SubredditConfig> = {
  BESalary: {
    country: "Belgium",
    currency: "EUR",
    templateSections: [
      "1. PERSONALIA",
      "2. EMPLOYER PROFILE",
      "3. CONTRACT & CONDITIONS",
      "4. SALARY",
      "5. MOBILITY",
      "6. OTHER",
    ],
    fieldMappings: {
      // PERSONALIA
      age: { pattern: /Age:\s*(\d+)/i, type: 'integer' },
      education: { pattern: /Education:\s*(.+?)(?=\n\s*Work experience)/i, type: 'text' },
      workExperience: { pattern: /Work experience:\s*(\d+)/i, type: 'integer' },
      civilStatus: { pattern: /Civil status:\s*(.+?)(?=\n\s*Dependent)/i, type: 'text' },
      dependents: { pattern: /Dependent people\/children:\s*(\d+)/i, type: 'integer' },

      // EMPLOYER PROFILE
      sector: { pattern: /Sector\/Industry:\s*(.+?)(?=\n\s*Amount)/i, type: 'text' },
      employeeCount: { pattern: /Amount of employees:\s*(.+?)(?=\n\s*Multinational)/i, type: 'text' },
      multinational: { pattern: /Multinational\?:\s*(YES|NO)/i, type: 'boolean' },

      // CONTRACT & CONDITIONS
      jobTitle: { pattern: /Current job title:\s*(.+?)(?=\n\s*Job description)/i, type: 'text', required: true },
      jobDescription: { pattern: /Job description:\s*(.+?)(?=\n\s*Seniority)/i, type: 'text' },
      seniority: { pattern: /Seniority:\s*(\d+)/i, type: 'integer' },
      officialHours: { pattern: /Official hours\/week:\s*(\d+)/i, type: 'integer' },
      averageHours: { pattern: /Average real hours\/week incl\. overtime:\s*(\d+)/i, type: 'integer' },
      shiftDescription: { pattern: /Shiftwork or 9 to 5[^:]*:\s*(.+?)(?=\n\s*On-call)/i, type: 'text' },
      onCall: { pattern: /On-call duty:\s*(.+?)(?=\n\s*Vacation)/i, type: 'text' },
      vacationDays: { pattern: /Vacation days\/year:\s*(\d+)/i, type: 'integer' },

      // SALARY
      grossSalary: { pattern: /Gross salary\/month:\s*([\d.,]+)/i, type: 'currency', required: true },
      netSalary: { pattern: /Net salary\/month:\s*([\d.,]+)/i, type: 'currency' },
      netCompensation: { pattern: /Netto compensation:\s*([\d.,]+)/i, type: 'currency' },
      mobilityBudget: { pattern: /Car\/bike\/\.\.\. or mobility budget:\s*(.+?)(?=\n\s*13th month)/i, type: 'text' },
      thirteenthMonth: { pattern: /13th month[^:]*:\s*(.+?)(?=\n\s*Meal vouchers)/i, type: 'text' },
      mealVouchers: { pattern: /Meal vouchers:\s*([\d.,]+)/i, type: 'currency' },
      ecoCheques: { pattern: /Ecocheques:\s*([\d.,]+)/i, type: 'currency' },
      groupInsurance: { pattern: /Group insurance:\s*(.+?)(?=\n\s*Other insurances)/i, type: 'text' },
      otherInsurances: { pattern: /Other insurances:\s*(.+?)(?=\n\s*Other benefits)/i, type: 'text' },
      otherBenefits: { pattern: /Other benefits[^:]*:\s*(.+?)(?=\n\n|5\. MOBILITY)/i, type: 'text' },

      // MOBILITY
      workCity: { pattern: /City\/region of work:\s*(.+?)(?=\n\s*Distance)/i, type: 'text', required: true },
      commuteDistance: { pattern: /Distance home-work:\s*(.+?)(?=\n\s*How do you commute)/i, type: 'text' },
      commuteMethod: { pattern: /How do you commute\?:\s*(.+?)(?=\n\s*How is the travel)/i, type: 'text' },
      commuteCompensation: { pattern: /How is the travel[^:]*compensated:\s*(.+?)(?=\n\s*Telework)/i, type: 'text' },
      teleworkDays: { pattern: /Telework days\/week:\s*(\d+)/i, type: 'integer' },

      // OTHER
      dayOffEase: { pattern: /How easily can you plan a day off:\s*(.+?)(?=\n\s*Is your job)/i, type: 'text' },
      stressLevel: { pattern: /Is your job stressful\?:\s*(.+?)(?=\n\s*Responsible)/i, type: 'text' },
      reports: { pattern: /Responsible for personnel[^:]*:\s*(\d+)/i, type: 'integer' },
    },
  },
};

export const getAllCountries = (): string[] => {
  return Array.from(new Set(Object.values(SUBREDDIT_CONFIGS).map((config) => config.country)));
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
  "Belgium": {
    sections: [
      {
        title: "Personal Information",
        description: "Basic personal details",
        fields: ["age", "education", "workExperience", "civilStatus", "dependents"],
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
        fields: ["officialHours", "averageHours", "shiftDescription", "onCall"],
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
        fields: ["workCity", "commuteDistance", "commuteMethod", "commuteCompensation"],
      },
      {
        title: "Work-Life Balance",
        description: "Work-life balance assessment",
        fields: ["teleworkDays", "vacationDays", "reports", "dayOffEase", "stressLevel"],
      },
      {
        title: "Additional Notes",
        description: "Optional notes for this entry",
        fields: ["extraNotes"],
      },
    ],
  },
};

export const getFormConfigForCountry = (country: string): CountryFormConfig | null => {
  return COUNTRY_FORM_CONFIGS[country] || null;
};

// Helper to get all fields that should be displayed for a country
export const getCountryFields = (country: string): Set<string> => {
  const config = getFormConfigForCountry(country);
  if (!config) return new Set();

  const fields = new Set<string>();
  for (const section of config.sections) {
    for (const field of section.fields) {
      fields.add(field);
    }
  }
  return fields;
};

// Helper to check if a field should be displayed for a country
export const shouldDisplayField = (country: string, fieldName: string): boolean => {
  const fields = getCountryFields(country);
  return fields.has(fieldName);
};
