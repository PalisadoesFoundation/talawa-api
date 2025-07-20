import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { builder } from "../../../../../src/graphql/builder";
import type { IPluginManifest } from "../../../../../src/plugin/types";
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

// Mocks
vi.mock("../../../../../src/plugin/utils", () => ({
	loadPluginManifest: vi.fn(),
	createPluginTables: vi.fn(),
	safeRequire: vi.fn(),
}));
vi.mock("../../../../../src/plugin/registry", () => ({
	getPluginManagerInstance: vi.fn(),
}));

import { getPluginManagerInstance } from "../../../../../src/plugin/registry";
import {
	createPluginTables,
	loadPluginManifest,
	safeRequire,
} from "../../../../../src/plugin/utils";

// Import the actual resolver function
import "../../../../../src/graphql/types/Mutation/plugin/createPlugin";

// Extract the resolver function from the builder mock after importing the module
let resolver: (
	parent: unknown,
	args: { input: typeof validInput },
	ctx: TestCtx,
) => Promise<unknown>;

const mutationFieldMock = builder.mutationField as unknown as Mock;
const mutationFieldCall = mutationFieldMock.mock.calls.find(
	(call: unknown[]) => call[0] === "createPlugin",
);
if (mutationFieldCall) {
	// The second argument is a function (t) => t.field({...})
	const fieldFn = mutationFieldCall[1];
	// We'll mock t.field to capture the resolver
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

const validInput = {
	pluginId: "test_plugin",
	isActivated: false,
	isInstalled: true,
	backup: false,
};

const validManifest: IPluginManifest = {
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
		insert: ReturnType<typeof vi.fn>;
		values: ReturnType<typeof vi.fn>;
		returning: ReturnType<typeof vi.fn>;
	};
	[key: string]: unknown;
};

function makeCtx(overrides: Partial<TestCtx> = {}): TestCtx {
	return {
		drizzleClient: {
			query: {
				pluginsTable: {
					findFirst: vi.fn().mockResolvedValue(null),
				},
			},
			insert: vi.fn().mockReturnThis(),
			values: vi.fn().mockReturnThis(),
			returning: vi.fn().mockResolvedValue([{ pluginId: validInput.pluginId }]),
		},
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.spyOn(console, "log").mockImplementation(() => {});
	vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
	vi.restoreAllMocks();
});

describe("createPlugin mutation", () => {
	it("creates a plugin successfully (no tables, not activated)", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			validManifest,
		);
		(createPluginTables as ReturnType<typeof vi.fn>).mockResolvedValue(
			undefined,
		);
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as { pluginId: string };
		expect(result.pluginId).toBe(validInput.pluginId);
	});

	it("throws on invalid input schema", async () => {
		const ctx = makeCtx();
		const args = { input: { ...validInput, pluginId: 123 } } as unknown as {
			input: typeof validInput;
		};
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("throws if plugin already exists", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				query: {
					pluginsTable: {
						findFirst: vi
							.fn()
							.mockResolvedValue({ pluginId: validInput.pluginId }),
					},
				},
				insert: vi.fn().mockReturnThis(),
				values: vi.fn().mockReturnThis(),
				returning: vi
					.fn()
					.mockResolvedValue([{ pluginId: validInput.pluginId }]),
			},
		});
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("throws if manifest loading fails", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockRejectedValue(
			new Error("fail"),
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("throws if table file is missing", async () => {
		const manifestWithTable: IPluginManifest = {
			...validManifest,
			main: "index.js",
			extensionPoints: {
				database: [{ name: "Table1", file: "table1.js", type: "table" }],
			},
		};
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			manifestWithTable,
		);
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
		const ctx = makeCtx();
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toThrow(
			"This action is forbidden on the resources associated to the provided arguments.",
		);
	});

	it("throws if table definition is missing", async () => {
		const manifestWithTable: IPluginManifest = {
			...validManifest,
			main: "index.js",
			extensionPoints: {
				database: [{ name: "Table1", file: "table1.js", type: "table" }],
			},
		};
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			manifestWithTable,
		);
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});
		const ctx = makeCtx();
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toThrow(
			"This action is forbidden on the resources associated to the provided arguments.",
		);
	});

	it("throws if createPluginTables fails", async () => {
		const manifestWithTable: IPluginManifest = {
			...validManifest,
			main: "index.js",
			extensionPoints: {
				database: [{ name: "Table1", file: "table1.js", type: "table" }],
			},
		};
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			manifestWithTable,
		);
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({ Table1: {} });
		(createPluginTables as ReturnType<typeof vi.fn>).mockRejectedValue(
			new Error("fail"),
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("creates plugin with tables (no activation)", async () => {
		const manifestWithTable: IPluginManifest = {
			...validManifest,
			main: "index.js",
			extensionPoints: {
				database: [{ name: "Table1", file: "table1.js", type: "table" }],
			},
		};
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			manifestWithTable,
		);
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({ Table1: {} });
		(createPluginTables as ReturnType<typeof vi.fn>).mockResolvedValue(
			undefined,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as { pluginId: string };
		expect(result.pluginId).toBe(validInput.pluginId);
		expect(createPluginTables).toHaveBeenCalled();
	});

	it("creates plugin with activation (activation succeeds)", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			validManifest,
		);
		const fakeManager = {
			isPluginLoaded: vi.fn().mockReturnValue(false),
			loadPlugin: vi.fn().mockResolvedValue(true),
			activatePlugin: vi.fn().mockResolvedValue(true),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx();
		const args = { input: { ...validInput, isActivated: true } };
		const result = (await resolver({}, args, ctx)) as { pluginId: string };
		expect(result.pluginId).toBe(validInput.pluginId);
		expect(fakeManager.isPluginLoaded).toHaveBeenCalledWith(
			validInput.pluginId,
		);
		expect(fakeManager.loadPlugin).toHaveBeenCalledWith(validInput.pluginId);
		expect(fakeManager.activatePlugin).toHaveBeenCalledWith(
			validInput.pluginId,
		);
	});

	it("creates plugin with activation (activation fails, does not throw)", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			validManifest,
		);
		const fakeManager = {
			isPluginLoaded: vi.fn().mockReturnValue(false),
			loadPlugin: vi.fn().mockResolvedValue(true),
			activatePlugin: vi.fn().mockRejectedValue(new Error("fail")),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx();
		const args = { input: { ...validInput, isActivated: true } };
		const result = (await resolver({}, args, ctx)) as { pluginId: string };
		expect(result.pluginId).toBe(validInput.pluginId);
	});

	it("creates plugin with backup flag", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			validManifest,
		);
		const ctx = makeCtx();
		ctx.drizzleClient.returning = vi
			.fn()
			.mockResolvedValue([{ pluginId: validInput.pluginId, backup: true }]);
		const args = { input: { ...validInput, backup: true } };
		const result = (await resolver({}, args, ctx)) as {
			pluginId: string;
			backup: boolean;
		};
		expect(result.pluginId).toBe(validInput.pluginId);
		expect(result.backup).toBe(true);
	});

	it("creates plugin with isInstalled false (skips manifest/tables)", async () => {
		const ctx = makeCtx();
		const args = { input: { ...validInput, isInstalled: false } };
		const result = (await resolver({}, args, ctx)) as { pluginId: string };
		expect(result.pluginId).toBe(validInput.pluginId);
		expect(loadPluginManifest).not.toHaveBeenCalled();
	});
});
