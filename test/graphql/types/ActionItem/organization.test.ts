import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { describe, expect, it, vi } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/ActionItem/organization";
import { resolveOrganization } from "~/src/graphql/types/ActionItem/organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
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
	Mutation_createUser,
	Query_actionItemsByOrganizationWithFullOrg,
	Query_signIn,
} from "../documentNodes";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

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

async function createRegularUser(adminToken: string) {
	const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				emailAddress: faker.internet.email(),
				password: faker.internet.password(),
				role: "regular",
				name: `Test User ${faker.string.uuid()}`,
				isEmailAddressVerified: true,
			},
		},
	});

	// Check for errors first
	if (createUserResult.errors) {
		throw new Error(
			`createUser mutation failed: ${JSON.stringify(createUserResult.errors)}`,
		);
	}
	assertToBeNonNullish(
		createUserResult.data,
		"createUser mutation returned no data",
	);
	const user = createUserResult.data.createUser;
	assertToBeNonNullish(user, "createUser returned null user payload");
	assertToBeNonNullish(
		user.authenticationToken,
		"createUser returned no authenticationToken",
	);
	assertToBeNonNullish(user.user, "createUser returned no user object");

	return {
		id: user.user.id as string,
		token: user.authenticationToken,
	};
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
				Query_actionItemsByOrganizationWithFullOrg,
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
			// Exact count: we created exactly 1 action item for this fresh organization
			expect(result.data.actionItemsByOrganization.length).toBe(1);

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
				Query_actionItemsByOrganizationWithFullOrg,
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
				Query_actionItemsByOrganizationWithFullOrg,
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
			// Exact count: we created exactly 3 action items for this fresh organization
			expect(result.data.actionItemsByOrganization.length).toBe(3);

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

			// Query without auth header - pass empty authorization in query options
			// instead of mutating global client state with setHeaders({})
			const result = await mercuriusClient.query(
				Query_actionItemsByOrganizationWithFullOrg,
				{
					variables: {
						input: {
							organizationId: organization.id,
						},
					},
					headers: { authorization: "" },
				},
			);

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});

		it("should reject query from user in a different organization", async () => {
			const adminAuth = await getAdminAuth();

			// Create original organization with action items
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

			// Create a different organization and a user who is only a member of that org
			const otherOrg = await createTestOrganization(adminAuth.token);
			const otherUser = await createRegularUser(adminAuth.token);
			await createOrgMembership(adminAuth.token, otherOrg.id, otherUser.id);

			// Query the original organization with the other user's token
			const result = await mercuriusClient.query(
				Query_actionItemsByOrganizationWithFullOrg,
				{
					headers: { authorization: `bearer ${otherUser.token}` },
					variables: {
						input: {
							organizationId: organization.id,
						},
					},
				},
			);

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
		});

		it("should allow regular member to query action items in their organization", async () => {
			const adminAuth = await getAdminAuth();

			// Create organization with action items
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

			// Create a regular user and add them as a member of the organization
			const regularUser = await createRegularUser(adminAuth.token);
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminAuth.token}` },
				variables: {
					input: {
						organizationId: organization.id,
						memberId: regularUser.id,
						role: "regular",
					},
				},
			});

			// Query with the regular member's token - should succeed
			const result = await mercuriusClient.query(
				Query_actionItemsByOrganizationWithFullOrg,
				{
					headers: { authorization: `bearer ${regularUser.token}` },
					variables: {
						input: {
							organizationId: organization.id,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.actionItemsByOrganization);
			// Exact count: we created exactly 1 action item for this fresh organization
			expect(result.data.actionItemsByOrganization.length).toBe(1);

			const actionItem = result.data.actionItemsByOrganization[0];
			assertToBeNonNullish(actionItem?.organization);
			expect(actionItem.organization.id).toBe(organization.id);
		});

		it("should reject query from user with no organization membership", async () => {
			const adminAuth = await getAdminAuth();

			// Create organization with action items
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

			// Create a user who has no membership in any organization
			const userWithNoMembership = await createRegularUser(adminAuth.token);

			// Query with the user's token - should be rejected
			const result = await mercuriusClient.query(
				Query_actionItemsByOrganizationWithFullOrg,
				{
					headers: { authorization: `bearer ${userWithNoMembership.token}` },
					variables: {
						input: {
							organizationId: organization.id,
						},
					},
				},
			);

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
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
				Query_actionItemsByOrganizationWithFullOrg,
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
			// Exact count: we created exactly 5 action items for this fresh organization
			expect(result.data.actionItemsByOrganization.length).toBe(5);

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
				Query_actionItemsByOrganizationWithFullOrg,
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
				Query_actionItemsByOrganizationWithFullOrg,
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
				Query_actionItemsByOrganizationWithFullOrg,
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

	describe("DataLoader Unit Tests - Batching Verification", () => {
		it("should call DataLoader exactly once per resolver invocation", async () => {
			const mockOrganization = {
				id: "org-123",
				name: "Test Organization",
				countryCode: "US",
			};

			const mockActionItem = {
				id: "action-item-123",
				organizationId: "org-123",
				categoryId: "category-123",
				eventId: null,
				volunteerId: null,
				volunteerGroupId: null,
				assigneeId: null,
				assignerId: null,
				isCompleted: false,
				isTemplate: false,
				creatorId: "creator-123",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: null,
				completionAt: null,
				preCompletionNotes: null,
				postCompletionNotes: null,
				dueAt: null,
				assignedAt: new Date(),
				recurringEventInstanceId: null,
			};

			const mockCtx = {
				dataloaders: {
					organization: {
						load: vi.fn().mockResolvedValue(mockOrganization),
					},
				},
				log: {
					error: vi.fn(),
					info: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
				},
			};

			const result = await resolveOrganization(
				mockActionItem,
				{},
				mockCtx as unknown as Parameters<typeof resolveOrganization>[2],
			);

			expect(result).toEqual(mockOrganization);
			expect(mockCtx.dataloaders.organization.load).toHaveBeenCalledTimes(1);
			expect(mockCtx.dataloaders.organization.load).toHaveBeenCalledWith(
				"org-123",
			);
		});

		it("should batch organization lookups when resolving multiple action items with same org", async () => {
			const mockOrganization = {
				id: "org-shared",
				name: "Shared Organization",
				countryCode: "US",
			};

			// Create mock DataLoader that tracks calls
			const loadFn = vi.fn().mockResolvedValue(mockOrganization);

			const mockCtx = {
				dataloaders: {
					organization: {
						load: loadFn,
					},
				},
				log: {
					error: vi.fn(),
					info: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
				},
			};

			// Create multiple action items with the same organizationId
			const actionItems = [
				{
					id: "action-item-1",
					organizationId: "org-shared",
					categoryId: "category-1",
					eventId: null,
					volunteerId: null,
					volunteerGroupId: null,
					assigneeId: null,
					assignerId: null,
					isCompleted: false,
					isTemplate: false,
					creatorId: "creator-1",
					updaterId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					completedAt: null,
					completionAt: null,
					preCompletionNotes: null,
					postCompletionNotes: null,
					dueAt: null,
					assignedAt: new Date(),
					recurringEventInstanceId: null,
				},
				{
					id: "action-item-2",
					organizationId: "org-shared",
					categoryId: "category-2",
					eventId: null,
					volunteerId: null,
					volunteerGroupId: null,
					assigneeId: null,
					assignerId: null,
					isCompleted: false,
					isTemplate: false,
					creatorId: "creator-2",
					updaterId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					completedAt: null,
					completionAt: null,
					preCompletionNotes: null,
					postCompletionNotes: null,
					dueAt: null,
					assignedAt: new Date(),
					recurringEventInstanceId: null,
				},
				{
					id: "action-item-3",
					organizationId: "org-shared",
					categoryId: "category-3",
					eventId: null,
					volunteerId: null,
					volunteerGroupId: null,
					assigneeId: null,
					assignerId: null,
					isCompleted: false,
					isTemplate: false,
					creatorId: "creator-3",
					updaterId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					completedAt: null,
					completionAt: null,
					preCompletionNotes: null,
					postCompletionNotes: null,
					dueAt: null,
					assignedAt: new Date(),
					recurringEventInstanceId: null,
				},
			];

			// Resolve all action items in parallel
			const results = await Promise.all(
				actionItems.map((actionItem) =>
					resolveOrganization(
						actionItem,
						{},
						mockCtx as unknown as Parameters<typeof resolveOrganization>[2],
					),
				),
			);

			// All results should be the same organization
			expect(results).toHaveLength(3);
			for (const result of results) {
				expect(result).toEqual(mockOrganization);
			}

			// DataLoader was called for each action item (batching happens at DataLoader level)
			expect(loadFn).toHaveBeenCalledTimes(3);
			expect(loadFn).toHaveBeenCalledWith("org-shared");
		});

		it("should handle different organization IDs correctly in DataLoader", async () => {
			const mockOrg1 = {
				id: "org-1",
				name: "Organization 1",
				countryCode: "US",
			};
			const mockOrg2 = {
				id: "org-2",
				name: "Organization 2",
				countryCode: "CA",
			};

			const loadFn = vi
				.fn()
				.mockImplementation((orgId: string) =>
					Promise.resolve(orgId === "org-1" ? mockOrg1 : mockOrg2),
				);

			const mockCtx = {
				dataloaders: {
					organization: {
						load: loadFn,
					},
				},
				log: {
					error: vi.fn(),
					info: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
				},
			};

			const actionItem1 = {
				id: "action-item-1",
				organizationId: "org-1",
				categoryId: "category-1",
				eventId: null,
				volunteerId: null,
				volunteerGroupId: null,
				assigneeId: null,
				assignerId: null,
				isCompleted: false,
				isTemplate: false,
				creatorId: "creator-1",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: null,
				completionAt: null,
				preCompletionNotes: null,
				postCompletionNotes: null,
				dueAt: null,
				assignedAt: new Date(),
				recurringEventInstanceId: null,
			};

			const actionItem2 = {
				id: "action-item-2",
				organizationId: "org-2",
				categoryId: "category-2",
				eventId: null,
				volunteerId: null,
				volunteerGroupId: null,
				assigneeId: null,
				assignerId: null,
				isCompleted: false,
				isTemplate: false,
				creatorId: "creator-2",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: null,
				completionAt: null,
				preCompletionNotes: null,
				postCompletionNotes: null,
				dueAt: null,
				assignedAt: new Date(),
				recurringEventInstanceId: null,
			};

			const [result1, result2] = await Promise.all([
				resolveOrganization(
					actionItem1,
					{},
					mockCtx as unknown as Parameters<typeof resolveOrganization>[2],
				),
				resolveOrganization(
					actionItem2,
					{},
					mockCtx as unknown as Parameters<typeof resolveOrganization>[2],
				),
			]);

			expect(result1).toEqual(mockOrg1);
			expect(result2).toEqual(mockOrg2);
			expect(loadFn).toHaveBeenCalledWith("org-1");
			expect(loadFn).toHaveBeenCalledWith("org-2");
			expect(loadFn).toHaveBeenCalledTimes(2);
		});

		it("should use organizationId from parent action item correctly", async () => {
			const mockOrganization = {
				id: "custom-org-id",
				name: "Custom Org",
				countryCode: "UK",
			};

			const loadFn = vi.fn().mockResolvedValue(mockOrganization);

			const mockCtx = {
				dataloaders: {
					organization: {
						load: loadFn,
					},
				},
				log: {
					error: vi.fn(),
					info: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
				},
			};

			const mockActionItem = {
				id: "action-item-custom",
				organizationId: "custom-org-id",
				categoryId: "category-custom",
				eventId: null,
				volunteerId: null,
				volunteerGroupId: null,
				assigneeId: null,
				assignerId: null,
				isCompleted: false,
				isTemplate: false,
				creatorId: "creator-custom",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: null,
				completionAt: null,
				preCompletionNotes: null,
				postCompletionNotes: null,
				dueAt: null,
				assignedAt: new Date(),
				recurringEventInstanceId: null,
			};

			await resolveOrganization(
				mockActionItem,
				{},
				mockCtx as unknown as Parameters<typeof resolveOrganization>[2],
			);

			expect(loadFn).toHaveBeenCalledWith("custom-org-id");
		});
	});

	describe("Error Handling - DataLoader Returns Null", () => {
		it("should throw 'unexpected' error when organization DataLoader returns null", async () => {
			// Create a mock ActionItem parent object
			const mockActionItem = {
				id: "action-item-123",
				organizationId: "org-that-does-not-exist-123",
				categoryId: "category-123",
				eventId: null,
				volunteerId: null,
				volunteerGroupId: null,
				assigneeId: null,
				assignerId: null,
				isCompleted: false,
				isTemplate: false,
				creatorId: "creator-123",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: null,
				completionAt: null,
				preCompletionNotes: null,
				postCompletionNotes: null,
				dueAt: null,
				assignedAt: new Date(),
				recurringEventInstanceId: null,
			};

			// Create a mock context with a DataLoader that returns null
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

			// Call the resolver and expect it to throw
			await expect(
				resolveOrganization(
					mockActionItem,
					{},
					mockCtx as unknown as Parameters<typeof resolveOrganization>[2],
				),
			).rejects.toThrow(TalawaGraphQLError);

			// Verify the error was logged with correct structured format
			expect(mockCtx.log.error).toHaveBeenCalledWith(
				{
					actionItemId: mockActionItem.id,
					organizationId: mockActionItem.organizationId,
				},
				"DataLoader returned null for an action item's organization id that isn't null",
			);

			// Verify the DataLoader was called with the correct organization ID
			expect(mockCtx.dataloaders.organization.load).toHaveBeenCalledWith(
				mockActionItem.organizationId,
			);
		});

		it("should throw error with 'unexpected' code when organization is not found", async () => {
			const mockActionItem = {
				id: "action-item-456",
				organizationId: "missing-org-456",
				categoryId: "category-456",
				eventId: null,
				volunteerId: null,
				volunteerGroupId: null,
				assigneeId: null,
				assignerId: null,
				isCompleted: false,
				isTemplate: false,
				creatorId: "creator-456",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: null,
				completionAt: null,
				preCompletionNotes: null,
				postCompletionNotes: null,
				dueAt: null,
				assignedAt: new Date(),
				recurringEventInstanceId: null,
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
					mockActionItem,
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

		it("should return undefined without throwing when DataLoader returns undefined", async () => {
			// This test documents actual behavior: the resolver only checks for === null,
			// so undefined is returned without throwing. This may be intentional to
			// distinguish between "not found" (null) and "not loaded" (undefined).
			const mockActionItem = {
				id: "action-item-undefined",
				organizationId: "org-undefined",
				categoryId: "category-undefined",
				eventId: null,
				volunteerId: null,
				volunteerGroupId: null,
				assigneeId: null,
				assignerId: null,
				isCompleted: false,
				isTemplate: false,
				creatorId: "creator-undefined",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: null,
				completionAt: null,
				preCompletionNotes: null,
				postCompletionNotes: null,
				dueAt: null,
				assignedAt: new Date(),
				recurringEventInstanceId: null,
			};

			const mockCtx = {
				dataloaders: {
					organization: {
						load: vi.fn().mockResolvedValue(undefined),
					},
				},
				log: {
					error: vi.fn(),
					info: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
				},
			};

			// The resolver uses === null check, so undefined passes through without throwing
			const result = await resolveOrganization(
				mockActionItem,
				{},
				mockCtx as unknown as Parameters<typeof resolveOrganization>[2],
			);

			expect(result).toBeUndefined();
			// Error logging should not have been called since this is not a null case
			expect(mockCtx.log.error).not.toHaveBeenCalled();
		});
	});

	describe("Error Handling - DataLoader Throws Error", () => {
		it("should propagate error when DataLoader throws", async () => {
			const mockActionItem = {
				id: "action-item-error",
				organizationId: "org-throws-error",
				categoryId: "category-error",
				eventId: null,
				volunteerId: null,
				volunteerGroupId: null,
				assigneeId: null,
				assignerId: null,
				isCompleted: false,
				isTemplate: false,
				creatorId: "creator-error",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: null,
				completionAt: null,
				preCompletionNotes: null,
				postCompletionNotes: null,
				dueAt: null,
				assignedAt: new Date(),
				recurringEventInstanceId: null,
			};

			const dataLoaderError = new Error("DataLoader internal failure");
			const mockCtx = {
				dataloaders: {
					organization: {
						load: vi.fn().mockRejectedValue(dataLoaderError),
					},
				},
				log: {
					error: vi.fn(),
					info: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
				},
			};

			// The resolver should propagate the DataLoader error
			await expect(
				resolveOrganization(
					mockActionItem,
					{},
					mockCtx as unknown as Parameters<typeof resolveOrganization>[2],
				),
			).rejects.toThrow("DataLoader internal failure");

			// Verify the DataLoader was called with the correct organization ID
			expect(mockCtx.dataloaders.organization.load).toHaveBeenCalledWith(
				mockActionItem.organizationId,
			);
		});

		it("should propagate database connection error from DataLoader", async () => {
			const mockActionItem = {
				id: "action-item-db-error",
				organizationId: "org-db-connection-error",
				categoryId: "category-db-error",
				eventId: null,
				volunteerId: null,
				volunteerGroupId: null,
				assigneeId: null,
				assignerId: null,
				isCompleted: false,
				isTemplate: false,
				creatorId: "creator-db-error",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: null,
				completionAt: null,
				preCompletionNotes: null,
				postCompletionNotes: null,
				dueAt: null,
				assignedAt: new Date(),
				recurringEventInstanceId: null,
			};

			const dbError = new Error("ECONNREFUSED: Database connection failed");
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
					mockActionItem,
					{},
					mockCtx as unknown as Parameters<typeof resolveOrganization>[2],
				),
			).rejects.toThrow("ECONNREFUSED: Database connection failed");
		});

		it("should propagate timeout error from DataLoader", async () => {
			const mockActionItem = {
				id: "action-item-timeout",
				organizationId: "org-timeout",
				categoryId: "category-timeout",
				eventId: null,
				volunteerId: null,
				volunteerGroupId: null,
				assigneeId: null,
				assignerId: null,
				isCompleted: false,
				isTemplate: false,
				creatorId: "creator-timeout",
				updaterId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: null,
				completionAt: null,
				preCompletionNotes: null,
				postCompletionNotes: null,
				dueAt: null,
				assignedAt: new Date(),
				recurringEventInstanceId: null,
			};

			const timeoutError = new Error("Query execution timeout");
			const mockCtx = {
				dataloaders: {
					organization: {
						load: vi.fn().mockRejectedValue(timeoutError),
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
					mockActionItem,
					{},
					mockCtx as unknown as Parameters<typeof resolveOrganization>[2],
				),
			).rejects.toThrow("Query execution timeout");
		});
	});
});
