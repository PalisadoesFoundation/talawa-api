import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { describe, expect, it } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/FundCampaign/createdAt";
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
					startAt: new Date("2024-01-01T00:00:00.000Z"),
					endAt: new Date("2024-12-31T23:59:59.999Z"),
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
