import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { expect, suite, test } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../../types/client";
import {
	Mutation_createFund,
	Mutation_createFundCampaign,
	Mutation_createFundCampaignPledge,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

/**
 * GraphQL document for querying FundCampaign pledges connection.
 */
const Query_FundCampaign_Pledges = gql(`
  query Query_FundCampaign_Pledges(
    $input: QueryFundCampaignInput!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    fundCampaign(input: $input) {
      id
      name
      pledges(first: $first, after: $after, last: $last, before: $before) {
        edges {
          cursor
          node {
            id
            amount
            note
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
`);

// Sign in as admin user for setup
const adminSignInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(adminSignInResult.data?.signIn);
const adminAuthToken = adminSignInResult.data.signIn.authenticationToken;
assertToBeNonNullish(adminAuthToken);
assertToBeNonNullish(adminSignInResult.data.signIn.user);
const adminUser = adminSignInResult.data.signIn.user;

/**
 * Helper to create a unique organization for testing
 */
async function createTestOrganization() {
	const uniqueId = faker.string.uuid();
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					name: `Pledges Integration Test Org ${uniqueId}`,
					description: `Organization for pledges integration tests ${uniqueId}`,
					countryCode: "us",
					state: "CA",
					city: "San Francisco",
					postalCode: "94101",
					addressLine1: "100 Test St",
				},
			},
		},
	);
	assertToBeNonNullish(createOrgResult.data?.createOrganization);
	const organization = createOrgResult.data.createOrganization;

	// Add admin as organization admin
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				organizationId: organization.id,
				memberId: adminUser.id,
				role: "administrator",
			},
		},
	});

	return organization;
}

/**
 * Helper to create a fund for testing
 */
async function createTestFund(organizationId: string) {
	const uniqueId = faker.string.uuid();
	const createFundResult = await mercuriusClient.mutate(Mutation_createFund, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: `Test Fund ${uniqueId}`,
				organizationId,
				isTaxDeductible: false,
			},
		},
	});
	assertToBeNonNullish(createFundResult.data?.createFund);
	return createFundResult.data.createFund;
}

/**
 * Helper to create a fund campaign for testing
 */
async function createTestFundCampaign(fundId: string) {
	const uniqueId = faker.string.uuid();
	const startDate = new Date();
	const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later

	const createCampaignResult = await mercuriusClient.mutate(
		Mutation_createFundCampaign,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					name: `Test Campaign ${uniqueId}`,
					fundId,
					goalAmount: 10000,
					currencyCode: "USD",
					startAt: startDate.toISOString(),
					endAt: endDate.toISOString(),
				},
			},
		},
	);
	assertToBeNonNullish(createCampaignResult.data?.createFundCampaign);
	return createCampaignResult.data.createFundCampaign;
}

/**
 * Helper to create a user for pledging
 */
async function createTestUser(organizationId: string) {
	const uniqueId = faker.string.uuid();
	const emailAddress = `pledger-${uniqueId}@test.com`;
	const password = faker.internet.password();

	const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: `Pledger ${uniqueId}`,
				emailAddress,
				password,
				role: "regular",
				isEmailAddressVerified: true,
			},
		},
	});
	assertToBeNonNullish(createUserResult.data?.createUser);
	assertToBeNonNullish(createUserResult.data.createUser.user);

	// Add user to organization
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				organizationId,
				memberId: createUserResult.data.createUser.user.id,
				role: "regular",
			},
		},
	});

	return {
		user: createUserResult.data.createUser.user,
		authToken: createUserResult.data.createUser.authenticationToken,
	};
}

/**
 * Helper to create a pledge
 */
async function createTestPledge(
	campaignId: string,
	pledgerId: string,
	authToken: string,
	amount: number,
	note?: string,
) {
	const createPledgeResult = await mercuriusClient.mutate(
		Mutation_createFundCampaignPledge,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					campaignId,
					pledgerId,
					amount,
					note: note ?? null,
				},
			},
		},
	);

	// Better error message for debugging
	if (!createPledgeResult.data?.createFundCampaignPledge) {
		throw new Error(
			`Failed to create pledge: ${JSON.stringify(
				createPledgeResult.errors,
				null,
				2,
			)}`,
		);
	}

	return createPledgeResult.data.createFundCampaignPledge;
}

suite("FundCampaign.pledges Integration Tests", () => {
	test("should return empty connection when campaign has no pledges", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				first: 10,
			},
		});

		assertToBeNonNullish(result.data?.fundCampaign);
		const pledgesConnection = result.data.fundCampaign.pledges;
		assertToBeNonNullish(pledgesConnection);
		const { edges, pageInfo } = pledgesConnection;
		assertToBeNonNullish(edges);

		expect(edges).toHaveLength(0);
		expect(pageInfo.hasNextPage).toBe(false);
		expect(pageInfo.hasPreviousPage).toBe(false);
		expect(pageInfo.startCursor).toBeNull();
		expect(pageInfo.endCursor).toBeNull();
	});

	test("should return pledges with forward pagination", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		// Create 5 pledges from different users (each user can only pledge once to a campaign)
		const pledges = [];
		for (let i = 0; i < 5; i++) {
			const { user: pledger, authToken } = await createTestUser(
				organization.id,
			);
			assertToBeNonNullish(authToken);
			const pledge = await createTestPledge(
				campaign.id,
				pledger.id,
				authToken,
				1000 * (i + 1),
				`Pledge ${i + 1}`,
			);
			pledges.push(pledge);
		}

		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				first: 3,
			},
		});

		assertToBeNonNullish(result.data?.fundCampaign);
		const pledgesConnection = result.data.fundCampaign.pledges;
		assertToBeNonNullish(pledgesConnection);
		const { edges, pageInfo } = pledgesConnection;
		assertToBeNonNullish(edges);

		expect(edges).toHaveLength(3);
		expect(pageInfo.hasNextPage).toBe(true);
		expect(pageInfo.hasPreviousPage).toBe(false);
		expect(pageInfo.startCursor).toBeDefined();
		expect(pageInfo.endCursor).toBeDefined();

		// Verify pledges are returned (most recent first by default)
		const returnedIds = edges.map((edge) => {
			assertToBeNonNullish(edge);
			assertToBeNonNullish(edge.node);
			return edge.node.id;
		});
		expect(returnedIds).toContain(pledges[pledges.length - 1]?.id);
	});

	test("should return pledges with backward pagination", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		// Create 5 pledges from different users
		for (let i = 0; i < 5; i++) {
			const { user: pledger, authToken } = await createTestUser(
				organization.id,
			);
			assertToBeNonNullish(authToken);
			await createTestPledge(
				campaign.id,
				pledger.id,
				authToken,
				1000 * (i + 1),
				`Pledge ${i + 1}`,
			);
		}

		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				last: 3,
			},
		});

		assertToBeNonNullish(result.data?.fundCampaign);
		const pledgesConnection = result.data.fundCampaign.pledges;
		assertToBeNonNullish(pledgesConnection);
		const { edges, pageInfo } = pledgesConnection;
		assertToBeNonNullish(edges);

		expect(edges).toHaveLength(3);
		expect(pageInfo.hasNextPage).toBe(false);
		expect(pageInfo.hasPreviousPage).toBe(true);
		expect(pageInfo.startCursor).toBeDefined();
		expect(pageInfo.endCursor).toBeDefined();
	});

	test("should support cursor-based forward pagination", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		// Create 10 pledges from different users
		for (let i = 0; i < 10; i++) {
			const { user: pledger, authToken } = await createTestUser(
				organization.id,
			);
			assertToBeNonNullish(authToken);
			await createTestPledge(
				campaign.id,
				pledger.id,
				authToken,
				1000 * (i + 1),
				`Pledge ${i + 1}`,
			);
		}

		// Get first page
		const firstPageResult = await mercuriusClient.query(
			Query_FundCampaign_Pledges,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: { id: campaign.id },
					first: 4,
				},
			},
		);

		assertToBeNonNullish(firstPageResult.data?.fundCampaign);
		const firstPage = firstPageResult.data.fundCampaign.pledges;
		assertToBeNonNullish(firstPage);
		assertToBeNonNullish(firstPage.edges);
		expect(firstPage.edges).toHaveLength(4);
		expect(firstPage.pageInfo.hasNextPage).toBe(true);

		// Get second page using endCursor
		assertToBeNonNullish(firstPage.pageInfo.endCursor);
		const secondPageResult = await mercuriusClient.query(
			Query_FundCampaign_Pledges,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: { id: campaign.id },
					first: 4,
					after: firstPage.pageInfo.endCursor,
				},
			},
		);

		assertToBeNonNullish(secondPageResult.data?.fundCampaign);
		const secondPage = secondPageResult.data.fundCampaign.pledges;
		assertToBeNonNullish(secondPage);
		assertToBeNonNullish(secondPage.edges);
		expect(secondPage.edges).toHaveLength(4);
		expect(secondPage.pageInfo.hasNextPage).toBe(true);

		// Verify no overlap between pages
		const firstPageIds = new Set(
			firstPage.edges.map((e) => {
				assertToBeNonNullish(e);
				assertToBeNonNullish(e.node);
				return e.node.id;
			}),
		);
		const secondPageIds = new Set(
			secondPage.edges.map((e) => {
				assertToBeNonNullish(e);
				assertToBeNonNullish(e.node);
				return e.node.id;
			}),
		);
		const intersection = Array.from(firstPageIds).filter((id) =>
			secondPageIds.has(id),
		);
		expect(intersection).toHaveLength(0);
	});

	test("should support cursor-based backward pagination", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		// Create 10 pledges from different users
		for (let i = 0; i < 10; i++) {
			const { user: pledger, authToken } = await createTestUser(
				organization.id,
			);
			assertToBeNonNullish(authToken);
			await createTestPledge(
				campaign.id,
				pledger.id,
				authToken,
				1000 * (i + 1),
				`Pledge ${i + 1}`,
			);
		}

		// Get last page
		const lastPageResult = await mercuriusClient.query(
			Query_FundCampaign_Pledges,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: { id: campaign.id },
					last: 4,
				},
			},
		);

		assertToBeNonNullish(lastPageResult.data?.fundCampaign);
		const lastPage = lastPageResult.data.fundCampaign.pledges;
		assertToBeNonNullish(lastPage);
		assertToBeNonNullish(lastPage.edges);
		expect(lastPage.edges).toHaveLength(4);
		expect(lastPage.pageInfo.hasPreviousPage).toBe(true);

		// Get previous page using startCursor
		assertToBeNonNullish(lastPage.pageInfo.startCursor);
		const previousPageResult = await mercuriusClient.query(
			Query_FundCampaign_Pledges,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: { id: campaign.id },
					last: 4,
					before: lastPage.pageInfo.startCursor,
				},
			},
		);

		assertToBeNonNullish(previousPageResult.data?.fundCampaign);
		const previousPage = previousPageResult.data.fundCampaign.pledges;
		assertToBeNonNullish(previousPage);
		assertToBeNonNullish(previousPage.edges);
		expect(previousPage.edges).toHaveLength(4);

		// Verify no overlap between pages
		const lastPageIds = new Set(
			lastPage.edges.map((e) => {
				assertToBeNonNullish(e);
				assertToBeNonNullish(e.node);
				return e.node.id;
			}),
		);
		const previousPageIds = new Set(
			previousPage.edges.map((e) => {
				assertToBeNonNullish(e);
				assertToBeNonNullish(e.node);
				return e.node.id;
			}),
		);
		const intersection = Array.from(lastPageIds).filter((id) =>
			previousPageIds.has(id),
		);
		expect(intersection).toHaveLength(0);
	});

	test("should correctly indicate hasNextPage when more pledges exist", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		// Create exactly 6 pledges from different users
		for (let i = 0; i < 6; i++) {
			const { user: pledger, authToken } = await createTestUser(
				organization.id,
			);
			assertToBeNonNullish(authToken);
			await createTestPledge(
				campaign.id,
				pledger.id,
				authToken,
				1000 * (i + 1),
			);
		}

		// Request 5 pledges
		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				first: 5,
			},
		});

		assertToBeNonNullish(result.data?.fundCampaign);
		const pledgesConnection = result.data.fundCampaign.pledges;
		assertToBeNonNullish(pledgesConnection);
		const { edges, pageInfo } = pledgesConnection;
		assertToBeNonNullish(edges);

		expect(edges).toHaveLength(5);
		expect(pageInfo.hasNextPage).toBe(true);
	});

	test("should correctly indicate hasNextPage as false when no more pledges exist", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		// Create exactly 3 pledges from different users
		for (let i = 0; i < 3; i++) {
			const { user: pledger, authToken } = await createTestUser(
				organization.id,
			);
			assertToBeNonNullish(authToken);
			await createTestPledge(
				campaign.id,
				pledger.id,
				authToken,
				1000 * (i + 1),
			);
		}

		// Request 5 pledges (more than exists)
		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				first: 5,
			},
		});

		assertToBeNonNullish(result.data?.fundCampaign);
		const pledgesConnection = result.data.fundCampaign.pledges;
		assertToBeNonNullish(pledgesConnection);
		const { edges, pageInfo } = pledgesConnection;
		assertToBeNonNullish(edges);

		expect(edges).toHaveLength(3);
		expect(pageInfo.hasNextPage).toBe(false);
	});

	test("should handle maximum page size limit", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		// Create 35 pledges from different users (more than max limit of 32)
		for (let i = 0; i < 35; i++) {
			const { user: pledger, authToken } = await createTestUser(
				organization.id,
			);
			assertToBeNonNullish(authToken);
			await createTestPledge(
				campaign.id,
				pledger.id,
				authToken,
				1000 * (i + 1),
			);
		}

		// Request maximum allowed (32)
		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				first: 32,
			},
		});

		assertToBeNonNullish(result.data?.fundCampaign);
		const pledgesConnection = result.data.fundCampaign.pledges;
		assertToBeNonNullish(pledgesConnection);
		const { edges, pageInfo } = pledgesConnection;
		assertToBeNonNullish(edges);

		expect(edges.length).toBeLessThanOrEqual(32);
		expect(pageInfo.hasNextPage).toBe(true);
	});

	test("should handle single pledge correctly", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);
		const { user: pledger, authToken } = await createTestUser(organization.id);
		assertToBeNonNullish(authToken);

		const pledge = await createTestPledge(
			campaign.id,
			pledger.id,
			authToken,
			5000,
			"Single pledge",
		);

		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				first: 10,
			},
		});

		assertToBeNonNullish(result.data?.fundCampaign);
		const pledgesConnection = result.data.fundCampaign.pledges;
		assertToBeNonNullish(pledgesConnection);
		const { edges, pageInfo } = pledgesConnection;
		assertToBeNonNullish(edges);

		expect(edges).toHaveLength(1);
		const firstEdge = edges[0];
		assertToBeNonNullish(firstEdge);
		assertToBeNonNullish(firstEdge.node);
		expect(firstEdge.node.id).toBe(pledge.id);
		expect(firstEdge.node.amount).toBe(5000);
		expect(pageInfo.hasNextPage).toBe(false);
		expect(pageInfo.hasPreviousPage).toBe(false);
	});

	test("should maintain cursor stability across separate requests", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		// Create 5 pledges from different users
		for (let i = 0; i < 5; i++) {
			const { user: pledger, authToken } = await createTestUser(
				organization.id,
			);
			assertToBeNonNullish(authToken);
			await createTestPledge(
				campaign.id,
				pledger.id,
				authToken,
				1000 * (i + 1),
			);
		}

		// Get first page twice
		const firstRequest = await mercuriusClient.query(
			Query_FundCampaign_Pledges,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: { id: campaign.id },
					first: 3,
				},
			},
		);

		const secondRequest = await mercuriusClient.query(
			Query_FundCampaign_Pledges,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: { id: campaign.id },
					first: 3,
				},
			},
		);

		assertToBeNonNullish(firstRequest.data?.fundCampaign);
		assertToBeNonNullish(secondRequest.data?.fundCampaign);
		const firstPledges = firstRequest.data.fundCampaign.pledges;
		assertToBeNonNullish(firstPledges);
		const secondPledges = secondRequest.data.fundCampaign.pledges;
		assertToBeNonNullish(secondPledges);

		// Cursors should be identical
		expect(firstPledges.pageInfo.startCursor).toBe(
			secondPledges.pageInfo.startCursor,
		);
		expect(firstPledges.pageInfo.endCursor).toBe(
			secondPledges.pageInfo.endCursor,
		);

		// Content should be identical
		const firstEdges = firstPledges.edges;
		assertToBeNonNullish(firstEdges);
		const secondEdges = secondPledges.edges;
		assertToBeNonNullish(secondEdges);
		const firstIds = firstEdges.map((e) => {
			assertToBeNonNullish(e);
			assertToBeNonNullish(e.node);
			return e.node.id;
		});
		const secondIds = secondEdges.map((e) => {
			assertToBeNonNullish(e);
			assertToBeNonNullish(e.node);
			return e.node.id;
		});
		expect(firstIds).toEqual(secondIds);
	});

	test("should throw error for invalid after cursor", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				first: 5,
				after: "invalid-cursor",
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("should throw error for invalid before cursor", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				last: 5,
				before: "invalid-cursor",
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("should throw error for non-existent after cursor", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);
		const { user: pledger, authToken } = await createTestUser(organization.id);
		assertToBeNonNullish(authToken);

		// Create a pledge
		await createTestPledge(campaign.id, pledger.id, authToken, 1000);

		// Create a fake but valid-looking cursor
		const fakeCursor = Buffer.from(
			JSON.stringify({ id: "01952911-82da-793f-a5bf-98381d9aefc8" }),
		).toString("base64url");

		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				first: 5,
				after: fakeCursor,
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("should throw error for non-existent before cursor", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);
		const { user: pledger, authToken } = await createTestUser(organization.id);
		assertToBeNonNullish(authToken);

		// Create a pledge
		await createTestPledge(campaign.id, pledger.id, authToken, 1000);

		// Create a fake but valid-looking cursor
		const fakeCursor = Buffer.from(
			JSON.stringify({ id: "01952911-82da-793f-a5bf-98381d9aefc8" }),
		).toString("base64url");

		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				last: 5,
				before: fakeCursor,
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("should handle pledges at dataset boundaries", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		// Create 10 pledges from different users
		for (let i = 0; i < 10; i++) {
			const { user: pledger, authToken } = await createTestUser(
				organization.id,
			);
			assertToBeNonNullish(authToken);
			await createTestPledge(
				campaign.id,
				pledger.id,
				authToken,
				1000 * (i + 1),
			);
		}

		// Get all pledges
		const allPledgesResult = await mercuriusClient.query(
			Query_FundCampaign_Pledges,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: { id: campaign.id },
					first: 10,
				},
			},
		);

		assertToBeNonNullish(allPledgesResult.data?.fundCampaign);
		const allPledges = allPledgesResult.data.fundCampaign.pledges;
		assertToBeNonNullish(allPledges);
		const allEdges = allPledges.edges;
		assertToBeNonNullish(allEdges);
		expect(allEdges).toHaveLength(10);
		expect(allPledges.pageInfo.hasNextPage).toBe(false);

		// Try to get page after the last pledge
		// Note: endCursor might be null when there's no next page
		const endCursor = allPledges.pageInfo.endCursor;
		if (endCursor) {
			const afterLastResult = await mercuriusClient.query(
				Query_FundCampaign_Pledges,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: { id: campaign.id },
						first: 5,
						after: endCursor,
					},
				},
			);

			assertToBeNonNullish(afterLastResult.data?.fundCampaign);
			const afterLastPledges = afterLastResult.data.fundCampaign.pledges;
			if (afterLastPledges) {
				const afterLastEdges = afterLastPledges.edges;
				expect(afterLastEdges).toHaveLength(0);
			}
		}
	});

	test("should return pledges with pagination limit", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		// Create pledges from different users
		for (let i = 0; i < 3; i++) {
			const { user: pledger, authToken } = await createTestUser(
				organization.id,
			);
			assertToBeNonNullish(authToken);
			await createTestPledge(
				campaign.id,
				pledger.id,
				authToken,
				1000 * (i + 1),
			);
		}

		// Query with authentication (fundCampaign may require authentication)
		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				first: 5,
			},
		});

		// Should work
		assertToBeNonNullish(result.data?.fundCampaign);
		const pledgesConnection = result.data.fundCampaign.pledges;
		assertToBeNonNullish(pledgesConnection);
		const { edges } = pledgesConnection;
		assertToBeNonNullish(edges);
		expect(edges).toHaveLength(3);
	});

	test("should handle multiple pledgers for same campaign", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		// Create multiple pledgers
		const pledger1 = await createTestUser(organization.id);
		const pledger2 = await createTestUser(organization.id);
		const pledger3 = await createTestUser(organization.id);
		const pledger4 = await createTestUser(organization.id);
		const pledger5 = await createTestUser(organization.id);
		const pledger6 = await createTestUser(organization.id);

		// Create 6 pledges from different users
		assertToBeNonNullish(pledger1.authToken);
		await createTestPledge(
			campaign.id,
			pledger1.user.id,
			pledger1.authToken,
			1000,
		);
		assertToBeNonNullish(pledger2.authToken);
		await createTestPledge(
			campaign.id,
			pledger2.user.id,
			pledger2.authToken,
			2000,
		);
		assertToBeNonNullish(pledger3.authToken);
		await createTestPledge(
			campaign.id,
			pledger3.user.id,
			pledger3.authToken,
			1500,
		);
		assertToBeNonNullish(pledger4.authToken);
		await createTestPledge(
			campaign.id,
			pledger4.user.id,
			pledger4.authToken,
			2500,
		);
		assertToBeNonNullish(pledger5.authToken);
		await createTestPledge(
			campaign.id,
			pledger5.user.id,
			pledger5.authToken,
			3000,
		);
		assertToBeNonNullish(pledger6.authToken);
		await createTestPledge(
			campaign.id,
			pledger6.user.id,
			pledger6.authToken,
			3500,
		);

		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				first: 10,
			},
		});

		assertToBeNonNullish(result.data?.fundCampaign);
		const pledgesConnection = result.data.fundCampaign.pledges;
		assertToBeNonNullish(pledgesConnection);
		const { edges } = pledgesConnection;
		assertToBeNonNullish(edges);

		expect(edges).toHaveLength(6);
		// Verify pledges from all pledgers are included
		const amounts = edges.map((e) => {
			assertToBeNonNullish(e);
			assertToBeNonNullish(e.node);
			return e.node.amount;
		});
		expect(amounts).toContain(1000);
		expect(amounts).toContain(1500);
		expect(amounts).toContain(3000);
	});

	test("should traverse entire dataset using pagination", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);

		// Create 15 pledges from different users
		const createdPledges = [];
		for (let i = 0; i < 15; i++) {
			const { user: pledger, authToken } = await createTestUser(
				organization.id,
			);
			assertToBeNonNullish(authToken);
			const pledge = await createTestPledge(
				campaign.id,
				pledger.id,
				authToken,
				1000 * (i + 1),
			);
			createdPledges.push(pledge);
		}

		// Traverse all pledges using pagination
		const allPledgeIds: string[] = [];
		let cursor: string | null = null;

		// Get first page to initialize type inference
		let queryResult = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				first: 5,
				after: cursor ?? undefined,
			},
		});

		assertToBeNonNullish(queryResult.data?.fundCampaign);
		let pledgesConnection = queryResult.data.fundCampaign.pledges;
		assertToBeNonNullish(pledgesConnection);
		let { edges, pageInfo } = pledgesConnection;
		assertToBeNonNullish(edges);

		for (const edge of edges) {
			assertToBeNonNullish(edge);
			assertToBeNonNullish(edge.node);
			allPledgeIds.push(edge.node.id);
		}

		let hasMore = pageInfo.hasNextPage;
		cursor = pageInfo.endCursor ?? null;

		// Continue pagination
		while (hasMore) {
			queryResult = await mercuriusClient.query(Query_FundCampaign_Pledges, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: { id: campaign.id },
					first: 5,
					after: cursor ?? undefined,
				},
			});

			assertToBeNonNullish(queryResult.data?.fundCampaign);
			pledgesConnection = queryResult.data.fundCampaign.pledges;
			assertToBeNonNullish(pledgesConnection);
			({ edges, pageInfo } = pledgesConnection);
			assertToBeNonNullish(edges);

			for (const edge of edges) {
				assertToBeNonNullish(edge);
				assertToBeNonNullish(edge.node);
				allPledgeIds.push(edge.node.id);
			}

			hasMore = pageInfo.hasNextPage;
			cursor = pageInfo.endCursor ?? null;
		}

		// Verify we got all pledges
		expect(allPledgeIds).toHaveLength(15);
		expect(new Set(allPledgeIds).size).toBe(15); // All unique

		// Verify all created pledges are in the result
		const createdIds = new Set(createdPledges.map((p) => p.id));
		for (const id of allPledgeIds) {
			expect(createdIds.has(id)).toBe(true);
		}
	});

	test("should handle pledges with null optional fields", async () => {
		const organization = await createTestOrganization();
		const fund = await createTestFund(organization.id);
		const campaign = await createTestFundCampaign(fund.id);
		const { user: pledger, authToken } = await createTestUser(organization.id);
		assertToBeNonNullish(authToken);

		// Create pledge without note
		const pledge = await createTestPledge(
			campaign.id,
			pledger.id,
			authToken,
			5000,
		);

		const result = await mercuriusClient.query(Query_FundCampaign_Pledges, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: { id: campaign.id },
				first: 10,
			},
		});

		assertToBeNonNullish(result.data?.fundCampaign);
		const pledgesConnection = result.data.fundCampaign.pledges;
		assertToBeNonNullish(pledgesConnection);
		const { edges } = pledgesConnection;
		assertToBeNonNullish(edges);
		expect(edges).toHaveLength(1);

		const firstEdge = edges[0];
		assertToBeNonNullish(firstEdge);
		assertToBeNonNullish(firstEdge.node);
		expect(firstEdge.node.id).toBe(pledge.id);
		expect(firstEdge.node.note).toBeNull();
	});
});
