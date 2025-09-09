import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createActionItem,
	Mutation_createActionItemCategory,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_signIn,
	DELETE_ACTION_ITEM_MUTATION,
} from "../documentNodes";

// Sign in as admin to get an authentication token and admin user id.
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

// Helper to create an organization with a unique name and return its id.
async function createOrganizationAndGetId(): Promise<string> {
	const uniqueName = `Test Org ${faker.string.uuid()}`;
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: uniqueName,
				countryCode: "us",
			},
		},
	});
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

// Helper to create an action item category
async function createActionItemCategory(
	organizationId: string,
): Promise<string> {
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				organizationId,
				memberId: adminUser.id,
				role: "administrator",
			},
		},
	});

	const result = await mercuriusClient.mutate(
		Mutation_createActionItemCategory,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Test Category ${faker.string.uuid()}`,
					organizationId: organizationId,
					isDisabled: false,
				},
			},
		},
	);

	const categoryId = result.data?.createActionItemCategory?.id;
	assertToBeNonNullish(categoryId);
	return categoryId;
}

suite("Mutation field deleteActionItem", () => {
	test("should delete an action item for a specific instance", async () => {
		const orgId = await createOrganizationAndGetId();
		const categoryId = await createActionItemCategory(orgId);
		const createUserResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						emailAddress: `assignee${faker.string.ulid()}@example.com`,
						isEmailAddressVerified: true,
						name: "Assignee User",
						password: "password",
						role: "regular",
					},
				},
			},
		);
		assertToBeNonNullish(createUserResult.data?.createUser);
		assertToBeNonNullish(createUserResult.data.createUser.user);
		const assigneeId = createUserResult.data.createUser.user.id;
		assertToBeNonNullish(assigneeId);

		const createActionItemResult = await mercuriusClient.mutate(
			Mutation_createActionItem,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						categoryId: categoryId,
						assigneeId: assigneeId,
						organizationId: orgId,
						assignedAt: "2025-04-01T00:00:00Z",
					},
				},
			},
		);
		assertToBeNonNullish(createActionItemResult.data?.createActionItem);
		const actionItemId = createActionItemResult.data.createActionItem.id;
		assertToBeNonNullish(actionItemId);

		const result = await mercuriusClient.mutate(
			DELETE_ACTION_ITEM_MUTATION,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: actionItemId,
						deleteForInstance: true,
					},
				},
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.deleteActionItem).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				isDeleted: true,
			}),
		);
	});
});
