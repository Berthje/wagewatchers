import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Debug: log DATABASE_URL
console.log("DATABASE_URL:", process.env.DATABASE_URL);

// Create the connection
const client = postgres(process.env.DATABASE_URL!);

// Create the drizzle instance
export const db = drizzle(client, { schema });
