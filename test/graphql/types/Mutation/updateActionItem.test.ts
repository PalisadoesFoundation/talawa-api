import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { expect, suite, test } from "vitest";
import { refreshTokensTable } from "~/src/drizzle/tables/refreshTokens";
import { usersTable } from "~/src/drizzle/tables/users";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	MARK_ACTION_ITEM_AS_PENDING_MUTATION,
	Mutation_createActionItem,
	Mutation_createActionItemCategory,
	Mutation_createEvent,
	Mutation_createEventVolunteer,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_currentUser,
	UPDATE_ACTION_ITEM_MUTATION,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUser = currentUserResult.data?.currentUser;
assertToBeNonNullish(adminUser);
const adminUserId: string = adminUser.id;

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
				memberId: adminUserId,
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

// Helper to create an event and volunteer
async function createEventAndVolunteer(
	organizationId: string,
	userId: string,
): Promise<string> {
	// Create an event
	const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				organizationId,
				name: "Test Event",
				description: "Test event for action items",
				startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
				endAt: new Date(Date.now() + 3600000).toISOString(),
				location: "Test Location",
			},
		},
	});
	if (eventResult.errors) {
		throw new Error(
			`Failed to create event: ${eventResult.errors[0]?.message || "unknown error"}`,
		);
	}
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
	assertToBeNonNullish(volunteerResult.data.createEventVolunteer.id);
	return volunteerResult.data.createEventVolunteer.id;
}

// Helper to create organization, category, user, volunteer, and action item
async function createOrgCategoryVolunteerActionItem(): Promise<{
	orgId: string;
	categoryId: string;
	userId: string;
	userToken?: string;
	volunteerId: string;
	actionItemId: string;
}> {
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
	const userId = createUserResult.data.createUser.user.id;
	assertToBeNonNullish(userId);
	const userToken =
		createUserResult.data.createUser.authenticationToken ?? undefined;

	const volunteerId = await createEventAndVolunteer(orgId, userId);

	const createActionItemResult = await mercuriusClient.mutate(
		Mutation_createActionItem,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					categoryId: categoryId,
					volunteerId: volunteerId,
					organizationId: orgId,
					assignedAt: "2025-04-01T00:00:00Z",
				},
			},
		},
	);
	assertToBeNonNullish(createActionItemResult.data?.createActionItem);
	const actionItemId = createActionItemResult.data.createActionItem.id;
	assertToBeNonNullish(actionItemId);

	return {
		orgId,
		categoryId,
		userId,
		userToken,
		volunteerId,
		actionItemId,
	};
}

suite("Mutation field updateActionItem", () => {
	test("should update an action item for a specific instance", async () => {
		const { actionItemId } = await createOrgCategoryVolunteerActionItem();

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

		// Delete the user from the database directly (bypassing GraphQL)
		// This ensures the user is deleted before we try to use their token
		// First delete refresh tokens to avoid foreign key constraint violations
		await server.drizzleClient
			.delete(refreshTokensTable)
			.where(eq(refreshTokensTable.userId, newUserId));
		// Then delete the user
		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, newUserId));

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
		const { actionItemId } = await createOrgCategoryVolunteerActionItem();

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
		const { actionItemId } = await createOrgCategoryVolunteerActionItem();

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
		const { actionItemId } = await createOrgCategoryVolunteerActionItem();

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
		const { actionItemId } = await createOrgCategoryVolunteerActionItem();

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

	test("should successfully update action item without categoryId", async () => {
		const { actionItemId } = await createOrgCategoryVolunteerActionItem();

		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: actionItemId,
					isCompleted: false,
					preCompletionNotes: "Updated notes",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateActionItem).toEqual(
			expect.objectContaining({
				id: actionItemId,
				isCompleted: false,
			}),
		);
	});

	test("should successfully update action item with valid categoryId", async () => {
		const { orgId, actionItemId } =
			await createOrgCategoryVolunteerActionItem();
		const newCategoryId = await createActionItemCategory(orgId);

		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: actionItemId,
					categoryId: newCategoryId,
					isCompleted: false,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateActionItem).toEqual(
			expect.objectContaining({
				id: actionItemId,
				isCompleted: false,
			}),
		);
	});

	test("should successfully update action item marking as not completed", async () => {
		const { actionItemId } = await createOrgCategoryVolunteerActionItem();

		// First mark as completed
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

		// Then mark as not completed
		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: actionItemId,
					isCompleted: false,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateActionItem).toEqual(
			expect.objectContaining({
				id: actionItemId,
				isCompleted: false,
			}),
		);
	});

	test("should allow organization administrator to update action item", async () => {
		const { orgId, actionItemId } =
			await createOrgCategoryVolunteerActionItem();

		// Create a regular user who will be made org admin
		const orgAdminUserResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						emailAddress: `orgadmin${faker.string.ulid()}@example.com`,
						isEmailAddressVerified: true,
						name: "Org Admin User",
						password: "password",
						role: "regular",
					},
				},
			},
		);
		assertToBeNonNullish(orgAdminUserResult.data?.createUser);
		assertToBeNonNullish(orgAdminUserResult.data.createUser.user);
		assertToBeNonNullish(
			orgAdminUserResult.data.createUser.authenticationToken,
		);
		const orgAdminUserId = orgAdminUserResult.data.createUser.user.id;
		const orgAdminToken =
			orgAdminUserResult.data.createUser.authenticationToken;

		// Make the user an organization administrator
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: orgAdminUserId,
					role: "administrator",
				},
			},
		});

		// Update as organization administrator (not global admin)
		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${orgAdminToken}` },
			variables: {
				input: {
					id: actionItemId,
					isCompleted: true,
					postCompletionNotes: "Updated by org admin",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateActionItem).toEqual(
			expect.objectContaining({
				id: actionItemId,
				isCompleted: true,
			}),
		);
	});
});

suite("Mutation field markActionItemAsPending", () => {
	test("should mark a completed action item as pending", async () => {
		const { actionItemId } = await createOrgCategoryVolunteerActionItem();

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
		const { actionItemId } = await createOrgCategoryVolunteerActionItem();

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
		const { actionItemId } = await createOrgCategoryVolunteerActionItem();

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
