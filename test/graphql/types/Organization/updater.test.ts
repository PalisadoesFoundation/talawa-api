import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
// import type { organizationsTable } from "~/src/drizzle/tables/organizations";
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
	// Add other required fields from your Organization type
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
	});

	describe("Authentication and Authorization", () => {
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

		it("should throw error when updater user is not found", async () => {
			const differentUpdaterOrg: TestOrganization = {
				...mockOrganization,
				updaterId: "non-existent-id",
			};

			ctx.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockUser)
				.mockResolvedValueOnce(undefined);

			await expect(
				OrganizationUpdaterResolver.updater(differentUpdaterOrg, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				`Postgres select operation returned an empty array for organization ${differentUpdaterOrg.id}'s updaterId (${differentUpdaterOrg.updaterId}) that isn't null.`,
			);
		});
	});

	describe("Edge Cases", () => {
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
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should handle null membership role", async () => {
			const userWithNullRole: ExtendedUser = {
				...mockUser,
				organizationMembershipsWhereMember: [
					{
						role: null as unknown as string,
					},
				],
			};
			ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				userWithNullRole,
			);

			await expect(
				OrganizationUpdaterResolver.updater(mockOrganization, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});
	});
});
