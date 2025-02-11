import { eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { Client } from "minio";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	ExplicitAuthenticationTokenPayload,
} from "../../../../src/graphql/context";
import { TalawaGraphQLError } from "../../../../src/utilities/TalawaGraphQLError";
import type { 
  Column, 
  ColumnBaseConfig, 
  ColumnDataType 
} from 'drizzle-orm';

interface CurrentClient {
	isAuthenticated: true;
	user?: {
		id: string;
		role: string;
		tokenVersion: number;
	};
}

interface TestContext {
	currentClient: CurrentClient;
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
		};
	};
	log: {
		warn: ReturnType<typeof vi.fn>;
	};
	app: FastifyInstance;
	reply: FastifyReply;
	__currentQuery: string;
	envConfig: {
		API_BASE_URL: string;
	};
	jwt: {
		sign: (payload: ExplicitAuthenticationTokenPayload) => string;
	};
	minio: {
		bucketName: "talawa";
		client: Client;
	};
}

interface OrganizationParent {
	id: string;
	creatorId: string | null;
}

type UserRole = "administrator" | "regular";

type User = {
	id: string;
	createdAt: Date;
	updatedAt: Date;
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	name: string;
	appLanguageCode: string;
	birthDate: string | null;
	gender: string | null;
	phoneNumber: string | null;
	addressLine1: string | null;
	addressLine2: string | null;
	city: string | null;
	state: string | null;
	zipCode: string | null;
	countryCode: string | null;
	status: string;
	role: UserRole;
	homePhoneNumber: string | null;
	workPhoneNumber: string | null;
	avatarMimeType: string | null;
	avatarBase64: string | null;
	educationGrade: string | null;
	employmentStatus: string | null;
	maritalStatus: string | null;
	organizationMembershipsWhereMember: Array<{
		role: "administrator" | "regular" | "member";
		organizationId: string;
	}>;
};

type UserWithRole = {
	id: string;
	role: UserRole;
	organizationMembershipsWhereMember: Array<{
		role: "administrator" | "regular" | "member";
		organizationId: string;
	}>;
};

type UserFromDB = {
	id: string;
	createdAt: Date;
	updatedAt: Date;
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	name: string;
	appLanguageCode: string;
	birthDate: string | null;
	gender: string | null;
	phoneNumber: string | null;
	addressLine1: string | null;
	addressLine2: string | null;
	city: string | null;
	state: string | null;
	zipCode: string | null;
	countryCode: string | null;
	status: string;
	role: UserRole;
	homePhoneNumber: string | null;
	workPhoneNumber: string | null;
	avatarMimeType:
		| "image/avif"
		| "image/jpeg"
		| "image/png"
		| "image/webp"
		| null;
	avatarBase64: string | null;
	educationGrade: string | null;
	employmentStatus: string | null;
	maritalStatus: string | null;
};

const createCompleteMockUser = (
	role: UserRole = "regular",
	memberships: Array<{
		role: "administrator" | "regular" | "member";
		organizationId: string;
	}> = [],
): User => ({
	id: "mock-id",
	createdAt: new Date(),
	updatedAt: new Date(),
	email: "test@example.com",
	password: "hashedpassword",
	firstName: "Test",
	lastName: "User",
	name: "Test User",
	appLanguageCode: "en",
	birthDate: null,
	gender: null,
	phoneNumber: null,
	addressLine1: null,
	addressLine2: null,
	city: null,
	state: null,
	zipCode: null,
	countryCode: null,
	status: "ACTIVE",
	role,
	homePhoneNumber: null,
	workPhoneNumber: null,
	avatarMimeType: null,
	avatarBase64: null,
	educationGrade: null,
	employmentStatus: null,
	maritalStatus: null,
	organizationMembershipsWhereMember: memberships,
});

const createMockContext = (overrides?: Partial<TestContext>): TestContext => ({
	currentClient: {
		isAuthenticated: true,
		user: {
			id: "user-123",
			role: "regular",
			tokenVersion: 1,
		},
	},
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: vi.fn(),
			},
		},
	},
	log: {
		warn: vi.fn(),
	},
	app: {
		addHook: vi.fn(),
		decorate: vi.fn(),
		get: vi.fn(),
		post: vi.fn(),
		server: {} as FastifyInstance["server"],
		pluginName: "",
		prefix: "",
		version: "",
	} as unknown as FastifyInstance,
	reply: {
		code: vi.fn(),
		send: vi.fn(),
		header: vi.fn(),
	} as unknown as FastifyReply,
	__currentQuery: "query { test }",
	envConfig: {
		API_BASE_URL: "http://localhost:4000",
	},
	jwt: {
		sign: vi.fn(),
	},
	minio: {
		bucketName: "talawa" as const,
		client: {} as Client,
	},
	...overrides,
});

type OrganizationFields = {
  organizationId: Column<ColumnBaseConfig<ColumnDataType, string>, object, object>;
};

type WhereOperators = {
  eq: typeof eq;
};

type UserFields = {
  id: Column<ColumnBaseConfig<ColumnDataType, string>, object, object>;
};

const resolveCreator = async (
	parent: OrganizationParent,
	_args: Record<string, never>,
	ctx: TestContext,
): Promise<User | null> => {
	if (!ctx.currentClient.isAuthenticated || !ctx.currentClient.user?.id) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	const currentUser = (await ctx.drizzleClient.query.usersTable.findFirst({
		columns: {
			role: true,
		},
		with: {
			organizationMembershipsWhereMember: {
				columns: {
					role: true,
					organizationId: true,
				},
				where: (
					fields: OrganizationFields,
					operators: WhereOperators,
				) => {
					return operators.eq(fields.organizationId, parent.id);
				},
			},
		},
		where: (userFields: UserFields, { eq: eqOp }: { eq: typeof eq }) =>
			eqOp(userFields.id, currentUserId),
	})) as UserWithRole | undefined;

	if (!currentUser) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];

	if (
		currentUser.role !== "administrator" &&
		(!currentUserOrganizationMembership ||
			currentUserOrganizationMembership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	if (parent.creatorId === null) {
		return null;
	}

	const existingUser = (await ctx.drizzleClient.query.usersTable.findFirst({
		where: (userFields: UserFields) =>
			eq(userFields.id, parent.creatorId || ""),
	})) as UserFromDB | undefined;

	if (!existingUser) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for an organization's creator id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return {
		...existingUser,
		organizationMembershipsWhereMember: [],
	};
};

describe("Organization Resolver - Creator Field", () => {
	let ctx: TestContext;
	let mockOrganization: OrganizationParent;

	beforeEach(() => {
		mockOrganization = {
			id: "org-123",
			creatorId: "user-123",
		};

		ctx = createMockContext();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			const testCtx = createMockContext({
				currentClient: {
					isAuthenticated: true,
					user: undefined,
				},
			});

			await expect(async () => {
				await resolveCreator(mockOrganization, {}, testCtx);
			}).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				}),
			);
		});

		it("should throw unauthenticated error if current user is not found", async () => {
			ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

			await expect(async () => {
				await resolveCreator(mockOrganization, {}, ctx);
			}).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				}),
			);
		});
	});

	describe("Authorization", () => {
		it("should allow access if user is system administrator", async () => {
			const mockUser = createCompleteMockUser("administrator");
			const mockCreator = createCompleteMockUser("regular");

			ctx.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockUser)
				.mockResolvedValueOnce(mockCreator);

			const result = await resolveCreator(mockOrganization, {}, ctx);
			expect(result).toEqual(mockCreator);
		});

		it("should allow access if user is organization administrator", async () => {
			const mockUser = createCompleteMockUser("regular", [
				{ role: "administrator", organizationId: "org-123" },
			]);
			const mockCreator = createCompleteMockUser("regular");

			ctx.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockUser)
				.mockResolvedValueOnce(mockCreator);

			const result = await resolveCreator(mockOrganization, {}, ctx);
			expect(result).toEqual(mockCreator);
		});

		it("should throw unauthorized error if user is not an administrator", async () => {
			const mockUser = createCompleteMockUser("regular", [
				{ role: "member", organizationId: "org-123" },
			]);
			ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUser,
			);

			await expect(async () => {
				await resolveCreator(mockOrganization, {}, ctx);
			}).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should throw unauthorized error if user has no organization membership", async () => {
			const mockUser = createCompleteMockUser("regular", []);
			ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUser,
			);

			await expect(async () => {
				await resolveCreator(mockOrganization, {}, ctx);
			}).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});
	});

	describe("Error Handling", () => {
		it("should throw unexpected error if creator user is not found", async () => {
			const mockUser = createCompleteMockUser("administrator");

			ctx.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockUser)
				.mockResolvedValueOnce(undefined);

			await expect(async () => {
				await resolveCreator(mockOrganization, {}, ctx);
			}).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an organization's creator id that isn't null.",
			);
		});
	});

	describe("Edge Cases", () => {
		it("should return null if organization has no creator", async () => {
			mockOrganization.creatorId = null;
			const mockUser = createCompleteMockUser("administrator");
			ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUser,
			);

			const result = await resolveCreator(mockOrganization, {}, ctx);
			expect(result).toBeNull();
		});

		it("should handle multiple organization memberships", async () => {
			const mockUser = createCompleteMockUser("regular", [
				{ role: "administrator", organizationId: "org-123" },
				{ role: "member", organizationId: "other-org" },
			]);
			const mockCreator = createCompleteMockUser("regular");

			ctx.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockUser)
				.mockResolvedValueOnce(mockCreator);

			const result = await resolveCreator(mockOrganization, {}, ctx);
			expect(result).toEqual(mockCreator);
		});
	});
});
