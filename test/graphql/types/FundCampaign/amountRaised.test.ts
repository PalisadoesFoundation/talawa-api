import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { describe, expect, it } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/FundCampaign/FundCampaign";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createFundCampaign,
	Mutation_createFundCampaignPledge,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteFund,
	Mutation_deleteFundCampaign,
	Mutation_deleteOrganization,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

// Add missing mutation defs for testing if needed, though they should be in documentNodes
// We will assume documentNodes has CreateFundCampaignPledge as we used it in repro

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// GraphQL query to test FundCampaign.amountRaised field
const Query_fundCampaign_amountRaised = gql(`
  query FundCampaignAmountRaised($id: String!) {
    fundCampaign(input: { id: $id }) {
      id
      amountRaised
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
					startAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
					endAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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

// Note: amountRaised is a simple exposed field (t.exposeInt), so it doesn't have a standalone resolve function to unit test separately
// like custom resolvers do. We rely on integration tests to verify its behavior and access control.

describe("FundCampaign.amountRaised field resolver - Integration tests", () => {
	it("successfully returns amountRaised (initial 0) when super admin accesses fund campaign", async () => {
		const adminAuth = await getAdminAuth();
		const { fundCampaignId, cleanup } = await createOrgFundCampaign(adminAuth);

		try {
			const result = await mercuriusClient.query(
				Query_fundCampaign_amountRaised,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: { id: fundCampaignId },
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.fundCampaign).toBeDefined();
			expect(result.data?.fundCampaign?.id).toBe(fundCampaignId);
			expect(result.data?.fundCampaign?.amountRaised).toBe(0);
		} finally {
			await cleanup();
		}
	});

	it("reflects updated amount raised after pledge is created", async () => {
		const adminAuth = await getAdminAuth();
		const regularUser = await createRegularUser();
		const { fundCampaignId, cleanup } = await createOrgFundCampaign(
			adminAuth,
			true,
			regularUser.userId,
		); // Make regular user org admin to create pledge

		try {
			// Create Pledge
			const pledgeAmount = 500;
			const pledgeResult = await mercuriusClient.mutate(
				Mutation_createFundCampaignPledge,
				{
					headers: { authorization: `bearer ${regularUser.token}` },
					variables: {
						input: {
							amount: pledgeAmount,
							campaignId: fundCampaignId,
							pledgerId: regularUser.userId,
						},
					},
				},
			);
			assertToBeNonNullish(pledgeResult.data?.createFundCampaignPledge?.id);

			const result = await mercuriusClient.query(
				Query_fundCampaign_amountRaised,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: { id: fundCampaignId },
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.fundCampaign).toBeDefined();
			expect(result.data?.fundCampaign?.amountRaised).toBe(pledgeAmount);
		} finally {
			await cleanup();
		}
	});
});
