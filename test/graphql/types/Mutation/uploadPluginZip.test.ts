import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { builder } from "../../../../src/graphql/builder";
import { TalawaGraphQLError } from "../../../../src/utilities/TalawaGraphQLError";

// Mock the GraphQL builder
vi.mock("../../../../src/graphql/builder", () => ({
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

// Mock the pluginInstaller module
vi.mock("../../../../src/utilities/pluginInstaller", () => ({
	installPluginFromZip: vi.fn(),
}));

import { installPluginFromZip } from "../../../../src/utilities/pluginInstaller";

// Import the actual mutation file to register the resolver
import "../../../../src/graphql/types/Mutation/uploadPluginZip";

// Import the exported schema and input type for testing
import {
	UploadPluginZipInput,
	uploadPluginZipInputSchema,
} from "../../../../src/graphql/types/Mutation/uploadPluginZip";

// Extract the resolver function from the builder mock after importing the module
let resolver: (
	parent: unknown,
	args: { input: typeof validInput },
	ctx: TestCtx,
) => Promise<unknown>;

const mutationFieldMock = builder.mutationField as unknown as Mock;
const mutationFieldCall = mutationFieldMock.mock.calls.find(
	(call: unknown[]) => call[0] === "uploadPluginZip",
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
	pluginZip: Promise.resolve({ arrayBuffer: async () => new ArrayBuffer(8) }),
	activate: false,
};

const fakePlugin = { pluginId: "test", name: "Test Plugin" };

type TestCtx = {
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
		};
	};
	currentClient: {
		user: { id: string } | undefined;
	};
	log: {
		info: ReturnType<typeof vi.fn>;
		error: ReturnType<typeof vi.fn>;
		warn: ReturnType<typeof vi.fn>;
		debug: ReturnType<typeof vi.fn>;
	};
	[key: string]: unknown;
};

function makeCtx(isAdmin = true, userId = "1"): TestCtx {
	return {
		drizzleClient: {
			query: {
				usersTable: {
					findFirst: vi
						.fn()
						.mockResolvedValue(
							isAdmin ? { role: "administrator" } : { role: "user" },
						),
				},
			},
		},
		currentClient: { user: userId ? { id: userId } : undefined },
		log: {
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		},
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

describe("uploadPluginZip mutation", () => {
	describe("uploadPluginZipInputSchema", () => {
		it("validates correct input schema", () => {
			const validData = {
				pluginZip: Promise.resolve({
					arrayBuffer: async () => new ArrayBuffer(8),
				}),
				activate: true,
			};

			const result = uploadPluginZipInputSchema.safeParse(validData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validData);
			}
		});

		it("validates input with default activate value", () => {
			const validData = {
				pluginZip: Promise.resolve({
					arrayBuffer: async () => new ArrayBuffer(8),
				}),
			};

			const result = uploadPluginZipInputSchema.safeParse(validData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.activate).toBe(false); // default value
			}
		});

		it("rejects invalid input schema", () => {
			const invalidData = {
				pluginZip: "not a promise",
				activate: "not a boolean",
			};

			const result = uploadPluginZipInputSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues).toHaveLength(1); // Only one validation error
			}
		});
	});

	describe("UploadPluginZipInput", () => {
		it("is exported correctly", () => {
			expect(UploadPluginZipInput).toBeDefined();
		});
	});

	describe("resolver function", () => {
		it("throws if not logged in", async () => {
			const ctx = makeCtx(true, "");
			const args = { input: validInput };
			await expect(resolver({}, args, ctx)).rejects.toThrow(TalawaGraphQLError);
		});

		it("throws if not admin", async () => {
			const ctx = makeCtx(false);
			const args = { input: validInput };
			await expect(resolver({}, args, ctx)).rejects.toThrow(TalawaGraphQLError);
		});

		it("throws if pluginZip is not a promise", async () => {
			const ctx = makeCtx();
			const args = {
				input: {
					...validInput,
					pluginZip: {} as unknown as Promise<{
						arrayBuffer: () => Promise<ArrayBuffer>;
					}>,
				},
			};
			await expect(resolver({}, args, ctx)).rejects.toThrow(TalawaGraphQLError);
		});

		it("throws if input is missing required fields", async () => {
			const ctx = makeCtx();
			const args = { input: {} as unknown as typeof validInput };
			await expect(resolver({}, args, ctx)).rejects.toThrow(TalawaGraphQLError);
		});

		it("throws if input has invalid types", async () => {
			const ctx = makeCtx();
			const args = {
				input: {
					pluginZip: "not a promise" as unknown as Promise<{
						arrayBuffer: () => Promise<ArrayBuffer>;
					}>,
					activate: "not a boolean" as unknown as boolean,
				},
			};
			await expect(resolver({}, args, ctx)).rejects.toThrow(TalawaGraphQLError);
		});

		it("installs plugin and returns plugin object", async () => {
			(installPluginFromZip as ReturnType<typeof vi.fn>).mockResolvedValue({
				plugin: fakePlugin,
			});
			const ctx = makeCtx();
			const args = { input: validInput };
			const result = await resolver({}, args, ctx);
			expect(result).toEqual(fakePlugin);
			expect(installPluginFromZip).toHaveBeenCalledWith({
				zipFile: await validInput.pluginZip,
				drizzleClient: ctx.drizzleClient,
				activate: false,
				userId: "1",
			});
		});

		it("installs plugin with activate flag", async () => {
			(installPluginFromZip as ReturnType<typeof vi.fn>).mockResolvedValue({
				plugin: fakePlugin,
			});
			const ctx = makeCtx();
			const args = { input: { ...validInput, activate: true } };
			const result = await resolver({}, args, ctx);
			expect(result).toEqual(fakePlugin);
			expect(installPluginFromZip).toHaveBeenCalledWith({
				zipFile: await validInput.pluginZip,
				drizzleClient: ctx.drizzleClient,
				activate: true,
				userId: "1",
			});
		});

		it("handles TalawaGraphQLError from installPluginFromZip", async () => {
			(installPluginFromZip as ReturnType<typeof vi.fn>).mockRejectedValue(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
			const ctx = makeCtx();
			const args = { input: validInput };
			await expect(resolver({}, args, ctx)).rejects.toThrow(TalawaGraphQLError);
		});

		it("handles unknown error from installPluginFromZip", async () => {
			(installPluginFromZip as ReturnType<typeof vi.fn>).mockRejectedValue(
				new Error("fail"),
			);
			const ctx = makeCtx();
			const args = { input: validInput };
			await expect(resolver({}, args, ctx)).rejects.toThrow(TalawaGraphQLError);
		});

		it("handles non-Error objects from installPluginFromZip", async () => {
			(installPluginFromZip as ReturnType<typeof vi.fn>).mockRejectedValue(
				"string error",
			);
			const ctx = makeCtx();
			const args = { input: validInput };
			await expect(resolver({}, args, ctx)).rejects.toThrow(TalawaGraphQLError);
		});

		it("handles null/undefined errors from installPluginFromZip", async () => {
			(installPluginFromZip as ReturnType<typeof vi.fn>).mockRejectedValue(
				null,
			);
			const ctx = makeCtx();
			const args = { input: validInput };
			await expect(resolver({}, args, ctx)).rejects.toThrow(TalawaGraphQLError);
		});

		it("handles database query errors", async () => {
			const ctx = makeCtx();
			ctx.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("DB error"),
			);
			const args = { input: validInput };
			await expect(resolver({}, args, ctx)).rejects.toThrow(Error);
		});

		it("handles missing user in database", async () => {
			const ctx = makeCtx();
			ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue(null);
			const args = { input: validInput };
			await expect(resolver({}, args, ctx)).rejects.toThrow(TalawaGraphQLError);
		});
	});
});
