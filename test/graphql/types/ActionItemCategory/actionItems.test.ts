import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import {
	Mutation_createActionItem,
	Mutation_createActionItemCategory,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_actionItems,
	Query_signIn,
} from "../documentNodes";
import { server } from "../../../server";
import { mercuriusClient } from "../../types/client";
import { faker } from "@faker-js/faker";
import { resolveActionItems } from "../../../../src/graphql/types/ActionItemCategory/actionItems";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";
import { TalawaGraphQLError } from "../../../../src/utilities/TalawaGraphQLError";

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);
assertToBeNonNullish(signInResult.data.signIn.user);
const adminUser = signInResult.data.signIn.user;

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
				memberId: adminUser.id,
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

suite("ActionItemCategory.actionItems", () => {
	test("should return action items for a category", async () => {
		const organization = await createOrg();
		const category = await createCategory(organization.id);

		await mercuriusClient.mutate(Mutation_createActionItem, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					categoryId: category.id!,
					assigneeId: adminUser.id,
					organizationId: organization.id,
					assignedAt: new Date().toISOString(),
				},
			},
		});

		const result = await mercuriusClient.query(Query_actionItems, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				id: category.id!,
			},
		});

		assertToBeNonNullish(result.data?.actionItemCategory);
		expect(result.data.actionItemCategory.actionItems).toHaveLength(1);
	});

	test("should return empty array when no action items exist", async () => {
		const organization = await createOrg();
		const category = await createCategory(organization.id);

		const result = await mercuriusClient.query(Query_actionItems, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				id: category.id!,
			},
		});

		assertToBeNonNullish(result.data?.actionItemCategory);
		expect(result.data.actionItemCategory.actionItems).toHaveLength(0);
	});

	test("should throw unauthenticated error when user is not authenticated", async () => {
		const organization = await createOrg();
		const category = await createCategory(organization.id);

		const result = await mercuriusClient.query(Query_actionItems, {
			variables: {
				id: category.id!,
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
