import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { describe, expect, it, vi } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { resolveOrganization } from "~/src/graphql/types/Fund/organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
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

			// Query without auth header - pass empty authorization in query options
			// instead of mutating global client state with setHeaders({})
			const result = await mercuriusClient.query(Query_Fund_Organization, {
				variables: {
					input: {
						id: fund.id,
					},
				},
				headers: { authorization: "" },
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

	describe("Multiple Funds Resolution", () => {
		it("should resolve organization correctly for multiple funds in same org", async () => {
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

			// Query each fund individually and verify organization resolution
			// Note: Each query is a separate HTTP request with its own DataLoader instance,
			// so this tests concurrent resolution correctness, not DataLoader batching
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

	describe("Error Handling - Orphaned Fund", () => {
		it("should throw 'unexpected' error when organization DataLoader returns null", async () => {
			// Simulate an orphaned fund where the organization no longer exists
			// This could happen due to data corruption or improper deletion
			const mockFund = {
				id: "orphaned-fund-id",
				organizationId: "deleted-org-id",
				name: "Orphaned Fund",
				isTaxDeductible: true,
				isDefault: false,
				isArchived: false,
				creatorId: "creator-id",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				referenceNumber: null,
			};

			const mockCtx = {
				dataloaders: {
					organization: {
						load: vi.fn().mockResolvedValue(null),
					},
				},
				log: {
					error: vi.fn(),
					info: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
				},
			};

			await expect(
				resolveOrganization(
					mockFund,
					{},
					mockCtx as unknown as Parameters<typeof resolveOrganization>[2],
				),
			).rejects.toThrow(TalawaGraphQLError);

			// Verify the error was logged
			expect(mockCtx.log.error).toHaveBeenCalledWith(
				{
					fundId: "orphaned-fund-id",
					organizationId: "deleted-org-id",
				},
				"DataLoader returned null for a fund's organization id that isn't null.",
			);

			// Verify DataLoader was called with the correct organization ID
			expect(mockCtx.dataloaders.organization.load).toHaveBeenCalledWith(
				"deleted-org-id",
			);
		});

		it("should throw error with 'unexpected' code for orphaned fund", async () => {
			const mockFund = {
				id: "orphaned-fund-id-2",
				organizationId: "missing-org-id",
				name: "Another Orphaned Fund",
				isTaxDeductible: false,
				isDefault: false,
				isArchived: false,
				creatorId: "creator-id",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				referenceNumber: null,
			};

			const mockCtx = {
				dataloaders: {
					organization: {
						load: vi.fn().mockResolvedValue(null),
					},
				},
				log: {
					error: vi.fn(),
					info: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
				},
			};

			let thrownError: unknown;
			try {
				await resolveOrganization(
					mockFund,
					{},
					mockCtx as unknown as Parameters<typeof resolveOrganization>[2],
				);
			} catch (error) {
				thrownError = error;
			}

			expect(thrownError).toBeDefined();
			expect(thrownError).toBeInstanceOf(TalawaGraphQLError);
			expect((thrownError as TalawaGraphQLError).extensions.code).toBe(
				"unexpected",
			);
		});

		it("should propagate DataLoader errors for fund organization lookup", async () => {
			const mockFund = {
				id: "fund-with-error",
				organizationId: "org-causing-error",
				name: "Fund With Error",
				isTaxDeductible: true,
				isDefault: false,
				isArchived: false,
				creatorId: "creator-id",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				referenceNumber: null,
			};

			const dbError = new Error("Database connection failed");
			const mockCtx = {
				dataloaders: {
					organization: {
						load: vi.fn().mockRejectedValue(dbError),
					},
				},
				log: {
					error: vi.fn(),
					info: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
				},
			};

			await expect(
				resolveOrganization(
					mockFund,
					{},
					mockCtx as unknown as Parameters<typeof resolveOrganization>[2],
				),
			).rejects.toThrow("Database connection failed");
		});
	});
});
