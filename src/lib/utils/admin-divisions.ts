/**
 * Administrative division mappings for converting codes to readable names
 * Based on GeoNames data structure
 */

// Belgium Administrative Divisions
export const BELGIUM_REGIONS: Record<string, string> = {
  VLG: "Flanders",
  WAL: "Wallonia",
  BRU: "Brussels-Capital Region",
};

export const BELGIUM_PROVINCES: Record<string, string> = {
  // Flanders
  VAN: "Antwerp",
  VBR: "Flemish Brabant",
  VLI: "Limburg",
  VOV: "East Flanders",
  VWV: "West Flanders",
  // Wallonia
  WBR: "Walloon Brabant",
  WHT: "Hainaut",
  WLG: "Liège",
  WLX: "Luxembourg",
  WNA: "Namur",
  // Brussels (no provinces)
  BRU: "Brussels-Capital Region",
};

// Netherlands Administrative Divisions (Provinces)
export const NETHERLANDS_PROVINCES: Record<string, string> = {
  "01": "Drenthe",
  "02": "Friesland",
  "03": "Gelderland",
  "04": "Groningen",
  "05": "Limburg",
  "06": "North Brabant",
  "07": "North Holland",
  "08": "Overijssel",
  "09": "Utrecht",
  "10": "Zeeland",
  "11": "South Holland",
  "12": "Flevoland",
};

// Germany Administrative Divisions (States/Länder)
export const GERMANY_STATES: Record<string, string> = {
  "01": "Baden-Württemberg",
  "02": "Bavaria",
  "03": "Berlin",
  "04": "Brandenburg",
  "05": "Bremen",
  "06": "Hamburg",
  "07": "Hesse",
  "08": "Mecklenburg-Vorpommern",
  "09": "Lower Saxony",
  "10": "North Rhine-Westphalia",
  "11": "Rhineland-Palatinate",
  "12": "Saarland",
  "13": "Saxony",
  "14": "Saxony-Anhalt",
  "15": "Schleswig-Holstein",
  "16": "Thuringia",
};

// France Administrative Divisions (Regions - new system post-2016)
export const FRANCE_REGIONS: Record<string, string> = {
  "84": "Auvergne-Rhône-Alpes",
  "27": "Bourgogne-Franche-Comté",
  "53": "Brittany",
  "24": "Centre-Val de Loire",
  "94": "Corsica",
  "44": "Grand Est",
  "32": "Hauts-de-France",
  "11": "Île-de-France",
  "28": "Normandy",
  "75": "Nouvelle-Aquitaine",
  "76": "Occitanie",
  "52": "Pays de la Loire",
  "93": "Provence-Alpes-Côte d'Azur",
};

/**
 * Get the province/state name from admin codes
 */
export function getProvinceName(countryCode: string, admin1Code?: string, admin2Code?: string): string | null {
  if (!admin1Code && !admin2Code) return null;

  switch (countryCode.toUpperCase()) {
    case "BE":
      // For Belgium, admin2Code is the province
      if (admin2Code && BELGIUM_PROVINCES[admin2Code]) {
        return BELGIUM_PROVINCES[admin2Code];
      }
      // Fallback to region if no province
      if (admin1Code && BELGIUM_REGIONS[admin1Code]) {
        return BELGIUM_REGIONS[admin1Code];
      }
      return null;

    case "NL":
      // For Netherlands, admin1Code is the province
      if (admin1Code && NETHERLANDS_PROVINCES[admin1Code]) {
        return NETHERLANDS_PROVINCES[admin1Code];
      }
      return null;

    case "DE":
      // For Germany, admin1Code is the state
      if (admin1Code && GERMANY_STATES[admin1Code]) {
        return GERMANY_STATES[admin1Code];
      }
      return null;

    case "FR":
      // For France, admin1Code is the region
      if (admin1Code && FRANCE_REGIONS[admin1Code]) {
        return FRANCE_REGIONS[admin1Code];
      }
      return null;

    default:
      return null;
  }
}

/**
 * Get the region name (higher level administrative division)
 */
export function getRegionName(countryCode: string, admin1Code?: string): string | null {
  if (!admin1Code) return null;

  switch (countryCode.toUpperCase()) {
    case "BE":
      return BELGIUM_REGIONS[admin1Code] || null;

    case "NL":
      return NETHERLANDS_PROVINCES[admin1Code] || null;

    case "DE":
      return GERMANY_STATES[admin1Code] || null;

    case "FR":
      return FRANCE_REGIONS[admin1Code] || null;

    default:
      return null;
  }
}

/**
 * Get ISO 3166-2 subdivision code for mapping to geodata
 * This is used by amCharts for region identification
 */
export function getISO3166Code(countryCode: string, admin1Code?: string, admin2Code?: string): string | null {
  if (!admin1Code && !admin2Code) return null;

  switch (countryCode.toUpperCase()) {
    case "BE":
      // Belgium uses admin2Code for provinces
      if (admin2Code) {
        const mapping: Record<string, string> = {
          VAN: "BE-VAN", // Antwerp
          VBR: "BE-VBR", // Flemish Brabant
          VLI: "BE-VLI", // Limburg
          VOV: "BE-VOV", // East Flanders
          VWV: "BE-VWV", // West Flanders
          WBR: "BE-WBR", // Walloon Brabant
          WHT: "BE-WHT", // Hainaut
          WLG: "BE-WLG", // Liège
          WLX: "BE-WLX", // Luxembourg
          WNA: "BE-WNA", // Namur
          BRU: "BE-BRU", // Brussels
        };
        return mapping[admin2Code] || null;
      }
      return null;

    case "NL":
      // Netherlands uses admin1Code for provinces
      if (admin1Code) {
        const mapping: Record<string, string> = {
          "01": "NL-DR", // Drenthe
          "02": "NL-FR", // Friesland
          "03": "NL-GE", // Gelderland
          "04": "NL-GR", // Groningen
          "05": "NL-LI", // Limburg
          "06": "NL-NB", // North Brabant
          "07": "NL-NH", // North Holland
          "08": "NL-OV", // Overijssel
          "09": "NL-UT", // Utrecht
          "10": "NL-ZE", // Zeeland
          "11": "NL-ZH", // South Holland
          "12": "NL-FL", // Flevoland
        };
        return mapping[admin1Code] || null;
      }
      return null;

    case "DE":
      // Germany uses admin1Code for states
      if (admin1Code) {
        const mapping: Record<string, string> = {
          "01": "DE-BW", // Baden-Württemberg
          "02": "DE-BY", // Bavaria
          "03": "DE-BE", // Berlin
          "04": "DE-BB", // Brandenburg
          "05": "DE-HB", // Bremen
          "06": "DE-HH", // Hamburg
          "07": "DE-HE", // Hesse
          "08": "DE-MV", // Mecklenburg-Vorpommern
          "09": "DE-NI", // Lower Saxony
          "10": "DE-NW", // North Rhine-Westphalia
          "11": "DE-RP", // Rhineland-Palatinate
          "12": "DE-SL", // Saarland
          "13": "DE-SN", // Saxony
          "14": "DE-ST", // Saxony-Anhalt
          "15": "DE-SH", // Schleswig-Holstein
          "16": "DE-TH", // Thuringia
        };
        return mapping[admin1Code] || null;
      }
      return null;

    case "FR":
      // France uses admin1Code for regions
      if (admin1Code) {
        const mapping: Record<string, string> = {
          "84": "FR-ARA", // Auvergne-Rhône-Alpes
          "27": "FR-BFC", // Bourgogne-Franche-Comté
          "53": "FR-BRE", // Brittany
          "24": "FR-CVL", // Centre-Val de Loire
          "94": "FR-COR", // Corsica
          "44": "FR-GES", // Grand Est
          "32": "FR-HDF", // Hauts-de-France
          "11": "FR-IDF", // Île-de-France
          "28": "FR-NOR", // Normandy
          "75": "FR-NAQ", // Nouvelle-Aquitaine
          "76": "FR-OCC", // Occitanie
          "52": "FR-PDL", // Pays de la Loire
          "93": "FR-PAC", // Provence-Alpes-Côte d'Azur
        };
        return mapping[admin1Code] || null;
      }
      return null;

    default:
      return null;
  }
}
