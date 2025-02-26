import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { organizationsTable } from "./organizations";

export const customFieldsTable = pgTable("custom_fields", {
	/**
	 * Primary unique identifier of the custom field.
	 */
	id: uuid("id").primaryKey().$default(uuidv7),

	/**
	 * Name of the custom field.
	 */
	name: text("name").notNull(),

	/**
	 * Type of the custom field (e.g., 'text', 'number', 'date', etc.).
	 */
	type: text("type").notNull(),

	/**
	 * Foreign key reference to the organization this custom field belongs to.
	 */
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organizationsTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),

	/**
	 * Date time at the time the custom field was created.
	 */
	createdAt: timestamp("created_at", {
		mode: "date",
		precision: 3,
		withTimezone: true,
	})
		.notNull()
		.defaultNow(),

	/**
	 * Date time at the time the custom field was last updated.
	 */
	updatedAt: timestamp("updated_at", {
		mode: "date",
		precision: 3,
		withTimezone: true,
	})
		.$defaultFn(() => sql`${null}`)
		.$onUpdate(() => new Date()),
});

export const customFieldsTableRelations = relations(
	customFieldsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `custom_fields` table to `organizations` table.
		 */
		organization: one(organizationsTable, {
			fields: [customFieldsTable.organizationId],
			references: [organizationsTable.id],
			relationName: "custom_fields.organization_id:organizations.id",
		}),
	}),
);

export const customFieldsTableInsertSchema = createInsertSchema(
	customFieldsTable,
	{
		name: (schema) => schema.min(1).max(256),
		type: (schema) => schema.min(1).max(64),
	},
);
