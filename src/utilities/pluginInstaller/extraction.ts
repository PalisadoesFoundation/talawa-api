import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Entry, ZipFile } from "yauzl";
import yauzl from "yauzl";
import type { PluginZipStructure } from "./types";

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

							// Prevent Zip Slip
							if (!targetPath.startsWith(apiPluginPath)) {
								extractPromises.push(
									Promise.reject(
										new Error(
											`Malicious zip entry detected: ${fileName} tries to write outside plugin directory`,
										),
									),
								);
								return;
							}

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
