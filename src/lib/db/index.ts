import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Clean the DATABASE_URL to remove schema parameter if present
const databaseUrl = process.env.DATABASE_URL!.replace(/[?&]schema=[^&]*/, '');

// Create the connection
const client = postgres(databaseUrl);

// Create the drizzle instance
export const db = drizzle(client, { schema });