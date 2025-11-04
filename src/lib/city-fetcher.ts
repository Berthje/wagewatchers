import { db } from '@/lib/db';
import { cities } from '@/lib/db/schema';
import fs from 'node:fs';

interface CityData {
    name: string;
    country: string;
}

/**
 * Parses the GeoNames CSV file and extracts city data
 * @param csvPath - Path to the CSV file
 * @returns Array of city objects
 */
function parseCitiesFromCSV(csvPath: string): CityData[] {
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n');

    // Remove header line
    const header = lines[0].split(';').map(col => col.trim());
    const dataLines = lines.slice(1);

    // Find column indices
    const nameIndex = header.findIndex(col => col.toLowerCase().includes('name'));
    const countryIndex = header.findIndex(col => col.toLowerCase().includes('country'));

    if (nameIndex === -1 || countryIndex === -1) {
        throw new Error('CSV must contain "name" and "country" columns');
    }

    console.log(`Found columns - name: ${header[nameIndex]}, country: ${header[countryIndex]}`);

    const citiesData: CityData[] = [];

    for (const line of dataLines) {
        if (!line.trim()) continue;

        const columns = line.split(';').map(col => col.trim());
        const name = columns[nameIndex];
        const country = columns[countryIndex];

        if (name && country) {
            citiesData.push({ name, country });
        }
    }

    console.log(`Parsed ${citiesData.length} cities from CSV`);
    return citiesData;
}

/**
 * Updates the cities table with data from CSV file
 * Drops all existing cities, filters duplicates, and imports from CSV
 * @param csvPath - Path to the CSV file
 */
export async function updateCitiesFromCSV(csvPath: string) {
    try {
        console.log('Reading cities from CSV...');
        const allCities = parseCitiesFromCSV(csvPath);

        console.log('Filtering out duplicates...');
        const uniqueCities = allCities
            .filter(city => city.name && city.name.trim().length > 0)
            .filter((city, index, self) =>
                index === self.findIndex(c =>
                    c.name.toLowerCase() === city.name.toLowerCase() &&
                    c.country.toLowerCase() === city.country.toLowerCase()
                )
            )
            .map(city => ({
                name: city.name.trim(),
                country: city.country.trim(),
            }));

        console.log(`After filtering: ${uniqueCities.length} unique cities`);

        // Drop all existing cities
        console.log('Dropping all existing cities...');
        await db.delete(cities);
        console.log('All cities deleted');

        // Insert new cities in batches (to avoid potential query size limits)
        const batchSize = 1000;
        for (let i = 0; i < uniqueCities.length; i += batchSize) {
            const batch = uniqueCities.slice(i, i + batchSize);
            await db.insert(cities).values(batch);
            console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(uniqueCities.length / batchSize)} (${batch.length} cities)`);
        }

        console.log(`Successfully imported ${uniqueCities.length} cities`);

    } catch (error) {
        console.error('Error updating cities from CSV:', error);
        throw error;
    }
}
