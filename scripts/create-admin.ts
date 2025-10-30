import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import * as readline from "readline";

const prisma = new PrismaClient();

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
        const existingAdmin = await prisma.admin.findUnique({
            where: { email },
        });

        if (existingAdmin) {
            console.log("Admin user already exists with this email");
            process.exit(1);
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the admin user
        const admin = await prisma.admin.create({
            data: {
                email,
                password: hashedPassword,
            },
        });

        console.log(`Admin user created successfully!`);
        console.log(`Email: ${admin.email}`);
        console.log(`Created at: ${admin.createdAt}`);
    } catch (error) {
        console.error("Error creating admin user:", error);
        process.exit(1);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

createAdmin();
