import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { builder } from "../../../../../src/graphql/builder";
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
			returning: vi.fn().mockResolvedValue([
				{
					pluginId: validInput.pluginId,
					isActivated: false,
					isInstalled: false,
					backup: false,
				},
			]),
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
	it("creates a plugin successfully with default values", async () => {
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as {
			pluginId: string;
			isActivated: boolean;
			isInstalled: boolean;
			backup: boolean;
		};
		expect(result.pluginId).toBe(validInput.pluginId);
		expect(result.isActivated).toBe(false);
		expect(result.isInstalled).toBe(false);
		expect(result.backup).toBe(false);
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

	it("handles database insertion error", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				query: {
					pluginsTable: {
						findFirst: vi.fn().mockResolvedValue(null),
					},
				},
				insert: vi.fn().mockReturnThis(),
				values: vi.fn().mockReturnThis(),
				returning: vi.fn().mockRejectedValue(new Error("Database error")),
			},
		});
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toThrow("Database error");
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

	it("creates plugin with valid pluginId format", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				returning: vi.fn().mockResolvedValue([
					{
						pluginId: "valid_plugin_id",
						isActivated: false,
						isInstalled: false,
						backup: false,
					},
				]),
			},
		});
		const args = { input: { pluginId: "valid_plugin_id" } };
		const result = (await resolver({}, args, ctx)) as { pluginId: string };
		expect(result.pluginId).toBe("valid_plugin_id");
	});

	it("creates plugin with camelCase pluginId", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				returning: vi.fn().mockResolvedValue([
					{
						pluginId: "validPluginId",
						isActivated: false,
						isInstalled: false,
						backup: false,
					},
				]),
			},
		});
		const args = { input: { pluginId: "validPluginId" } };
		const result = (await resolver({}, args, ctx)) as { pluginId: string };
		expect(result.pluginId).toBe("validPluginId");
	});

	it("creates plugin with PascalCase pluginId", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				returning: vi.fn().mockResolvedValue([
					{
						pluginId: "ValidPluginId",
						isActivated: false,
						isInstalled: false,
						backup: false,
					},
				]),
			},
		});
		const args = { input: { pluginId: "ValidPluginId" } };
		const result = (await resolver({}, args, ctx)) as { pluginId: string };
		expect(result.pluginId).toBe("ValidPluginId");
	});
});
