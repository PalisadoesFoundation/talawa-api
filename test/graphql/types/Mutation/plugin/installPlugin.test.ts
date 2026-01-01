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

const validInput = {
	pluginId: "test_plugin",
};

const existingPlugin = {
	id: "123e4567-e89b-12d3-a456-426614174000",
	pluginId: "test_plugin",
	isActivated: false,
	isInstalled: false,
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
		.mockResolvedValue([{ ...existingPlugin, isInstalled: true }]);
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
		log: {
			error: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
		},
		...overrides,
	};
}

// Import the actual resolver function
import "../../../../../src/graphql/types/Mutation/plugin/installPlugin";

// Extract the resolver function from the builder mock after importing the module
let resolver: (
	parent: unknown,
	args: { input: typeof validInput },
	ctx: TestCtx,
) => Promise<unknown>;

const mutationFieldMock = builder.mutationField as unknown as Mock;
const mutationFieldCall = mutationFieldMock.mock.calls.find(
	(call: unknown[]) => call[0] === "installPlugin",
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

describe("installPlugin mutation", () => {
	it("installs a plugin successfully", async () => {
		const fakeManager = {
			installPlugin: vi.fn().mockResolvedValue(true),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isInstalled).toBe(true);
		expect(fakeManager.installPlugin).toHaveBeenCalledWith(validInput.pluginId);
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

	it("throws if plugin not found in database", async () => {
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

	it("throws if plugin is already installed", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				query: {
					pluginsTable: {
						findFirst: vi.fn().mockResolvedValue({
							...existingPlugin,
							isInstalled: true,
						}),
					},
				},
			},
		});
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("handles plugin manager not available", async () => {
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			undefined,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isInstalled).toBe(true);
	});

	it("handles plugin manager installation failure gracefully", async () => {
		const fakeManager = {
			installPlugin: vi.fn().mockResolvedValue(false),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isInstalled).toBe(true);
		expect(fakeManager.installPlugin).toHaveBeenCalledWith(validInput.pluginId);
	});

	it("handles plugin manager installation error gracefully", async () => {
		const fakeManager = {
			installPlugin: vi
				.fn()
				.mockRejectedValue(new Error("Installation failed")),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isInstalled).toBe(true);
		expect(fakeManager.installPlugin).toHaveBeenCalledWith(validInput.pluginId);
	});

	it("handles database update error", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				update: vi.fn().mockReturnThis(),
				set: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				returning: vi.fn().mockRejectedValue(new Error("Database error")),
			},
		});
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("validates pluginId is required", async () => {
		const ctx = makeCtx();
		const args = { input: {} } as unknown as { input: typeof validInput };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("validates pluginId is a string", async () => {
		const ctx = makeCtx();
		const args = { input: { pluginId: null } } as unknown as {
			input: typeof validInput;
		};
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("validates pluginId is not empty", async () => {
		const ctx = makeCtx();
		const args = { input: { pluginId: "" } };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("installs plugin with valid pluginId format", async () => {
		const fakeManager = {
			installPlugin: vi.fn().mockResolvedValue(true),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx();
		const args = { input: { pluginId: "valid_plugin_id" } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isInstalled).toBe(true);
		expect(fakeManager.installPlugin).toHaveBeenCalledWith("valid_plugin_id");
	});

	it("installs plugin with camelCase pluginId", async () => {
		const fakeManager = {
			installPlugin: vi.fn().mockResolvedValue(true),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx();
		const args = { input: { pluginId: "validPluginId" } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isInstalled).toBe(true);
		expect(fakeManager.installPlugin).toHaveBeenCalledWith("validPluginId");
	});

	it("installs plugin with PascalCase pluginId", async () => {
		const fakeManager = {
			installPlugin: vi.fn().mockResolvedValue(true),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		const ctx = makeCtx();
		const args = { input: { pluginId: "ValidPluginId" } };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.isInstalled).toBe(true);
		expect(fakeManager.installPlugin).toHaveBeenCalledWith("ValidPluginId");
	});

	it("handles generic error during installation", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				update: vi.fn().mockImplementation(() => {
					throw new Error("Generic error");
				}),
			},
		});
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("re-throws TalawaGraphQLError as-is", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				update: vi.fn().mockImplementation(() => {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
							issues: [],
						},
					});
				}),
			},
		});
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});
});
