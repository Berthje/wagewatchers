import { db } from '@/lib/db';
import { cities } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface GeoNamesCity {
    name: string;
    countryName: string;
}

/**
 * Fetches cities from GeoNames API for a given country
 * @param countryCode - ISO country code (e.g., 'BE' for Belgium)
 * @param lang - Language code (e.g., 'en' for English, or undefined for local)
 * @returns Array of city objects
 */
async function fetchCitiesFromGeoNames(countryCode: string, lang?: string): Promise<GeoNamesCity[]> {
    const username = process.env.GEONAMES_USERNAME;
    if (!username) {
        throw new Error('GEONAMES_USERNAME environment variable is required');
    }

    const langParam = lang ? `&lang=${lang}` : '';
    const maxRows = 1000;
    let allCities: GeoNamesCity[] = [];
    let startRow = 0;

    while (true) {
        const cities = await fetchCitiesPage(countryCode, langParam, maxRows, startRow);
        if (cities.length === 0) {
            break;
        }

        allCities = allCities.concat(cities);

        if (cities.length < maxRows) {
            break;
        }

        startRow += maxRows;

        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return allCities;
}

/**
 * Fetches a single page of cities from GeoNames API
 */
async function fetchCitiesPage(countryCode: string, langParam: string, maxRows: number, startRow: number): Promise<GeoNamesCity[]> {
    const username = process.env.GEONAMES_USERNAME!;
    const url = `http://api.geonames.org/searchJSON?country=${countryCode}&featureClass=P&username=${username}${langParam}&maxRows=${maxRows}&startRow=${startRow}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`GeoNames API error: ${response.status}`);
    }

    const data: { geonames: GeoNamesCity[] } = await response.json();
    return data.geonames || [];
}

/**
 * Updates the cities table with data from GeoNames API
 * @param countryCode - ISO country code
 * @param countryName - Full country name
 */
export async function updateCitiesForCountry(countryCode: string, countryName: string) {
    try {
        const localCities = await fetchCitiesFromGeoNames(countryCode);

        const uniqueCities = localCities
            .filter(city => city.name && city.name.trim().length > 0)
            .filter((city, index, self) =>
                index === self.findIndex(c => c.name.toLowerCase() === city.name.toLowerCase())
            )
            .map(city => ({
                name: city.name.trim(),
                country: countryName,
            }));

        // Clear existing cities for this country
        await db.delete(cities).where(eq(cities.country, countryName));

        // Insert new cities
        if (uniqueCities.length > 0) {
            await db.insert(cities).values(uniqueCities);
        }

    } catch (error) {
        console.error(`Error updating cities for ${countryName}:`, error);
        throw error;
    }
}

/**
 * Updates cities for multiple countries
 * @param countries - Array of {code: string, name: string} objects
 */
export async function updateCitiesForCountries(countries: { code: string; name: string }[]) {
    for (const { code, name } of countries) {
        await updateCitiesForCountry(code, name);

        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}
