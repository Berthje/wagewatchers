/**
 * Curated, canonical degree list — the single source of truth for the Degree
 * lookup table and the form's degree picker. Stable numeric `id`s let the form
 * bind `salaryEntries.degreeId` directly while the seed inserts the same ids.
 *
 * Curated & representative across the major Belgian (universiteit + hogeschool)
 * and Dutch (universiteit + hogeschool) programs, grouped by level so the form
 * can offer the right list per education choice. The key distinction users asked
 * for — burgerlijk (academic/civil engineer) vs industrieel (industrial
 * engineer) — is captured explicitly. Not exhaustive; extend over time.
 *
 * ids are stable and country-tagged: 1–99 are the original BE core, 100+ are the
 * BE/NL expansion. Never renumber an existing row (SalaryEntry.degreeId and the
 * seed both point at these ids).
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

  // ───────────────────────────── BE/NL expansion (100+) ─────────────────────
  // Engineering
  { id: 100, name: "Industrieel ingenieur — bouwkunde", field: "engineering", level: "master", countries: ["BE"] },
  { id: 101, name: "Industrieel ingenieur — chemie", field: "engineering", level: "master", countries: ["BE"] },
  { id: 102, name: "Industrieel ingenieur — automatisering", field: "engineering", level: "master", countries: ["BE"] },
  { id: 103, name: "Bachelor Werktuigbouwkunde", field: "engineering", level: "bachelor", countries: ["NL"] },
  { id: 104, name: "Bachelor Elektrotechniek", field: "engineering", level: "bachelor", countries: ["NL"] },
  { id: 105, name: "Bachelor Civiele Techniek", field: "engineering", level: "bachelor", countries: ["NL"] },
  { id: 106, name: "Bachelor Technische Bedrijfskunde", field: "engineering", level: "bachelor", countries: ["NL"] },
  { id: 107, name: "Master Mechanical Engineering", field: "engineering", level: "master", countries: ["NL"] },
  { id: 108, name: "Master Electrical Engineering", field: "engineering", level: "master", countries: ["NL"] },
  { id: 109, name: "Master Aerospace Engineering", field: "engineering", level: "master", countries: ["NL"] },
  { id: 110, name: "Master Civil Engineering", field: "engineering", level: "master", countries: ["NL"] },
  { id: 111, name: "Master Industrial Design Engineering", field: "engineering", level: "master", countries: ["NL"] },
  { id: 112, name: "Master Technische Natuurkunde / Applied Physics", field: "engineering", level: "master", countries: ["NL"] },

  // Computer science / IT
  { id: 120, name: "Bachelor informatica (universitair)", field: "computerScience", level: "bachelor", countries: ["BE"] },
  { id: 121, name: "Professionele bachelor elektronica-ICT", field: "computerScience", level: "bachelor", countries: ["BE"] },
  { id: 122, name: "Graduaat systeem- en netwerkbeheer", field: "computerScience", level: "associate", countries: ["BE"] },
  { id: 123, name: "Graduaat internet of things", field: "computerScience", level: "associate", countries: ["BE"] },
  { id: 124, name: "Master computerwetenschappen (specialisatie AI)", field: "computerScience", level: "master", countries: ["BE"] },
  { id: 125, name: "Bachelor Informatica", field: "computerScience", level: "bachelor", countries: ["NL"] },
  { id: 126, name: "Bachelor Technische Informatica", field: "computerScience", level: "bachelor", countries: ["NL"] },
  { id: 127, name: "Bachelor HBO-ICT", field: "computerScience", level: "bachelor", countries: ["NL"] },
  { id: 128, name: "Bachelor Kunstmatige Intelligentie", field: "computerScience", level: "bachelor", countries: ["NL"] },
  { id: 129, name: "Master Computer Science", field: "computerScience", level: "master", countries: ["NL"] },
  { id: 130, name: "Master Artificial Intelligence", field: "computerScience", level: "master", countries: ["NL"] },
  { id: 131, name: "Master Data Science", field: "computerScience", level: "master", countries: ["NL"] },
  { id: 132, name: "Master Cyber Security", field: "computerScience", level: "master", countries: ["NL"] },

  // Sciences
  { id: 140, name: "Bachelor biomedische wetenschappen", field: "sciences", level: "bachelor", countries: ["BE"] },
  { id: 141, name: "Bachelor chemie", field: "sciences", level: "bachelor", countries: ["BE"] },
  { id: 142, name: "Bachelor fysica", field: "sciences", level: "bachelor", countries: ["BE"] },
  { id: 143, name: "Bachelor biologie", field: "sciences", level: "bachelor", countries: ["BE"] },
  { id: 144, name: "Master biochemie en biotechnologie", field: "sciences", level: "master", countries: ["BE"] },
  { id: 145, name: "Bachelor Scheikunde", field: "sciences", level: "bachelor", countries: ["NL"] },
  { id: 146, name: "Bachelor Natuurkunde", field: "sciences", level: "bachelor", countries: ["NL"] },
  { id: 147, name: "Bachelor Wiskunde", field: "sciences", level: "bachelor", countries: ["NL"] },
  { id: 148, name: "Bachelor Biologie", field: "sciences", level: "bachelor", countries: ["NL"] },
  { id: 149, name: "Bachelor Life Science & Technology", field: "sciences", level: "bachelor", countries: ["NL"] },
  { id: 150, name: "Master Life Sciences", field: "sciences", level: "master", countries: ["NL"] },

  // Business / economics
  { id: 160, name: "Bachelor handelswetenschappen", field: "business", level: "bachelor", countries: ["BE"] },
  { id: 161, name: "Master handelswetenschappen", field: "business", level: "master", countries: ["BE"] },
  { id: 162, name: "Master marketing", field: "business", level: "master", countries: ["BE"] },
  { id: 163, name: "Master accountancy en fiscaliteit", field: "business", level: "master", countries: ["BE"] },
  { id: 164, name: "Professionele bachelor office management", field: "business", level: "bachelor", countries: ["BE"] },
  { id: 165, name: "Graduaat accounting administration", field: "business", level: "associate", countries: ["BE"] },
  { id: 166, name: "Graduaat marketing- en communicatiesupport", field: "business", level: "associate", countries: ["BE"] },
  { id: 167, name: "Bachelor Bedrijfskunde", field: "business", level: "bachelor", countries: ["NL"] },
  { id: 168, name: "Bachelor Bedrijfseconomie", field: "economics", level: "bachelor", countries: ["NL"] },
  { id: 169, name: "Bachelor Commerciële Economie", field: "business", level: "bachelor", countries: ["NL"] },
  { id: 170, name: "Bachelor International Business", field: "business", level: "bachelor", countries: ["NL"] },
  { id: 171, name: "Bachelor Accountancy", field: "business", level: "bachelor", countries: ["NL"] },
  { id: 172, name: "Master Business Administration / Bedrijfskunde", field: "business", level: "master", countries: ["NL"] },
  { id: 173, name: "Master Finance", field: "economics", level: "master", countries: ["NL"] },
  { id: 174, name: "Master Marketing Management", field: "business", level: "master", countries: ["NL"] },

  // Law
  { id: 180, name: "Bachelor rechten", field: "law", level: "bachelor", countries: ["BE"] },
  { id: 181, name: "Master notariaat", field: "law", level: "master", countries: ["BE"] },
  { id: 182, name: "Master criminologische wetenschappen", field: "law", level: "master", countries: ["BE"] },
  { id: 183, name: "Bachelor Rechtsgeleerdheid", field: "law", level: "bachelor", countries: ["NL"] },
  { id: 184, name: "Master Nederlands recht", field: "law", level: "master", countries: ["NL"] },
  { id: 185, name: "Bachelor HBO-Rechten", field: "law", level: "bachelor", countries: ["NL"] },

  // Medicine / healthcare
  { id: 190, name: "Master tandheelkunde", field: "medicine", level: "master", countries: ["BE"] },
  { id: 191, name: "Master diergeneeskunde", field: "medicine", level: "master", countries: ["BE"] },
  { id: 192, name: "Master farmaceutische wetenschappen", field: "medicine", level: "master", countries: ["BE"] },
  { id: 193, name: "Master revalidatiewetenschappen en kinesitherapie", field: "healthcare", level: "master", countries: ["BE"] },
  { id: 194, name: "Bachelor vroedkunde (midwifery)", field: "healthcare", level: "bachelor", countries: ["BE"] },
  { id: 195, name: "Bachelor ergotherapie", field: "healthcare", level: "bachelor", countries: ["BE"] },
  { id: 196, name: "Graduaat verpleegkunde (HBO5)", field: "healthcare", level: "associate", countries: ["BE"] },
  { id: 197, name: "Bachelor Geneeskunde", field: "medicine", level: "bachelor", countries: ["NL"] },
  { id: 198, name: "Master Geneeskunde", field: "medicine", level: "master", countries: ["NL"] },
  { id: 199, name: "Bachelor Verpleegkunde (HBO)", field: "healthcare", level: "bachelor", countries: ["NL"] },
  { id: 200, name: "Bachelor Fysiotherapie", field: "healthcare", level: "bachelor", countries: ["NL"] },
  { id: 201, name: "Master Farmacie", field: "medicine", level: "master", countries: ["NL"] },
  { id: 202, name: "Bachelor Tandheelkunde", field: "medicine", level: "bachelor", countries: ["NL"] },

  // Humanities / social sciences / education / arts
  { id: 210, name: "Bachelor psychologie", field: "socialSciences", level: "bachelor", countries: ["BE"] },
  { id: 211, name: "Master pedagogische wetenschappen", field: "education", level: "master", countries: ["BE"] },
  { id: 212, name: "Master geschiedenis", field: "humanities", level: "master", countries: ["BE"] },
  { id: 213, name: "Master wijsbegeerte", field: "humanities", level: "master", countries: ["BE"] },
  { id: 214, name: "Professionele bachelor sociaal werk", field: "socialSciences", level: "bachelor", countries: ["BE"] },
  { id: 215, name: "Professionele bachelor communicatiemanagement", field: "socialSciences", level: "bachelor", countries: ["BE"] },
  { id: 216, name: "Educatieve bachelor secundair onderwijs", field: "education", level: "bachelor", countries: ["BE"] },
  { id: 217, name: "Educatieve bachelor kleuteronderwijs", field: "education", level: "bachelor", countries: ["BE"] },
  { id: 218, name: "Educatieve bachelor lager onderwijs", field: "education", level: "bachelor", countries: ["BE"] },
  { id: 219, name: "Bachelor beeldende kunsten", field: "arts", level: "bachelor", countries: ["BE"] },
  { id: 220, name: "Bachelor Psychologie", field: "socialSciences", level: "bachelor", countries: ["NL"] },
  { id: 221, name: "Bachelor Pedagogische Wetenschappen", field: "education", level: "bachelor", countries: ["NL"] },
  { id: 222, name: "Bachelor Sociaal Werk", field: "socialSciences", level: "bachelor", countries: ["NL"] },
  { id: 223, name: "Bachelor Communicatie", field: "socialSciences", level: "bachelor", countries: ["NL"] },
  { id: 224, name: "Bachelor Leraar Basisonderwijs (PABO)", field: "education", level: "bachelor", countries: ["NL"] },
  { id: 225, name: "Bachelor Journalistiek", field: "humanities", level: "bachelor", countries: ["NL"] },
  { id: 226, name: "Master Communicatiewetenschap", field: "socialSciences", level: "master", countries: ["NL"] },
  { id: 227, name: "Master Onderwijskunde", field: "education", level: "master", countries: ["NL"] },
  { id: 228, name: "Bachelor Kunst / Conservatorium", field: "arts", level: "bachelor", countries: ["NL"] },

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

/**
 * Maps a selected education level (the form's `education` field values) to the
 * degree levels that make sense for it. Education values with no academic degree
 * equivalent (highSchool, vocational, someCollege) are intentionally absent —
 * the picker shows the full list for those rather than an empty one.
 */
const EDUCATION_TO_DEGREE_LEVELS: Record<string, DegreeLevel[]> = {
  associate: ["associate"], // graduaat / HBO5
  bachelor: ["bachelor"],
  master: ["master"],
  phd: ["phd"],
  professional: ["professional"],
};

/**
 * Degrees for a country, narrowed to the selected education level. The catch-all
 * "Other / not listed" (id 99) always stays available so users have an escape
 * hatch. When no education is selected — or it has no degree-level equivalent —
 * the full country list is returned unfiltered.
 */
export function getDegreesForEducation(
  country: string | undefined,
  education: string | undefined
): DegreeDefinition[] {
  const byCountry = getDegreesFor(country);
  const levels = education ? EDUCATION_TO_DEGREE_LEVELS[education] : undefined;
  if (!levels) return byCountry;
  return byCountry.filter((d) => levels.includes(d.level) || d.id === 99);
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
