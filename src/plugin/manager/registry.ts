/**
 * Plugin Registry Manager
 *
 * Handles database operations for plugins including fetching, updating,
 * and managing plugin state in the database.
 */

import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";

import type { IDatabaseClient, IPluginContext } from "../types";

export class PluginRegistry {
	constructor(private pluginContext: IPluginContext) {}

	/**
	 * Get plugin from database
	 */
	public async getPluginFromDatabase(
		pluginId: string,
	): Promise<typeof pluginsTable.$inferSelect | null> {
		try {
			const queryBuilder = (this.pluginContext.db as IDatabaseClient)
				.select()
				.from(pluginsTable);
			const results = (await queryBuilder.where(
				eq(pluginsTable.pluginId, pluginId),
			)) as Array<typeof pluginsTable.$inferSelect>;

			return results[0] || null;
		} catch (error) {
			this.pluginContext.logger.error?.({
				msg: "Error fetching plugin from database",
				err: error,
			});
			return null;
		}
	}

	/**
	 * Update plugin in database
	 */
	public async updatePluginInDatabase(
		pluginId: string,
		updates: Partial<typeof pluginsTable.$inferInsert>,
	): Promise<void> {
		try {
			const updateBuilder = (this.pluginContext.db as IDatabaseClient)
				.update(pluginsTable)
				.set(updates);
			await updateBuilder.where(eq(pluginsTable.pluginId, pluginId));
		} catch (error) {
			this.pluginContext.logger.error?.({
				msg: "Error updating plugin in database",
				err: error,
			});
			throw error;
		}
	}
}
