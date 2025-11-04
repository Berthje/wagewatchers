#!/usr/bin/env tsx

import 'dotenv/config';
import { updateCitiesFromCSV } from '../src/lib/city-fetcher';
import path from 'node:path';

/**
 * Script to update city data from CSV file
 * CSV should have semicolon (;) delimiter and contain 'name' and 'country' columns
 * Place the CSV file in: public/data/cities.csv
 */

async function main() {
    // CSV file should be in public/data/cities.csv
    const csvPath = path.join(process.cwd(), 'public', 'data', 'cities.csv');

    console.log('Starting city data update from CSV...');
    console.log(`CSV file path: ${csvPath}`);

    try {
        await updateCitiesFromCSV(csvPath);
        console.log('City data update completed successfully!');
    } catch (error) {
        console.error('Error updating city data:', error);
        process.exit(1);
    }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main();