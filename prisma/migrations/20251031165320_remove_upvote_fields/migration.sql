-- Drop upvote columns from SalaryEntry
ALTER TABLE "SalaryEntry" DROP COLUMN "upvoteCount";
ALTER TABLE "SalaryEntry" DROP COLUMN "redditUpvotes";

-- DropTable
DROP TABLE "Upvote";