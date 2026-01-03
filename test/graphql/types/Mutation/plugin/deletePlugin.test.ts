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
	removePluginDirectory: vi.fn(),
}));
vi.mock("../../../../../src/plugin/registry", () => ({
	getPluginManagerInstance: vi.fn(),
}));

import { removePluginDirectory } from "../../../../../src/plugin/utils";

const validId = "123e4567-e89b-12d3-a456-426614174000";
const validInput = { id: validId };
const existingPlugin = {
	id: validId,
	pluginId: "test_plugin",
	isActivated: true,
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
		delete: ReturnType<typeof vi.fn>;
		where: ReturnType<typeof vi.fn>;
		returning: ReturnType<typeof vi.fn>;
	};
	log: {
		error: ReturnType<typeof vi.fn>;
		info: ReturnType<typeof vi.fn>;
		warn: ReturnType<typeof vi.fn>;
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
		log: {
			error: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
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
});
afterEach(() => {
	vi.restoreAllMocks();
});

describe("deletePlugin mutation", () => {
	it("deletes a plugin successfully", async () => {
		(removePluginDirectory as ReturnType<typeof vi.fn>).mockResolvedValue(
			undefined,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
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

	it("handles plugin manager present (uninstall)", async () => {
		const fakeManager = {
			uninstallPlugin: vi.fn().mockResolvedValue(true),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		(removePluginDirectory as ReturnType<typeof vi.fn>).mockResolvedValue(
			undefined,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		await resolver({}, args, ctx);
		expect(fakeManager.uninstallPlugin).toHaveBeenCalledWith(
			existingPlugin.pluginId,
		);
		expect(removePluginDirectory).toHaveBeenCalledWith(existingPlugin.pluginId);

		expect(ctx.log.info).toHaveBeenCalledWith(
			{ pluginId: existingPlugin.pluginId, correlationId: ctx.id },
			"Uninstalling plugin via lifecycle manager",
		);
		expect(ctx.log.info).toHaveBeenCalledWith(
			{ pluginId: existingPlugin.pluginId, correlationId: ctx.id },
			"Plugin uninstalled successfully via lifecycle manager",
		);
	});

	it("handles plugin manager errors gracefully", async () => {
		const fakeManager = {
			uninstallPlugin: vi.fn().mockRejectedValue(new Error("fail")),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		(removePluginDirectory as ReturnType<typeof vi.fn>).mockResolvedValue(
			undefined,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		expect(fakeManager.uninstallPlugin).toHaveBeenCalled();

		expect(ctx.log.info).toHaveBeenCalledWith(
			{ pluginId: existingPlugin.pluginId, correlationId: ctx.id },
			"Uninstalling plugin via lifecycle manager",
		);
		expect(ctx.log.error).toHaveBeenCalledWith(
			expect.any(Error),
			"Error during plugin lifecycle uninstallation",
		);
	});

	it("handles plugin manager uninstall failure gracefully", async () => {
		const fakeManager = {
			uninstallPlugin: vi.fn().mockResolvedValue(false),
		};
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			fakeManager,
		);
		(removePluginDirectory as ReturnType<typeof vi.fn>).mockResolvedValue(
			undefined,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		expect(fakeManager.uninstallPlugin).toHaveBeenCalled();

		expect(ctx.log.info).toHaveBeenCalledWith(
			{ pluginId: existingPlugin.pluginId, correlationId: ctx.id },
			"Uninstalling plugin via lifecycle manager",
		);
		expect(ctx.log.error).toHaveBeenCalledWith(
			{ pluginId: existingPlugin.pluginId, correlationId: ctx.id },
			"Plugin uninstallation failed in lifecycle manager",
		);
	});

	it("handles plugin directory removal error", async () => {
		(removePluginDirectory as ReturnType<typeof vi.fn>).mockRejectedValue(
			new Error("Directory removal failed"),
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.any(Error),
				pluginId: existingPlugin.pluginId,
				correlationId: ctx.id,
			}),
			`Failed to remove plugin directory for ${existingPlugin.pluginId}`,
		);
	});

	it("handles plugin manager absent", async () => {
		(getPluginManagerInstance as ReturnType<typeof vi.fn>).mockReturnValue(
			undefined,
		);
		(removePluginDirectory as ReturnType<typeof vi.fn>).mockResolvedValue(
			undefined,
		);
		const ctx = makeCtx();
		const args = { input: validInput };
		const result = (await resolver({}, args, ctx)) as typeof existingPlugin;
		expect(result.pluginId).toBe(existingPlugin.pluginId);
		expect(removePluginDirectory).toHaveBeenCalledWith(existingPlugin.pluginId);
	});

	it("throws if plugin not found after delete", async () => {
		const ctx = makeCtx();
		ctx.drizzleClient.returning = vi.fn().mockResolvedValue([undefined]);
		(removePluginDirectory as ReturnType<typeof vi.fn>).mockResolvedValue(
			undefined,
		);
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
	});

	it("handles database deletion error", async () => {
		const ctx = makeCtx({
			drizzleClient: {
				...makeCtx().drizzleClient,
				delete: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				returning: vi.fn().mockRejectedValue(new Error("Database error")),
			},
		});
		(removePluginDirectory as ReturnType<typeof vi.fn>).mockResolvedValue(
			undefined,
		);
		const args = { input: validInput };
		await expect(resolver({}, args, ctx)).rejects.toThrow("Database error");
	});

	it("validates input schema", async () => {
		const ctx = makeCtx();
		const args = { input: { id: 123 } } as unknown as {
			input: typeof validInput;
		};
		await expect(resolver({}, args, ctx)).rejects.toThrow();
	});

	it("validates id is required", async () => {
		const ctx = makeCtx();
		const args = { input: {} } as unknown as { input: typeof validInput };
		await expect(resolver({}, args, ctx)).rejects.toThrow();
	});
});
