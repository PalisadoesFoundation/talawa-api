import { faker } from "@faker-js/faker";

import { describe, expect, it } from "vitest";

import "~/src/graphql/types/FundCampaign/FundCampaign";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createFundCampaign,
	Mutation_createFundCampaignPledge,
	Mutation_createOrganization,
	Mutation_deleteOrganization,
	Mutation_updateFundCampaignPledge,
	Query_fundCampaign,
	Query_signIn,
} from "../documentNodes";

async function getAdminAuth(): Promise<{ token: string; userId: string }> {
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

describe("FundCampaign Pledge Update & amountRaised Verification", () => {
	it("should update pledge amount and recalculate amountRaised", async () => {
		const adminAuth = await getAdminAuth();

		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);
		assertToBeNonNullish(orgResult.data?.createOrganization?.id);
		const orgId = orgResult.data.createOrganization.id;

		const fundResult = await mercuriusClient.mutate(Mutation_createFund, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: {
				input: {
					organizationId: orgId,
					name: "Test Fund",
					isTaxDeductible: false,
					isDefault: false,
					isArchived: false,
					referenceNumber: "123",
				},
			},
		});
		assertToBeNonNullish(fundResult.data?.createFund?.id);
		const fundId = fundResult.data.createFund.id;

		const campaignResult = await mercuriusClient.mutate(
			Mutation_createFundCampaign,
			{
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						fundId: fundId,
						name: "Test Campaign",
						goalAmount: 1000,
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 86400000).toISOString(),
						currencyCode: "USD",
					},
				},
			},
		);
		assertToBeNonNullish(campaignResult.data?.createFundCampaign?.id);
		const campaignId = campaignResult.data.createFundCampaign.id;

		// Create Pledge 100
		const initialAmount = 100;
		const pledgeResult = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						campaignId: campaignId,
						pledgerId: adminAuth.userId,
						amount: initialAmount,
					},
				},
			},
		);

		assertToBeNonNullish(pledgeResult.data?.createFundCampaignPledge?.id);
		const pledgeId = pledgeResult.data.createFundCampaignPledge.id;

		// Update Pledge to 150
		const newAmount = 150;
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateFundCampaignPledge,
			{
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						id: pledgeId,
						amount: newAmount,
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data?.updateFundCampaignPledge?.amount).toBe(newAmount);

		// Verify amountRaised is 150 (since it was 100, now 150 via update)
		// Wait, updateFundCampaignPledge returns the Pledge. We need to fetch Campaign to verify amountRaised.
		// Assuming Mutation_updateFundCampaignPledge doesn't return campaign fields in its default DocumentNode?
		// Let's assume we can fetch it via another query or if the mutation returns it (it should if we updated the docnode).
		// Since I'm using generated docnodes, I can't easily change them here without updating the source.
		// But amountValidation test used create mutation which returned campaign.amountRaised.
		// Let's rely on creating another pledge or fetching campaign if possible.
		// Actually, updateFundCampaignPledge in `updateFundCampaignPledge.ts` returns `FundCampaignPledge`.
		// `FundCampaignPledge` has `campaign` field.

		// BUT, the imported `Mutation_updateFundCampaignPledge` might not select `campaign { amountRaised }`.
		// I should probably define a custom query here or check `documentNodes.ts`.
		// To avoid complexity, I'll use a `gql.tada` query here directly or assume it works if I can't see the file.
		// Wait, typical pattern here is defining the query inside the test file if specific selection needed?
		// No, standard `documentNodes` are used.
		// Let's assume I can't check amountRaised directly from update result without custom query.

		const checkResult = await mercuriusClient.query(Query_fundCampaign, {
			variables: { input: { id: campaignId } },
			headers: { authorization: `bearer ${adminAuth.token}` },
		});

		expect(checkResult.data?.fundCampaign?.amountRaised).toBe(newAmount);

		// Cleanup
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: { input: { id: orgId } },
		});
	});
});
