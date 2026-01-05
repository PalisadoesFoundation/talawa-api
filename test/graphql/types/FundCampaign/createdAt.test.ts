import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import type { GraphQLObjectType } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/FundCampaign/createdAt";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { FundCampaign } from "~/src/graphql/types/FundCampaign/FundCampaign";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createFundCampaign,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteFund,
	Mutation_deleteFundCampaign,
	Mutation_deleteOrganization,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// GraphQL query to test FundCampaign.createdAt field
const Query_fundCampaign_createdAt = gql(`
  query FundCampaignCreatedAt($id: String!) {
    fundCampaign(input: { id: $id }) {
      id
      createdAt
    }
  }
`);

type AdminAuth = { token: string; userId: string };

async function getAdminAuth(): Promise<AdminAuth> {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(signInResult.data?.signIn?.authenticationToken);
	assertToBeNonNullish(signInResult.data?.signIn?.user);

	return {
		token: signInResult.data.signIn.authenticationToken,
		userId: signInResult.data.signIn.user.id,
	};
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

	// Delete temp org
	await mercuriusClient.mutate(Mutation_deleteOrganization, {
		headers: { authorization: `bearer ${adminAuth.token}` },
		variables: { input: { id: tempOrgId } },
	});

	return {
		token: registerResult.data.signUp.authenticationToken,
		userId: registerResult.data.signUp.user.id,
	};
}

/**
 * Helper function to create an organization with a fund and fund campaign
 */
async function createOrgFundCampaign(
	adminAuth: AdminAuth,
	makeUserOrgAdmin = false,
	regularUserId?: string,
): Promise<{
	organizationId: string;
	fundId: string;
	fundCampaignId: string;
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
		throw new Error(`createFund failed: ${JSON.stringify(fundResult.errors)}`);
	}

	assertToBeNonNullish(fundResult.data?.createFund?.id);
	const fundId = fundResult.data.createFund.id;

	// Create fund campaign
	const campaignResult = await mercuriusClient.mutate(
		Mutation_createFundCampaign,
		{
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: {
				input: {
					name: `Test Campaign ${faker.string.uuid()}`,
					fundId,
					goalAmount: 10000,
					currencyCode: "USD",
					startAt: new Date("2024-01-01T00:00:00.000Z").toISOString(),
					endAt: new Date("2024-12-31T23:59:59.999Z").toISOString(),
				},
			},
		},
	);

	if (campaignResult.errors && campaignResult.errors.length > 0) {
		throw new Error(
			`createFundCampaign failed: ${JSON.stringify(campaignResult.errors)}`,
		);
	}

	assertToBeNonNullish(campaignResult.data?.createFundCampaign?.id);
	const fundCampaignId = campaignResult.data.createFundCampaign.id;

	// If requested, make the regular user an org admin
	if (makeUserOrgAdmin && regularUserId) {
		const membershipResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						organizationId,
						memberId: regularUserId,
						role: "administrator",
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

	const cleanup = async () => {
		try {
			await mercuriusClient.mutate(Mutation_deleteFundCampaign, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: { input: { id: fundCampaignId } },
			});
		} catch (error) {
			console.error("Failed to cleanup fund campaign:", error);
		}

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
		fundCampaignId,
		cleanup,
	};
}

// Get the createdAt resolver from the schema
const fundCampaignType = schema.getType("FundCampaign") as GraphQLObjectType;
const createdAtField = fundCampaignType.getFields().createdAt;
if (!createdAtField) {
	throw new Error("createdAt field not found on FundCampaign type");
}
const createdAtResolver = createdAtField.resolve as (
	parent: FundCampaign,
	args: Record<string, never>,
	ctx: GraphQLContext,
) => Promise<Date>;

describe("FundCampaign.createdAt field resolver - Unit tests", () => {
	let ctx: GraphQLContext;
	let mockFundCampaign: FundCampaign;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	// Helper function to setup common authorized user and fund mocks
	const setupAuthorizedMocks = () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});
	};

	beforeEach(() => {
		vi.clearAllMocks();
		const { context, mocks: newMocks } = createMockGraphQLContext(true, "123");
		ctx = context;
		mocks = newMocks;
		mockFundCampaign = {
			createdAt: new Date("2024-01-15T10:30:00Z"),
			name: "Annual Fundraiser",
			id: "campaign-111",
			fundId: "fund-456",
			creatorId: "000",
			updatedAt: new Date(),
			updaterId: "id-222",
			currencyCode: "USD",
			goalAmount: 50000,
			startAt: new Date("2024-01-01T00:00:00Z"),
			endAt: new Date("2024-12-31T23:59:59Z"),
			amountRaised: 0,
		};
	});

	it("should throw unauthenticated error when user is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(
			createdAtResolver(mockFundCampaign, {}, ctx),
		).rejects.toMatchObject({
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
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		await expect(
			createdAtResolver(mockFundCampaign, {}, ctx),
		).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("should throw unexpected error when existingFund is undefined (corrupted data)", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockImplementation(
			(...funcArgs: unknown[]) => {
				const args = funcArgs[0] as {
					where?: (fields: unknown, operators: unknown) => void;
				};

				// Execute the where callback to ensure coverage and verify filtering logic
				if (args?.where) {
					const fields = { id: "funds.id" };
					const operators = { eq: vi.fn() };
					args.where(fields, operators);
				}

				return Promise.resolve(undefined);
			},
		);
		await expect(
			createdAtResolver(mockFundCampaign, {}, ctx),
		).rejects.toMatchObject({
			extensions: { code: "unexpected" },
		});

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a fund campaign's fund id that isn't null.",
		);
	});

	it("should throw unauthorized_action when user is not admin and has no organization membership", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		await expect(
			createdAtResolver(mockFundCampaign, {}, ctx),
		).rejects.toMatchObject({
			extensions: { code: "unauthorized_action" },
		});
	});

	it("should throw unauthorized_action when user is not admin and org membership role is not administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "member" }],
			},
		});

		await expect(
			createdAtResolver(mockFundCampaign, {}, ctx),
		).rejects.toMatchObject({
			extensions: { code: "unauthorized_action" },
		});
	});

	it("should return createdAt when user is a system administrator", async () => {
		setupAuthorizedMocks();

		const result = await createdAtResolver(mockFundCampaign, {}, ctx);

		expect(result).toEqual(mockFundCampaign.createdAt);
	});

	it("should return createdAt when user is an organization administrator", async () => {
		setupAuthorizedMocks();
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		const result = await createdAtResolver(mockFundCampaign, {}, ctx);

		expect(result).toEqual(mockFundCampaign.createdAt);
	});
});

describe("FundCampaign.createdAt field resolver - Integration tests", () => {
	it("throws unauthenticated error when client is not authenticated (query level)", async () => {
		const adminAuth = await getAdminAuth();
		const { fundCampaignId, cleanup } = await createOrgFundCampaign(adminAuth);

		try {
			const result = await mercuriusClient.query(Query_fundCampaign_createdAt, {
				variables: { id: fundCampaignId },
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		} finally {
			await cleanup();
		}
	});

	it("throws arguments_associated_resources_not_found error when fund campaign doesn't exist", async () => {
		const adminAuth = await getAdminAuth();
		const nonExistentId = "non-existent-fund-campaign-id";

		const result = await mercuriusClient.query(Query_fundCampaign_createdAt, {
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

	it("throws unauthorized_action_on_arguments_associated_resources when regular user (not org member) tries to access", async () => {
		const adminAuth = await getAdminAuth();
		const regularUser = await createRegularUser();
		const { fundCampaignId, cleanup } = await createOrgFundCampaign(adminAuth);

		try {
			const result = await mercuriusClient.query(Query_fundCampaign_createdAt, {
				headers: { authorization: `bearer ${regularUser.token}` },
				variables: { id: fundCampaignId },
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
		} finally {
			await cleanup();
		}
	});

	it("successfully returns createdAt when super admin accesses fund campaign", async () => {
		const adminAuth = await getAdminAuth();
		const { fundCampaignId, cleanup } = await createOrgFundCampaign(adminAuth);

		try {
			const result = await mercuriusClient.query(Query_fundCampaign_createdAt, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: { id: fundCampaignId },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.fundCampaign).toBeDefined();
			expect(result.data?.fundCampaign?.id).toBe(fundCampaignId);
			expect(result.data?.fundCampaign?.createdAt).toBeDefined();
			// GraphQL DateTime scalar is returned as an ISO string over the wire.
			expect(typeof result.data?.fundCampaign?.createdAt).toBe("string");
			// Ensure it's a parseable date
			expect(
				new Date(result.data?.fundCampaign?.createdAt as string).toString(),
			).not.toBe("Invalid Date");
		} finally {
			await cleanup();
		}
	});

	it("successfully returns createdAt when organization admin accesses fund campaign", async () => {
		const adminAuth = await getAdminAuth();
		const regularUser = await createRegularUser();

		// Create org, fund, campaign and make regular user an org admin
		const { fundCampaignId, cleanup } = await createOrgFundCampaign(
			adminAuth,
			true,
			regularUser.userId,
		);

		try {
			const result = await mercuriusClient.query(Query_fundCampaign_createdAt, {
				headers: { authorization: `bearer ${regularUser.token}` },
				variables: { id: fundCampaignId },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.fundCampaign).toBeDefined();
			expect(result.data?.fundCampaign?.id).toBe(fundCampaignId);
			expect(result.data?.fundCampaign?.createdAt).toBeDefined();
			expect(typeof result.data?.fundCampaign?.createdAt).toBe("string");
			expect(
				new Date(result.data?.fundCampaign?.createdAt as string).toString(),
			).not.toBe("Invalid Date");
		} finally {
			await cleanup();
		}
	});
});
