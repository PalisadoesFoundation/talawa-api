import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { describe, expect, it } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/Fund/organization";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// Query to fetch a fund with its organization field
const Query_Fund_Organization = gql(`
  query FundWithOrganization($input: QueryFundInput!) {
    fund(input: $input) {
      id
      name
      isTaxDeductible
      organization {
        id
        name
        countryCode
        description
        addressLine1
        city
        state
        postalCode
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
	const orgName = `Fund Org Test ${faker.string.uuid()}`;
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: orgName,
					description: "Organization for Fund.organization tests",
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
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				organizationId,
				memberId,
				role: "administrator",
			},
		},
	});
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

describe("Fund.organization Resolver - Integration", () => {
	describe("Organization Resolution", () => {
		it("should successfully resolve organization when querying a fund", async () => {
			const adminAuth = await getAdminAuth();
			const organization = await createTestOrganization(adminAuth.token);
			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			const fund = await createTestFund(adminAuth.token, organization.id);

			const result = await mercuriusClient.query(Query_Fund_Organization, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						id: fund.id,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.fund);
			assertToBeNonNullish(result.data.fund.organization);
			expect(result.data.fund.organization.id).toBe(organization.id);
			expect(result.data.fund.organization.name).toBe(organization.name);
		});

		it("should return organization with all requested fields", async () => {
			const adminAuth = await getAdminAuth();
			const organization = await createTestOrganization(adminAuth.token);
			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			const fund = await createTestFund(adminAuth.token, organization.id);

			const result = await mercuriusClient.query(Query_Fund_Organization, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						id: fund.id,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.fund?.organization);

			// Verify all requested organization fields are present
			expect(result.data.fund.organization.id).toBe(organization.id);
			expect(result.data.fund.organization.name).toBe(organization.name);
			expect(result.data.fund.organization.countryCode).toBe("us");
			expect(result.data.fund.organization.description).toBe(
				"Organization for Fund.organization tests",
			);
			expect(result.data.fund.organization.addressLine1).toBe(
				"100 Fund Street",
			);
			expect(result.data.fund.organization.city).toBe("San Francisco");
			expect(result.data.fund.organization.state).toBe("CA");
			expect(result.data.fund.organization.postalCode).toBe("94101");
		});
	});

	describe("Authentication", () => {
		it("should return unauthenticated error when not logged in", async () => {
			const adminAuth = await getAdminAuth();
			const organization = await createTestOrganization(adminAuth.token);
			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			const fund = await createTestFund(adminAuth.token, organization.id);

			// Query without auth header
			mercuriusClient.setHeaders({});
			const result = await mercuriusClient.query(Query_Fund_Organization, {
				variables: {
					input: {
						id: fund.id,
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});
	});

	describe("Organization via createFund mutation", () => {
		it("should create fund with valid organization reference", async () => {
			const adminAuth = await getAdminAuth();
			const organization = await createTestOrganization(adminAuth.token);
			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);

			const fundName = `Test Fund ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_createFund, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						name: fundName,
						organizationId: organization.id,
						isTaxDeductible: true,
						isDefault: false,
						isArchived: false,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.createFund);
			expect(result.data.createFund.name).toBe(fundName);

			// Now query the fund with organization field
			const fundQuery = await mercuriusClient.query(Query_Fund_Organization, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						id: result.data.createFund.id,
					},
				},
			});

			expect(fundQuery.errors).toBeUndefined();
			assertToBeNonNullish(fundQuery.data?.fund?.organization);
			expect(fundQuery.data.fund.organization.id).toBe(organization.id);
		});
	});

	describe("DataLoader Behavior", () => {
		it("should efficiently resolve organization for multiple funds in same org", async () => {
			const adminAuth = await getAdminAuth();
			const organization = await createTestOrganization(adminAuth.token);
			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);

			// Create multiple funds in the same organization
			const fund1 = await createTestFund(adminAuth.token, organization.id);
			const fund2 = await createTestFund(adminAuth.token, organization.id);
			const fund3 = await createTestFund(adminAuth.token, organization.id);

			// Query each fund individually - DataLoader should batch organization lookups
			const results = await Promise.all([
				mercuriusClient.query(Query_Fund_Organization, {
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: { input: { id: fund1.id } },
				}),
				mercuriusClient.query(Query_Fund_Organization, {
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: { input: { id: fund2.id } },
				}),
				mercuriusClient.query(Query_Fund_Organization, {
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: { input: { id: fund3.id } },
				}),
			]);

			// All queries should succeed and return the same organization
			for (const result of results) {
				expect(result.errors).toBeUndefined();
				assertToBeNonNullish(result.data?.fund?.organization);
				expect(result.data.fund.organization.id).toBe(organization.id);
				expect(result.data.fund.organization.name).toBe(organization.name);
			}
		});
	});

	describe("Edge Cases", () => {
		it("should handle organization with minimal required fields", async () => {
			const adminAuth = await getAdminAuth();

			// Create organization with minimal fields
			const orgName = `Minimal Org ${faker.string.uuid()}`;
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							name: orgName,
							countryCode: "us",
						},
					},
				},
			);
			assertToBeNonNullish(createOrgResult.data?.createOrganization);
			const organization = createOrgResult.data.createOrganization;
			assertToBeNonNullish(organization.id);
			const orgId = organization.id as string;

			await createOrgMembership(adminAuth.token, orgId, adminAuth.userId);
			const fund = await createTestFund(adminAuth.token, orgId);

			const result = await mercuriusClient.query(Query_Fund_Organization, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						id: fund.id,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.fund?.organization);
			expect(result.data.fund.organization.id).toBe(orgId);
			expect(result.data.fund.organization.name).toBe(orgName);
			expect(result.data.fund.organization.countryCode).toBe("us");
			// Optional fields should be null
			expect(result.data.fund.organization.description).toBeNull();
			expect(result.data.fund.organization.addressLine1).toBeNull();
		});

		it("should handle organization with special characters in name", async () => {
			const adminAuth = await getAdminAuth();

			// Create organization with special characters
			const orgName = `Test Org & Co. <Special> ${faker.string.uuid()}`;
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							name: orgName,
							countryCode: "us",
						},
					},
				},
			);
			assertToBeNonNullish(createOrgResult.data?.createOrganization);
			const organization = createOrgResult.data.createOrganization;
			assertToBeNonNullish(organization.id);
			const orgId = organization.id as string;

			await createOrgMembership(adminAuth.token, orgId, adminAuth.userId);
			const fund = await createTestFund(adminAuth.token, orgId);

			const result = await mercuriusClient.query(Query_Fund_Organization, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						id: fund.id,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.fund?.organization);
			expect(result.data.fund.organization.name).toBe(orgName);
		});

		it("should handle different country codes correctly", async () => {
			const adminAuth = await getAdminAuth();

			// Test with Canadian country code
			const orgName = `Canadian Org ${faker.string.uuid()}`;
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							name: orgName,
							countryCode: "ca",
							state: "ON",
							city: "Toronto",
						},
					},
				},
			);
			assertToBeNonNullish(createOrgResult.data?.createOrganization);
			const organization = createOrgResult.data.createOrganization;
			assertToBeNonNullish(organization.id);
			const orgId = organization.id as string;

			await createOrgMembership(adminAuth.token, orgId, adminAuth.userId);
			const fund = await createTestFund(adminAuth.token, orgId);

			const result = await mercuriusClient.query(Query_Fund_Organization, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						id: fund.id,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.fund?.organization);
			expect(result.data.fund.organization.countryCode).toBe("ca");
			expect(result.data.fund.organization.state).toBe("ON");
			expect(result.data.fund.organization.city).toBe("Toronto");
		});
	});

	describe("Fund Properties with Organization", () => {
		it("should return fund properties along with organization", async () => {
			const adminAuth = await getAdminAuth();
			const organization = await createTestOrganization(adminAuth.token);
			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			const fund = await createTestFund(adminAuth.token, organization.id);

			const result = await mercuriusClient.query(Query_Fund_Organization, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						id: fund.id,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.fund);

			// Verify fund properties
			expect(result.data.fund.id).toBe(fund.id);
			expect(result.data.fund.name).toBe(fund.name);
			expect(result.data.fund.isTaxDeductible).toBe(true);

			// Verify organization is resolved
			assertToBeNonNullish(result.data.fund.organization);
			expect(result.data.fund.organization.id).toBe(organization.id);
		});
	});
});
