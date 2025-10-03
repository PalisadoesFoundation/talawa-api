import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { builder } from "../../../../../src/graphql/builder";
import { getPluginManagerInstance } from "../../../../../src/plugin/registry";
import { TalawaGraphQLError } from "../../../../../src/utilities/TalawaGraphQLError";

// Mock the GraphQL builder
vi.mock("../../../../../src/graphql/builder", () => ({
	builder: {
		mutationField: vi.fn().mockReturnThis(),
		field: vi.fn().mockReturnThis(),
		arg: vi.fn().mockReturnThis(),
		type: vi.fn().mockReturnThis(),
		required: vi.fn().mockReturnThis(),
		resolve: vi.fn(),
		objectRef: vi.fn().mockReturnValue({ implement: vi.fn() }),
		inputType: vi.fn().mockReturnValue({}),
	},
}));

vi.mock("../../../../../src/plugin/utils", () => ({
	dropPluginTables: vi.fn(),
	loadPluginManifest: vi.fn(),
	removePluginDirectory: vi.fn(),
	safeRequire: vi.fn(),
}));
vi.mock("../../../../../src/plugin/registry", () => ({
	getPluginManagerInstance: vi.fn(),
}));

import {
	dropPluginTables,
	loadPluginManifest,
	removePluginDirectory,
	safeRequire,
} from "../../../../../src/plugin/utils";

const validId = "123e4567-e89b-12d3-a456-426614174000";
const validInput = { id: validId };
const existingPlugin = {
	id: validId,
	pluginId: "test_plugin",
	isActivated: true,
	isInstalled: true,
	backup: false,
};
const validManifest = {
	pluginId: "test_plugin",
	name: "Test Plugin",
	version: "1.0.0",
	description: "desc",
	author: "author",
	main: "index.js",
	extensionPoints: {},
};

type TestCtx = {
	drizzleClient: {
		query: {
			pluginsTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
		};
		delete: ReturnType<typeof vi.fn>;
		where: ReturnType<typeof vi.fn>;
		returning: ReturnType<typeof vi.fn>;
	};
	[key: string]: unknown;
};

function makeCtx(overrides: Partial<TestCtx> = {}): TestCtx {
	const deleteMock = vi.fn().mockReturnThis();
	const whereMock = vi.fn().mockReturnThis();
	const returningMock = vi.fn().mockResolvedValue([existingPlugin]);
	return {
		drizzleClient: {
			query: {
				pluginsTable: {
					findFirst: vi.fn().mockResolvedValue(existingPlugin),
				},
			},
			delete: deleteMock,
			where: whereMock,
			returning: returningMock,
		},
		...overrides,
	};
}

// Import the actual resolver function
import "../../../../../src/graphql/types/Mutation/plugin/deletePlugin";

// Extract the resolver function from the builder mock after importing the module
let resolver: (
	parent: unknown,
	args: { input: typeof validInput },
	ctx: TestCtx,
) => Promise<unknown>;

const mutationFieldMock = builder.mutationField as unknown as Mock;
const mutationFieldCall = mutationFieldMock.mock.calls.find(
	(call: unknown[]) => call[0] === "deletePlugin",
);
if (mutationFieldCall) {
	const fieldFn = mutationFieldCall[1];
	const t = {
		field: (def: { resolve: typeof resolver }) => {
			resolver = def.resolve;
			return undefined;
		},
		arg: vi.fn().mockReturnThis(),
		type: vi.fn().mockReturnThis(),
		required: vi.fn().mockReturnThis(),
	};
	fieldFn(t);
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.spyOn(console, "log").mockImplementation(() => {});
	vi.spyOn(console, "error").mockImplementation(() => {});
	vi.spyOn(console, "warn").mockImplementation(() => {});
	vi.useFakeTimers();
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe("deletePlugin mutation", () => {
	it("deletes a plugin successfully", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			validManifest,
		);
		(dropPluginTables as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
		(removePluginDirectory as ReturnType<typeof vi.fn>).mockResolvedValue(
			undefined,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		vi.runAllTimers();
		expect(removePluginDirectory).toHaveBeenCalledWith(existingPlugin.pluginId);
	});

	it("throws if plugin not found", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				query: {
					pluginsTable: {
						findFirst: vi.fn().mockResolvedValue(null),
					},
				},
			},
		});
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("handles plugin manager present (deactivate/unload)", async () => {
		const fakeManager = {
			isPluginLoaded: vi.fn().mockReturnValue(true),
			isPluginActive: vi.fn().mockReturnValue(true),
			deactivatePlugin: vi.fn().mockResolvedValue(undefined),
			unloadPlugin: vi.fn().mockResolvedValue(undefined),
			emit: vi.fn(),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			validManifest,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		await resolver({}, args, ctx);
		expect(fakeManager.deactivatePlugin).toHaveBeenCalledWith(
			existingPlugin.pluginId,
		);
		expect(fakeManager.unloadPlugin).toHaveBeenCalledWith(
			existingPlugin.pluginId,
		);
		expect(fakeManager.emit).toHaveBeenCalledWith(
			"schema:rebuild",
			expect.objectContaining({ pluginId: existingPlugin.pluginId }),
		);
		vi.runAllTimers();
	});

	it("handles plugin manager errors gracefully", async () => {
		const fakeManager = {
			isPluginLoaded: vi.fn().mockReturnValue(true),
			isPluginActive: vi.fn().mockReturnValue(true),
			deactivatePlugin: vi.fn().mockRejectedValue(new Error("fail")),
			unloadPlugin: vi.fn().mockRejectedValue(new Error("fail")),
			emit: vi.fn(),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			validManifest,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		await resolver({}, args, ctx);
		expect(fakeManager.deactivatePlugin).toHaveBeenCalled();
		expect(fakeManager.unloadPlugin).toHaveBeenCalled();
		vi.runAllTimers();
	});

	it("handles manifest load error gracefully", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockRejectedValue(
			new Error("fail"),
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		vi.runAllTimers();
	});

	it("handles table drop error gracefully", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue({
			...validManifest,
			extensionPoints: {
				database: [{ name: "Table1", file: "table1.js", type: "table" }],
			},
		});
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({ Table1: {} });
		(dropPluginTables as ReturnType<typeof vi.fn>).mockRejectedValue(
			new Error("fail"),
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		vi.runAllTimers();
	});

	it("handles plugin directory removal error gracefully", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			validManifest,
		);
		(removePluginDirectory as ReturnType<typeof vi.fn>).mockRejectedValue(
			new Error("fail"),
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		vi.runAllTimers();
	});

	it("handles plugin manager absent (no emit)", async () => {
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			undefined,
		);
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			validManifest,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		vi.runAllTimers();
	});

	it("throws if plugin not found after delete", async () => {
		const ctx = makeCtx();
		ctx.drizzleClient.returning = vi.fn().mockResolvedValue([undefined]);
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("warns if table not found in file during cleanup", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue({
			...validManifest,
			extensionPoints: {
				database: [{ name: "Table1", file: "table1.js", type: "table" }],
			},
		});
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({}); // Table1 missing
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		vi.runAllTimers();
	});

	it("warns if table file failed to load during cleanup", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue({
			...validManifest,
			extensionPoints: {
				database: [{ name: "Table1", file: "table1.js", type: "table" }],
			},
		});
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(null); // File failed to load
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		vi.runAllTimers();
	});

	it("warns if error loading table definition during cleanup", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue({
			...validManifest,
			extensionPoints: {
				database: [{ name: "Table1", file: "table1.js", type: "table" }],
			},
		});
		(safeRequire as ReturnType<typeof vi.fn>).mockRejectedValue(
			new Error("fail"),
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		vi.runAllTimers();
	});

	it("logs if no plugin-defined tables to drop", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue({
			...validManifest,
			extensionPoints: {},
		});
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		vi.runAllTimers();
	});

	it("catches error during plugin table cleanup (outer catch)", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockImplementation(() => {
			throw new Error("fail");
		});
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		vi.runAllTimers();
	});

	it("handles schema rebuild error gracefully (does not throw)", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			validManifest,
		);
		const fakeManager = {
			isPluginLoaded: vi.fn().mockReturnValue(false),
			isPluginActive: vi.fn().mockReturnValue(false),
			emit: vi.fn().mockImplementation(() => {
				throw new Error("Schema rebuild failed");
			}),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		expect(fakeManager.emit).toHaveBeenCalledWith(
			"schema:rebuild",
			expect.objectContaining({ pluginId: existingPlugin.pluginId }),
		);
		vi.runAllTimers();
	});

	it("handles table drop error during cleanup (inner catch)", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue({
			...validManifest,
			extensionPoints: {
				database: [{ name: "Table1", file: "table1.js", type: "table" }],
			},
		});
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({ Table1: {} });
		(dropPluginTables as ReturnType<typeof vi.fn>).mockRejectedValue(
			new Error("Table drop failed"),
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		expect(dropPluginTables).toHaveBeenCalled();
		vi.runAllTimers();
	});

	it("logs when no tables to drop (covers else block)", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue({
			...validManifest,
			extensionPoints: {}, // No database tables
		});
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		expect(dropPluginTables).not.toHaveBeenCalled();
		vi.runAllTimers();
	});

	it("handles manifest with empty database extension points (covers else block)", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue({
			...validManifest,
			extensionPoints: {
				database: [], // Empty array
			},
		});
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		expect(dropPluginTables).not.toHaveBeenCalled();
		vi.runAllTimers();
	});

	it("handles manifest with undefined extension points (covers else block)", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue({
			...validManifest,
			extensionPoints: undefined, // Undefined extension points
		});
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		expect(dropPluginTables).not.toHaveBeenCalled();
		vi.runAllTimers();
	});

	it("handles outer catch block during table cleanup", async () => {
		// Mock loadPluginManifest to throw an error that will be caught by the outer catch
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockImplementation(() => {
			throw new Error("Outer manifest load error");
		});
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		vi.runAllTimers();
	});
});
