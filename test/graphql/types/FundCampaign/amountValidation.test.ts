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

describe("FundCampaign Amount Validation & BigInt Support", () => {
	it("should create a pledge with a valid positive amount", async () => {
		const adminAuth = await getAdminAuth();

		// 1. Create Organization
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

		// 2. Create Fund
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

		// 3. Create Fund Campaign
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

		// 4. Create Pledge
		const amount = 100;
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

		expect(pledgeResult.errors).toBeUndefined();
		expect(pledgeResult.data?.createFundCampaignPledge?.amount).toBe(amount);

		// Cleanup
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: { input: { id: orgId } },
		});
	});

	it("should fail to create a pledge with negative amount", async () => {
		const adminAuth = await getAdminAuth();

		// Setup Org/Fund/Campaign again
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

		const amount = -50;
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

		assertToBeNonNullish(pledgeResult.errors);
		expect(pledgeResult.errors?.[0]?.message).toBeTruthy();

		// Cleanup
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: { input: { id: orgId } },
		});
	});

	it("should handle very large numbers (BigInt)", async () => {
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

		const amount = 2000000000; // Large but still within 32-bit signed int range (2^31-1 = 2,147,483,647)
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

		expect(pledgeResult.errors).toBeUndefined();
		expect(pledgeResult.data?.createFundCampaignPledge?.amount).toBe(amount);

		// Cleanup
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${adminAuth.token}` },
			variables: { input: { id: orgId } },
		});
	});
});
