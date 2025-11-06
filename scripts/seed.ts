import { db } from "../src/lib/db";
import {
    salaryEntries,
    comments,
    reports,
    admins,
    exchangeRates,
    cities,
    newsletterSubscribers,
} from "../src/lib/db/schema";
import bcrypt from "bcrypt";
import { updateCitiesFromCSV } from "../src/lib/city-fetcher";
import path from "node:path";

// Check if we're in development
const isDevelopment = process.env.NODE_ENV !== "production";

async function seed() {
    if (!isDevelopment && !process.env.FORCE_SEED) {
        console.error("⚠️  Seed script can only run in development environment!");
        console.error("   Set FORCE_SEED=true to override (dangerous in production)");
        process.exit(1);
    }

    console.log("🌱 Starting database seed...");

    try {
        // Clear existing data
        console.log("🗑️  Clearing existing data...");
        await db.delete(comments);
        await db.delete(salaryEntries);
        await db.delete(reports);
        await db.delete(admins);
        await db.delete(exchangeRates);
        await db.delete(cities);
        await db.delete(newsletterSubscribers);

        // Seed admins
        console.log("👤 Seeding admins...");
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await db.insert(admins).values([
            {
                email: "admin@wagewatchers.dev",
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
        console.log("   ✓ Created admin user: admin@wagewatchers.dev (password: admin123)");

        // Seed cities from CSV
        console.log("🏙️  Seeding cities from CSV...");
        const csvPath = path.join(process.cwd(), "public", "data", "cities.csv");
        try {
            await updateCitiesFromCSV(csvPath);
            console.log("   ✓ Cities loaded from CSV");
        } catch (error) {
            console.warn("   ⚠️  Could not load cities from CSV, using fallback data");
            console.warn("   Error:", error instanceof Error ? error.message : error);

            // Fallback to hardcoded cities if CSV fails
            const cityData = [
                // Belgium
                { name: "Brussels", country: "Belgium" },
                { name: "Antwerp", country: "Belgium" },
                { name: "Ghent", country: "Belgium" },
                // Netherlands
                { name: "Amsterdam", country: "Netherlands" },
                { name: "Rotterdam", country: "Netherlands" },
                // France
                { name: "Paris", country: "France" },
                // Germany
                { name: "Berlin", country: "Germany" },
                { name: "Munich", country: "Germany" },
            ];

            await db.insert(cities).values(
                cityData.map((city) => ({
                    ...city,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }))
            );
            console.log(`   ✓ Created ${cityData.length} fallback cities`);
        }

        // Seed exchange rates
        console.log("💱 Seeding exchange rates...");
        const exchangeRateData = [
            { currency: "EUR", rate: 1 },
            { currency: "USD", rate: 1.09 },
            { currency: "GBP", rate: 0.86 },
            { currency: "CHF", rate: 0.95 },
            { currency: "CAD", rate: 1.48 },
            { currency: "AUD", rate: 1.64 },
        ];

        await db.insert(exchangeRates).values(
            exchangeRateData.map((rate) => ({
                ...rate,
                createdAt: new Date(),
                updatedAt: new Date(),
            }))
        );
        console.log(`   ✓ Created ${exchangeRateData.length} exchange rates`);

        // Seed salary entries
        console.log("💰 Seeding salary entries...");
        const salaryEntryData = [
            // Belgium - Software Engineers
            {
                country: "Belgium",
                subreddit: "BESalary",
                age: 28,
                education: "Master's degree",
                workExperience: 5,
                civilStatus: "Single",
                dependents: 0,
                sector: "Technology",
                employeeCount: "100-500",
                multinational: true,
                jobTitle: "Senior Software Engineer",
                jobDescription: "Full-stack development with React and Node.js",
                seniority: 5,
                officialHours: 38,
                averageHours: 40,
                shiftDescription: "Regular office hours",
                onCall: "1 week per month",
                vacationDays: 20,
                currency: "EUR",
                grossSalary: 4500,
                netSalary: 2800,
                netCompensation: 3200,
                thirteenthMonth: "Yes",
                mealVouchers: 160,
                ecoCheques: 250,
                groupInsurance: "Yes",
                otherInsurances: "Hospitalization",
                otherBenefits: "Company car, laptop, phone",
                workCity: "Brussels",
                commuteDistance: "15",
                commuteMethod: "Car",
                commuteCompensation: "Fuel card",
                teleworkDays: 3,
                dayOffEase: "Easy",
                stressLevel: "Medium",
                reports: 2,
                isManualEntry: true,
                reviewStatus: "APPROVED" as const,
            },
            {
                country: "Belgium",
                subreddit: "BESalary",
                age: 32,
                education: "Bachelor's degree",
                workExperience: 8,
                civilStatus: "Married",
                dependents: 1,
                sector: "Technology",
                employeeCount: "500+",
                multinational: true,
                jobTitle: "Lead Developer",
                jobDescription: "Team lead for cloud infrastructure",
                seniority: 8,
                officialHours: 38,
                averageHours: 42,
                shiftDescription: "Flexible hours",
                onCall: "2 weeks per month",
                vacationDays: 22,
                currency: "EUR",
                grossSalary: 5800,
                netSalary: 3500,
                netCompensation: 4000,
                thirteenthMonth: "Yes",
                mealVouchers: 160,
                ecoCheques: 250,
                groupInsurance: "Yes",
                otherInsurances: "Hospitalization, dental",
                otherBenefits: "Company car, laptop, phone, stock options",
                workCity: "Antwerp",
                commuteDistance: "8",
                commuteMethod: "Bike",
                commuteCompensation: "Bike allowance",
                teleworkDays: 4,
                dayOffEase: "Easy",
                stressLevel: "High",
                reports: 5,
                isManualEntry: true,
                reviewStatus: "APPROVED" as const,
            },
            // Belgium - Other sectors
            {
                country: "Belgium",
                subreddit: "BESalary",
                age: 35,
                education: "Master's degree",
                workExperience: 10,
                civilStatus: "Married",
                dependents: 2,
                sector: "Finance",
                employeeCount: "500+",
                multinational: true,
                jobTitle: "Financial Analyst",
                jobDescription: "Corporate finance and risk management",
                seniority: 8,
                officialHours: 38,
                averageHours: 45,
                shiftDescription: "Regular office hours",
                onCall: "Rarely",
                vacationDays: 24,
                currency: "EUR",
                grossSalary: 5200,
                netSalary: 3200,
                netCompensation: 3600,
                thirteenthMonth: "Yes",
                mealVouchers: 160,
                ecoCheques: 250,
                groupInsurance: "Yes",
                otherInsurances: "Full package",
                otherBenefits: "Bonus scheme, laptop",
                workCity: "Brussels",
                commuteDistance: "25",
                commuteMethod: "Train",
                commuteCompensation: "Train subscription",
                teleworkDays: 2,
                dayOffEase: "Medium",
                stressLevel: "High",
                reports: 3,
                isManualEntry: true,
                reviewStatus: "APPROVED" as const,
            },
            {
                country: "Belgium",
                subreddit: "BESalary",
                age: 26,
                education: "Bachelor's degree",
                workExperience: 3,
                civilStatus: "Single",
                dependents: 0,
                sector: "Marketing",
                employeeCount: "50-100",
                multinational: false,
                jobTitle: "Marketing Specialist",
                jobDescription: "Digital marketing and social media",
                seniority: 2,
                officialHours: 38,
                averageHours: 38,
                shiftDescription: "Regular office hours",
                onCall: "Never",
                vacationDays: 20,
                currency: "EUR",
                grossSalary: 3200,
                netSalary: 2100,
                netCompensation: 2300,
                thirteenthMonth: "No",
                mealVouchers: 140,
                ecoCheques: 250,
                groupInsurance: "Basic",
                otherInsurances: "Hospitalization",
                otherBenefits: "Laptop",
                workCity: "Ghent",
                commuteDistance: "5",
                commuteMethod: "Bike",
                commuteCompensation: "Bike allowance",
                teleworkDays: 2,
                dayOffEase: "Easy",
                stressLevel: "Low",
                reports: 0,
                isManualEntry: true,
                reviewStatus: "APPROVED" as const,
            },
            // Entry with anomaly (for testing anomaly detection)
            {
                country: "Belgium",
                subreddit: "BESalary",
                age: 22,
                education: "High school",
                workExperience: 1,
                civilStatus: "Single",
                dependents: 0,
                sector: "Technology",
                employeeCount: "10-50",
                multinational: false,
                jobTitle: "Junior Developer",
                jobDescription: "Entry level position",
                seniority: 1,
                officialHours: 38,
                averageHours: 38,
                shiftDescription: "Regular office hours",
                onCall: "Never",
                vacationDays: 20,
                currency: "EUR",
                grossSalary: 15000, // Anomaly: unrealistic salary
                netSalary: 9000,
                netCompensation: 10000,
                thirteenthMonth: "Yes",
                mealVouchers: 160,
                ecoCheques: 250,
                groupInsurance: "No",
                otherBenefits: "Laptop",
                workCity: "Brussels",
                commuteDistance: "10",
                commuteMethod: "Public transport",
                commuteCompensation: "Train subscription",
                teleworkDays: 1,
                dayOffEase: "Easy",
                stressLevel: "Low",
                reports: 0,
                isManualEntry: true,
                reviewStatus: "NEEDS_REVIEW" as const,
                anomalyScore: 0.95,
                anomalyReason: "Salary significantly higher than expected for experience level",
            },
        ];

        const insertedEntries = await db
            .insert(salaryEntries)
            .values(
                salaryEntryData.map((entry) => ({
                    ...entry,
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
                })) as any
            )
            .returning();

        console.log(`   ✓ Created ${insertedEntries.length} salary entries`);

        // Seed comments
        console.log("💬 Seeding comments...");
        const commentData = [
            // Comments for the Reddit scraped entry (last entry)
            {
                salaryEntryId: insertedEntries.at(-1)!.id,
                externalId: "comment1",
                body: "Great salary! How did you negotiate that?",
                author: "user123",
                score: 15,
                depth: 0,
                parentId: null,
            },
            {
                salaryEntryId: insertedEntries.at(-1)!.id,
                externalId: "comment2",
                body: "Thanks! It took years of experience and specialization.",
                author: "OP",
                score: 8,
                depth: 1,
                parentId: null, // Will be set after first comment is inserted
            },
            {
                salaryEntryId: insertedEntries.at(-1)!.id,
                externalId: "comment3",
                body: "The on-call frequency seems very high. How do you manage work-life balance?",
                author: "concerned_user",
                score: 22,
                depth: 0,
                parentId: null,
            },
            {
                salaryEntryId: insertedEntries.at(-1)!.id,
                externalId: "comment4",
                body: "It's challenging, but the compensation helps. Plus I love what I do.",
                author: "OP",
                score: 12,
                depth: 1,
                parentId: null, // Will be set after third comment is inserted
            },
        ];

        // Insert first comment
        const [comment1] = await db
            .insert(comments)
            .values([
                {
                    ...commentData[0],
                    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                },
            ])
            .returning();

        // Insert reply to first comment
        await db
            .insert(comments)
            .values([
                {
                    ...commentData[1],
                    parentId: comment1.id,
                    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
                },
            ]);

        // Insert third comment
        const [comment3] = await db
            .insert(comments)
            .values([
                {
                    ...commentData[2],
                    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                },
            ])
            .returning();

        // Insert reply to third comment
        await db.insert(comments).values([
            {
                ...commentData[3],
                parentId: comment3.id,
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            },
        ]);

        console.log(`   ✓ Created ${commentData.length} comments with threaded replies`);

        // Seed reports
        console.log("📋 Seeding reports...");
        const reportData = [
            {
                title: "Bug: Salary filter not working on mobile",
                description:
                    "When I try to use the salary range filter on my iPhone, it doesn't apply the filter correctly. The slider seems unresponsive.",
                type: "BUG" as const,
                status: "IN_PROGRESS" as const,
                priority: "HIGH" as const,
                trackingId: "BUG-001",
                email: "user1@example.com",
            },
            {
                title: "Feature: Add export to CSV functionality",
                description:
                    "It would be great to be able to export the filtered salary data to a CSV file for further analysis in Excel.",
                type: "FEATURE" as const,
                status: "TODO" as const,
                priority: "MEDIUM" as const,
                trackingId: "FEAT-001",
                email: "user2@example.com",
            },
            {
                title: "Improvement: Better mobile navigation",
                description:
                    "The navigation menu on mobile could be improved. Consider adding a hamburger menu for better UX.",
                type: "IMPROVEMENT" as const,
                status: "TODO" as const,
                priority: "LOW" as const,
                trackingId: "IMP-001",
                email: null,
            },
            {
                title: "Bug: Translation missing on dashboard",
                description: "Some fields on the dashboard are not translated to Dutch.",
                type: "BUG" as const,
                status: "DONE" as const,
                priority: "MEDIUM" as const,
                trackingId: "BUG-002",
                email: "user3@example.com",
            },
            {
                title: "Feature: Add comparison tool",
                description:
                    "Would love to see a feature where I can compare my salary with the average in my sector and region.",
                type: "FEATURE" as const,
                status: "TODO" as const,
                priority: "HIGH" as const,
                trackingId: "FEAT-002",
                email: "user4@example.com",
            },
        ];

        await db.insert(reports).values(
            reportData.map((report) => ({
                ...report,
                createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
            }))
        );
        console.log(`   ✓ Created ${reportData.length} reports`);

        // Seed newsletter subscribers
        console.log("📧 Seeding newsletter subscribers...");
        const subscriberData = [
            { email: "subscriber1@example.com", isActive: true },
            { email: "subscriber2@example.com", isActive: true },
            { email: "subscriber3@example.com", isActive: false },
            { email: "subscriber4@example.com", isActive: true },
            { email: "subscriber5@example.com", isActive: true },
        ];

        await db.insert(newsletterSubscribers).values(
            subscriberData.map((subscriber) => ({
                ...subscriber,
                subscribedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
            }))
        );
        console.log(`   ✓ Created ${subscriberData.length} newsletter subscribers`);

        console.log("\n✅ Database seeding completed successfully!");
        console.log("\n📊 Summary:");
        console.log(`   • ${insertedEntries.length} salary entries`);
        console.log(`   • ${commentData.length} comments`);
        console.log(`   • ${reportData.length} reports`);
        console.log(`   • 1 admin user`);
        console.log(`   • Cities loaded from CSV (or fallback)`);
        console.log(`   • ${exchangeRateData.length} exchange rates`);
        console.log(`   • ${subscriberData.length} newsletter subscribers`);
        console.log("\n🔑 Admin credentials:");
        console.log("   Email: admin@wagewatchers.dev");
        console.log("   Password: admin123");
        console.log("\n⚠️  Remember to change the admin password in production!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void seed();
