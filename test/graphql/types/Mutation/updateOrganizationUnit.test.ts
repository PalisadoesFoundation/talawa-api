import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("postgres", () => ({
	default: vi.fn(() => ({
		end: vi.fn(),
	})),
}));

vi.mock("~/src/server", () => ({
	server: {
		envConfig: {},
		minio: { client: { putObject: vi.fn() } },
	},
}));

// Mock utilities
vi.mock("~/src/utilities/TalawaGraphQLError", () => ({
	TalawaGraphQLError: class extends Error {
		constructor(message: string, _options?: Record<string, unknown>) {
			super(message);
		}
	},
}));

vi.mock("~/src/utilities/isNotNullish", () => ({
	isNotNullish: (val: unknown) => val !== null && val !== undefined,
}));

// Hoist mocks to be accessible inside vi.mock
const mocks = vi.hoisted(() => {
	return {
		builder: {
			mutationField: vi.fn(),
			field: vi.fn((args) => args),
			arg: vi.fn(),
			type: vi.fn(),
			required: vi.fn(),
			resolve: vi.fn(),
			objectRef: vi.fn(),
			inputType: vi.fn(),
			inputRef: vi.fn(),
			enumType: vi.fn(),
			scalarType: vi.fn(),
			interfaceType: vi.fn(),
			unionType: vi.fn(),
			queryField: vi.fn(),
		},
		tx: {
			update: vi.fn(),
			set: vi.fn(),
			where: vi.fn(),
			returning: vi.fn().mockResolvedValue([
				{
					id: "org-1",
					avatarMimeType: "image/png",
					avatarName: "new-avatar-id",
				},
			]),
		},
		drizzle: {
			transaction: vi.fn(),
			query: {
				organizationsTable: {
					findFirst: vi.fn(),
				},
				usersTable: {
					findFirst: vi.fn(),
				},
			},
			update: vi.fn(),
		},
		minio: {
			client: {
				putObject: vi.fn().mockResolvedValue({}),
				removeObject: vi.fn().mockResolvedValue({}),
			},
			bucketName: "talawa",
		},
	};
});

// Configure Drizzle Mock
mocks.drizzle.transaction.mockImplementation(
	(cb: (tx: typeof mocks.tx) => unknown) => cb(mocks.tx),
);
mocks.drizzle.update.mockReturnValue(mocks.tx);
mocks.tx.update.mockReturnValue(mocks.tx);
mocks.tx.set.mockReturnValue(mocks.tx);
mocks.tx.where.mockReturnValue(mocks.tx);

vi.mock("~/src/graphql/builder", () => ({
	builder: mocks.builder,
}));

// Mock context and services
const mockContext = {
	currentClient: {
		isAuthenticated: true,
		user: { id: "admin-id" },
	},
	drizzleClient: mocks.drizzle,
	minio: mocks.minio,
	cache: {
		del: vi.fn().mockResolvedValue(undefined),
		clearByPattern: vi.fn().mockResolvedValue(undefined),
	},
};

vi.mock("~/src/drizzle/client", () => ({
	drizzleClient: mocks.drizzle,
}));

vi.mock("~/src/services/minio", () => ({
	minio: mocks.minio,
}));

vi.mock("ulidx", () => ({
	ulid: () => "mock-ulid",
}));

// Mock the Organization type to prevent import errors or side effects
vi.mock("~/src/graphql/types/Organization/Organization", () => ({
	Organization: "OrganizationType",
}));

vi.mock("~/src/graphql/inputs/MutationUpdateOrganizationInput", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		mutationUpdateOrganizationInputSchema: z.any(),
		MutationUpdateOrganizationInput: "MutationUpdateOrganizationInput",
	};
});

vi.mock("~/src/drizzle/enums/imageMimeType", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		imageMimeTypeEnum: z.enum(["image/png"]),
	};
});

import "~/src/graphql/types/Mutation/updateOrganization";

describe("updateOrganization Resolver Unit Coverage", () => {
	let resolver: (...args: unknown[]) => unknown;

	beforeAll(() => {
		// Capture the resolver from the builder mock
		const calls = mocks.builder.mutationField.mock.calls;
		const updateOrgCall = calls.find(
			(c: unknown[]) => c[0] === "updateOrganization",
		);
		if (updateOrgCall) {
			// The resolver is passed in the field definition
			const fieldDef = updateOrgCall[1]({
				field: mocks.builder.field,
				arg: mocks.builder.arg,
			});
			resolver = fieldDef.resolve;
		}
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should be defined", () => {
		expect(resolver).toBeDefined();
	});

	it("should handle avatar upload (coverage for true branch of isNotNullish logic)", async () => {
		mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		mocks.drizzle.query.organizationsTable.findFirst.mockResolvedValue({
			id: "org-1",
			avatarName: "old-avatar",
		});

		const args = {
			input: {
				id: "org-1",
				avatar: {
					mimetype: "image/png",
					createReadStream: vi.fn().mockReturnValue("stream"),
				},
			},
		};

		// Execute resolver
		await resolver(null, args, mockContext);

		expect(mocks.minio.client.putObject).toHaveBeenCalledWith(
			"talawa",
			"old-avatar",
			expect.anything(),
			undefined,
			{ "content-type": "image/png" },
		);

		// Verify Drizzle Update with Avatar Fields
		expect(mocks.tx.set).toHaveBeenCalledWith(
			expect.objectContaining({
				avatarMimeType: "image/png",
				avatarName: "old-avatar",
			}),
		);
	});
});
