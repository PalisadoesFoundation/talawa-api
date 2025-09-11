import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	MARK_ACTION_ITEM_AS_PENDING_MUTATION,
	Mutation_createActionItem,
	Mutation_createActionItemCategory,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
	UPDATE_ACTION_ITEM_MUTATION,
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

suite("Mutation field updateActionItem", () => {
	test("should update an action item for a specific instance", async () => {
		const orgId = await createOrganizationAndGetId();
		const categoryId = await createActionItemCategory(orgId);
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
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
		});
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

		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: actionItemId,
					isCompleted: true,
					postCompletionNotes: "This action item is completed.",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateActionItem).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				isCompleted: true,
			}),
		);
	});

	test("should throw unauthenticated error when client is not authenticated", async () => {
		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			variables: {
				input: {
					id: faker.string.uuid(),
					isCompleted: true,
					postCompletionNotes: "This should fail.",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("should throw invalid_arguments error for invalid input", async () => {
		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: "invalid-uuid",
					isCompleted: true,
					postCompletionNotes: "This should fail.",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("should throw arguments_associated_resources_not_found error when action item does not exist", async () => {
		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: faker.string.uuid(),
					isCompleted: true,
					postCompletionNotes: "This should fail.",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("should throw unauthenticated error when current user is not found in database", async () => {
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					emailAddress: `testuser${faker.string.ulid()}@example.com`,
					isEmailAddressVerified: true,
					name: "Test User",
					password: "password",
					role: "regular",
				},
			},
		});
		assertToBeNonNullish(createUserResult.data?.createUser);
		assertToBeNonNullish(createUserResult.data.createUser.user);
		assertToBeNonNullish(createUserResult.data.createUser.authenticationToken);

		const newUserId = createUserResult.data.createUser.user.id;
		const newUserToken = createUserResult.data.createUser.authenticationToken;

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: newUserId,
				},
			},
		});

		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${newUserToken}` },
			variables: {
				input: {
					id: faker.string.uuid(),
					isCompleted: true,
					postCompletionNotes: "This should fail.",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("should throw forbidden_action error when completing without postCompletionNotes", async () => {
		const orgId = await createOrganizationAndGetId();
		const categoryId = await createActionItemCategory(orgId);
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
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
		});
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

		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: actionItemId,
					isCompleted: true,
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"forbidden_action_on_arguments_associated_resources",
		);
		expect(result.errors?.[0]?.extensions?.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					argumentPath: ["input", "postCompletionNotes"],
					message:
						"Post completion notes are required when marking as completed.",
				}),
			]),
		);
	});

	test("should throw arguments_associated_resources_not_found error when category does not exist", async () => {
		const orgId = await createOrganizationAndGetId();
		const categoryId = await createActionItemCategory(orgId);
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
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
		});
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

		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: actionItemId,
					categoryId: faker.string.uuid(),
					isCompleted: false,
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
		expect(result.errors?.[0]?.extensions?.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					argumentPath: ["input", "categoryId"],
				}),
			]),
		);
	});

	test("should throw unauthorized error if a non-admin tries to update", async () => {
		const orgId = await createOrganizationAndGetId();
		const categoryId = await createActionItemCategory(orgId);
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
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
		});
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

		// Create a regular user
		const regularUserResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						emailAddress: `regular${faker.string.ulid()}@example.com`,
						isEmailAddressVerified: true,
						name: "Regular User",
						password: "password",
						role: "regular",
					},
				},
			},
		);
		assertToBeNonNullish(regularUserResult.data?.createUser);
		assertToBeNonNullish(regularUserResult.data.createUser.authenticationToken);
		const regularUserToken =
			regularUserResult.data.createUser.authenticationToken;

		// Try to update as regular user
		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${regularUserToken}` },
			variables: {
				input: {
					id: actionItemId,
					isCompleted: true,
					postCompletionNotes: "This should fail.",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	test("should throw unexpected error when update operation fails to return updated item", async () => {
		const orgId = await createOrganizationAndGetId();
		const categoryId = await createActionItemCategory(orgId);
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
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
		});
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

		const originalUpdate = server.drizzleClient.update;
		const fakeUpdate = () => ({
			set: () => ({
				where: () => ({
					returning: async () => [],
				}),
			}),
		});

		try {
			server.drizzleClient.update =
				fakeUpdate as unknown as typeof server.drizzleClient.update;

			const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: actionItemId,
						isCompleted: true,
						postCompletionNotes: "This should fail.",
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
		} finally {
			server.drizzleClient.update = originalUpdate;
		}
	});
});

suite("Mutation field markActionItemAsPending", () => {
	test("should mark a completed action item as pending", async () => {
		const orgId = await createOrganizationAndGetId();
		const categoryId = await createActionItemCategory(orgId);
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
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
		});
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

		await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: actionItemId,
					isCompleted: true,
					postCompletionNotes: "Completed",
				},
			},
		});

		const result = await mercuriusClient.mutate(
			MARK_ACTION_ITEM_AS_PENDING_MUTATION,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: actionItemId,
					},
				},
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.markActionItemAsPending?.isCompleted).toBe(false);
	});

	test("should throw unauthenticated error when client is not authenticated", async () => {
		const result = await mercuriusClient.mutate(
			MARK_ACTION_ITEM_AS_PENDING_MUTATION,
			{
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			},
		);

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("should throw arguments_associated_resources_not_found error when action item does not exist", async () => {
		const result = await mercuriusClient.mutate(
			MARK_ACTION_ITEM_AS_PENDING_MUTATION,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			},
		);

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("should throw forbidden_action error if action item is already pending", async () => {
		const orgId = await createOrganizationAndGetId();
		const categoryId = await createActionItemCategory(orgId);
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
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
		});
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
			MARK_ACTION_ITEM_AS_PENDING_MUTATION,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: actionItemId,
					},
				},
			},
		);

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"forbidden_action_on_arguments_associated_resources",
		);
	});

	test("should throw unexpected error when update operation fails to return updated item", async () => {
		const orgId = await createOrganizationAndGetId();
		const categoryId = await createActionItemCategory(orgId);
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
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
		});
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

		await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: actionItemId,
					isCompleted: true,
					postCompletionNotes: "Completed",
				},
			},
		});

		const originalUpdate = server.drizzleClient.update;
		const fakeUpdate = () => ({
			set: () => ({
				where: () => ({
					returning: async () => [],
				}),
			}),
		});

		try {
			server.drizzleClient.update =
				fakeUpdate as unknown as typeof server.drizzleClient.update;

			const result = await mercuriusClient.mutate(
				MARK_ACTION_ITEM_AS_PENDING_MUTATION,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: actionItemId,
						},
					},
				},
			);

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
		} finally {
			server.drizzleClient.update = originalUpdate;
		}
	});
});
