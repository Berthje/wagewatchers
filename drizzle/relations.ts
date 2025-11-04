import { relations } from "drizzle-orm/relations";
import { comment, salaryEntry } from "./schema";

export const commentRelations = relations(comment, ({one, many}) => ({
	comment: one(comment, {
		fields: [comment.parentId],
		references: [comment.id],
		relationName: "comment_parentId_comment_id"
	}),
	comments: many(comment, {
		relationName: "comment_parentId_comment_id"
	}),
	salaryEntry: one(salaryEntry, {
		fields: [comment.salaryEntryId],
		references: [salaryEntry.id]
	}),
}));

export const salaryEntryRelations = relations(salaryEntry, ({many}) => ({
	comments: many(comment),
}));