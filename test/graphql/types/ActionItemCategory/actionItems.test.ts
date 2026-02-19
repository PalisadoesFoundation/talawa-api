import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { resolveActionItems } from "../../../../src/graphql/types/ActionItemCategory/actionItems";
import { TalawaGraphQLError } from "../../../../src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../../types/client";
import {
	Mutation_createActionItem,
	Mutation_createActionItemCategory,
	Mutation_createEvent,
	Mutation_createEventVolunteer,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_actionItems,
	Query_currentUser,
} from "../documentNodes";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const _adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(_adminUserId);
const adminUserId: string = _adminUserId;

async function createOrg() {
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Action Items Test Org ${faker.string.uuid()}`,
					description: "Org to test action items",
					countryCode: "us",
					state: "CA",
					city: "San Francisco",
					postalCode: "94101",
					addressLine1: "100 Test St",
					addressLine2: "Suite 1",
				},
			},
		},
	);
	assertToBeNonNullish(createOrgResult.data?.createOrganization);
	const organization = createOrgResult.data.createOrganization;

	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				organizationId: organization.id,
				memberId: adminUserId,
				role: "administrator",
			},
		},
	});

	return organization;
}

async function createCategory(organizationId: string) {
	const createCategoryResult = await mercuriusClient.mutate(
		Mutation_createActionItemCategory,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Test Category ${faker.string.uuid()}`,
					description: "A category for testing",
					organizationId,
					isDisabled: false,
				},
			},
		},
	);
	assertToBeNonNullish(createCategoryResult.data?.createActionItemCategory);
	return createCategoryResult.data.createActionItemCategory;
}

async function createEventAndVolunteer(organizationId: string) {
	// Create an event
	const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				organizationId,
				name: "Test Event",
				description: "Test event for action items",
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
					userId: adminUserId,
				},
			},
		},
	);
	assertToBeNonNullish(volunteerResult.data?.createEventVolunteer);
	return {
		eventId,
		volunteerId: volunteerResult.data.createEventVolunteer.id,
	};
}

suite("ActionItemCategory.actionItems", () => {
	test("should return action items for a category", async () => {
		const organization = await createOrg();
		const category = await createCategory(organization.id);
		assertToBeNonNullish(category.id);

		// Create event and volunteer first
		const { volunteerId } = await createEventAndVolunteer(organization.id);

		await mercuriusClient.mutate(Mutation_createActionItem, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					categoryId: category.id,
					organizationId: organization.id,
					volunteerId: volunteerId,
					assignedAt: new Date().toISOString(),
				},
			},
		});

		const result = await mercuriusClient.query(Query_actionItems, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				id: category.id,
			},
		});

		assertToBeNonNullish(result.data?.actionItemCategory);
		expect(result.data.actionItemCategory.actionItems).toHaveLength(1);
	});
	test("should return empty array when no action items exist", async () => {
		const organization = await createOrg();
		const category = await createCategory(organization.id);
		assertToBeNonNullish(category.id);

		const result = await mercuriusClient.query(Query_actionItems, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				id: category.id,
			},
		});

		assertToBeNonNullish(result.data?.actionItemCategory);
		expect(result.data.actionItemCategory.actionItems).toHaveLength(0);
	});

	test("should throw unauthenticated error when user is not authenticated", async () => {
		const organization = await createOrg();
		const category = await createCategory(organization.id);
		assertToBeNonNullish(category.id);

		const result = await mercuriusClient.query(Query_actionItems, {
			variables: {
				id: category.id,
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("should throw unauthenticated error when calling resolver directly with unauthenticated user", async () => {
		const { context } = createMockGraphQLContext(false);
		const mockActionItemCategory = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Test Category",
			description: "A test category",
			isDisabled: false,
			organizationId: "789e1234-e89b-12d3-a456-426614174002",
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "123e4567-e89b-12d3-a456-426614174000",
			updaterId: "223e4567-e89b-12d3-a456-426614174001",
		};

		await expect(
			resolveActionItems(mockActionItemCategory, {}, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			}),
		);
	});
});
