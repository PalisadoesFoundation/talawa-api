import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { eq } from "drizzle-orm";
import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { getPluginManagerInstance } from "~/src/plugin/registry";
import type { IPluginManifest } from "~/src/plugin/types";
import {
	createPluginTables,
	loadPluginManifest,
	safeRequire,
} from "~/src/plugin/utils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

import type { Readable } from "node:stream";

import yauzl, { type Entry, type ZipFile } from "yauzl";

// Use the actual Drizzle client type from the schema
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as drizzleSchema from "~/src/drizzle/schema";

type DrizzleClientInterface = PostgresJsDatabase<typeof drizzleSchema>;

export interface PluginInstallationOptions {
	zipFile: FileUpload;
	drizzleClient: DrizzleClientInterface;
	activate?: boolean;
	userId: string;
}

export interface PluginZipStructure {
	hasApiFolder: boolean;
	apiManifest?: IPluginManifest;
	pluginId?: string;
}

/**
 * Validates the structure of a plugin zip file (API-only)
 */
export async function validatePluginZip(
	zipPath: string,
): Promise<PluginZipStructure> {
	return new Promise((resolve, reject) => {
		yauzl.open(
			zipPath,
			{ lazyEntries: true },
			(err: Error | null, zipfile: ZipFile) => {
				if (err) {
					reject(new Error(`Failed to open zip file: ${err.message}`));
					return;
				}

				if (!zipfile) {
					reject(new Error("Invalid zip file"));
					return;
				}

				const structure: PluginZipStructure = {
					hasApiFolder: false,
				};

				zipfile.readEntry();

				zipfile.on("entry", (entry?: Entry) => {
					if (!entry) return;
					const fileName = entry.fileName;

					// Check for API folder structure
					if (fileName.startsWith("api/")) {
						structure.hasApiFolder = true;

						// Check for API manifest
						if (fileName === "api/manifest.json") {
							zipfile.openReadStream(
								entry,
								(err: Error | null, readStream: Readable | undefined) => {
									if (err) {
										reject(err);
										return;
									}

									if (!readStream) {
										reject(new Error("Failed to read manifest"));
										return;
									}

									let manifestContent = "";
									readStream.on("data", (chunk: string | Buffer) => {
										manifestContent += chunk.toString();
									});

									readStream.on("end", () => {
										try {
											const manifest = JSON.parse(
												manifestContent,
											) as IPluginManifest;
											structure.apiManifest = manifest;
											structure.pluginId = manifest.pluginId;
										} catch (error) {
											reject(new Error("Invalid API manifest.json"));
											return;
										}
									});

									readStream.on("error", reject);
								},
							);
						}
					}

					zipfile.readEntry();
				});

				zipfile.on("end", () => {
					resolve(structure);
				});

				zipfile.on("error", reject);
			},
		);
	});
}

/**
 * Extracts API plugin files from zip to the available directory
 */
export async function extractPluginZip(
	zipPath: string,
	pluginId: string,
	structure: PluginZipStructure,
): Promise<void> {
	const apiPluginPath = join(process.cwd(), "src/plugin/available", pluginId);

	return new Promise((resolve, reject) => {
		yauzl.open(
			zipPath,
			{ lazyEntries: true },
			(err: Error | null, zipfile: ZipFile) => {
				if (err) {
					reject(new Error(`Failed to open zip file: ${err.message}`));
					return;
				}

				if (!zipfile) {
					reject(new Error("Invalid zip file"));
					return;
				}

				const extractPromises: Promise<void>[] = [];

				zipfile.readEntry();

				zipfile.on("entry", (entry?: Entry) => {
					if (!entry) return;
					const fileName = entry.fileName;

					// Handle API files only
					if (fileName.startsWith("api/") && structure.hasApiFolder) {
						const relativePath = fileName.substring(4); // Remove "api/" prefix
						if (relativePath && !fileName.endsWith("/")) {
							const targetPath = join(apiPluginPath, relativePath);

							extractPromises.push(
								new Promise<void>((resolveExtract, rejectExtract) => {
									zipfile.openReadStream(
										entry,
										async (
											err: Error | null,
											readStream: Readable | undefined,
										) => {
											if (err) {
												rejectExtract(err);
												return;
											}

											if (!readStream) {
												rejectExtract(new Error("Failed to read entry"));
												return;
											}

											try {
												// Ensure directory exists
												await mkdir(dirname(targetPath), { recursive: true });

												// Extract file
												const writeStream = createWriteStream(targetPath);
												await pipeline(readStream, writeStream);
												resolveExtract();
											} catch (error) {
												rejectExtract(error);
											}
										},
									);
								}),
							);
						}
					}

					zipfile.readEntry();
				});

				zipfile.on("end", async () => {
					try {
						await Promise.all(extractPromises);
						resolve();
					} catch (error) {
						reject(error);
					}
				});

				zipfile.on("error", reject);
			},
		);
	});
}

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

		// Create plugin-defined database tables after file extraction
		try {
			// Load plugin manifest from extracted files
			const pluginsDirectory = join(
				process.cwd(),
				"src",
				"plugin",
				"available",
			);
			const pluginPath = join(pluginsDirectory, pluginId);

			console.log("Loading plugin manifest for table creation:", pluginId);
			let manifest: IPluginManifest;
			try {
				manifest = await loadPluginManifest(pluginPath);
				console.log("Plugin manifest loaded:", manifest);
			} catch (error) {
				console.error(`Failed to load manifest for ${pluginId}:`, error);
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "pluginZip"],
								message:
									"Plugin manifest not found or invalid after extraction. Ensure plugin structure is correct.",
							},
						],
					},
				});
			}

			// Create plugin-defined tables if they exist
			if (
				manifest.extensionPoints?.database &&
				manifest.extensionPoints.database.length > 0
			) {
				console.log(`Creating plugin-defined tables for: ${pluginId}`);

				const tableDefinitions: Record<string, Record<string, unknown>> = {};

				// Load each table definition
				for (const tableExtension of manifest.extensionPoints.database) {
					console.log(
						"Loading table definition:",
						tableExtension.name,
						"from",
						tableExtension.file,
					);

					const tableFilePath = join(pluginPath, tableExtension.file);
					const tableModule =
						await safeRequire<Record<string, Record<string, unknown>>>(
							tableFilePath,
						);

					if (!tableModule) {
						throw new Error(
							`Failed to load table file: ${tableExtension.file}`,
						);
					}

					const tableDefinition = tableModule[tableExtension.name] as Record<
						string,
						unknown
					>;
					if (!tableDefinition) {
						throw new Error(
							`Table '${tableExtension.name}' not found in file: ${tableExtension.file}`,
						);
					}

					tableDefinitions[tableExtension.name] = tableDefinition;
					console.log("Table definition loaded:", tableExtension.name);
				}

				// Create the plugin-defined tables
				try {
					await createPluginTables(
						options.drizzleClient as {
							execute: (sql: string) => Promise<unknown>;
						},
						pluginId,
						tableDefinitions,
						console, // Using console as logger
					);
					console.log(
						"Successfully created plugin-defined tables for:",
						pluginId,
					);
				} catch (error) {
					console.error(`Failed to create tables for ${pluginId}:`, error);
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "pluginZip"],
									message:
										"Failed to create plugin database tables during installation",
								},
							],
						},
					});
				}
			} else {
				console.log("No plugin-defined tables found for:", pluginId);
			}
		} catch (error) {
			// Re-throw TalawaGraphQLError as-is
			if (error instanceof TalawaGraphQLError) {
				throw error;
			}
			// Handle other errors
			console.error(
				`Error during plugin table creation for ${pluginId}:`,
				error,
			);
			throw new TalawaGraphQLError({
				extensions: {
					code: "forbidden_action_on_arguments_associated_resources",
					issues: [
						{
							argumentPath: ["input", "pluginZip"],
							message: `Plugin table creation failed: ${
								error instanceof Error ? error.message : "Unknown error"
							}`,
						},
					],
				},
			});
		}

		// Create or update plugin record in database
		let plugin: unknown;
		if (existingPlugin) {
			const [updatedPlugin] = await options.drizzleClient
				.update(pluginsTable)
				.set({
					isInstalled: true,
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
					isInstalled: true,
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
