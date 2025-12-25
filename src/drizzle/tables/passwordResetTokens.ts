import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for password_reset_tokens.
 * Stores password reset tokens for secure password recovery flow.
 */
export const passwordResetTokensTable = pgTable(
    "password_reset_tokens",
    {
        /**
         * Primary unique identifier of the password reset token.
         */
        id: uuid("id").primaryKey().$default(uuidv7),
        /**
         * Hash of the password reset token (never store raw token).
         */
        tokenHash: text("token_hash").notNull(),
        /**
         * Foreign key reference to the user this password reset token belongs to.
         */
        userId: uuid("user_id")
            .notNull()
            .references(() => usersTable.id, { onDelete: "cascade" }),
        /**
         * Date and time when the password reset token expires.
         */
        expiresAt: timestamp("expires_at", {
            withTimezone: true,
            mode: "date",
            precision: 3,
        }).notNull(),
        /**
         * Date and time when the password reset token was used (null if not used).
         */
        usedAt: timestamp("used_at", {
            withTimezone: true,
            mode: "date",
            precision: 3,
        }),
        /**
         * Date and time when the password reset token was created.
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
        index("password_reset_tokens_user_id_idx").on(self.userId),
        index("password_reset_tokens_token_hash_idx").on(self.tokenHash),
        index("password_reset_tokens_expires_at_idx").on(self.expiresAt),
    ],
);

export const passwordResetTokensTableRelations = relations(
    passwordResetTokensTable,
    ({ one }) => ({
        user: one(usersTable, {
            fields: [passwordResetTokensTable.userId],
            references: [usersTable.id],
            relationName: "password_reset_tokens.user_id:users.id",
        }),
    }),
);

export const passwordResetTokensTableInsertSchema = createInsertSchema(
    passwordResetTokensTable,
    {
        tokenHash: (schema) => schema.min(1),
        userId: (schema) => schema.uuid(),
        expiresAt: (schema) => schema,
    },
);
