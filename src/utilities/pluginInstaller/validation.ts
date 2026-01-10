import type { Readable } from "node:stream";
import type { Entry, ZipFile } from "yauzl";
import yauzl from "yauzl";
import type { IPluginManifest } from "~/src/plugin/types";
import { pluginIdSchema } from "../validators";
import type { PluginZipStructure } from "./types";

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

											// Validate pluginId from manifest
											const validation = pluginIdSchema.safeParse(
												manifest.pluginId,
											);
											if (!validation.success) {
												reject(
													new Error(
														`Invalid plugin ID in manifest: ${validation.error.message}`,
													),
												);
												return;
											}

											structure.apiManifest = manifest;
											structure.pluginId = manifest.pluginId;
										} catch (_error) {
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
