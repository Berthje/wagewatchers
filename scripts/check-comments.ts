import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkComments() {
    console.log("\n📊 Checking entries with comments...\n");

    const entriesWithComments = await prisma.salaryEntry.findMany({
        where: {
            isManualEntry: false,
            source: {
                contains: "Reddit",
            },
        },
        include: {
            _count: {
                select: { comments: true },
            },
        },
        orderBy: {
            id: "asc",
        },
    });

    console.log(`Found ${entriesWithComments.length} Reddit entries:\n`);

    for (const entry of entriesWithComments) {
        const commentCount = entry._count.comments;
        if (commentCount > 0) {
            console.log(`✅ Entry #${entry.id}`);
            console.log(`   Job: ${entry.jobTitle}`);
            console.log(`   Sector: ${entry.sector}`);
            console.log(`   Salary: €${entry.grossSalary?.toLocaleString()}`);
            console.log(`   Comments: ${commentCount} 💬`);
            console.log(
                `   View at: http://localhost:3000/en/dashboard/${entry.id}\n`,
            );
        }
    }

    // Get a sample of comments to show structure
    const sampleComments = await prisma.comment.findMany({
        where: {
            salaryEntryId: entriesWithComments[0]?.id,
            depth: 0, // Only top-level
        },
        take: 3,
        include: {
            replies: {
                take: 2,
            },
        },
    });

    if (sampleComments.length > 0) {
        console.log("\n📝 Sample comment thread from first entry:\n");
        for (const comment of sampleComments) {
            console.log(
                `👤 ${comment.author}: "${comment.body.substring(0, 80)}..."`,
            );
            console.log(`   ↑ ${comment.score} points`);
            if (comment.replies && comment.replies.length > 0) {
                for (const reply of comment.replies) {
                    console.log(
                        `   └─ 👤 ${reply.author}: "${
                            reply.body.substring(0, 60)
                        }..."`,
                    );
                }
            }
            console.log("");
        }
    }

    await prisma.$disconnect();
}

checkComments().catch(console.error);
