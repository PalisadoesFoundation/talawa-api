import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";

/**
 * Drizzle orm postgres table definition for plugins.
 */
export const pluginsTable = pgTable(
	"plugins",
	{
		/**
		 * Primary unique identifier of the plugin.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Unique identifier of the plugin type.
		 */
		pluginId: text("plugin_id").notNull().unique(),

		/**
		 * Whether the plugin is activated.
		 */
		isActivated: boolean("is_activated").notNull().default(false),

		/**
		 * Whether the plugin is installed.
		 */
		isInstalled: boolean("is_installed").notNull().default(true),

		/**
		 * Whether the plugin is a backup.
		 */
		backup: boolean("backup").notNull().default(false),

		/**
		 * Date time at the time the plugin was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time at the time the plugin was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
	},
	(self) => [
		index().on(self.pluginId),
		index().on(self.isActivated),
		index().on(self.isInstalled),
	],
);

/**
 * Relations for the plugins table.
 */
// export const pluginsTableRelations = relations(pluginsTable, ({}) => ({}));
