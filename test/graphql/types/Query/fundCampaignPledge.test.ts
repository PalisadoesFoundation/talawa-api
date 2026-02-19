import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test } from "vitest";

import { usersTable } from "~/src/drizzle/tables/users";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";

import {
	Mutation_createFund,
	Mutation_createFundCampaign,
	Mutation_createFundCampaignPledge,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteFund,
	Mutation_deleteFundCampaign,
	Mutation_deleteFundCampaignPledge,
	Mutation_deleteOrganization,
	Mutation_deleteOrganizationMembership,
	Mutation_deleteUser,
	Query_fundCampaignPledge,
} from "../documentNodes";

/* -------------------------------------------------------------------------- */
/*                                   Cleanup                                  */
/* -------------------------------------------------------------------------- */

const testCleanupFunctions: Array<() => Promise<void>> = [];

afterEach(async () => {
	for (const cleanup of testCleanupFunctions.reverse()) {
		try {
			await cleanup();
		} catch (err) {
			console.error("Cleanup failed:", err);
		}
	}
	testCleanupFunctions.length = 0;
});

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

async function getAdminAuthToken(): Promise<string> {
	const { accessToken } = await getAdminAuthViaRest(server);
	return accessToken;
}

async function createRegularUser(
	role: "regular" | "administrator" = "regular",
) {
	const adminAuthToken = await getAdminAuthToken();

	const res = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				emailAddress: `email_${faker.string.uuid()}@test.com`,
				password: "password123",
				role: role,
				name: "Test User",
				isEmailAddressVerified: false,
			},
		},
	});

	assertToBeNonNullish(res.data?.createUser?.authenticationToken);
	assertToBeNonNullish(res.data?.createUser?.user?.id);

	const userId = res.data.createUser.user.id;

	testCleanupFunctions.push(async () => {
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: userId } },
		});
	});

	return {
		authToken: res.data.createUser.authenticationToken,
		userId,
	};
}

async function createFund() {
	const adminAuthToken = await getAdminAuthToken();

	const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: `Org ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});
	assertToBeNonNullish(orgRes.data?.createOrganization?.id);

	const orgId = orgRes.data.createOrganization.id;

	const fundRes = await mercuriusClient.mutate(Mutation_createFund, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: `Fund ${faker.string.uuid()}`,
				organizationId: orgId,
				isTaxDeductible: false,
			},
		},
	});
	assertToBeNonNullish(fundRes.data?.createFund?.id);

	const fundId = fundRes.data.createFund.id;

	testCleanupFunctions.push(async () => {
		await mercuriusClient.mutate(Mutation_deleteFund, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: fundId } },
		});
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: orgId } },
		});
	});

	return { fundId, orgId };
}

async function createFundCampaign(fundId: string) {
	const adminAuthToken = await getAdminAuthToken();

	const res = await mercuriusClient.mutate(Mutation_createFundCampaign, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: `Campaign ${faker.string.uuid()}`,
				fundId,
				goalAmount: 5000,
				startAt: new Date(Date.now() - 1000).toISOString(),
				endAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
				currencyCode: "USD",
			},
		},
	});
	assertToBeNonNullish(res.data?.createFundCampaign?.id);

	const campaignId = res.data.createFundCampaign.id;

	testCleanupFunctions.push(async () => {
		await mercuriusClient.mutate(Mutation_deleteFundCampaign, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: campaignId } },
		});
	});

	return { campaignId };
}

async function createFundCampaignPledge(campaignId: string, pledgerId: string) {
	const adminAuthToken = await getAdminAuthToken();

	const res = await mercuriusClient.mutate(Mutation_createFundCampaignPledge, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				campaignId,
				pledgerId,
				amount: 2500,
				note: "Test pledge",
			},
		},
	});
	assertToBeNonNullish(res.data?.createFundCampaignPledge?.id);

	const pledgeId = res.data.createFundCampaignPledge.id;

	testCleanupFunctions.push(async () => {
		await mercuriusClient.mutate(Mutation_deleteFundCampaignPledge, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { id: pledgeId } },
		});
	});

	return { pledgeId };
}

async function addUserToOrg(userId: string, orgId: string) {
	const adminAuthToken = await getAdminAuthToken();

	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				memberId: userId,
				organizationId: orgId,
				role: "administrator",
			},
		},
	});

	testCleanupFunctions.push(async () => {
		await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: { input: { memberId: userId, organizationId: orgId } },
		});
	});
}

/* -------------------------------------------------------------------------- */
/*                                   Tests                                    */
/* -------------------------------------------------------------------------- */

suite("Query field fundCampaignPledge", () => {
	suite("authentication", () => {
		test("returns unauthenticated if client is not authenticated", async () => {
			const res = await mercuriusClient.query(Query_fundCampaignPledge, {
				variables: { input: { id: faker.string.uuid() } },
			});

			expect(res.data.fundCampaignPledge).toBeNull();
			expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});

		test("returns unauthenticated if user does not exist in DB", async () => {
			const user = await createRegularUser("administrator");
			const { fundId } = await createFund();
			const { campaignId } = await createFundCampaign(fundId);
			const { pledgeId } = await createFundCampaignPledge(
				campaignId,
				user.userId,
			);

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, user.userId));

			const res = await mercuriusClient.query(Query_fundCampaignPledge, {
				headers: { authorization: `bearer ${user.authToken}` },
				variables: { input: { id: pledgeId } },
			});

			expect(res.data.fundCampaignPledge).toBeNull();
			expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});
	});

	suite("input validation & existence", () => {
		test("returns invalid_arguments for invalid input", async () => {
			const adminAuthToken = await getAdminAuthToken();

			const res = await mercuriusClient.query(Query_fundCampaignPledge, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: "not-a-uuid",
					},
				},
			});
			expect(res.data.fundCampaignPledge).toBeNull();
			expect(res.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
		});

		test("returns not found when pledge does not exist", async () => {
			const adminAuthToken = await getAdminAuthToken();

			const res = await mercuriusClient.query(Query_fundCampaignPledge, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: faker.string.uuid() } },
			});

			expect(res.data.fundCampaignPledge).toBeNull();
			expect(res.errors?.[0]?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		});
	});

	suite("authorization", () => {
		test("denies access to unrelated user", async () => {
			const user = await createRegularUser();
			const otherUser = await createRegularUser();

			const { fundId } = await createFund();
			const { campaignId } = await createFundCampaign(fundId);
			const { pledgeId } = await createFundCampaignPledge(
				campaignId,
				otherUser.userId,
			);

			const res = await mercuriusClient.query(Query_fundCampaignPledge, {
				headers: { authorization: `bearer ${user.authToken}` },
				variables: { input: { id: pledgeId } },
			});

			expect(res.data.fundCampaignPledge).toBeNull();
			expect(res.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
		});

		test("allows pledge owner", async () => {
			const user = await createRegularUser();

			const { fundId } = await createFund();
			const { campaignId } = await createFundCampaign(fundId);
			const { pledgeId } = await createFundCampaignPledge(
				campaignId,
				user.userId,
			);
			const res = await mercuriusClient.query(Query_fundCampaignPledge, {
				headers: { authorization: `bearer ${user.authToken}` },
				variables: { input: { id: pledgeId } },
			});

			expect(res.errors).toBeUndefined();
			expect(res.data.fundCampaignPledge?.id).toBe(pledgeId);
		});

		test("allows organization admin", async () => {
			const user = await createRegularUser();
			const { fundId, orgId } = await createFund();
			await addUserToOrg(user.userId, orgId);
			const { campaignId } = await createFundCampaign(fundId);
			const { pledgeId } = await createFundCampaignPledge(
				campaignId,
				user.userId,
			);

			const res = await mercuriusClient.query(Query_fundCampaignPledge, {
				headers: { authorization: `bearer ${user.authToken}` },
				variables: { input: { id: pledgeId } },
			});

			expect(res.errors).toBeUndefined();
			expect(res.data.fundCampaignPledge?.id).toBe(pledgeId);
		});
		test("allows pledge owner (non-member) to view pledge", async () => {
			const user = await createRegularUser();
			const { fundId } = await createFund();
			// Intentionally skipping adding user to org to simulate external donor
			const { campaignId } = await createFundCampaign(fundId);
			const { pledgeId } = await createFundCampaignPledge(
				campaignId,
				user.userId,
			);

			const res = await mercuriusClient.query(Query_fundCampaignPledge, {
				headers: { authorization: `bearer ${user.authToken}` },
				variables: { input: { id: pledgeId } },
			});

			expect(res.errors).toBeUndefined();
			expect(res.data.fundCampaignPledge?.id).toBe(pledgeId);
		});
		test("allows super admin", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const user = await createRegularUser();

			const { fundId } = await createFund();
			const { campaignId } = await createFundCampaign(fundId);
			const { pledgeId } = await createFundCampaignPledge(
				campaignId,
				user.userId,
			);

			const res = await mercuriusClient.query(Query_fundCampaignPledge, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: pledgeId } },
			});

			expect(res.errors).toBeUndefined();
			expect(res.data.fundCampaignPledge?.id).toBe(pledgeId);
		});
		test("denies access to organization member who is not admin and not pledge owner", async () => {
			const viewer = await createRegularUser("regular");
			const pledger = await createRegularUser("regular");

			const { fundId, orgId } = await createFund();

			// viewer is org member but NOT admin
			const adminAuthToken = await getAdminAuthToken();
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						memberId: viewer.userId,
						organizationId: orgId,
						role: "regular",
					},
				},
			});

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: { memberId: viewer.userId, organizationId: orgId },
					},
				});
			});

			const { campaignId } = await createFundCampaign(fundId);
			const { pledgeId } = await createFundCampaignPledge(
				campaignId,
				pledger.userId,
			);

			const res = await mercuriusClient.query(Query_fundCampaignPledge, {
				headers: { authorization: `bearer ${viewer.authToken}` },
				variables: { input: { id: pledgeId } },
			});

			expect(res.data.fundCampaignPledge).toBeNull();
			expect(res.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
		});
		test("allows organization admin to view another user's pledge", async () => {
			const orgAdmin = await createRegularUser("regular"); // NOT super admin
			const pledgeOwner = await createRegularUser("regular");

			const { fundId, orgId } = await createFund();
			await addUserToOrg(orgAdmin.userId, orgId); // orgAdmin is org admin

			const { campaignId } = await createFundCampaign(fundId);
			const { pledgeId } = await createFundCampaignPledge(
				campaignId,
				pledgeOwner.userId, // ⚠️ Pledge created for DIFFERENT user
			);

			// orgAdmin viewing pledgeOwner's pledge
			const res = await mercuriusClient.query(Query_fundCampaignPledge, {
				headers: { authorization: `bearer ${orgAdmin.authToken}` },
				variables: { input: { id: pledgeId } },
			});

			expect(res.errors).toBeUndefined();
			expect(res.data.fundCampaignPledge?.id).toBe(pledgeId);
		});
	});
});
