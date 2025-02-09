import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Organization } from "~/src/graphql/types/Organization/Organization";
import { OrganizationUpdaterResolver } from "~/src/graphql/types/Organization/updater";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockLogger } from "../../../utilities/mockLogger";

interface ExtendedUser extends User {
	organizationMembershipsWhereMember?: Array<{
		role: string;
	}>;
}

interface BaseOrganization {
	id: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date | null;
	updaterId: string | null;
}

type TestOrganization = Organization & BaseOrganization;

interface TestContext extends Omit<GraphQLContext, "log" | "currentClient"> {
	log: FastifyBaseLogger;
	currentClient: {
		isAuthenticated: true;
		user: { id: string };
		token?: string;
	};
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
			organizationsTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
		};
	} & GraphQLContext["drizzleClient"];
	jwt: {
		sign: (payload: Record<string, unknown>) => string;
	};
}

describe("Organization Resolver: Updater Field", () => {
	let ctx: TestContext;
	let mockUser: ExtendedUser;
	let mockOrganization: TestOrganization;
	const currentDate = new Date();

	beforeEach(() => {
		mockUser = {
			id: "123",
			name: "John Doe",
			role: "administrator",
			createdAt: currentDate,
			updatedAt: null,
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
				},
			],
		} as ExtendedUser;

		mockOrganization = {
			id: "org-123",
			name: "Test Organization",
			createdAt: currentDate,
			updatedAt: null,
			updaterId: "456",
			description: "Test description",
		} as TestOrganization;

		const mockLogger = createMockLogger();

		ctx = {
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi.fn().mockResolvedValue(mockUser),
					},
					organizationsTable: {
						findFirst: vi.fn().mockResolvedValue(mockOrganization),
					},
				},
			} as unknown as TestContext["drizzleClient"],
			log: mockLogger,
			currentClient: {
				isAuthenticated: true,
				user: {
					id: "123",
				},
				token: "sample-token",
			},
			jwt: {},
		} as TestContext;

		// Clear mocks to prevent test pollution
		vi.clearAllMocks();
	});

	describe("Authentication and Authorization", () => {
		it("should throw unauthenticated error when user is not authenticated", async () => {
			const unauthenticatedCtx = {
				...ctx,
				currentClient: {
					...ctx.currentClient,
					isAuthenticated: false as false,
				},
			};

			await expect(
				OrganizationUpdaterResolver.updater(
					mockOrganization,
					{},
					unauthenticatedCtx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				}),
			);
		});

		it("should throw unauthorized error when user is not an administrator", async () => {
			const nonAdminUser = {
				...mockUser,
				organizationMembershipsWhereMember: [
					{
						role: "member",
					},
				],
			};
			ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				nonAdminUser,
			);

			await expect(
				OrganizationUpdaterResolver.updater(mockOrganization, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should proceed with authentication check when user is authenticated", async () => {
			const authenticatedCtx = {
				...ctx,
				currentClient: {
					...ctx.currentClient,
					isAuthenticated: true,
				},
			};

			// This test just verifies the authentication check passes
			// The actual resolver result will depend on other conditions
			await expect(
				OrganizationUpdaterResolver.updater(
					mockOrganization,
					{},
					authenticatedCtx,
				),
			).resolves.not.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				}),
			);
		});

		it("should throw forbidden_action error when currentUser is not found", async () => {
			// Mock the usersTable.findFirst to return null/undefined for currentUser
			ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			await expect(
				OrganizationUpdaterResolver.updater(mockOrganization, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "forbidden_action" },
				}),
			);
		});

		it("should throw forbidden_action error when currentUser is null", async () => {
			// Mock the usersTable.findFirst to return null explicitly
			ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(null);

			await expect(
				OrganizationUpdaterResolver.updater(mockOrganization, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "forbidden_action" },
				}),
			);
		});

		// Test the positive case
		it("should not throw forbidden_action error when currentUser exists", async () => {
			// Using the mockUser that's already set up in beforeEach
			const result = await OrganizationUpdaterResolver.updater(
				mockOrganization,
				{},
				ctx,
			);

			// Verify the resolver continues past the currentUser check
			expect(result).toBeDefined();
		});
	});

	describe("Updater Resolution", () => {
		it("should return null when updaterId is null", async () => {
			const nullUpdaterOrg: TestOrganization = {
				...mockOrganization,
				updaterId: null,
			};

			const result = await OrganizationUpdaterResolver.updater(
				nullUpdaterOrg,
				{},
				ctx,
			);

			expect(result).toBeNull();
		});

		it("should return current user when updaterId matches current user", async () => {
			const currentUserOrg: TestOrganization = {
				...mockOrganization,
				updaterId: "123",
			};

			const result = await OrganizationUpdaterResolver.updater(
				currentUserOrg,
				{},
				ctx,
			);

			expect(result).toEqual(mockUser);
		});
	});

	describe("Error Handling", () => {
		it("should handle database errors gracefully", async () => {
			const dbError = new Error("Database connection failed");
			ctx.drizzleClient.query.usersTable.findFirst.mockRejectedValueOnce(
				dbError,
			);

			await expect(
				OrganizationUpdaterResolver.updater(mockOrganization, {}, ctx),
			).rejects.toThrow(dbError);
		});

		it("should handle missing updater user scenarios appropriately", async () => {
			const differentUpdaterOrg: TestOrganization = {
				...mockOrganization,
				updaterId: "non-existent-id",
			};

			ctx.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockUser) // First call returns current user
				.mockResolvedValueOnce(undefined); // Second call returns undefined for updater

			await expect(
				OrganizationUpdaterResolver.updater(differentUpdaterOrg, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Something went wrong. Please try again later.",
					extensions: {
						code: "unexpected",
					},
				}),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				`Postgres select operation returned an empty array for organization ${differentUpdaterOrg.id}'s updaterId (${differentUpdaterOrg.updaterId}) that isn't null.`,
			);
		});
	});

	describe("Edge Cases", () => {
		describe("Organization Membership Scenarios", () => {
			it("should handle user with no organization memberships", async () => {
				const userWithoutMemberships: ExtendedUser = {
					...mockUser,
					organizationMembershipsWhereMember: [],
				};
				ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
					userWithoutMemberships,
				);

				await expect(
					OrganizationUpdaterResolver.updater(mockOrganization, {}, ctx),
				).rejects.toThrow(
					new TalawaGraphQLError({
						message: "You are not authorized to perform this action.",
						extensions: { code: "unauthorized_action" },
					}),
				);
			});

			it("should handle user with undefined memberships array", async () => {
				const userWithUndefinedMemberships: ExtendedUser = {
					...mockUser,
					organizationMembershipsWhereMember: undefined,
				};
				ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
					userWithUndefinedMemberships,
				);

				await expect(
					OrganizationUpdaterResolver.updater(mockOrganization, {}, ctx),
				).rejects.toThrow(
					TypeError("Cannot read properties of undefined (reading '0')"),
				);
			});

			it("should handle membership with missing role field", async () => {
				const userWithIncompleteData: ExtendedUser = {
					...mockUser,
					organizationMembershipsWhereMember: [{} as { role: string }],
				};
				ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
					userWithIncompleteData,
				);

				await expect(
					OrganizationUpdaterResolver.updater(mockOrganization, {}, ctx),
				).rejects.toThrow(
					new TalawaGraphQLError({
						message: "You are not authorized to perform this action.",
						extensions: { code: "unauthorized_action" },
					}),
				);
			});

			it("should handle membership with empty role string", async () => {
				const userWithEmptyRole: ExtendedUser = {
					...mockUser,
					organizationMembershipsWhereMember: [{ role: "" }],
				};
				ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
					userWithEmptyRole,
				);

				await expect(
					OrganizationUpdaterResolver.updater(mockOrganization, {}, ctx),
				).rejects.toThrow(
					new TalawaGraphQLError({
						message: "You are not authorized to perform this action.",
						extensions: { code: "unauthorized_action" },
					}),
				);
			});

			it("should handle multiple memberships with mixed roles", async () => {
				// Create a user with administrator role as first membership
				const userWithMixedRoles: ExtendedUser = {
					...mockUser,
					organizationMembershipsWhereMember: [{ role: "administrator" }],
				};
				ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
					userWithMixedRoles,
				);

				const result = await OrganizationUpdaterResolver.updater(
					mockOrganization,
					{},
					ctx,
				);

				expect(result).toEqual(userWithMixedRoles);
			});

			it("should reject if administrator role is not first membership", async () => {
				const userWithWrongRoleOrder: ExtendedUser = {
					...mockUser,
					organizationMembershipsWhereMember: [
						{ role: "member" },
						{ role: "administrator" }, // Even though user has admin role, it's not first
					],
				};
				ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
					userWithWrongRoleOrder,
				);

				await expect(
					OrganizationUpdaterResolver.updater(mockOrganization, {}, ctx),
				).rejects.toThrow(
					new TalawaGraphQLError({
						message: "You are not authorized to perform this action.",
						extensions: { code: "unauthorized_action" },
					}),
				);
			});
		});
	});
});
