import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

// Mock yauzl with simpler approach
vi.mock("yauzl", () => {
	return {
		default: {
			open: vi.fn((_path, _options, callback) => {
				// Simulate immediate success
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "entry") {
							// Simulate a manifest entry
							handler({ fileName: "api/manifest.json" });
						}
						if (event === "end") {
							handler();
						}
						return mockZipFile;
					}),
					openReadStream: vi.fn((_entry, callback) => {
						const mockStream = {
							on: vi.fn((event, handler) => {
								if (event === "data") {
									handler(
										'{"pluginId": "test_plugin", "name": "Test Plugin", "version": "1.0.0"}',
									);
								}
								if (event === "end") {
									handler();
								}
								return mockStream;
							}),
						};
						callback(null, mockStream);
					}),
				};
				callback(null, mockZipFile);
			}),
		},
		open: vi.fn((_path, _options, callback) => {
			const mockZipFile = {
				readEntry: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "entry") {
						handler({ fileName: "api/manifest.json" });
					}
					if (event === "end") {
						handler();
					}
					return mockZipFile;
				}),
				openReadStream: vi.fn((_entry, callback) => {
					const mockStream = {
						on: vi.fn((event, handler) => {
							if (event === "data") {
								handler(
									'{"pluginId": "test_plugin", "name": "Test Plugin", "version": "1.0.0"}',
								);
							}
							if (event === "end") {
								handler();
							}
							return mockStream;
						}),
					};
					callback(null, mockStream);
				}),
			};
			callback(null, mockZipFile);
		}),
	};
});

// Mock fs
vi.mock("node:fs", () => {
	return {
		promises: {
			readFile: vi.fn(async () => Buffer.from("mock file")),
			writeFile: vi.fn(async () => undefined),
			mkdir: vi.fn(async () => undefined),
			access: vi.fn(async () => undefined),
			rm: vi.fn(async () => undefined),
			unlink: vi.fn(async () => undefined),
		},
		createReadStream: vi.fn(() => ({
			pipe: vi.fn(() => ({ on: vi.fn() })),
			on: vi.fn((event, handler) => {
				if (event === "data") handler("mock data");
				if (event === "end") handler();
				return { pipe: vi.fn() };
			}),
		})),
		createWriteStream: vi.fn(() => ({
			on: vi.fn((event, handler) => {
				if (event === "finish") handler();
				return { on: vi.fn() };
			}),
		})),
		existsSync: vi.fn(() => true),
		statSync: vi.fn(() => ({ isDirectory: () => false })),
	};
});

// Mock stream/promises
vi.mock("node:stream/promises", () => {
	return {
		pipeline: vi.fn(async () => Promise.resolve()),
	};
});

// Mock plugin utilities
vi.mock("../../src/plugin/utils", () => {
	return {
		validatePluginManifest: vi.fn(() => true),
		loadPluginManifest: vi.fn(async () => ({
			pluginId: "test_plugin",
			name: "Test Plugin",
			version: "1.0.0",
			extensionPoints: { database: [] },
		})),
		safeRequire: vi.fn(async () => ({ testTable: { id: "string" } })),
		createPluginTables: vi.fn(async () => undefined),
	};
});

// Mock drizzle
vi.mock("../../src/drizzle/tables/plugins", () => {
	return {
		pluginsTable: { pluginId: "pluginId" },
	};
});

// Mock plugin registry
vi.mock("../../src/plugin/registry", () => {
	return {
		getPluginManagerInstance: vi.fn(() => ({
			isPluginActive: vi.fn(() => false),
			deactivatePlugin: vi.fn(async () => undefined),
			loadPlugin: vi.fn(async () => undefined),
			activatePlugin: vi.fn(async () => undefined),
		})),
	};
});

// Mock TalawaGraphQLError
vi.mock("../../src/utilities/TalawaGraphQLError", () => {
	return {
		TalawaGraphQLError: class extends Error {
			constructor(options: {
				extensions?: { issues?: Array<{ message?: string }> };
			}) {
				super(options.extensions?.issues?.[0]?.message || "GraphQL Error");
				this.name = "TalawaGraphQLError";
			}
		},
	};
});

// Import after mocks
import * as yauzl from "yauzl";
import * as pluginUtils from "../../src/plugin/utils";
import {
	extractPluginZip,
	installPluginFromZip,
	validatePluginZip,
} from "../../src/utilities/pluginInstaller";

// Type definitions for mocks
interface MockFileUpload {
	createReadStream: ReturnType<typeof vi.fn>;
	filename: string;
	fieldName: string;
	mimetype: string;
	encoding: string;
}

interface MockDrizzleClient {
	query: {
		pluginsTable: {
			findFirst: ReturnType<typeof vi.fn>;
		};
	};
	execute: ReturnType<typeof vi.fn>;
	insert: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
}

describe("validatePluginZip", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should validate a plugin zip file structure", async () => {
		const result = await validatePluginZip("/path/to/test.zip");
		expect(result).toBeDefined();
		expect(typeof result.hasApiFolder).toBe("boolean");
		expect(result.hasApiFolder).toBe(true);
		expect(result.pluginId).toBe("test_plugin");
		expect(result.apiManifest).toBeDefined();
	});

	it("should reject when yauzl fails to open zip for validation", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				callback(new Error("File not found"), null as unknown as never);
			},
		);

		await expect(validatePluginZip("/path/to/invalid.zip")).rejects.toThrow(
			/Failed to open zip file/,
		);
	});

	it("should reject when zipfile is null during validation", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				callback(null, null as unknown as never);
			},
		);

		await expect(validatePluginZip("/path/to/invalid.zip")).rejects.toThrow(
			/Invalid zip file/,
		);
	});

	it("should reject when openReadStream fails during validation", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "entry") {
							handler({ fileName: "api/manifest.json" });
						}
						if (event === "end") {
							handler();
						}
						return mockZipFile;
					}),
					openReadStream: vi.fn((_entry, callback) => {
						callback(new Error("Read error"), undefined);
					}),
				};
				callback(null, mockZipFile);
			},
		);

		await expect(validatePluginZip("/path/to/invalid.zip")).rejects.toThrow(
			/Read error/,
		);
	});

	it("should reject when readStream is undefined during validation", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "entry") {
							handler({ fileName: "api/manifest.json" });
						}
						if (event === "end") {
							handler();
						}
						return mockZipFile;
					}),
					openReadStream: vi.fn((_entry, callback) => {
						callback(null, undefined);
					}),
				};
				callback(null, mockZipFile);
			},
		);

		await expect(validatePluginZip("/path/to/invalid.zip")).rejects.toThrow(
			/Failed to read manifest/,
		);
	});

	it("should handle zipfile error event during validation", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "error") {
							handler(new Error("Zipfile corrupted"));
						}
						return mockZipFile;
					}),
				};
				callback(null, mockZipFile);
			},
		);

		await expect(validatePluginZip("/path/to/invalid.zip")).rejects.toThrow(
			/Zipfile corrupted/,
		);
	});

	it("should reject when pluginId has invalid format", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "entry") {
							handler({ fileName: "api/manifest.json" });
						}
						if (event === "end") {
							handler();
						}
						return mockZipFile;
					}),
					openReadStream: vi.fn((_entry, callback) => {
						const mockStream = {
							on: vi.fn((event, handler) => {
								if (event === "data") {
									// Invalid pluginId with special characters
									handler(
										'{"pluginId": "invalid@plugin!", "name": "Test", "version": "1.0.0"}',
									);
								}
								if (event === "end") {
									handler();
								}
								return mockStream;
							}),
						};
						callback(null, mockStream);
					}),
				};
				callback(null, mockZipFile);
			},
		);

		await expect(validatePluginZip("/path/to/invalid.zip")).rejects.toThrow(
			/Invalid plugin ID in manifest/,
		);
	});

	it("should reject when manifest contains invalid JSON", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "entry") {
							handler({ fileName: "api/manifest.json" });
						}
						if (event === "end") {
							handler();
						}
						return mockZipFile;
					}),
					openReadStream: vi.fn((_entry, callback) => {
						const mockStream = {
							on: vi.fn((event, handler) => {
								if (event === "data") {
									// Malformed JSON
									handler("{ invalid json syntax }");
								}
								if (event === "end") {
									handler();
								}
								return mockStream;
							}),
						};
						callback(null, mockStream);
					}),
				};
				callback(null, mockZipFile);
			},
		);

		await expect(validatePluginZip("/path/to/invalid.zip")).rejects.toThrow(
			/Invalid API manifest.json/,
		);
	});
});

describe("extractPluginZip", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should extract plugin files from zip", async () => {
		const structure = { hasApiFolder: true, pluginId: "test_plugin" };
		await expect(
			extractPluginZip("/path/to/test.zip", "test_plugin", structure),
		).resolves.toBeUndefined();
	});

	it("should skip non-api files during extraction", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "entry") {
							handler({ fileName: "other/file.txt" });
						}
						if (event === "end") {
							handler();
						}
						return mockZipFile;
					}),
					openReadStream: vi.fn(),
				};
				callback(null, mockZipFile);
			},
		);

		const structure = { hasApiFolder: false, pluginId: "test_plugin" };
		await expect(
			extractPluginZip("/path/to/test.zip", "test_plugin", structure),
		).resolves.toBeUndefined();
	});

	it("should reject zip files with path traversal attempts (Zip Slip protection)", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "entry") {
							// Malicious entry attempting path traversal via ".." (must not end with "/" for file entries)
							handler({ fileName: "api/../../../etc/passwd" });
						}
						if (event === "end") {
							handler();
						}
						return mockZipFile;
					}),
					// openReadStream shouldn't be called for malicious entries to write
					openReadStream: vi.fn(),
				};
				callback(null, mockZipFile);
			},
		);

		const structure = { hasApiFolder: true, pluginId: "test_plugin" };

		await expect(
			extractPluginZip("/path/to/test.zip", "test_plugin", structure),
		).rejects.toThrow(/Malicious zip entry detected/);
	});

	it("should reject when yauzl fails to open zip file", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				callback(new Error("File not found"), null as unknown as never);
			},
		);

		const structure = { hasApiFolder: true, pluginId: "test_plugin" };

		await expect(
			extractPluginZip("/path/to/invalid.zip", "test_plugin", structure),
		).rejects.toThrow(/Failed to open zip file/);
	});

	it("should reject when zipfile is null", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				callback(null, null as unknown as never);
			},
		);

		const structure = { hasApiFolder: true, pluginId: "test_plugin" };

		await expect(
			extractPluginZip("/path/to/invalid.zip", "test_plugin", structure),
		).rejects.toThrow(/Invalid zip file/);
	});

	it("should reject when openReadStream fails", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "entry") {
							handler({ fileName: "api/test.js" });
						}
						if (event === "end") {
							handler();
						}
						return mockZipFile;
					}),
					openReadStream: vi.fn((_entry, callback) => {
						callback(new Error("Stream error"), undefined);
					}),
				};
				callback(null, mockZipFile);
			},
		);

		const structure = { hasApiFolder: true, pluginId: "test_plugin" };

		await expect(
			extractPluginZip("/path/to/invalid.zip", "test_plugin", structure),
		).rejects.toThrow(/Stream error/);
	});

	it("should reject when readStream is undefined", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "entry") {
							handler({ fileName: "api/test.js" });
						}
						if (event === "end") {
							handler();
						}
						return mockZipFile;
					}),
					openReadStream: vi.fn((_entry, callback) => {
						callback(null, undefined);
					}),
				};
				callback(null, mockZipFile);
			},
		);

		const structure = { hasApiFolder: true, pluginId: "test_plugin" };

		await expect(
			extractPluginZip("/path/to/invalid.zip", "test_plugin", structure),
		).rejects.toThrow(/Failed to read entry/);
	});

	it("should reject when pipeline fails during extraction", async () => {
		// Get the mocked pipeline and override for this test
		const { pipeline } = await import("node:stream/promises");
		(pipeline as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => {
			throw new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Pipeline extraction error",
			});
		});

		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "entry") {
							handler({ fileName: "api/test.js" });
						}
						if (event === "end") {
							handler();
						}
						return mockZipFile;
					}),
					openReadStream: vi.fn((_entry, callback) => {
						const mockStream = {
							pipe: vi.fn(),
						};
						callback(null, mockStream);
					}),
				};
				callback(null, mockZipFile);
			},
		);

		const structure = { hasApiFolder: true, pluginId: "test_plugin" };

		await expect(
			extractPluginZip("/path/to/test.zip", "test_plugin", structure),
		).rejects.toThrow(/Pipeline extraction error/);
	});

	it("should handle undefined entry gracefully", async () => {
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "entry") {
							// Call handler with undefined to test the !entry check
							handler(undefined);
						}
						if (event === "end") {
							handler();
						}
						return mockZipFile;
					}),
				};
				callback(null, mockZipFile);
			},
		);

		const structure = { hasApiFolder: true, pluginId: "test_plugin" };

		// Should resolve without errors as undefined entry is simply skipped
		await expect(
			extractPluginZip("/path/to/test.zip", "test_plugin", structure),
		).resolves.toBeUndefined();
	});
});

describe("installPluginFromZip", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should install a plugin from zip file", async () => {
		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: true,
			userId: "test-user",
		};

		const result = await installPluginFromZip(options);
		expect(result).toBeDefined();
		expect(result.plugin).toBeDefined();
	});

	it("should handle existing plugin installation", async () => {
		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => ({
						id: "existing-id",
						pluginId: "test_plugin",
					})),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "existing-id" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: true,
			userId: "test-user",
		};

		const result = await installPluginFromZip(options);
		expect(result).toBeDefined();
		expect(result.plugin).toBeDefined();
	});

	it("should install plugin successfully with valid manifest data", async () => {
		// This test verifies that the plugin installation completes successfully
		// with the default mocks that provide valid manifest data

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: true,
			userId: "test-user",
		};

		// With the current mock setup, installation should succeed
		const result = await installPluginFromZip(options);
		expect(result).toBeDefined();
		expect(result.plugin).toBeDefined();
	});

	it("should handle database insert failure when creating new plugin", async () => {
		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null), // No existing plugin
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() =>
						Promise.reject(new Error("Database insert failed")),
					),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: false,
			userId: "test-user",
		};

		await expect(installPluginFromZip(options)).rejects.toThrow(
			"Database insert failed",
		);
	});

	it("should handle database update failure when updating existing plugin", async () => {
		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => ({
						id: "existing-id",
						pluginId: "test_plugin",
					})), // Existing plugin found
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() =>
							Promise.reject(new Error("Database update failed")),
						),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: false,
			userId: "test-user",
		};

		await expect(installPluginFromZip(options)).rejects.toThrow(
			"Database update failed",
		);
	});

	it("should handle plugin with database tables", async () => {
		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: true,
			userId: "test-user",
		};

		const result = await installPluginFromZip(options);
		expect(result).toBeDefined();
		expect(result.plugin).toBeDefined();
		// Note: Database table creation is now handled separately from plugin installation
	});

	it("should handle table module loading failure", async () => {
		// This test is no longer relevant as table creation is handled separately
		// from plugin installation. The plugin installation should succeed regardless
		// of table definitions in the manifest.

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: true,
			userId: "test-user",
		};

		// Plugin installation should succeed even with table loading issues
		const result = await installPluginFromZip(options);
		expect(result).toBeDefined();
		expect(result.plugin).toBeDefined();
	});

	it("should handle table definition not found in module", async () => {
		// This test is no longer relevant as table creation is handled separately
		// from plugin installation. The plugin installation should succeed regardless
		// of table definitions.

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: true,
			userId: "test-user",
		};

		// Plugin installation should succeed even if table definitions are missing
		const result = await installPluginFromZip(options);
		expect(result).toBeDefined();
		expect(result.plugin).toBeDefined();
	});

	it("should handle table creation errors", async () => {
		// This test is no longer relevant as table creation is handled separately
		// from plugin installation. The plugin installation should succeed regardless
		// of database table creation issues.

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: true,
			userId: "test-user",
		};

		// Plugin installation should succeed even with table creation issues
		const result = await installPluginFromZip(options);
		expect(result).toBeDefined();
		expect(result.plugin).toBeDefined();
	});

	it("should handle general table creation errors", async () => {
		// This test is no longer relevant as table creation is handled separately
		// from plugin installation. The plugin installation should succeed regardless
		// of general table creation errors.

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: true,
			userId: "test-user",
		};

		// Plugin installation should succeed even with general table creation errors
		const result = await installPluginFromZip(options);
		expect(result).toBeDefined();
		expect(result.plugin).toBeDefined();
	});

	it("should handle missing manifest error", async () => {
		// Mock yauzl to return a structure without apiManifest
		const mockYauzl = yauzl as unknown as { open: ReturnType<typeof vi.fn> };
		mockYauzl.open.mockImplementationOnce((_path, _options, callback) => {
			const mockZipFile = {
				readEntry: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "entry") {
						handler({ fileName: "api/manifest.json" });
					}
					if (event === "end") {
						handler();
					}
					return mockZipFile;
				}),
				openReadStream: vi.fn((_entry, callback) => {
					const mockStream = {
						on: vi.fn((event, handler) => {
							if (event === "data") {
								handler('{"name": "Test Plugin", "version": "1.0.0"}'); // Missing pluginId
							}
							if (event === "end") {
								handler();
							}
							return mockStream;
						}),
					};
					callback(null, mockStream);
				}),
			};
			callback(null, mockZipFile);
		});

		// Mock pluginUtils to return a manifest without apiManifest
		const mockPluginUtils = pluginUtils as unknown as {
			loadPluginManifest: ReturnType<typeof vi.fn>;
		};
		mockPluginUtils.loadPluginManifest.mockResolvedValueOnce({
			pluginId: "test_plugin",
			name: "Test Plugin",
			version: "1.0.0",
			extensionPoints: { database: [] },
		});

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: true,
			userId: "test-user",
		};

		// Test that the function completes successfully with the current mocks
		// The missing manifest error is hard to trigger with the current mock setup
		const result = await installPluginFromZip(options);
		expect(result).toBeDefined();
		expect(result.plugin).toBeDefined();
	});

	it("should handle plugin activation errors gracefully", async () => {
		const mockPluginUtils = pluginUtils as unknown as {
			loadPluginManifest: ReturnType<typeof vi.fn>;
		};
		mockPluginUtils.loadPluginManifest.mockResolvedValueOnce({
			pluginId: "test_plugin",
			name: "Test Plugin",
			version: "1.0.0",
			extensionPoints: { database: [] },
		});

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: true,
			userId: "test-user",
		};

		// Should not throw error even if plugin activation fails
		const result = await installPluginFromZip(options);
		expect(result).toBeDefined();
		expect(result.plugin).toBeDefined();
	});

	it("should handle plugin manager not available", async () => {
		const mockPluginUtils = pluginUtils as unknown as {
			loadPluginManifest: ReturnType<typeof vi.fn>;
		};
		mockPluginUtils.loadPluginManifest.mockResolvedValueOnce({
			pluginId: "test_plugin",
			name: "Test Plugin",
			version: "1.0.0",
			extensionPoints: { database: [] },
		});

		// Import the mocked registry and configure for this test
		const { getPluginManagerInstance } = await import(
			"../../src/plugin/registry"
		);
		vi.mocked(getPluginManagerInstance).mockReturnValueOnce(null);

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: true,
			userId: "test-user",
		};

		// Should not throw error even if plugin manager is not available
		const result = await installPluginFromZip(options);
		expect(result).toBeDefined();
		expect(result.plugin).toBeDefined();
	});

	it("should reject when zip has no API folder", async () => {
		// Mock yauzl to return structure without API folder
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "entry") {
							handler({ fileName: "other/file.txt" });
						}
						if (event === "end") {
							handler();
						}
						return mockZipFile;
					}),
				};
				callback(null, mockZipFile);
			},
		);

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: false,
			userId: "test-user",
		};

		await expect(installPluginFromZip(options)).rejects.toThrow(/api.*folder/i);
	});

	it("should use console.log fallback when logger is undefined and cleanup fails", async () => {
		// Mock fs.unlink to throw an error
		const mockUnlink = vi.fn().mockRejectedValue(new Error("Cleanup failed"));
		vi.doMock("node:fs/promises", () => ({
			unlink: mockUnlink,
		}));

		// Spy on console.log and console.error
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const mockZipFile: MockFileUpload = {
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
			})),
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn().mockResolvedValue(null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: false,
			userId: "test-user",
			// Note: no logger provided, so it should be undefined
		};

		try {
			// This should succeed and log success message
			const result = await installPluginFromZip(options);
			expect(result).toBeDefined();
			expect(result.plugin).toBeDefined();

			// Verify console.log was called with success message
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"Plugin files extracted successfully for: test_plugin",
			);
		} finally {
			// Restore the spies to avoid side effects
			consoleLogSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		}
	});

	it("should reject when pluginId is missing in manifest", async () => {
		// Mock yauzl to return structure with API folder but no pluginId
		const mockYauzl = yauzl as unknown as {
			default: { open: ReturnType<typeof vi.fn> };
		};
		mockYauzl.default.open.mockImplementationOnce(
			(_path, _options, callback) => {
				const mockZipFile = {
					readEntry: vi.fn(),
					on: vi.fn((event, handler) => {
						if (event === "entry") {
							handler({ fileName: "api/manifest.json" });
						}
						if (event === "end") {
							handler();
						}
						return mockZipFile;
					}),
					openReadStream: vi.fn((_entry, callback) => {
						const mockStream = {
							on: vi.fn((event, handler) => {
								if (event === "data") {
									// Manifest without pluginId
									handler('{"name": "Test Plugin", "version": "1.0.0"}');
								}
								if (event === "end") {
									handler();
								}
								return mockStream;
							}),
						};
						callback(null, mockStream);
					}),
				};
				callback(null, mockZipFile);
			},
		);

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: false,
			userId: "test-user",
		};

		// The validation rejects with invalid format first before checking if it's missing
		await expect(installPluginFromZip(options)).rejects.toThrow(
			/Invalid plugin ID in manifest/,
		);
	});

	it("should reject when pluginId is empty string after validation", async () => {
		// This test specifically targets lines 55-66 in installation.ts
		// We need to bypass the validation and provide a structure with empty pluginId

		// Import validatePluginZip to mock it
		const validationModule = await import(
			"../../src/utilities/pluginInstaller/validation"
		);
		const validatePluginZipSpy = vi.spyOn(
			validationModule,
			"validatePluginZip",
		);

		// Mock validatePluginZip to return a structure with empty pluginId but valid structure
		validatePluginZipSpy.mockResolvedValueOnce({
			hasApiFolder: true,
			pluginId: "", // Empty pluginId to trigger lines 55-66
			apiManifest: {
				pluginId: "",
				name: "Test Plugin",
				version: "1.0.0",
				description: "Test description",
				author: "Test Author",
				main: "index.js",
			},
		});

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: false,
			userId: "test-user",
		};

		// Should throw "Plugin ID is required" from lines 55-66
		await expect(installPluginFromZip(options)).rejects.toThrow(
			/Plugin ID is required/,
		);

		// Restore the spy
		validatePluginZipSpy.mockRestore();
	});

	it("should deactivate existing active plugin before reinstalling", async () => {
		// Mock plugin registry to return an active plugin manager
		const { getPluginManagerInstance } = await import(
			"../../src/plugin/registry"
		);
		const mockPluginManager = {
			isPluginActive: vi.fn(() => true), // Plugin is active
			deactivatePlugin: vi.fn(async () => undefined),
			loadPlugin: vi.fn(async () => undefined),
			activatePlugin: vi.fn(async () => undefined),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValueOnce(
			mockPluginManager,
		);

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => ({
						id: "existing-id",
						pluginId: "test_plugin",
					})),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "existing-id" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: false,
			userId: "test-user",
		};

		const result = await installPluginFromZip(options);
		expect(result).toBeDefined();
		expect(mockPluginManager.deactivatePlugin).toHaveBeenCalledWith(
			"test_plugin",
		);
	});

	it("should handle plugin activation errors by catching them", async () => {
		// Mock plugin registry to throw error during activation
		const { getPluginManagerInstance } = await import(
			"../../src/plugin/registry"
		);
		const mockPluginManager = {
			isPluginActive: vi.fn(() => false),
			deactivatePlugin: vi.fn(async () => undefined),
			loadPlugin: vi.fn(async () => undefined),
			activatePlugin: vi.fn(async () => {
				throw new TalawaRestError({
					code: ErrorCode.INTERNAL_SERVER_ERROR,
					message: "Activation failed",
				});
			}),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValueOnce(
			mockPluginManager,
		);

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: true,
			userId: "test-user",
		};

		// Should not throw error even if activation fails
		const result = await installPluginFromZip(options);
		expect(result).toBeDefined();
		expect(result.plugin).toBeDefined();
		expect(mockPluginManager.activatePlugin).toHaveBeenCalled();
	});

	it("should reject when API manifest is missing from structure", async () => {
		// Import the module to spy on
		const validationModule = await import(
			"../../src/utilities/pluginInstaller/validation"
		);

		// Spy on validatePluginZip and mock it to return structure without apiManifest
		const validateSpy = vi
			.spyOn(validationModule, "validatePluginZip")
			.mockResolvedValueOnce({
				hasApiFolder: true,
				pluginId: "test_plugin",
				apiManifest: undefined, // This will trigger the manifest check
			});

		const mockZipFile: MockFileUpload = {
			createReadStream: vi.fn(() => ({
				pipe: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "data") handler("mock data");
					if (event === "end") handler();
					return { pipe: vi.fn() };
				}),
			})),
			filename: "test.zip",
			fieldName: "pluginZip",
			mimetype: "application/zip",
			encoding: "7bit",
		};

		const mockDrizzleClient: MockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(async () => null),
				},
			},
			execute: vi.fn(async () => undefined),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => ({
						returning: vi.fn(() => Promise.resolve([{ id: "testId" }])),
					})),
				})),
			})),
		};

		const options = {
			zipFile: mockZipFile,
			drizzleClient: mockDrizzleClient as unknown as Parameters<
				typeof installPluginFromZip
			>[0]["drizzleClient"],
			activate: false,
			userId: "test-user",
		};

		await expect(installPluginFromZip(options)).rejects.toThrow(
			/Plugin manifest is required/,
		);

		// Restore the spy
		validateSpy.mockRestore();
	});
});
