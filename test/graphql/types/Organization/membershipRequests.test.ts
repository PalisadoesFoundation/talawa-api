import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { Organization as OrganizationType } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type MembershipRequestsResolver = GraphQLFieldResolver<
	OrganizationType,
	GraphQLContext,
	Record<string, unknown>,
	unknown
>;

describe("Organization membershipRequests Resolver Tests", () => {
	let mockOrganization: OrganizationType;
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let membershipRequestsResolver: MembershipRequestsResolver;

	const mockResolveInfo: GraphQLResolveInfo = {} as GraphQLResolveInfo;

	beforeAll(() => {
		const organizationType = schema.getType(
			"Organization",
		) as GraphQLObjectType;
		const membershipRequestsField =
			organizationType.getFields().membershipRequests;
		if (!membershipRequestsField) {
			throw new Error(
				"membershipRequests field not found on Organization type",
			);
		}
		membershipRequestsResolver =
			membershipRequestsField.resolve as MembershipRequestsResolver;
		if (!membershipRequestsResolver) {
			throw new Error(
				"membershipRequests resolver not found on Organization type",
			);
		}
	});

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockOrganization = {
			id: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
			name: "Test Organization",
			description: "Test Description",
			creatorId: "123e4567-e89b-12d3-a456-426614174000",
			createdAt: new Date("2024-02-07T10:30:00.000Z"),
			updatedAt: new Date("2024-02-07T12:00:00.000Z"),
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			updaterId: null,
			state: null,
			postalCode: null,
			userRegistrationRequired: false,
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication and Authorization", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;
			await expect(
				membershipRequestsResolver(mockOrganization, {}, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error if current user is not found", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				membershipRequestsResolver(mockOrganization, {}, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthorized error for non-admin user with no organization membership", async () => {
			const mockUserData = {
				id: "user-123",
				role: "member",
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				membershipRequestsResolver(mockOrganization, {}, ctx, mockResolveInfo),
			).rejects.toMatchObject({
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
				},
			});
		});

		it("should throw unauthorized error for non-admin organization member", async () => {
			const mockUserData = {
				id: "user-123",
				role: "member",
			};
			const mockMembershipData = {
				role: "member",
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				mockMembershipData,
			);

			await expect(
				membershipRequestsResolver(mockOrganization, {}, ctx, mockResolveInfo),
			).rejects.toMatchObject({
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
				},
			});
		});

		it("should allow system administrator access", async () => {
			const mockUserData = {
				id: "user-123",
				role: "administrator",
			};

			// Mock usersTable.findFirst to invoke the where callback for coverage
			mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
				(args?: {
					where?: (
						fields: { id: string },
						operators: { eq: (a: string, b: string) => unknown },
					) => unknown;
				}) => {
					// Invoke the where callback if provided to cover line 99
					if (args?.where) {
						const mockFields = { id: "user-123" };
						const mockOperators = {
							eq: vi.fn((a, b) => ({ field: a, value: b })),
						};
						args.where(mockFields, mockOperators);
					}
					return Promise.resolve(mockUserData);
				},
			);

			// Mock organizationMembershipsTable.findFirst to invoke the where callback for coverage
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockImplementation(
				(args?: {
					where?: (
						fields: { organizationId: string; memberId: string },
						operators: {
							and: (...args: unknown[]) => unknown;
							eq: (a: string, b: string) => unknown;
						},
					) => unknown;
				}) => {
					// Invoke the where callback if provided to cover lines 106-109
					if (args?.where) {
						const mockFields = {
							organizationId: mockOrganization.id,
							memberId: "user-123",
						};
						const mockOperators = {
							and: vi.fn((...conditions) => ({ type: "and", conditions })),
							eq: vi.fn((a, b) => ({ field: a, value: b })),
						};
						args.where(mockFields, mockOperators);
					}
					return Promise.resolve(undefined);
				},
			);

			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValue(
				[],
			);

			const result = await membershipRequestsResolver(
				mockOrganization,
				{},
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
		});

		it("should allow organization administrator access", async () => {
			const mockUserData = {
				id: "user-123",
				role: "member",
			};
			const mockMembershipData = {
				role: "administrator",
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				mockMembershipData,
			);
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValue(
				[],
			);

			const result = await membershipRequestsResolver(
				mockOrganization,
				{},
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe("Argument Validation", () => {
		it("should throw invalid_arguments error for negative skip value", async () => {
			const mockUserData = {
				id: "user-123",
				role: "administrator",
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			await expect(
				membershipRequestsResolver(
					mockOrganization,
					{ skip: -1 },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: { code: "invalid_arguments" },
			});
		});

		it("should throw invalid_arguments error for first exceeding max (50)", async () => {
			const mockUserData = {
				id: "user-123",
				role: "administrator",
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			await expect(
				membershipRequestsResolver(
					mockOrganization,
					{ first: 100 },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: { code: "invalid_arguments" },
			});
		});

		it("should throw invalid_arguments error for negative first value", async () => {
			const mockUserData = {
				id: "user-123",
				role: "administrator",
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			await expect(
				membershipRequestsResolver(
					mockOrganization,
					{ first: -5 },
					ctx,
					mockResolveInfo,
				),
			).rejects.toMatchObject({
				extensions: { code: "invalid_arguments" },
			});
		});
	});

	describe("Name Filtering", () => {
		const setupAdminUser = () => {
			const mockUserData = {
				id: "user-123",
				role: "administrator",
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				undefined,
			);
		};

		it("should return membership requests without name filter", async () => {
			setupAdminUser();

			const mockRequests = [
				{
					id: "request-1",
					organizationId: mockOrganization.id,
					userId: "user-1",
					createdAt: new Date("2024-01-01"),
					user: { id: "user-1", name: "John Doe" },
				},
				{
					id: "request-2",
					organizationId: mockOrganization.id,
					userId: "user-2",
					createdAt: new Date("2024-01-02"),
					user: { id: "user-2", name: "Jane Smith" },
				},
			];

			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValue(
				mockRequests,
			);

			const result = await membershipRequestsResolver(
				mockOrganization,
				{},
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(2);
		});

		it("should filter by name_contains when provided and matching users found", async () => {
			setupAdminUser();

			const matchingUsers = [{ id: "user-1" }, { id: "user-3" }];
			// Mock the findMany for usersTable (used for name filtering)
			mocks.drizzleClient.query.usersTable.findMany.mockResolvedValue(
				matchingUsers,
			);

			const mockRequests = [
				{
					id: "request-1",
					organizationId: mockOrganization.id,
					userId: "user-1",
					createdAt: new Date("2024-01-01"),
					user: { id: "user-1", name: "John Doe" },
				},
			];

			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValue(
				mockRequests,
			);

			const result = await membershipRequestsResolver(
				mockOrganization,
				{ where: { user: { name_contains: "John" } } },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
			expect(mocks.drizzleClient.query.usersTable.findMany).toHaveBeenCalled();
			expect(
				mocks.drizzleClient.query.membershipRequestsTable.findMany,
			).toHaveBeenCalled();
		});

		it("should return empty array when name_contains matches no users", async () => {
			setupAdminUser();

			// Mock the findMany for usersTable to return empty array (no matching users)
			mocks.drizzleClient.query.usersTable.findMany.mockResolvedValue([]);

			const result = await membershipRequestsResolver(
				mockOrganization,
				{ where: { user: { name_contains: "NonExistentName" } } },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(0);
			// The membershipRequestsTable.findMany should NOT be called when no users match
			expect(
				mocks.drizzleClient.query.membershipRequestsTable.findMany,
			).not.toHaveBeenCalled();
		});
	});

	describe("Pagination", () => {
		const setupAdminUser = () => {
			const mockUserData = {
				id: "user-123",
				role: "administrator",
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				undefined,
			);
		};

		it("should apply default values (skip: 0, first: 10) when not provided", async () => {
			setupAdminUser();

			let capturedQueryArgs: Record<string, unknown> | undefined;
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockImplementation(
				(args?: Record<string, unknown>) => {
					capturedQueryArgs = args;
					return Promise.resolve([]);
				},
			);

			await membershipRequestsResolver(
				mockOrganization,
				{},
				ctx,
				mockResolveInfo,
			);

			expect(capturedQueryArgs).toBeDefined();
			expect(capturedQueryArgs?.offset).toBe(0);
			expect(capturedQueryArgs?.limit).toBe(10);
		});

		it("should apply custom skip and first values", async () => {
			setupAdminUser();

			let capturedQueryArgs: Record<string, unknown> | undefined;
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockImplementation(
				(args?: Record<string, unknown>) => {
					capturedQueryArgs = args;
					return Promise.resolve([]);
				},
			);

			await membershipRequestsResolver(
				mockOrganization,
				{ skip: 5, first: 20 },
				ctx,
				mockResolveInfo,
			);

			expect(capturedQueryArgs).toBeDefined();
			expect(capturedQueryArgs?.offset).toBe(5);
			expect(capturedQueryArgs?.limit).toBe(20);
		});

		it("should apply skip: 0 as valid value", async () => {
			setupAdminUser();

			let capturedQueryArgs: Record<string, unknown> | undefined;
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockImplementation(
				(args?: Record<string, unknown>) => {
					capturedQueryArgs = args;
					return Promise.resolve([]);
				},
			);

			await membershipRequestsResolver(
				mockOrganization,
				{ skip: 0, first: 5 },
				ctx,
				mockResolveInfo,
			);

			expect(capturedQueryArgs).toBeDefined();
			expect(capturedQueryArgs?.offset).toBe(0);
			expect(capturedQueryArgs?.limit).toBe(5);
		});

		it("should apply first: 50 (max value) as valid", async () => {
			setupAdminUser();

			let capturedQueryArgs: Record<string, unknown> | undefined;
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockImplementation(
				(args?: Record<string, unknown>) => {
					capturedQueryArgs = args;
					return Promise.resolve([]);
				},
			);

			await membershipRequestsResolver(
				mockOrganization,
				{ first: 50 },
				ctx,
				mockResolveInfo,
			);

			expect(capturedQueryArgs).toBeDefined();
			expect(capturedQueryArgs?.limit).toBe(50);
		});
	});

	describe("Where Clause Handling", () => {
		const setupAdminUser = () => {
			const mockUserData = {
				id: "user-123",
				role: "administrator",
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValue(
				undefined,
			);
		};

		it("should handle undefined where clause", async () => {
			setupAdminUser();
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValue(
				[],
			);

			const result = await membershipRequestsResolver(
				mockOrganization,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
		});

		it("should handle where clause with undefined user", async () => {
			setupAdminUser();
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValue(
				[],
			);

			const result = await membershipRequestsResolver(
				mockOrganization,
				{ first: 10, where: {} },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
		});

		it("should handle where clause with user but undefined name_contains", async () => {
			setupAdminUser();
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValue(
				[],
			);

			const result = await membershipRequestsResolver(
				mockOrganization,
				{ first: 10, where: { user: {} } },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
		});
	});
});
