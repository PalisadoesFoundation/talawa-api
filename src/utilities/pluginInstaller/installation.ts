import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { getPluginManagerInstance } from "~/src/plugin/registry";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { extractPluginZip } from "./extraction";
import type { PluginInstallationOptions } from "./types";
import { validatePluginZip } from "./validation";

/**
 * Installs a plugin from a zip file (API-only)
 */
export async function installPluginFromZip(
	options: PluginInstallationOptions,
): Promise<{ plugin: unknown }> {
	// Save uploaded file temporarily
	const tempId = ulid();
	const tempPath = join(process.cwd(), "temp", `${tempId}.zip`);

	try {
		// Ensure temp directory exists
		await mkdir(dirname(tempPath), { recursive: true });

		// Save uploaded file
		const { createReadStream } = await options.zipFile;
		const stream = createReadStream();
		const writeStream = createWriteStream(tempPath);
		await pipeline(stream, writeStream);

		// Validate zip structure
		const structure = await validatePluginZip(tempPath);

		// Validate that the zip contains API folder
		if (!structure.hasApiFolder) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "invalid_arguments",
					issues: [
						{
							argumentPath: ["input", "pluginZip"],
							message:
								"Zip file must contain 'api' folder with valid plugin structure",
						},
					],
				},
			});
		}

		const pluginId = structure.pluginId || "";
		if (!pluginId) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "invalid_arguments",
					issues: [
						{
							argumentPath: ["pluginId"],
							message: "Plugin ID is required",
						},
					],
				},
			});
		}

		// Check if plugin already exists
		const existingPlugin =
			await options.drizzleClient.query.pluginsTable.findFirst({
				where: eq(pluginsTable.pluginId, pluginId),
			});

		if (existingPlugin) {
			// Deactivate existing plugin if it's active
			const pluginManager = getPluginManagerInstance();
			if (pluginManager?.isPluginActive(pluginId)) {
				await pluginManager.deactivatePlugin(pluginId);
			}
		}

		// Extract plugin files
		await extractPluginZip(tempPath, pluginId, structure);

		console.log(`Plugin files extracted successfully for: ${pluginId}`);

		// Create or update plugin record in database
		let plugin: unknown;
		if (existingPlugin) {
			const [updatedPlugin] = await options.drizzleClient
				.update(pluginsTable)
				.set({
					isInstalled: false, // Changed from true to false - installation handled separately
					updatedAt: new Date(),
				})
				.where(eq(pluginsTable.id, (existingPlugin as { id: string }).id))
				.returning();
			plugin = updatedPlugin;
		} else {
			const [newPlugin] = await options.drizzleClient
				.insert(pluginsTable)
				.values({
					id: ulid(),
					pluginId,
					isActivated: false,
					isInstalled: false, // Changed from true to false - installation handled separately
					backup: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();
			plugin = newPlugin;
		}

		// Load and activate plugin if requested
		if (options.activate) {
			const pluginManager = getPluginManagerInstance();
			if (pluginManager) {
				try {
					// Load plugin
					await pluginManager.loadPlugin(pluginId);

					// Activate plugin
					await pluginManager.activatePlugin(pluginId);
				} catch (error) {
					console.error(`Failed to activate plugin ${pluginId}:`, error);
					// Don't throw error, just log it - plugin is installed but not activated
				}
			}
		}

		// Get the API manifest
		const manifest = structure.apiManifest;
		if (!manifest) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "invalid_arguments",
					issues: [
						{
							argumentPath: ["manifest"],
							message: "Plugin manifest is required",
						},
					],
				},
			});
		}

		return {
			plugin,
		};
	} finally {
		// Clean up temporary file
		try {
			await import("node:fs/promises").then((fs) => fs.unlink(tempPath));
		} catch (error) {
			console.error("Failed to clean up temporary file:", error);
		}
	}
}
