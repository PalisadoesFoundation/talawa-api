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

vi.mock("../../../../../src/plugin/registry", () => ({
	getPluginManagerInstance: vi.fn(),
}));

const validId = "123e4567-e89b-12d3-a456-426614174000";
const validInput = {
	id: validId,
	pluginId: "test_plugin",
	isActivated: true,
	isInstalled: true,
	backup: false,
};
const existingPlugin = {
	id: validId,
	pluginId: "test_plugin",
	isActivated: false,
	isInstalled: true,
	backup: false,
};

type TestCtx = {
	drizzleClient: {
		query: {
			pluginsTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
		};
		update: ReturnType<typeof vi.fn>;
		set: ReturnType<typeof vi.fn>;
		where: ReturnType<typeof vi.fn>;
		returning: ReturnType<typeof vi.fn>;
	};
	[key: string]: unknown;
};

function makeCtx(overrides: Partial<TestCtx> = {}): TestCtx {
	const updateMock = vi.fn().mockReturnThis();
	const setMock = vi.fn().mockReturnThis();
	const whereMock = vi.fn().mockReturnThis();
	const returningMock = vi
		.fn()
		.mockResolvedValue([{ ...existingPlugin, ...validInput }]);
	return {
		drizzleClient: {
			query: {
				pluginsTable: {
					findFirst: vi.fn().mockResolvedValue(existingPlugin),
				},
			},
			update: updateMock,
			set: setMock,
			where: whereMock,
			returning: returningMock,
		},
		...overrides,
	};
}

// Import the actual resolver function
import "../../../../../src/graphql/types/Mutation/plugin/updatePlugin";

// Extract the resolver function from the builder mock after importing the module
let resolver: (
	parent: unknown,
	args: {
		input: {
			id: string;
			pluginId?: string;
			isActivated?: boolean;
			isInstalled?: boolean;
			backup?: boolean;
		};
	},
	ctx: TestCtx,
) => Promise<unknown>;

const mutationFieldMock = builder.mutationField as unknown as Mock;
const mutationFieldCall = mutationFieldMock.mock.calls.find(
	(call: unknown[]) => call[0] === "updatePlugin",
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
});
afterEach(() => {
	vi.restoreAllMocks();
});

describe("updatePlugin mutation", () => {
	it("updates a plugin successfully", async () => {
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(validInput.pluginId);
		expect(result.isActivated).toBe(true);
		expect(result.isInstalled).toBe(true);
		expect(result.backup).toBe(false);
	});

	it("returns existing plugin on no-op update", async () => {
		const ctx = makeCtx();
		const args = { input: { id: validId } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result).toEqual(existingPlugin);
	});

	it("throws if plugin not found", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				query: {
					pluginsTable: {
						findFirst: vi.fn().mockResolvedValueOnce(null),
					},
				},
			},
		});
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("throws if duplicate pluginId exists", async () => {
		const ctx = makeCtx();
		ctx.drizzleClient.query.pluginsTable.findFirst = vi
			.fn()
			.mockResolvedValueOnce(existingPlugin)
			.mockResolvedValueOnce({ ...existingPlugin, pluginId: "other_plugin" });
		const args = { input: { ...validInput, pluginId: "other_plugin" } };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("activates plugin if isActivated changes to true", async () => {
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
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isActivated).toBe(true);
		expect(fakeManager.isPluginLoaded).toHaveBeenCalledWith(
			validInput.pluginId,
		);
		expect(fakeManager.loadPlugin).toHaveBeenCalledWith(validInput.pluginId);
		expect(fakeManager.activatePlugin).toHaveBeenCalledWith(
			validInput.pluginId,
		);
	});

	it("deactivates plugin if isActivated changes to false", async () => {
		const fakeManager = {
			deactivatePlugin: vi.fn().mockResolvedValue(true),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				query: {
					pluginsTable: {
						findFirst: vi
							.fn()
							.mockResolvedValue({ ...existingPlugin, isActivated: true }),
					},
				},
				returning: vi
					.fn()
					.mockResolvedValue([{ ...existingPlugin, isActivated: false }]),
			},
		});
		const args = { input: { ...validInput, isActivated: false } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isActivated).toBe(false);
		expect(fakeManager.deactivatePlugin).toHaveBeenCalledWith(
			validInput.pluginId,
		);
	});

	it("handles plugin manager errors gracefully", async () => {
		const fakeManager = {
			isPluginLoaded: vi.fn().mockReturnValue(false),
			loadPlugin: vi.fn().mockRejectedValue(new Error("fail")),
			activatePlugin: vi.fn().mockResolvedValue(true),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx();
		const args = { input: { ...validInput, isActivated: true } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isActivated).toBe(true);
		// Should not throw, just log error
	});

	it("throws on database connection error", async () => {
		const ctx = makeCtx();
		ctx.drizzleClient.returning = vi
			.fn()
			.mockRejectedValue(new Error("Database connection failed"));
		ctx.drizzleClient.update = vi.fn().mockReturnThis();
		ctx.drizzleClient.set = vi.fn().mockReturnThis();
		ctx.drizzleClient.where = vi.fn().mockReturnThis();
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toThrow(
			"Database connection failed",
		);
	});

	it("throws if plugin not found on no-op update", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				query: {
					pluginsTable: {
						findFirst: vi.fn().mockResolvedValueOnce(null),
					},
				},
			},
		});
		const args = { input: { id: validId } };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("skips duplicate check if pluginId is unchanged", async () => {
		const ctx = makeCtx();
		const args = {
			input: { ...validInput, pluginId: existingPlugin.pluginId },
		};
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
	});

	it("rethrows non-database errors from update", async () => {
		const ctx = makeCtx();
		ctx.drizzleClient.returning = vi
			.fn()
			.mockRejectedValue(new Error("Some other error"));
		ctx.drizzleClient.update = vi.fn().mockReturnThis();
		ctx.drizzleClient.set = vi.fn().mockReturnThis();
		ctx.drizzleClient.where = vi.fn().mockReturnThis();
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toThrow("Some other error");
	});

	it("updates only pluginId field", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				query: {
					pluginsTable: {
						findFirst: vi
							.fn()
							.mockResolvedValueOnce(existingPlugin) // First call for existing plugin
							.mockResolvedValueOnce(null), // Second call for duplicate check - no duplicate found
					},
				},
				returning: vi.fn().mockResolvedValue([
					{
						...existingPlugin,
						pluginId: "new_plugin_id",
					},
				]),
			},
		});
		const args = { input: { id: validId, pluginId: "new_plugin_id" } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe("new_plugin_id");
		expect(result.isActivated).toBe(existingPlugin.isActivated);
		expect(result.isInstalled).toBe(existingPlugin.isInstalled);
		expect(result.backup).toBe(existingPlugin.backup);
	});

	it("updates only isActivated field", async () => {
		const ctx = makeCtx();
		const args = { input: { id: validId, isActivated: true } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isActivated).toBe(true);
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		expect(result.isInstalled).toBe(existingPlugin.isInstalled);
		expect(result.backup).toBe(existingPlugin.backup);
	});

	it("updates only isInstalled field", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				returning: vi.fn().mockResolvedValue([
					{
						...existingPlugin,
						isInstalled: false,
					},
				]),
			},
		});
		const args = { input: { id: validId, isInstalled: false } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isInstalled).toBe(false);
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		expect(result.isActivated).toBe(existingPlugin.isActivated);
		expect(result.backup).toBe(existingPlugin.backup);
	});

	it("updates only backup field", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				returning: vi.fn().mockResolvedValue([
					{
						...existingPlugin,
						backup: true,
					},
				]),
			},
		});
		const args = { input: { id: validId, backup: true } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.backup).toBe(true);
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		expect(result.isActivated).toBe(existingPlugin.isActivated);
		expect(result.isInstalled).toBe(existingPlugin.isInstalled);
	});

	it("handles plugin manager not available during activation", async () => {
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			null,
		);
		const ctx = makeCtx();
		const args = { input: { ...validInput, isActivated: true } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isActivated).toBe(true);
	});

	it("handles plugin manager not available during deactivation", async () => {
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			null,
		);
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				query: {
					pluginsTable: {
						findFirst: vi
							.fn()
							.mockResolvedValue({ ...existingPlugin, isActivated: true }),
					},
				},
				returning: vi
					.fn()
					.mockResolvedValue([{ ...existingPlugin, isActivated: false }]),
			},
		});
		const args = { input: { ...validInput, isActivated: false } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isActivated).toBe(false);
	});

	it("handles plugin already loaded during activation", async () => {
		const fakeManager = {
			isPluginLoaded: vi.fn().mockReturnValue(true),
			activatePlugin: vi.fn().mockResolvedValue(true),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx();
		const args = { input: { ...validInput, isActivated: true } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isActivated).toBe(true);
		expect(fakeManager.isPluginLoaded).toHaveBeenCalledWith(
			validInput.pluginId,
		);
		expect(fakeManager.activatePlugin).toHaveBeenCalledWith(
			validInput.pluginId,
		);
	});

	it("handles activation error gracefully", async () => {
		const fakeManager = {
			isPluginLoaded: vi.fn().mockReturnValue(false),
			loadPlugin: vi.fn().mockResolvedValue(true),
			activatePlugin: vi.fn().mockRejectedValue(new Error("Activation failed")),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx();
		const args = { input: { ...validInput, isActivated: true } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isActivated).toBe(true);
	});

	it("handles deactivation error gracefully", async () => {
		const fakeManager = {
			deactivatePlugin: vi
				.fn()
				.mockRejectedValue(new Error("Deactivation failed")),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				query: {
					pluginsTable: {
						findFirst: vi
							.fn()
							.mockResolvedValue({ ...existingPlugin, isActivated: true }),
					},
				},
				returning: vi
					.fn()
					.mockResolvedValue([{ ...existingPlugin, isActivated: false }]),
			},
		});
		const args = { input: { ...validInput, isActivated: false } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isActivated).toBe(false);
	});

	it("covers the duplicate check query function", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				query: {
					pluginsTable: {
						findFirst: vi
							.fn()
							.mockResolvedValueOnce(existingPlugin) // First call for existing plugin
							.mockResolvedValueOnce({ ...existingPlugin, id: "different-id" }), // Second call finds duplicate
					},
				},
			},
		});
		const args = { input: { id: validId, pluginId: "new_plugin_id" } };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});
});
