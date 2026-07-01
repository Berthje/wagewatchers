/**
 * Curated, canonical degree list — the single source of truth for the Degree
 * lookup table and the form's degree picker. Stable numeric `id`s let the form
 * bind `salaryEntries.degreeId` directly while the seed inserts the same ids.
 *
 * This is a deliberately short, high-signal Belgian list (expandable over time);
 * the key distinction users asked for — burgerlijk (academic/civil engineer) vs
 * industrieel (industrial engineer) — is captured explicitly.
 *
 * Pure TS — no Drizzle import, safe to bundle on the client.
 */

export type DegreeLevel = "bachelor" | "master" | "phd" | "professional" | "associate";

export interface DegreeDefinition {
  id: number;
  name: string;
  field: string;
  level: DegreeLevel;
  countries?: string[]; // omitted = universal
}

export const DEGREE_FIELDS = [
  "engineering",
  "computerScience",
  "sciences",
  "business",
  "economics",
  "law",
  "medicine",
  "healthcare",
  "humanities",
  "socialSciences",
  "education",
  "arts",
  "other",
] as const;

// Belgium-focused curated list. ids are stable — never renumber existing rows.
export const DEGREE_DEFINITIONS: DegreeDefinition[] = [
  // Engineering — the burgerlijk vs industrieel distinction users called out
  {
    id: 1,
    name: "Burgerlijk ingenieur (civil/academic engineer)",
    field: "engineering",
    level: "master",
    countries: ["BE"],
  },
  {
    id: 2,
    name: "Burgerlijk ingenieur — computerwetenschappen",
    field: "engineering",
    level: "master",
    countries: ["BE"],
  },
  {
    id: 3,
    name: "Burgerlijk ingenieur — elektrotechniek",
    field: "engineering",
    level: "master",
    countries: ["BE"],
  },
  {
    id: 4,
    name: "Burgerlijk ingenieur — werktuigkunde",
    field: "engineering",
    level: "master",
    countries: ["BE"],
  },
  {
    id: 5,
    name: "Industrieel ingenieur (industrial engineer)",
    field: "engineering",
    level: "master",
    countries: ["BE"],
  },
  {
    id: 6,
    name: "Industrieel ingenieur — elektronica/ICT",
    field: "engineering",
    level: "master",
    countries: ["BE"],
  },
  {
    id: 7,
    name: "Bio-ingenieur (bioscience engineer)",
    field: "engineering",
    level: "master",
    countries: ["BE"],
  },
  // Computer science / IT
  {
    id: 20,
    name: "Master computerwetenschappen / informatica",
    field: "computerScience",
    level: "master",
  },
  { id: 21, name: "Bachelor toegepaste informatica", field: "computerScience", level: "bachelor" },
  {
    id: 22,
    name: "Graduaat programmeren",
    field: "computerScience",
    level: "associate",
    countries: ["BE"],
  },
  // Sciences
  { id: 30, name: "Master wiskunde", field: "sciences", level: "master" },
  { id: 31, name: "Master fysica", field: "sciences", level: "master" },
  { id: 32, name: "Master chemie", field: "sciences", level: "master" },
  { id: 33, name: "Master biologie", field: "sciences", level: "master" },
  { id: 34, name: "PhD / doctoraat (sciences)", field: "sciences", level: "phd" },
  // Business / economics
  {
    id: 40,
    name: "Master handelsingenieur (business engineering)",
    field: "business",
    level: "master",
    countries: ["BE"],
  },
  {
    id: 41,
    name: "Master TEW (toegepaste economische wetenschappen)",
    field: "economics",
    level: "master",
    countries: ["BE"],
  },
  { id: 42, name: "Master economics", field: "economics", level: "master" },
  {
    id: 43,
    name: "Bachelor bedrijfsmanagement",
    field: "business",
    level: "bachelor",
    countries: ["BE"],
  },
  { id: 44, name: "MBA", field: "business", level: "professional" },
  // Law
  { id: 50, name: "Master rechten (law)", field: "law", level: "master" },
  // Medicine / healthcare
  { id: 60, name: "Arts (doctor of medicine)", field: "medicine", level: "master" },
  { id: 61, name: "Bachelor verpleegkunde (nursing)", field: "healthcare", level: "bachelor" },
  // Humanities / social sciences / education / arts
  { id: 70, name: "Master taal- en letterkunde", field: "humanities", level: "master" },
  { id: 71, name: "Master psychologie", field: "socialSciences", level: "master" },
  { id: 72, name: "Master communicatiewetenschappen", field: "socialSciences", level: "master" },
  {
    id: 73,
    name: "Bachelor onderwijs / leraar",
    field: "education",
    level: "bachelor",
    countries: ["BE"],
  },
  { id: 74, name: "Master kunsten (arts)", field: "arts", level: "master" },
  // Catch-all
  { id: 99, name: "Other / not listed", field: "other", level: "professional" },
];

/** Degrees available for a country (undefined country = all universal + none). */
export function getDegreesFor(country: string | undefined): DegreeDefinition[] {
  const cc = countryToCode(country);
  return DEGREE_DEFINITIONS.filter(
    (d) => !d.countries || (cc !== undefined && d.countries.includes(cc))
  );
}

function countryToCode(country: string | undefined): string | undefined {
  if (!country) return undefined;
  const map: Record<string, string> = {
    Belgium: "BE",
    Netherlands: "NL",
    Germany: "DE",
    France: "FR",
    "United States": "US",
  };
  return map[country] ?? country;
}
