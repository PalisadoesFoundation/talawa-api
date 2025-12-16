import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for refresh_tokens.
 * Stores refresh tokens for JWT authentication with short-lived access tokens.
 */
export const refreshTokensTable = pgTable(
	"refresh_tokens",
	{
		/**
		 * Primary unique identifier of the refresh token.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Hash of the refresh token (never store raw token).
		 */
		tokenHash: text("token_hash").notNull(),
		/**
		 * Foreign key reference to the user this refresh token belongs to.
		 */
		userId: uuid("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		/**
		 * Date and time when the refresh token expires.
		 */
		expiresAt: timestamp("expires_at", {
			withTimezone: true,
			mode: "date",
			precision: 3,
		}).notNull(),
		/**
		 * Date and time when the refresh token was revoked (null if not revoked).
		 */
		revokedAt: timestamp("revoked_at", {
			withTimezone: true,
			mode: "date",
			precision: 3,
		}),
		/**
		 * Date and time when the refresh token was created.
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
		index("refresh_tokens_user_id_idx").on(self.userId),
		index("refresh_tokens_token_hash_idx").on(self.tokenHash),
		index("refresh_tokens_expires_at_idx").on(self.expiresAt),
	],
);

export const refreshTokensTableRelations = relations(
	refreshTokensTable,
	({ one }) => ({
		user: one(usersTable, {
			fields: [refreshTokensTable.userId],
			references: [usersTable.id],
			relationName: "refresh_tokens.user_id:users.id",
		}),
	}),
);

export const refreshTokensTableInsertSchema = createInsertSchema(
	refreshTokensTable,
	{
		tokenHash: (schema) => schema.min(1),
		userId: (schema) => schema.uuid(),
		expiresAt: (schema) => schema,
	},
);
