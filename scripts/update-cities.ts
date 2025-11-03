#!/usr/bin/env tsx

import { updateCitiesForCountries } from '../src/lib/city-fetcher';

/**
 * Script to update city data from GeoNames API
*/

const COUNTRIES = [
    { code: 'BE', name: 'Belgium' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
];

async function main() {
    console.log('Starting city data update...');

    try {
        await updateCitiesForCountries(COUNTRIES);
        console.log('City data update completed successfully!');
    } catch (error) {
        console.error('Error updating city data:', error);
        process.exit(1);
    }
}

main();