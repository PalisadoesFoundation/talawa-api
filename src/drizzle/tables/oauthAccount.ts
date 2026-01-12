import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	pgTable,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import type { OAuthAccountProfile } from "~/src/types/oauthAccount";
import { usersTable } from "./users";

/**
 * OAuth account linkages table
 * Stores provider-specific account information linked to users
 */
export const oauthAccountsTable = pgTable(
	"oauth_accounts",
	{
		/**
		 * Primary unique identifier of the OAuth account.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Foreign key reference to the id of the user who owns this OAuth account.
		 */
		userId: uuid("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),

		/**
		 * OAuth provider name (e.g., google, github, etc.).
		 */
		provider: varchar("provider", { length: 50 }).notNull(),

		/**
		 * Provider-specific user identifier.
		 */
		providerId: varchar("provider_id", { length: 255 }).notNull(),

		/**
		 * Email address associated with the OAuth account from the provider.
		 */
		email: varchar("email", { length: 255 }).notNull(),

		/**
		 * Additional profile data from the OAuth provider stored as JSON.
		 */
		profile: jsonb("profile").$type<OAuthAccountProfile>(),

		/**
		 * Date time when the OAuth account was first linked to the user.
		 */
		linkedAt: timestamp("linked_at", {
			withTimezone: true,
			mode: "date",
			precision: 3,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Date time when the OAuth account was last used for authentication.
		 */
		lastUsedAt: timestamp("last_used_at", {
			withTimezone: true,
			mode: "date",
			precision: 3,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => {
		return {
			// Compound unique index: ensures each external provider account
			// (provider + providerId) is only linked once
			providerUserUnique: unique(
				"oauth_accounts_provider_provider_id_unique",
			).on(table.provider, table.providerId),

			// Index for efficient user lookups
			userIdIdx: index("oauth_accounts_user_id_idx").on(table.userId),

			// Index for provider lookups
			providerIdx: index("oauth_accounts_provider_idx").on(table.provider),
		};
	},
);

/**
 * Relations definition for Drizzle ORM
 */
export const oauthAccountsTableRelations = relations(
	oauthAccountsTable,
	({ one }) => ({
		user: one(usersTable, {
			fields: [oauthAccountsTable.userId],
			references: [usersTable.id],
			relationName: "oauth_accounts.user_id:users.id",
		}),
	}),
);

export const oauthAccountsTableInsertSchema =
	createInsertSchema(oauthAccountsTable);
