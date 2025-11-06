import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema";
import fs from "node:fs";

interface CityData {
  name: string;
  alternateNames?: string;
  country: string;
  countryCode?: string;
  admin1Code?: string;
  admin2Code?: string;
  admin3Code?: string;
  admin4Code?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Parses the GeoNames CSV file and extracts city data
 * CSV format: Geoname ID;Name;ASCII Name;Alternate Names;...;Country name EN;...;Admin1 Code;Admin2 Code;...;Coordinates
 * @param csvPath - Path to the CSV file
 * @returns Array of city objects
 */
function parseCitiesFromCSV(csvPath: string): CityData[] {
  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const lines = fileContent.split("\n");

  // Remove header line
  const header = lines[0].split(";").map((col) => col.trim());
  const dataLines = lines.slice(1);

  // Find column indices by exact header names
  const nameIndex = header.indexOf("Name");
  const alternateNamesIndex = header.indexOf("Alternate Names");
  const countryIndex = header.indexOf("Country name EN");
  const countryCodeIndex = header.indexOf("Country Code");
  const admin1Index = header.indexOf("Admin1 Code");
  const admin2Index = header.indexOf("Admin2 Code");
  const admin3Index = header.indexOf("Admin3 Code");
  const admin4Index = header.indexOf("Admin4 Code");
  const coordinatesIndex = header.indexOf("Coordinates");

  if (nameIndex === -1 || countryIndex === -1) {
    throw new Error(
      `CSV must contain "Name" and "Country name EN" columns. Found headers: ${header.join(", ")}`
    );
  }

  const citiesData: CityData[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;

    const columns = line.split(";");
    const name = columns[nameIndex]?.trim();
    const alternateNames = columns[alternateNamesIndex]?.trim();
    const country = columns[countryIndex]?.trim();
    const countryCode = columns[countryCodeIndex]?.trim();
    const admin1Code = columns[admin1Index]?.trim();
    const admin2Code = columns[admin2Index]?.trim();
    const admin3Code = columns[admin3Index]?.trim();
    const admin4Code = columns[admin4Index]?.trim();
    const coordinatesStr = columns[coordinatesIndex]?.trim();

    // Parse coordinates (format: "latitude, longitude")
    let latitude: number | undefined;
    let longitude: number | undefined;
    if (coordinatesStr) {
      const coords = coordinatesStr.split(",").map((c) => c.trim());
      if (coords.length === 2) {
        const lat = Number.parseFloat(coords[0]);
        const lon = Number.parseFloat(coords[1]);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          latitude = lat;
          longitude = lon;
        }
      }
    }

    if (name && country) {
      citiesData.push({
        name,
        alternateNames: alternateNames || undefined,
        country,
        countryCode: countryCode || undefined,
        admin1Code: admin1Code || undefined,
        admin2Code: admin2Code || undefined,
        admin3Code: admin3Code || undefined,
        admin4Code: admin4Code || undefined,
        latitude,
        longitude,
      });
    }
  }

  return citiesData;
}

/**
 * Updates the cities table with data from CSV file
 * Drops all existing cities, filters duplicates, and imports from CSV
 * @param csvPath - Path to the CSV file
 */
export async function updateCitiesFromCSV(csvPath: string) {
  try {
    const allCities = parseCitiesFromCSV(csvPath);

    const uniqueCities = allCities
      .filter((city) => city.name && city.name.trim().length > 0)
      .filter(
        (city, index, self) =>
          index ===
          self.findIndex(
            (c) =>
              c.name.toLowerCase() === city.name.toLowerCase() &&
              c.country.toLowerCase() === city.country.toLowerCase()
          )
      )
      .map((city) => ({
        name: city.name.trim(),
        alternateNames: city.alternateNames,
        country: city.country.trim(),
        countryCode: city.countryCode,
        admin1Code: city.admin1Code,
        admin2Code: city.admin2Code,
        admin3Code: city.admin3Code,
        admin4Code: city.admin4Code,
        latitude: city.latitude,
        longitude: city.longitude,
      }));

    // Drop all existing cities
    await db.delete(cities);

    // Insert new cities in batches (to avoid potential query size limits)
    const batchSize = 1000;
    for (let i = 0; i < uniqueCities.length; i += batchSize) {
      const batch = uniqueCities.slice(i, i + batchSize);
      await db.insert(cities).values(batch);
    }
  } catch (error) {
    console.error("Error updating cities from CSV:", error);
    throw error;
  }
}
