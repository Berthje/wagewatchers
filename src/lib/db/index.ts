import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create the connection
const client = postgres(process.env.DATABASE_URL!);

// Create the drizzle instance
export const db = drizzle(client, { schema });