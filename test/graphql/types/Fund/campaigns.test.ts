import { faker } from "@faker-js/faker";
import type { GraphQLObjectType } from "graphql";
import { initGraphQLTada } from "gql.tada";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { schema } from "~/src/graphql/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createFundCampaign,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// Query to fetch a fund with its campaigns connection
const Query_Fund_Campaigns = gql(`
  query FundWithCampaigns($input: QueryFundInput!, $first: Int, $after: String, $last: Int, $before: String) {
    fund(input: $input) {
      id
      name
      campaigns(first: $first, after: $after, last: $last, before: $before) {
        edges {
          cursor
          node {
            id
            name
            goalAmount
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

async function createTestOrganization(authToken: string) {
	const orgName = `Fund Campaigns Test ${faker.string.uuid()}`;
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: orgName,
					description: "Organization for Fund.campaigns tests",
					countryCode: "us",
					state: "CA",
					city: "San Francisco",
					postalCode: "94101",
					addressLine1: "100 Fund Street",
					addressLine2: "Suite 200",
				},
			},
		},
	);
	assertToBeNonNullish(createOrgResult.data?.createOrganization);
	const org = createOrgResult.data.createOrganization;
	assertToBeNonNullish(org.id);
	return { id: org.id as string, name: org.name as string };
}

async function createOrgMembership(
	authToken: string,
	organizationId: string,
	memberId: string,
) {
	const result = await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				organizationId,
				memberId,
				role: "administrator",
			},
		},
	});

	if (result.errors) {
		throw new Error(
			`Failed to create organization membership: ${JSON.stringify(result.errors)}`,
		);
	}

	assertToBeNonNullish(result.data?.createOrganizationMembership);
	return result.data.createOrganizationMembership;
}

async function createTestFund(authToken: string, organizationId: string) {
	const fundName = `Test Fund ${faker.string.uuid()}`;
	const createFundResult = await mercuriusClient.mutate(Mutation_createFund, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: fundName,
				organizationId,
				isTaxDeductible: true,
				isDefault: false,
				isArchived: false,
			},
		},
	});
	assertToBeNonNullish(createFundResult.data?.createFund);
	const fund = createFundResult.data.createFund;
	assertToBeNonNullish(fund.id);
	return { id: fund.id as string, name: fund.name as string };
}

async function createTestCampaign(
	authToken: string,
	fundId: string,
	name: string,
) {
	const now = new Date();
	const startAt = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now
	const endAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30); // 30 days from now

	const createCampaignResult = await mercuriusClient.mutate(
		Mutation_createFundCampaign,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					fundId,
					name,
					goalAmount: 10000,
					currencyCode: "USD",
					startAt: startAt.toISOString(),
					endAt: endAt.toISOString(),
				},
			},
		},
	);

	if (createCampaignResult.errors) {
		throw new Error(
			`Failed to create campaign: ${JSON.stringify(createCampaignResult.errors)}`,
		);
	}

	assertToBeNonNullish(createCampaignResult.data?.createFundCampaign);
	const campaign = createCampaignResult.data.createFundCampaign;
	assertToBeNonNullish(campaign.id);
	return { id: campaign.id as string, name: campaign.name as string };
}

describe("Fund.campaigns Resolver - Integration", () => {
	let adminAuth: AdminAuth;
	let organization: { id: string; name: string };
	let fund: { id: string; name: string };
	let campaigns: Array<{ id: string; name: string }>;

	beforeAll(async () => {
		adminAuth = await getAdminAuth();
		organization = await createTestOrganization(adminAuth.token);
		await createOrgMembership(
			adminAuth.token,
			organization.id,
			adminAuth.userId,
		);
		fund = await createTestFund(adminAuth.token, organization.id);

		// Create multiple campaigns for pagination tests
		campaigns = [];
		for (const name of ["Alpha Campaign", "Beta Campaign", "Gamma Campaign"]) {
			const campaign = await createTestCampaign(
				adminAuth.token,
				fund.id,
				name,
			);
			campaigns.push(campaign);
		}
	});

	afterAll(async () => {
		// Cleanup is handled by test database reset
	});

	describe("Campaign List Resolution", () => {
		it("should successfully retrieve a list of campaigns with valid connection structure", async () => {
			const result = await mercuriusClient.query(Query_Fund_Campaigns, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: { id: fund.id },
					first: 10,
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.fund);
			assertToBeNonNullish(result.data.fund.campaigns);

			const edges = result.data.fund.campaigns.edges;
			assertToBeNonNullish(edges);
			expect(edges.length).toBe(3);

			// Campaigns should be ordered by name (alphabetically ascending)
			const names = edges.map((edge) => edge?.node?.name);
			expect(names).toEqual([
				"Alpha Campaign",
				"Beta Campaign",
				"Gamma Campaign",
			]);

			// Validate pageInfo structure
			const pageInfo = result.data.fund.campaigns.pageInfo;
			assertToBeNonNullish(pageInfo);
			expect(pageInfo.hasNextPage).toBeDefined();
			expect(pageInfo.hasPreviousPage).toBeDefined();
			expect(pageInfo.startCursor).toBeDefined();
			expect(pageInfo.endCursor).toBeDefined();
		});

		it("should return empty edges when fund has no campaigns", async () => {
			// Create a new fund without campaigns
			const emptyFund = await createTestFund(adminAuth.token, organization.id);

			const result = await mercuriusClient.query(Query_Fund_Campaigns, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: { id: emptyFund.id },
					first: 10,
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.fund?.campaigns);

			const edges = result.data.fund.campaigns.edges;
			assertToBeNonNullish(edges);
			expect(edges.length).toBe(0);
		});
	});

	describe("Forward Pagination", () => {
		it("should limit results with first argument", async () => {
			const result = await mercuriusClient.query(Query_Fund_Campaigns, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: { id: fund.id },
					first: 2,
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.fund?.campaigns);

			const edges = result.data.fund.campaigns.edges;
			assertToBeNonNullish(edges);
			expect(edges.length).toBe(2);

			// Should have next page since there are 3 campaigns
			expect(result.data.fund.campaigns.pageInfo?.hasNextPage).toBe(true);
		});

		it("should paginate forward using after cursor", async () => {
			// First, get the first page
			const firstPageResult = await mercuriusClient.query(Query_Fund_Campaigns, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: { id: fund.id },
					first: 1,
				},
			});

			expect(firstPageResult.errors).toBeUndefined();
			assertToBeNonNullish(firstPageResult.data?.fund?.campaigns);

			const firstPageEdges = firstPageResult.data.fund.campaigns.edges;
			assertToBeNonNullish(firstPageEdges);
			expect(firstPageEdges.length).toBe(1);

			const endCursor = firstPageResult.data.fund.campaigns.pageInfo?.endCursor;
			assertToBeNonNullish(endCursor);

			// Now get the second page using the cursor
			const secondPageResult = await mercuriusClient.query(
				Query_Fund_Campaigns,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: { id: fund.id },
						first: 2,
						after: endCursor,
					},
				},
			);

			expect(secondPageResult.errors).toBeUndefined();
			assertToBeNonNullish(secondPageResult.data?.fund?.campaigns);

			const secondPageEdges = secondPageResult.data.fund.campaigns.edges;
			assertToBeNonNullish(secondPageEdges);
			expect(secondPageEdges.length).toBe(2);

			// The first item of second page should be different from the first page
			expect(secondPageEdges[0]?.node?.name).not.toBe(
				firstPageEdges[0]?.node?.name,
			);
		});
	});

	describe("Backward Pagination", () => {
		it("should limit results with last argument", async () => {
			const result = await mercuriusClient.query(Query_Fund_Campaigns, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: { id: fund.id },
					last: 2,
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.fund?.campaigns);

			const edges = result.data.fund.campaigns.edges;
			assertToBeNonNullish(edges);
			expect(edges.length).toBe(2);

			// Should have previous page since there are 3 campaigns
			expect(result.data.fund.campaigns.pageInfo?.hasPreviousPage).toBe(true);
		});

		it("should paginate backward using before cursor", async () => {
			// First, get the last page
			const lastPageResult = await mercuriusClient.query(Query_Fund_Campaigns, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: { id: fund.id },
					last: 1,
				},
			});

			expect(lastPageResult.errors).toBeUndefined();
			assertToBeNonNullish(lastPageResult.data?.fund?.campaigns);

			const lastPageEdges = lastPageResult.data.fund.campaigns.edges;
			assertToBeNonNullish(lastPageEdges);
			expect(lastPageEdges.length).toBe(1);

			const startCursor =
				lastPageResult.data.fund.campaigns.pageInfo?.startCursor;
			assertToBeNonNullish(startCursor);

			// Now get the previous page using the cursor
			const prevPageResult = await mercuriusClient.query(Query_Fund_Campaigns, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: { id: fund.id },
					last: 2,
					before: startCursor,
				},
			});

			expect(prevPageResult.errors).toBeUndefined();
			assertToBeNonNullish(prevPageResult.data?.fund?.campaigns);

			const prevPageEdges = prevPageResult.data.fund.campaigns.edges;
			assertToBeNonNullish(prevPageEdges);
			expect(prevPageEdges.length).toBe(2);

			// The last item of previous page should be different from the last page
			expect(prevPageEdges[prevPageEdges.length - 1]?.node?.name).not.toBe(
				lastPageEdges[0]?.node?.name,
			);
		});
	});

	describe("Cursor Validation", () => {
		it("should return error for malformed cursor in forward pagination", async () => {
			const result = await mercuriusClient.query(Query_Fund_Campaigns, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: { id: fund.id },
					first: 10,
					after: "this-is-not-a-valid-cursor-123",
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);

			const error = result.errors?.[0];
			expect(error?.extensions?.code).toBe("invalid_arguments");
		});

		it("should return error for malformed cursor in backward pagination", async () => {
			const result = await mercuriusClient.query(Query_Fund_Campaigns, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: { id: fund.id },
					last: 5,
					before: "this-is-not-a-valid-cursor-432",
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);

			const error = result.errors?.[0];
			expect(error?.extensions?.code).toBe("invalid_arguments");
		});

		it("should return error for invalid JSON in base64url cursor", async () => {
			const invalidCursor = Buffer.from("INVALID_JSON").toString("base64url");

			const result = await mercuriusClient.query(Query_Fund_Campaigns, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: { id: fund.id },
					first: 10,
					after: invalidCursor,
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);

			const error = result.errors?.[0];
			expect(error?.extensions?.code).toBe("invalid_arguments");
		});

		it("should return error for non-existent cursor in forward pagination", async () => {
			const nonExistentCursor = Buffer.from(
				JSON.stringify({ name: "Non Existent Campaign" }),
			).toString("base64url");

			const result = await mercuriusClient.query(Query_Fund_Campaigns, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: { id: fund.id },
					first: 10,
					after: nonExistentCursor,
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);

			const error = result.errors?.[0];
			expect(error?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		});

		it("should return error for non-existent cursor in backward pagination", async () => {
			const nonExistentCursor = Buffer.from(
				JSON.stringify({ name: "Non Existent Campaign" }),
			).toString("base64url");

			const result = await mercuriusClient.query(Query_Fund_Campaigns, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: { id: fund.id },
					last: 10,
					before: nonExistentCursor,
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);

			const error = result.errors?.[0];
			expect(error?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		});
	});

	describe("Campaign Data", () => {
		it("should return campaign with correct fields", async () => {
			const result = await mercuriusClient.query(Query_Fund_Campaigns, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: { id: fund.id },
					first: 1,
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.fund?.campaigns);

			const edges = result.data.fund.campaigns.edges;
			assertToBeNonNullish(edges);
			expect(edges.length).toBe(1);

			const campaign = edges[0]?.node;
			assertToBeNonNullish(campaign);

			expect(campaign.id).toBeDefined();
			expect(campaign.name).toBeDefined();
			expect(campaign.goalAmount).toBe(10000);
		});
	});

	describe("Complexity Calculation", () => {
		let campaignsComplexityFunction: (args: Record<string, unknown>) => {
			field: number;
			multiplier: number;
		};

		beforeAll(() => {
			const fundType = schema.getType("Fund") as GraphQLObjectType;
			const campaignsField = fundType.getFields().campaigns;
			if (
				!campaignsField ||
				!campaignsField.extensions ||
				!campaignsField.extensions.complexity
			) {
				throw new Error("Complexity function not found on Fund.campaigns field");
			}
			campaignsComplexityFunction = campaignsField.extensions.complexity as (
				args: Record<string, unknown>,
			) => { field: number; multiplier: number };
		});

		it("should return correct complexity with first argument", () => {
			const result = campaignsComplexityFunction({ first: 20 });
			expect(result).toBeDefined();
			expect(result.multiplier).toBe(20);
			expect(result.field).toBeDefined();
		});

		it("should return correct complexity with last argument", () => {
			const result = campaignsComplexityFunction({ last: 15 });
			expect(result).toBeDefined();
			expect(result.multiplier).toBe(15);
			expect(result.field).toBeDefined();
		});

		it("should return complexity with fallback multiplier of 1 when no first or last", () => {
			const result = campaignsComplexityFunction({});
			expect(result).toBeDefined();
			expect(result.multiplier).toBe(1);
			expect(result.field).toBeDefined();
		});
	});
});