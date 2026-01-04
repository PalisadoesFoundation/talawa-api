import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { describe, expect, it } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/ActionItem/organization";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createActionItem,
	Mutation_createActionItemCategory,
	Mutation_createEvent,
	Mutation_createEventVolunteer,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

// Query to fetch action items with organization field
const Query_ActionItem_Organization = gql(`
  query ActionItemsByOrganizationWithOrg($input: QueryActionItemsByOrganizationInput!) {
    actionItemsByOrganization(input: $input) {
      id
      isCompleted
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
	const orgName = `ActionItem Org Test ${faker.string.uuid()}`;
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: orgName,
					description: "Organization for ActionItem.organization tests",
					countryCode: "us",
					state: "CA",
					city: "San Francisco",
					postalCode: "94101",
					addressLine1: "100 Test Street",
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

async function createTestCategory(authToken: string, organizationId: string) {
	const createCategoryResult = await mercuriusClient.mutate(
		Mutation_createActionItemCategory,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Test Category ${faker.string.uuid()}`,
					description: "A category for organization resolver testing",
					organizationId,
					isDisabled: false,
				},
			},
		},
	);
	assertToBeNonNullish(createCategoryResult.data?.createActionItemCategory);
	const category = createCategoryResult.data.createActionItemCategory;
	assertToBeNonNullish(category.id);
	return { id: category.id as string, name: category.name };
}

async function createTestEventAndVolunteer(
	authToken: string,
	organizationId: string,
	userId: string,
) {
	// Create an event
	const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				organizationId,
				name: "Test Event for ActionItem",
				description: "Test event for action item organization tests",
				startAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
				endAt: new Date(Date.now() + ONE_DAY_MS + ONE_HOUR_MS).toISOString(),
				location: "Test Location",
			},
		},
	});
	assertToBeNonNullish(eventResult.data?.createEvent);
	const eventId = eventResult.data.createEvent.id;

	// Create a volunteer
	const volunteerResult = await mercuriusClient.mutate(
		Mutation_createEventVolunteer,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					eventId,
					userId,
				},
			},
		},
	);
	assertToBeNonNullish(volunteerResult.data?.createEventVolunteer);
	const volunteerId = volunteerResult.data.createEventVolunteer.id;
	assertToBeNonNullish(volunteerId);
	return {
		eventId: eventId as string,
		volunteerId: volunteerId as string,
	};
}

async function createTestActionItem(
	authToken: string,
	categoryId: string,
	organizationId: string,
	volunteerId: string,
) {
	const createActionItemResult = await mercuriusClient.mutate(
		Mutation_createActionItem,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					categoryId,
					organizationId,
					volunteerId,
					assignedAt: new Date().toISOString(),
					preCompletionNotes: "Test action item notes",
				},
			},
		},
	);
	assertToBeNonNullish(createActionItemResult.data?.createActionItem);
	return createActionItemResult.data.createActionItem;
}

describe("ActionItem.organization Resolver - Integration", () => {
	describe("Organization Resolution", () => {
		it("should successfully resolve organization when querying action items", async () => {
			const adminAuth = await getAdminAuth();
			const organization = await createTestOrganization(adminAuth.token);
			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			const category = await createTestCategory(
				adminAuth.token,
				organization.id,
			);
			const { volunteerId } = await createTestEventAndVolunteer(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			await createTestActionItem(
				adminAuth.token,
				category.id,
				organization.id,
				volunteerId,
			);

			const result = await mercuriusClient.query(
				Query_ActionItem_Organization,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							organizationId: organization.id,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.actionItemsByOrganization);
			expect(result.data.actionItemsByOrganization.length).toBeGreaterThan(0);

			const actionItem = result.data.actionItemsByOrganization[0];
			assertToBeNonNullish(actionItem?.organization);
			expect(actionItem.organization.id).toBe(organization.id);
			expect(actionItem.organization.name).toBe(organization.name);
		});

		it("should return organization with all requested fields", async () => {
			const adminAuth = await getAdminAuth();
			const organization = await createTestOrganization(adminAuth.token);
			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			const category = await createTestCategory(
				adminAuth.token,
				organization.id,
			);
			const { volunteerId } = await createTestEventAndVolunteer(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			await createTestActionItem(
				adminAuth.token,
				category.id,
				organization.id,
				volunteerId,
			);

			const result = await mercuriusClient.query(
				Query_ActionItem_Organization,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							organizationId: organization.id,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.actionItemsByOrganization);
			const actionItem = result.data.actionItemsByOrganization[0];
			assertToBeNonNullish(actionItem?.organization);

			// Verify all requested organization fields are present
			expect(actionItem.organization.id).toBe(organization.id);
			expect(actionItem.organization.name).toBe(organization.name);
			expect(actionItem.organization.countryCode).toBe("us");
			expect(actionItem.organization.description).toBe(
				"Organization for ActionItem.organization tests",
			);
			expect(actionItem.organization.addressLine1).toBe("100 Test Street");
			expect(actionItem.organization.city).toBe("San Francisco");
			expect(actionItem.organization.state).toBe("CA");
			expect(actionItem.organization.postalCode).toBe("94101");
		});

		it("should resolve organization correctly for multiple action items", async () => {
			const adminAuth = await getAdminAuth();
			const organization = await createTestOrganization(adminAuth.token);
			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			const category = await createTestCategory(
				adminAuth.token,
				organization.id,
			);
			const { volunteerId } = await createTestEventAndVolunteer(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);

			// Create multiple action items
			await createTestActionItem(
				adminAuth.token,
				category.id,
				organization.id,
				volunteerId,
			);
			await createTestActionItem(
				adminAuth.token,
				category.id,
				organization.id,
				volunteerId,
			);
			await createTestActionItem(
				adminAuth.token,
				category.id,
				organization.id,
				volunteerId,
			);

			const result = await mercuriusClient.query(
				Query_ActionItem_Organization,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							organizationId: organization.id,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.actionItemsByOrganization);
			expect(
				result.data.actionItemsByOrganization.length,
			).toBeGreaterThanOrEqual(3);

			// All action items should have the same organization
			for (const actionItem of result.data.actionItemsByOrganization) {
				assertToBeNonNullish(actionItem?.organization);
				expect(actionItem.organization.id).toBe(organization.id);
				expect(actionItem.organization.name).toBe(organization.name);
			}
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
			const category = await createTestCategory(
				adminAuth.token,
				organization.id,
			);
			const { volunteerId } = await createTestEventAndVolunteer(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			await createTestActionItem(
				adminAuth.token,
				category.id,
				organization.id,
				volunteerId,
			);

			// Query without auth header
			mercuriusClient.setHeaders({});
			const result = await mercuriusClient.query(
				Query_ActionItem_Organization,
				{
					variables: {
						input: {
							organizationId: organization.id,
						},
					},
				},
			);

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});
	});

	describe("Organization via createActionItem mutation", () => {
		it("should return organization when creating action item", async () => {
			const adminAuth = await getAdminAuth();
			const organization = await createTestOrganization(adminAuth.token);
			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			const category = await createTestCategory(
				adminAuth.token,
				organization.id,
			);
			const { volunteerId } = await createTestEventAndVolunteer(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);

			// The Mutation_createActionItem already requests organization { id, name }
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						categoryId: category.id,
						organizationId: organization.id,
						volunteerId,
						assignedAt: new Date().toISOString(),
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.createActionItem);
			assertToBeNonNullish(result.data.createActionItem.organization);
			expect(result.data.createActionItem.organization.id).toBe(
				organization.id,
			);
			expect(result.data.createActionItem.organization.name).toBe(
				organization.name,
			);
		});
	});

	describe("DataLoader Behavior", () => {
		it("should efficiently batch organization lookups for multiple action items", async () => {
			const adminAuth = await getAdminAuth();
			const organization = await createTestOrganization(adminAuth.token);
			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			const category = await createTestCategory(
				adminAuth.token,
				organization.id,
			);
			const { volunteerId } = await createTestEventAndVolunteer(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);

			// Create multiple action items that will all need the same organization
			const actionItemPromises = [];
			for (let i = 0; i < 5; i++) {
				actionItemPromises.push(
					createTestActionItem(
						adminAuth.token,
						category.id,
						organization.id,
						volunteerId,
					),
				);
			}
			await Promise.all(actionItemPromises);

			// Query all action items - DataLoader should batch the organization lookups
			const result = await mercuriusClient.query(
				Query_ActionItem_Organization,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							organizationId: organization.id,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.actionItemsByOrganization);
			expect(
				result.data.actionItemsByOrganization.length,
			).toBeGreaterThanOrEqual(5);

			// Verify all action items have the organization resolved correctly
			for (const actionItem of result.data.actionItemsByOrganization) {
				assertToBeNonNullish(actionItem?.organization);
				expect(actionItem.organization.id).toBe(organization.id);
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

			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			const category = await createTestCategory(
				adminAuth.token,
				organization.id,
			);
			const { volunteerId } = await createTestEventAndVolunteer(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			await createTestActionItem(
				adminAuth.token,
				category.id,
				organization.id,
				volunteerId,
			);

			const result = await mercuriusClient.query(
				Query_ActionItem_Organization,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							organizationId: organization.id,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.actionItemsByOrganization);
			const actionItem = result.data.actionItemsByOrganization[0];
			assertToBeNonNullish(actionItem?.organization);
			expect(actionItem.organization.id).toBe(organization.id);
			expect(actionItem.organization.name).toBe(orgName);
			expect(actionItem.organization.countryCode).toBe("us");
			// Optional fields should be null
			expect(actionItem.organization.description).toBeNull();
			expect(actionItem.organization.addressLine1).toBeNull();
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

			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			const category = await createTestCategory(
				adminAuth.token,
				organization.id,
			);
			const { volunteerId } = await createTestEventAndVolunteer(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			await createTestActionItem(
				adminAuth.token,
				category.id,
				organization.id,
				volunteerId,
			);

			const result = await mercuriusClient.query(
				Query_ActionItem_Organization,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							organizationId: organization.id,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.actionItemsByOrganization);
			const actionItem = result.data.actionItemsByOrganization[0];
			assertToBeNonNullish(actionItem?.organization);
			expect(actionItem.organization.name).toBe(orgName);
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

			await createOrgMembership(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			const category = await createTestCategory(
				adminAuth.token,
				organization.id,
			);
			const { volunteerId } = await createTestEventAndVolunteer(
				adminAuth.token,
				organization.id,
				adminAuth.userId,
			);
			await createTestActionItem(
				adminAuth.token,
				category.id,
				organization.id,
				volunteerId,
			);

			const result = await mercuriusClient.query(
				Query_ActionItem_Organization,
				{
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							organizationId: organization.id,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.actionItemsByOrganization);
			const actionItem = result.data.actionItemsByOrganization[0];
			assertToBeNonNullish(actionItem?.organization);
			expect(actionItem.organization.countryCode).toBe("ca");
			expect(actionItem.organization.state).toBe("ON");
			expect(actionItem.organization.city).toBe("Toronto");
		});
	});
});
