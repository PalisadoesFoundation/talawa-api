import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for email_verification_tokens.
 * Stores email verification tokens for secure email verification flow.
 */
export const emailVerificationTokensTable = pgTable(
	"email_verification_tokens",
	{
		/**
		 * Primary unique identifier of the email verification token.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Hash of the email verification token (never store raw token).
		 */
		tokenHash: text("token_hash").notNull().unique(),
		/**
		 * Foreign key reference to the user this email verification token belongs to.
		 */
		userId: uuid("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		/**
		 * Date and time when the email verification token expires.
		 */
		expiresAt: timestamp("expires_at", {
			withTimezone: true,
			mode: "date",
			precision: 3,
		}).notNull(),
		/**
		 * Date and time when the email verification token was used (null if not used).
		 */
		usedAt: timestamp("used_at", {
			withTimezone: true,
			mode: "date",
			precision: 3,
		}),
		/**
		 * Date and time when the email verification token was created.
		 */
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
			precision: 3,
		})
			.notNull()
			.defaultNow(),
	},
	(self) => [
		index("email_verification_tokens_user_id_idx").on(self.userId),
		// Note: tokenHash already has .unique() constraint which creates an index automatically
		index("email_verification_tokens_expires_at_idx").on(self.expiresAt),
	],
);

export const emailVerificationTokensTableRelations = relations(
	emailVerificationTokensTable,
	({ one }) => ({
		user: one(usersTable, {
			fields: [emailVerificationTokensTable.userId],
			references: [usersTable.id],
			relationName: "email_verification_tokens.user_id:users.id",
		}),
	}),
);

export const emailVerificationTokensTableInsertSchema = createInsertSchema(
	emailVerificationTokensTable,
	{
		// SHA-256 produces 64-character hex string
		tokenHash: (schema) => schema.length(64),
		userId: (schema) => schema,
		expiresAt: (schema) => schema,
	},
);
