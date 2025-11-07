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
      age: { pattern: /Age:\s*(.+?)(?=\n)/i, type: 'integer' },
      education: { pattern: /Education:\s*(.+?)(?=\n)/i, type: 'text' },
      workExperience: { pattern: /Work experience[^:]*:\s*(.+?)(?=\n)/i, type: 'integer' },
      civilStatus: { pattern: /Civil status:\s*(.+?)(?=\n)/i, type: 'text' },
      dependents: { pattern: /Dependent people\/children:\s*(.+?)(?=\n)/i, type: 'integer' },

      // EMPLOYER PROFILE
      sector: { pattern: /Sector\/Industry:\s*(.+?)(?=\n)/i, type: 'text' },
      employeeCount: { pattern: /Amount of employees:\s*(.+?)(?=\n)/i, type: 'text' },
      multinational: { pattern: /Multinational\?[\s:]*(.+?)(?=\n)/i, type: 'boolean' },

      // CONTRACT & CONDITIONS
      jobTitle: { pattern: /Current job title:\s*(.+?)(?=\n)/i, type: 'text', required: true },
      jobDescription: { pattern: /Job description:\s*(.+?)(?=\n)/i, type: 'text' },
      seniority: { pattern: /Seniority:\s*(.+?)(?=\n)/i, type: 'integer' },
      officialHours: { pattern: /Official hours\/week[^:]*:\s*(.+?)(?=\n)/i, type: 'integer' },
      averageHours: { pattern: /Average real hours\/week[^:]*:\s*(.+?)(?=\n)/i, type: 'integer' },
      shiftDescription: { pattern: /Shiftwork or 9 to 5[^:]*:\s*(.+?)(?=\n)/i, type: 'text' },
      onCall: { pattern: /On-call duty:\s*(.+?)(?=\n)/i, type: 'text' },
      vacationDays: { pattern: /Vacation days\/year:\s*(.+?)(?=\n)/i, type: 'integer' },

      // SALARY
      grossSalary: { pattern: /Gross salary\/month:\s*(.+?)(?=\n)/i, type: 'currency', required: true },
      netSalary: { pattern: /Net salary\/month:\s*(.+?)(?=\n)/i, type: 'currency' },
      netCompensation: { pattern: /Netto compensation:\s*(.+?)(?=\n)/i, type: 'currency' },
      mobilityBudget: { pattern: /Car\/bike\/\.\.\. or mobility budget:\s*(.+?)(?=\n)/i, type: 'text' },
      thirteenthMonth: { pattern: /13th month[^:]*:\s*(.+?)(?=\n)/i, type: 'text' },
      mealVouchers: { pattern: /Meal vouchers:\s*(.+?)(?=\n)/i, type: 'currency' },
      ecoCheques: { pattern: /Ecocheques:\s*(.+?)(?=\n)/i, type: 'currency' },
      groupInsurance: { pattern: /Group insurance:\s*(.+?)(?=\n)/i, type: 'text' },
      otherInsurances: { pattern: /Other insurances:\s*(.+?)(?=\n)/i, type: 'text' },
      otherBenefits: { pattern: /Other benefits[^:]*:\s*(.+?)(?=\n)/i, type: 'text' },

      // MOBILITY
      workCity: { pattern: /City\/region of work:\s*(.+?)(?=\n)/i, type: 'text', required: true },
      commuteDistance: { pattern: /Distance home-work:\s*(.+?)(?=\n)/i, type: 'text' },
      commuteMethod: { pattern: /How do you commute\?:\s*(.+?)(?=\n)/i, type: 'text' },
      commuteCompensation: { pattern: /How is the travel[^:]*compensated:\s*(.+?)(?=\n)/i, type: 'text' },
      teleworkDays: { pattern: /Telework days\/week:\s*(.+?)(?=\n)/i, type: 'integer' },

      // OTHER
      dayOffEase: { pattern: /How easily can you plan a day off:\s*(.+?)(?=\n)/i, type: 'text' },
      stressLevel: { pattern: /Is your job stressful\?:\s*(.+?)(?=\n)/i, type: 'text' },
      reports: { pattern: /Responsible for personnel[^:]*:\s*(.+?)(?=\n)/i, type: 'integer' },
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
