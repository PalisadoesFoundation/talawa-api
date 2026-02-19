import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import type { GraphQLObjectType } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/Fund/createdAt";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { Fund } from "~/src/graphql/types/Fund/Fund";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteFund,
	Mutation_deleteOrganization,
	Query_currentUser,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// GraphQL query to test Fund.createdAt field
const Query_fund_createdAt = gql(`
  query FundCreatedAt($id: String!) {
    fund(input: { id: $id }) {
      id
      createdAt
    }
  }
`);

type AdminAuth = { token: string; userId: string };

async function getAdminAuth(): Promise<AdminAuth> {
	const { accessToken } = await getAdminAuthViaRest(server);
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${accessToken}` },
	});
	const userId = currentUserResult.data?.currentUser?.id;
	assertToBeNonNullish(accessToken);
	assertToBeNonNullish(userId);
	return { token: accessToken, userId };
}

async function createRegularUser(): Promise<{ token: string; userId: string }> {
	const emailAddress = `test-${faker.string.uuid()}@example.com`;
	const password = faker.internet.password();

	// First create an organization for the user
	const adminAuth = await getAdminAuth();
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminAuth.token}` },
		variables: {
			input: {
				name: `Temp Org ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});
	assertToBeNonNullish(orgResult.data?.createOrganization?.id);
	const tempOrgId = orgResult.data.createOrganization.id as string;

	try {
		// Register user
		const registerResult = await mercuriusClient.mutate(
			gql(`
      mutation SignUp($input: MutationSignUpInput!) {
        signUp(input: $input) {
          authenticationToken
          user {
            id
          }
        }
      }
    `),
			{
				variables: {
					input: {
						emailAddress,
						password,
						name: "Regular User",
						selectedOrganization: tempOrgId,
					},
				},
			},
		);

		assertToBeNonNullish(registerResult.data?.signUp?.authenticationToken);
		assertToBeNonNullish(registerResult.data?.signUp?.user);

		return {
			token: registerResult.data.signUp.authenticationToken,
			userId: registerResult.data.signUp.user.id,
		};
	} finally {
		// Always delete temp org, even if signUp fails
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: { input: { id: tempOrgId } },
		});
	}
}

/**
 * Helper function to create an organization with a fund
 */
async function createOrgFund(
	adminAuth: AdminAuth,
	makeUserOrgMember = false,
	regularUserId?: string,
): Promise<{
	organizationId: string;
	fundId: string;
	cleanup: () => Promise<void>;
}> {
	// Create organization
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminAuth.token}` },
		variables: {
			input: {
				name: `Test Org ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});

	if (orgResult.errors && orgResult.errors.length > 0) {
		throw new Error(
			`createOrganization failed: ${JSON.stringify(orgResult.errors)}`,
		);
	}

	assertToBeNonNullish(orgResult.data?.createOrganization?.id);
	const organizationId = orgResult.data.createOrganization.id;

	let fundId: string;

	try {
		// Create fund
		const fundResult = await mercuriusClient.mutate(Mutation_createFund, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: {
				input: {
					name: `Test Fund ${faker.string.uuid()}`,
					organizationId,
					isTaxDeductible: false,
				},
			},
		});

		if (fundResult.errors && fundResult.errors.length > 0) {
			throw new Error(
				`createFund failed: ${JSON.stringify(fundResult.errors)}`,
			);
		}

		assertToBeNonNullish(fundResult.data?.createFund?.id);
		fundId = fundResult.data.createFund.id;

		// If requested, make the regular user an org member
		if (makeUserOrgMember && regularUserId) {
			const membershipResult = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							organizationId,
							memberId: regularUserId,
							role: "regular",
						},
					},
				},
			);

			if (membershipResult.errors && membershipResult.errors.length > 0) {
				throw new Error(
					`createOrganizationMembership failed: ${JSON.stringify(membershipResult.errors)}`,
				);
			}
		}
	} catch (error) {
		// Clean up organization if fund creation or membership creation fails
		try {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: { input: { id: organizationId } },
			});
		} catch (cleanupError) {
			console.error(
				"Failed to cleanup organization after error:",
				cleanupError,
			);
		}
		throw error;
	}

	const cleanup = async () => {
		try {
			await mercuriusClient.mutate(Mutation_deleteFund, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: { input: { id: fundId } },
			});
		} catch (error) {
			console.error("Failed to cleanup fund:", error);
		}

		try {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: { input: { id: organizationId } },
			});
		} catch (error) {
			console.error("Failed to cleanup organization:", error);
		}
	};

	return {
		organizationId,
		fundId,
		cleanup,
	};
}

// Get the createdAt resolver from the schema
const fundType = schema.getType("Fund") as GraphQLObjectType;
const createdAtField = fundType.getFields().createdAt;
if (!createdAtField) {
	throw new Error("createdAt field not found on Fund type");
}
const createdAtResolver = createdAtField.resolve as (
	parent: Fund,
	args: Record<string, never>,
	ctx: GraphQLContext,
) => Promise<Date>;

describe("Fund.createdAt field resolver - Unit tests", () => {
	let ctx: GraphQLContext;
	let mockFund: Fund;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		vi.clearAllMocks();
		const { context, mocks: newMocks } = createMockGraphQLContext(true, "123");
		ctx = context;
		mocks = newMocks;
		mockFund = {
			createdAt: new Date("2024-01-15T10:30:00Z"),
			name: "Annual Fund",
			id: "fund-111",
			organizationId: "org-456",
			creatorId: "000",
			updatedAt: new Date(),
			updaterId: "id-222",
			isTaxDeductible: true,
			isArchived: false,
			isDefault: false,
			referenceNumber: null,
		};
	});

	it("should throw unauthenticated error when user is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(createdAtResolver(mockFund, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("should throw unauthenticated error when currentUser is undefined (user not found in database)", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
			(...funcArgs: unknown[]) => {
				const args = funcArgs[0] as {
					where?: (fields: unknown, operators: unknown) => void;
				};

				// Execute the where callback to ensure coverage and verify filtering logic
				if (args?.where) {
					const fields = { id: "users.id" };
					const eqMock = vi.fn();
					const operators = { eq: eqMock };
					args.where(fields, operators);
					// Verify the resolver filters by currentUserId
					expect(eqMock).toHaveBeenCalledWith("users.id", "123");
				}

				return Promise.resolve(undefined);
			},
		);

		await expect(createdAtResolver(mockFund, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("should throw unauthorized_action when user is not admin and has no organization membership", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "regular",
			organizationMembershipsWhereMember: [],
		});

		await expect(createdAtResolver(mockFund, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthorized_action" },
		});
	});

	it("should return createdAt when user is a system administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});

		const result = await createdAtResolver(mockFund, {}, ctx);

		expect(result).toEqual(mockFund.createdAt);
	});

	it("should return createdAt when user is an organization member", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "regular",
			organizationMembershipsWhereMember: [{ role: "regular" }],
		});

		const result = await createdAtResolver(mockFund, {}, ctx);

		expect(result).toEqual(mockFund.createdAt);
	});

	it("should verify the where clause filters by organizationId correctly", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockImplementation(
			(...funcArgs: unknown[]) => {
				const args = funcArgs[0] as {
					with?: {
						organizationMembershipsWhereMember?: {
							where?: (fields: unknown, operators: unknown) => void;
						};
					};
				};

				// Execute the where callback to ensure coverage and verify filtering logic
				if (args?.with?.organizationMembershipsWhereMember?.where) {
					const fields = { organizationId: "orgs.id" };
					const eqMock = vi.fn();
					const operators = { eq: eqMock };
					args.with.organizationMembershipsWhereMember.where(fields, operators);
					// Verify the resolver filters by parent.organizationId
					expect(eqMock).toHaveBeenCalledWith(
						"orgs.id",
						mockFund.organizationId,
					);
				}

				return Promise.resolve({
					id: "user123",
					role: "administrator",
					organizationMembershipsWhereMember: [],
				});
			},
		);

		await createdAtResolver(mockFund, {}, ctx);

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledTimes(1);
	});
});

describe("Fund.createdAt field resolver - Integration tests", () => {
	it("throws unauthenticated error when client is not authenticated (query level)", async () => {
		const adminAuth = await getAdminAuth();
		const { fundId, cleanup } = await createOrgFund(adminAuth);

		try {
			const result = await mercuriusClient.query(Query_fund_createdAt, {
				variables: { id: fundId },
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		} finally {
			await cleanup();
		}
	});

	it("throws arguments_associated_resources_not_found error when fund doesn't exist", async () => {
		const adminAuth = await getAdminAuth();
		const nonExistentId = "non-existent-fund-id";

		const result = await mercuriusClient.query(Query_fund_createdAt, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: { id: nonExistentId },
		});

		expect(result.errors).toBeDefined();
		// Different layers (query-level vs field-level) may return different error codes
		// Accept either the specific 'arguments_associated_resources_not_found' or the
		// more generic 'invalid_arguments' depending on validation order.
		const code = result.errors?.[0]?.extensions?.code;
		expect([
			"arguments_associated_resources_not_found",
			"invalid_arguments",
		]).toContain(code);
	});

	it("throws unauthorized_action when regular user (not org member) tries to access", async () => {
		const adminAuth = await getAdminAuth();
		const regularUser = await createRegularUser();
		const { fundId, cleanup } = await createOrgFund(adminAuth);

		try {
			const result = await mercuriusClient.query(Query_fund_createdAt, {
				headers: { authorization: `bearer ${regularUser.token}` },
				variables: { id: fundId },
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
		} finally {
			await cleanup();
		}
	});

	it("successfully returns createdAt when super admin accesses fund", async () => {
		const adminAuth = await getAdminAuth();
		const { fundId, cleanup } = await createOrgFund(adminAuth);

		try {
			const result = await mercuriusClient.query(Query_fund_createdAt, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: { id: fundId },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.fund).toBeDefined();
			expect(result.data?.fund?.id).toBe(fundId);
			expect(result.data?.fund?.createdAt).toBeDefined();
			// GraphQL DateTime scalar is returned as an ISO string over the wire.
			expect(typeof result.data?.fund?.createdAt).toBe("string");
			// Ensure it's a parseable date
			expect(
				new Date(result.data?.fund?.createdAt as string).toString(),
			).not.toBe("Invalid Date");
		} finally {
			await cleanup();
		}
	});

	it("successfully returns createdAt when organization member accesses fund", async () => {
		const adminAuth = await getAdminAuth();
		const regularUser = await createRegularUser();

		// Create org, fund and make regular user an org member
		const { fundId, cleanup } = await createOrgFund(
			adminAuth,
			true,
			regularUser.userId,
		);

		try {
			const result = await mercuriusClient.query(Query_fund_createdAt, {
				headers: { authorization: `bearer ${regularUser.token}` },
				variables: { id: fundId },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.fund).toBeDefined();
			expect(result.data?.fund?.id).toBe(fundId);
			expect(result.data?.fund?.createdAt).toBeDefined();
			expect(typeof result.data?.fund?.createdAt).toBe("string");
			expect(
				new Date(result.data?.fund?.createdAt as string).toString(),
			).not.toBe("Invalid Date");
		} finally {
			await cleanup();
		}
	});
});
