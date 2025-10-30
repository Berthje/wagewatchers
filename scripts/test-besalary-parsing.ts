/**
 * Test BESalary Template Parsing
 *
 * This script tests the parsing of BESalary formatted posts
 */

import { parseRedditPost } from "../src/lib/reddit-scraper";

// Mock submission object
const mockSubmission = {
    title: "My salary as a Software Developer in Belgium",
    selftext: `
1. PERSONALIA

Age: 28

Education: Master's Degree in Computer Science

Work experience: 5 years

Civil status: Single

Dependent people/children: 0

2. EMPLOYER PROFILE

Sector/Industry: IT/Technology

Amount of employees: 250

Multinational? Yes

3. CONTRACT & CONDITIONS

Current job title: Senior Software Developer

Job description: Full-stack development with React and Node.js

Seniority: 5 years

Official hours/week: 40

Average real hours/week incl. overtime: 42

Shiftwork or 9 to 5 (flexible?): Flexible hours, mostly 9-5

On-call duty: Rarely, about once every 2 months

Vacation days/year: 20

4. SALARY

Gross salary/month: 4500

Net salary/month: 2800

Netto compensation: 3200

Car/bike/... or mobility budget: Company car (Audi A3)

13th month (full? partial?): Full 13th month

Meal vouchers: 8

Ecocheques: 250

Group insurance: 3% employer contribution

Other insurances: Hospitalization insurance

Other benefits (bonuses, stocks options, ...): Performance bonus up to 10%

5. MOBILITY

City/region of work: Brussels

Distance home-work: 20km

How do you commute? Company car

How is the travel home-work compensated: Full fuel card

Telework days/week: 3

6. OTHER

How easily can you plan a day off: Easy, just need to inform manager

Is your job stressful? Medium stress, deadlines can be tight

Responsible for personnel (reports): 2
    `,
    permalink: "/r/BESalary/comments/test123/my_salary",
    created_utc: Date.now() / 1000,
} as any;

console.log("🧪 Testing BESalary Template Parsing\n");
console.log("=".repeat(60));

const result = parseRedditPost(mockSubmission, "BESalary");

if (!result) {
    console.error("❌ Failed to parse post!");
    process.exit(1);
}

console.log("\n✅ Parsing successful! Results:\n");

// Check each field
const expectedValues = {
    "Country": "Belgium",
    "Subreddit": "BESalary",
    "Age": 28,
    "Education": "Master's Degree in Computer Science",
    "Work Experience": 5,
    "Civil Status": "Single",
    "Dependents": 0,
    "Sector": "IT/Technology",
    "Employee Count": "250",
    "Multinational": true,
    "Job Title": "Senior Software Developer",
    "Job Description": "Full-stack development with React and Node.js",
    "Seniority": 5,
    "Official Hours": 40,
    "Average Hours": 42,
    "Shift Description": "Flexible hours, mostly 9-5",
    "On Call": "Rarely, about once every 2 months",
    "Vacation Days": 20,
    "Gross Salary": 4500,
    "Net Salary": 2800,
    "Net Compensation": 3200,
    "Mobility": "Company car (Audi A3)",
    "13th Month": "Full 13th month",
    "Meal Vouchers": 8,
    "Eco Cheques": 250,
    "Group Insurance": "3% employer contribution",
    "Other Insurances": "Hospitalization insurance",
    "Other Benefits": "Performance bonus up to 10%",
    "Work City": "Brussels",
    "Commute Distance": "20km",
    "Commute Method": "Company car",
    "Commute Compensation": "Full fuel card",
    "Telework Days": 3,
    "Day Off Ease": "Easy, just need to inform manager",
    "Stress Level": "Medium stress, deadlines can be tight",
    "Reports": 2,
};

const fieldMapping: Record<string, keyof typeof result> = {
    "Country": "country",
    "Subreddit": "subreddit",
    "Age": "age",
    "Education": "education",
    "Work Experience": "workExperience",
    "Civil Status": "civilStatus",
    "Dependents": "dependents",
    "Sector": "sector",
    "Employee Count": "employeeCount",
    "Multinational": "multinational",
    "Job Title": "jobTitle",
    "Job Description": "jobDescription",
    "Seniority": "seniority",
    "Official Hours": "officialHours",
    "Average Hours": "averageHours",
    "Shift Description": "shiftDescription",
    "On Call": "onCall",
    "Vacation Days": "vacationDays",
    "Gross Salary": "grossSalary",
    "Net Salary": "netSalary",
    "Net Compensation": "netCompensation",
    "Mobility": "mobility",
    "13th Month": "thirteenthMonth",
    "Meal Vouchers": "mealVouchers",
    "Eco Cheques": "ecoCheques",
    "Group Insurance": "groupInsurance",
    "Other Insurances": "otherInsurances",
    "Other Benefits": "otherBenefits",
    "Work City": "workCity",
    "Commute Distance": "commuteDistance",
    "Commute Method": "commuteMethod",
    "Commute Compensation": "commuteCompensation",
    "Telework Days": "teleworkDays",
    "Day Off Ease": "dayOffEase",
    "Stress Level": "stressLevel",
    "Reports": "reports",
};

let passed = 0;
let failed = 0;

for (const [label, expected] of Object.entries(expectedValues)) {
    const field = fieldMapping[label];
    const actual = result[field];

    if (actual === expected) {
        console.log(`✓ ${label.padEnd(25)} ${actual}`);
        passed++;
    } else {
        console.log(
            `✗ ${label.padEnd(25)} Expected: ${expected}, Got: ${actual}`,
        );
        failed++;
    }
}

console.log("\n" + "=".repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    console.log("\n⚠️  Some fields were not parsed correctly.");
    console.log("Check the parsing logic in src/lib/reddit-scraper.ts");
    process.exit(1);
} else {
    console.log("\n🎉 All fields parsed correctly!");
}
