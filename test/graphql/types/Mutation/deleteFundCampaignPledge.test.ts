import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";

import {
	Mutation_createFund,
	Mutation_createFundCampaign,
	Mutation_createFundCampaignPledge,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteFundCampaignPledge,
	Query_signIn,
} from "../documentNodes";

/* -------------------- SIGN IN AS ADMIN -------------------- */

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});

assertToBeNonNullish(signInResult.data?.signIn);
const adminToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(signInResult.data.signIn.user);
const adminUserId = signInResult.data.signIn.user.id;

/* --------------------------------------------------------- */

suite("Mutation deleteFundCampaignPledge", () => {
	/* ---------- 1. UNAUTHENTICATED ---------- */
	test("unauthenticated user cannot delete pledge", async () => {
		const res = await mercuriusClient.mutate(
			Mutation_deleteFundCampaignPledge,
			{
				variables: { input: { id: faker.string.uuid() } },
			},
		);

		expect(res.data?.deleteFundCampaignPledge).toBeNull();
		assertToBeNonNullish(res.errors);
		assertToBeNonNullish(res.errors[0]?.extensions);
		expect(res.errors[0].extensions?.code).toBe("unauthenticated");
	});

	/* ---------- 2. INVALID ARGUMENTS ---------- */
	test("invalid arguments return invalid_arguments", async () => {
		const res = await mercuriusClient.mutate(
			Mutation_deleteFundCampaignPledge,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: "not-a-uuid" } },
			},
		);

		expect(res.data?.deleteFundCampaignPledge).toBeNull();
		assertToBeNonNullish(res.errors);
		assertToBeNonNullish(res.errors[0]?.extensions);
		expect(res.errors[0].extensions?.code).toBe("invalid_arguments");
	});

	/* ---------- 3. PLEDGE NOT FOUND ---------- */
	test("non-existent pledge returns not_found", async () => {
		const res = await mercuriusClient.mutate(
			Mutation_deleteFundCampaignPledge,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: faker.string.uuid() } },
			},
		);

		expect(res.data?.deleteFundCampaignPledge).toBeNull();
		assertToBeNonNullish(res.errors);
		assertToBeNonNullish(res.errors[0]?.extensions);
		expect(res.errors[0].extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	/* ---------- 4. UNAUTHORIZED USER ---------- */
	test("non-admin non-pledger cannot delete pledge", async () => {
		const pledger = await createUser();
		const attacker = await createUser();

		const pledgeId = await createPledgeAsUser(pledger.token, pledger.id);

		const res = await mercuriusClient.mutate(
			Mutation_deleteFundCampaignPledge,
			{
				headers: { authorization: `bearer ${attacker.token}` },
				variables: { input: { id: pledgeId } },
			},
		);

		expect(res.data?.deleteFundCampaignPledge).toBeNull();
		assertToBeNonNullish(res.errors);
		assertToBeNonNullish(res.errors[0]?.extensions);
		expect(res.errors[0].extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	/* ---------- 5. PLEDGER SUCCESS ---------- */
	test("pledger with organization membership can delete own pledge", async () => {
		const user = await createUser();

		const { orgId, campaignId } = await createOrgAndCampaign();

		// 👇 ADD ORG MEMBERSHIP
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: user.id,
					role: "regular",
				},
			},
		});

		const pledgeId = await createPledgeWithCampaign(
			user.token,
			user.id,
			campaignId,
		);

		const res = await mercuriusClient.mutate(
			Mutation_deleteFundCampaignPledge,
			{
				headers: { authorization: `bearer ${user.token}` },
				variables: { input: { id: pledgeId } },
			},
		);

		expect(res.errors).toBeUndefined();
		assertToBeNonNullish(res.data.deleteFundCampaignPledge);
		expect(res.data.deleteFundCampaignPledge.id).toBe(pledgeId);
	});

	/* ---------- 6. ADMIN SUCCESS ---------- */
	test("administrator can delete any pledge", async () => {
		assertToBeNonNullish(adminToken);
		assertToBeNonNullish(adminUserId);
		const pledgeId = await createPledgeAsUser(adminToken, adminUserId);

		const res = await mercuriusClient.mutate(
			Mutation_deleteFundCampaignPledge,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: pledgeId } },
			},
		);

		expect(res.errors).toBeUndefined();
		assertToBeNonNullish(res.data.deleteFundCampaignPledge);
		expect(res.data.deleteFundCampaignPledge.id).toBe(pledgeId);
	});

	/* ---------- 7. ORG ADMIN SUCCESS ---------- */
	test("organization administrator can delete pledge", async () => {
		const orgAdmin = await createUser();
		const pledger = await createUser();

		const { orgId, campaignId } = await createOrgAndCampaign();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: orgAdmin.id,
					role: "administrator",
				},
			},
		});

		const pledgeId = await createPledgeWithCampaign(
			pledger.token,
			pledger.id,
			campaignId,
		);

		const res = await mercuriusClient.mutate(
			Mutation_deleteFundCampaignPledge,
			{
				headers: { authorization: `bearer ${orgAdmin.token}` },
				variables: { input: { id: pledgeId } },
			},
		);

		expect(res.errors).toBeUndefined();
		assertToBeNonNullish(res.data.deleteFundCampaignPledge);
		expect(res.data.deleteFundCampaignPledge.id).toBe(pledgeId);
	});

	/* ---------- 8. UNEXPECTED DELETE FAILURE ---------- */
	test("unexpected delete failure returns unexpected error", async () => {
		const user = await createUser();
		const pledgeId = await createPledgeAsUser(user.token, user.id);

		const spy = vi
			.spyOn(server.drizzleClient, "transaction")
			.mockResolvedValueOnce(
				undefined as unknown as Awaited<
					ReturnType<typeof server.drizzleClient.transaction>
				>,
			);

		const res = await mercuriusClient.mutate(
			Mutation_deleteFundCampaignPledge,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: pledgeId } },
			},
		);

		expect(res.data?.deleteFundCampaignPledge).toBeNull();
		assertToBeNonNullish(res.errors);
		assertToBeNonNullish(res.errors[0]?.extensions);
		expect(res.errors[0].extensions?.code).toBe("unexpected");

		spy.mockRestore();
	});
});

/* ---------------- HELPERS ---------------- */

async function createUser() {
	const res = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				emailAddress: `test-${faker.string.uuid()}@example.com`,
				password: faker.internet.password(),
				role: "regular",
				name: `org-${faker.string.uuid()}`,
				isEmailAddressVerified: true,
			},
		},
	});

	assertToBeNonNullish(res.data);
	const user = res.data.createUser;
	assertToBeNonNullish(user);
	assertToBeNonNullish(user.authenticationToken);
	assertToBeNonNullish(user.user);
	return {
		id: user.user.id,
		token: user.authenticationToken,
	};
}

async function createOrgAndCampaign() {
	const org = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				name: faker.company.name(),
				countryCode: "id",
				isUserRegistrationRequired: false,
			},
		},
	});
	assertToBeNonNullish(org.data);
	assertToBeNonNullish(org.data.createOrganization);
	const fund = await mercuriusClient.mutate(Mutation_createFund, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				name: "Fund",
				organizationId: org.data.createOrganization.id,
				isTaxDeductible: false,
			},
		},
	});
	assertToBeNonNullish(fund.data);
	assertToBeNonNullish(fund.data.createFund);
	const campaign = await mercuriusClient.mutate(Mutation_createFundCampaign, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				name: "Campaign",
				fundId: fund.data.createFund.id,
				goalAmount: 1000,
				currencyCode: "USD",
				startAt: new Date().toISOString(),
				endAt: new Date(Date.now() + 86400000).toISOString(),
			},
		},
	});
	assertToBeNonNullish(campaign.data);
	assertToBeNonNullish(campaign.data.createFundCampaign);
	return {
		orgId: org.data.createOrganization.id,
		campaignId: campaign.data.createFundCampaign.id,
	};
}

async function createPledgeAsUser(token: string, userId: string) {
	const { campaignId } = await createOrgAndCampaign();
	return createPledgeWithCampaign(token, userId, campaignId);
}

async function createPledgeWithCampaign(
	token: string,
	userId: string,
	campaignId: string,
) {
	const pledge = await mercuriusClient.mutate(
		Mutation_createFundCampaignPledge,
		{
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					pledgerId: userId,
					campaignId,
					amount: 100,
				},
			},
		},
	);
	assertToBeNonNullish(pledge.data);
	assertToBeNonNullish(pledge.data.createFundCampaignPledge);
	return pledge.data.createFundCampaignPledge.id;
}
