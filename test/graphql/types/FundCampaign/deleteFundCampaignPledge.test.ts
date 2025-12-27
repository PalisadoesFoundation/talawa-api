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
	Mutation_deleteFundCampaignPledge,
	Mutation_deleteOrganization,
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

describe("FundCampaign Pledge Delete & amountRaised Verification", () => {
	it("should delete pledge and decrease amountRaised", async () => {
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

		// Create Pledge 200
		const amount = 200;
		const pledgeResult = await mercuriusClient.mutate(
			Mutation_createFundCampaignPledge,
			{
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						campaignId: campaignId,
						pledgerId: adminAuth.userId,
						amount: amount,
					},
				},
			},
		);

		assertToBeNonNullish(pledgeResult.data?.createFundCampaignPledge?.id);
		const pledgeId = pledgeResult.data.createFundCampaignPledge.id;

		// Verify initial amount (should be 200)
		let checkResult = await mercuriusClient.query(Query_fundCampaign, {
			variables: { input: { id: campaignId } },
			headers: { authorization: `bearer ${adminAuth.token}` },
		});
		expect(checkResult.data?.fundCampaign?.amountRaised).toBe("200");

		// Delete Pledge
		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteFundCampaignPledge,
			{
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						id: pledgeId,
					},
				},
			},
		);

		expect(deleteResult.errors).toBeUndefined();

		// Verify amountRaised is 0
		checkResult = await mercuriusClient.query(Query_fundCampaign, {
			variables: { input: { id: campaignId } },
			headers: { authorization: `bearer ${adminAuth.token}` },
		});

		expect(checkResult.data?.fundCampaign?.amountRaised).toBe("0");

		// Cleanup
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: { input: { id: orgId } },
		});
	});
});
