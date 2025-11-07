/**
 * Field normalizers for converting human-written Reddit values to standardized database values
 *
 * This module handles the transformation of free-form text from Reddit posts
 * into the structured, predefined values used in our forms and database.
 */

import { distance } from "fastest-levenshtein";

/**
 * Normalized education levels matching field-configs.ts options
 */
const EDUCATION_MAPPINGS: Record<string, string[]> = {
  highSchool: [
    "high school",
    "highschool",
    "secondary school",
    "secondary education",
    "aso",
    "tso",
    "bso",
    "kso",
    "middelbaar",
    "secondaire",
  ],
  associate: [
    "associate",
    "associate degree",
    "graduaat",
    "graduate",
    "short-cycle higher education",
  ],
  bachelor: [
    "bachelor",
    "bachelors",
    "bachelor's",
    "prof bachelor",
    "professional bachelor",
    "academic bachelor",
    "ba",
    "bs",
    "bsc",
    "professionele bachelor",
    "academische bachelor",
    "bachelor energy",
    "bachelor it",
    "bachelor science",
  ],
  master: [
    "master",
    "masters",
    "master's",
    "ma",
    "ms",
    "msc",
    "mba",
    "ingenieur",
    "burgerlijk ingenieur",
    "civil engineer",
  ],
  phd: [
    "phd",
    "ph.d",
    "doctorate",
    "doctoral",
    "doctor",
    "doctoraat",
  ],
  professional: [
    "professional degree",
    "professional certification",
    "md",
    "jd",
    "law degree",
  ],
  vocational: [
    "vocational",
    "vocational training",
    "beroepsopleiding",
    "trade school",
    "apprenticeship",
  ],
  someCollege: [
    "some college",
    "incomplete bachelor",
    "university dropout",
    "partial degree",
  ],
};

/**
 * Normalized civil status values matching field-configs.ts options
 */
const CIVIL_STATUS_MAPPINGS: Record<string, string[]> = {
  single: [
    "single",
    "unmarried",
    "not married",
    "alleenstaand",
    "célibataire",
    "ledig",
  ],
  cohabiting: [
    "cohabiting",
    "cohabitation",
    "living together",
    "samenwonend",
    "cohabitant",
    "zusammenlebend",
    "partner",
    "in a relationship",
  ],
  civilUnion: [
    "civil union",
    "civil partnership",
    "registered partnership",
    "wettelijk samenwonend",
    "pacs",
    "eingetragene partnerschaft",
  ],
  married: [
    "married",
    "getrouwd",
    "marié",
    "verheiratet",
    "spouse",
  ],
  divorced: [
    "divorced",
    "gescheiden",
    "divorcé",
    "geschieden",
  ],
  widowed: [
    "widowed",
    "widow",
    "widower",
    "weduwe",
    "weduwnaar",
    "veuf",
    "veuve",
    "verwitwet",
  ],
};

/**
 * Normalized contract types matching field-configs.ts options
 */
const CONTRACT_TYPE_MAPPINGS: Record<string, string[]> = {
  permanent: [
    "permanent",
    "indefinite",
    "vast",
    "cdi",
    "unbefristet",
    "vaste",
    "fixed position",
    "tenure",
  ],
  temporary: [
    "temporary",
    "fixed-term",
    "tijdelijk",
    "cdd",
    "befristet",
    "contract",
  ],
  freelance: [
    "freelance",
    "independent",
    "self-employed",
    "zelfstandig",
    "indépendant",
    "freiberufler",
    "contractor",
  ],
  internship: [
    "internship",
    "intern",
    "stage",
    "praktikum",
  ],
};

/**
 * Normalized company sizes matching field-configs.ts options
 */
const COMPANY_SIZE_MAPPINGS: Record<string, string[]> = {
  "1-10": [
    "1-10",
    "startup",
    "very small",
    "micro",
    "tiny",
    "< 10",
  ],
  "11-50": [
    "11-50",
    "small",
    "klein",
    "petit",
    "klein",
  ],
  "51-200": [
    "51-200",
    "medium",
    "middelgroot",
    "moyen",
    "mittel",
  ],
  "201-500": [
    "201-500",
    "large",
    "groot",
    "grand",
    "groß",
  ],
  "501-1000": [
    "501-1000",
    "very large",
    "zeer groot",
  ],
  "1001-5000": [
    "1001-5000",
    "enterprise",
    "multinational",
  ],
  "5001+": [
    "5001+",
    "5000+",
    "mega corporation",
    "fortune 500",
  ],
};

/**
 * Normalized work arrangement matching field-configs.ts options
 */
const WORK_ARRANGEMENT_MAPPINGS: Record<string, string[]> = {
  onsite: [
    "onsite",
    "on-site",
    "office",
    "on site",
    "kantoor",
    "sur place",
    "vor ort",
  ],
  hybrid: [
    "hybrid",
    "mixed",
    "hybride",
    "flexible",
  ],
  remote: [
    "remote",
    "work from home",
    "wfh",
    "thuiswerk",
    "télétravail",
    "home office",
    "fully remote",
    "100% remote",
  ],
};

/**
 * Helper function to normalize a value using fuzzy matching
 */
function normalizeWithFuzzyMatch(
  value: string | null,
  mappings: Record<string, string[]>,
  threshold = 0.8
): string | null {
  if (!value) return null;

  const normalizedInput = value.toLowerCase().trim();

  // First, try exact match
  for (const [standardValue, variations] of Object.entries(mappings)) {
    for (const variation of variations) {
      if (normalizedInput === variation.toLowerCase()) {
        return standardValue;
      }
    }
  }

  // Second, try substring match (e.g., "prof bachelor energy" contains "prof bachelor")
  for (const [standardValue, variations] of Object.entries(mappings)) {
    for (const variation of variations) {
      const lowerVariation = variation.toLowerCase();
      if (normalizedInput.includes(lowerVariation) || lowerVariation.includes(normalizedInput)) {
        return standardValue;
      }
    }
  }

  // Finally, try fuzzy matching using Levenshtein distance
  let bestMatch: string | null = null;
  let bestSimilarity = 0;

  for (const [standardValue, variations] of Object.entries(mappings)) {
    for (const variation of variations) {
      const maxLength = Math.max(normalizedInput.length, variation.length);
      if (maxLength === 0) continue;

      const dist = distance(normalizedInput, variation.toLowerCase());
      const similarity = 1 - dist / maxLength;

      if (similarity > bestSimilarity && similarity >= threshold) {
        bestSimilarity = similarity;
        bestMatch = standardValue;
      }
    }
  }

  return bestMatch;
}

/**
 * Normalize education level from Reddit text to standard value
 * @example "Prof Bachelor energy" → "bachelor"
 * @example "MA" → "master"
 */
export function normalizeEducation(value: string | null): string | null {
  return normalizeWithFuzzyMatch(value, EDUCATION_MAPPINGS);
}

/**
 * Normalize civil status from Reddit text to standard value
 * @example "Unmarried" → "single"
 * @example "samenwonend" → "cohabiting"
 */
export function normalizeCivilStatus(value: string | null): string | null {
  return normalizeWithFuzzyMatch(value, CIVIL_STATUS_MAPPINGS);
}

/**
 * Normalize contract type from Reddit text to standard value
 * @example "vast" → "permanent"
 * @example "cdi" → "permanent"
 */
export function normalizeContractType(value: string | null): string | null {
  return normalizeWithFuzzyMatch(value, CONTRACT_TYPE_MAPPINGS);
}

/**
 * Normalize company size from Reddit text to standard value
 * @example "startup" → "1-10"
 * @example "multinational" → "1001-5000"
 */
export function normalizeCompanySize(value: string | null): string | null {
  return normalizeWithFuzzyMatch(value, COMPANY_SIZE_MAPPINGS);
}

/**
 * Normalize work arrangement from Reddit text to standard value
 * @example "wfh" → "remote"
 * @example "kantoor" → "onsite"
 */
export function normalizeWorkArrangement(value: string | null): string | null {
  return normalizeWithFuzzyMatch(value, WORK_ARRANGEMENT_MAPPINGS);
}

/**
 * Normalize work experience from Reddit text to integer years
 * @example "2.5 Y" → 2
 * @example "5 years" → 5
 * @example "18 months" → 1
 */
export function normalizeWorkExperience(value: string | null): number | null {
  if (!value) return null;

  const normalized = value.toLowerCase().trim();

  // Extract numeric value
  const numMatch = /(\d+(?:\.\d+)?)/g.exec(normalized);
  if (!numMatch) return null;

  const num = Number.parseFloat(numMatch[1]);

  // Check if it's in months and convert to years
  if (normalized.includes("month") || normalized.includes("maand") || normalized.includes("mois")) {
    return Math.floor(num / 12);
  }

  // Otherwise treat as years and round down
  return Math.floor(num);
}

/**
 * Normalize age from Reddit text to integer
 * @example "30y" → 30
 * @example "25 years old" → 25
 */
export function normalizeAge(value: string | null): number | null {
  if (!value) return null;

  const numMatch = /(\d+)/g.exec(value);
  if (!numMatch) return null;

  const age = Number.parseInt(numMatch[1], 10);
  return age >= 16 && age <= 100 ? age : null; // Sanity check
}

/**
 * Normalize boolean values from Reddit text
 * @example "yes" → true
 * @example "nee" → false
 * @example "n/a" → null
 */
export function normalizeBoolean(value: string | null): boolean | null {
  if (!value) return null;

  const normalized = value.toLowerCase().trim();

  const trueValues = ["yes", "ja", "oui", "y", "true", "1", "✓", "x"];
  const falseValues = ["no", "nee", "non", "nein", "n", "false", "0", "✗"];

  if (trueValues.includes(normalized)) return true;
  if (falseValues.includes(normalized)) return false;

  return null;
}

/**
 * Normalize sector/industry values
 * This matches against the sectors defined in field-configs.ts
 */
export function normalizeSector(value: string | null): string | null {
  if (!value) return null;

  const normalized = value.toLowerCase().trim();

  // Common variations and misspellings
  const sectorMappings: Record<string, string[]> = {
    "IT": ["it", "tech", "technology", "software", "ict", "informatique"],
    "Finance": ["finance", "banking", "financial", "fintech", "bank"],
    "Healthcare": ["healthcare", "health care", "medical", "pharma", "gezondheidszorg", "santé"],
    "Education": ["education", "teaching", "onderwijs", "éducation", "university", "school"],
    "Retail": ["retail", "e-commerce", "ecommerce", "detailhandel", "commerce de détail"],
    "Manufacturing": ["manufacturing", "production", "industry", "productie"],
    "Consulting": ["consulting", "advisory", "consultancy", "conseil"],
    "Government": ["government", "public sector", "overheid", "gouvernement", "öffentlicher dienst"],
    "Construction": ["construction", "bouw", "construction", "bau"],
    "Energy": ["energy", "oil", "gas", "utilities", "energie", "énergie"],
    "Automotive": ["automotive", "automobile", "auto", "car"],
    "Telecommunications": ["telecom", "telecommunications", "telco"],
    "RealEstate": ["real estate", "property", "vastgoed", "immobilier"],
  };

  return normalizeWithFuzzyMatch(normalized, sectorMappings, 0.75);
}

/**
 * Master normalization function that applies all normalizers based on field name
 */
export function normalizeFieldValue(
  fieldName: string,
  value: string | null
): string | number | boolean | null {
  if (!value) return null;

  switch (fieldName) {
    case "education":
      return normalizeEducation(value);
    case "civilStatus":
      return normalizeCivilStatus(value);
    case "contractType":
      return normalizeContractType(value);
    case "companySize":
      return normalizeCompanySize(value);
    case "workArrangement":
      return normalizeWorkArrangement(value);
    case "sector":
      return normalizeSector(value);
    case "workExperience":
    case "yearsInCurrentRole":
      return normalizeWorkExperience(value);
    case "age":
    case "dependents":
      return normalizeAge(value);
    case "hasCompanyCar":
    case "hasStockOptions":
    case "hasSigningBonus":
    case "hasPerformanceBonus":
    case "hasCommissionPay":
    case "hasShiftAllowance":
    case "hasOvertimePay":
    case "hasPensionContribution":
    case "hasHealthInsurance":
    case "hasMealVouchers":
    case "hasInternetAllowance":
    case "hasPhoneAllowance":
    case "hasPublicTransport":
    case "hasTrainingBudget":
      return normalizeBoolean(value);
    default:
      // For text fields, just clean up whitespace
      return value.trim();
  }
}
