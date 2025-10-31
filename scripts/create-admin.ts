import { db } from "../src/lib/db";
import { admins } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import * as readline from "node:readline";

async function createAdmin() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const question = (query: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(query, resolve);
        });
    };

    try {
        console.log("Creating admin user...");

        const email = await question("Enter admin email: ");
        const password = await question("Enter admin password: ");

        if (!email || !password) {
            console.error("Email and password are required");
            process.exit(1);
        }

        // Check if admin already exists
        const existingAdmin = await db.select().from(admins).where(eq(admins.email, email)).limit(1);

        if (existingAdmin[0]) {
            console.log("Admin user already exists with this email");
            process.exit(1);
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the admin user
        const admin = await db.insert(admins).values({
            email,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        console.log(`Admin user created successfully!`);
        console.log(`Email: ${admin[0].email}`);
        console.log(`Created at: ${admin[0].createdAt}`);
    } catch (error) {
        console.error("Error creating admin user:", error);
        process.exit(1);
    } finally {
        rl.close();
    }
}

createAdmin();
