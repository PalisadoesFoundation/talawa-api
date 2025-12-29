import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	DELETE_ACTION_ITEM_MUTATION,
	Mutation_createActionItem,
	Mutation_createActionItemCategory,
	Mutation_createEvent,
	Mutation_createEventVolunteer,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
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

// Helper to create an event and volunteer
async function createEventAndVolunteer(organizationId: string, userId: string) {
	// Create an event
	const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				organizationId,
				name: "Test Event",
				description: "Test event for action items",
				startAt: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
				endAt: new Date(Date.now() + 90000000).toISOString(), // 1 day + 1 hour from now
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
	assertToBeNonNullish(volunteerResult.data.createEventVolunteer.id);
	return {
		eventId,
		volunteerId: volunteerResult.data.createEventVolunteer.id,
	};
}

suite("Mutation field deleteActionItem", () => {
	test("should delete an action item for a specific instance", async () => {
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
		const assigneeUserId = createUserResult.data.createUser.user.id;
		assertToBeNonNullish(assigneeUserId);

		const { volunteerId } = await createEventAndVolunteer(
			orgId,
			assigneeUserId,
		);

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

		const result = await mercuriusClient.mutate(DELETE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: actionItemId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.deleteActionItem).toBeDefined();
		expect(result.data?.deleteActionItem?.id).toBe(actionItemId);
		expect(result.data?.deleteActionItem?.isCompleted).toBe(false);
	});

	test("should throw unauthenticated error when client is not authenticated", async () => {
		const result = await mercuriusClient.mutate(DELETE_ACTION_ITEM_MUTATION, {
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
		expect(result.data).toEqual({ deleteActionItem: null });
	});

	test("should throw invalid_arguments error when input validation fails", async () => {
		const result = await mercuriusClient.mutate(DELETE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: "invalid-uuid", // Invalid UUID format
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "id"],
							message: expect.stringContaining("Invalid uuid"),
						}),
					]),
				}),
			}),
		);
		expect(result.data).toEqual({ deleteActionItem: null });
	});

	test("should throw arguments_associated_resources_not_found error when action item does not exist", async () => {
		const result = await mercuriusClient.mutate(DELETE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: faker.string.uuid(), // Valid UUID but non-existent action item
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				message: "The specified action item does not exist.",
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "id"],
						}),
					]),
				}),
			}),
		);
		expect(result.data).toEqual({ deleteActionItem: null });
	});

	test("should throw unauthenticated error when current user is not found in database", async () => {
		// Create a new user
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

		// Delete the user using admin token
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: newUserId,
				},
			},
		});

		// Now try to delete an action item with the deleted user's token
		// This should fail with "unauthenticated" because the user no longer exists
		const result = await mercuriusClient.mutate(DELETE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${newUserToken}` },
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
		expect(result.data).toEqual({ deleteActionItem: null });
	});

	test("should throw unexpected error when delete operation fails to return deleted item", async () => {
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
		const assigneeUserId = createUserResult.data.createUser.user.id;
		assertToBeNonNullish(assigneeUserId);

		const { volunteerId } = await createEventAndVolunteer(
			orgId,
			assigneeUserId,
		);

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

		// Mock the delete method to simulate returning empty array
		const originalDelete = server.drizzleClient.delete;
		const fakeDelete = () => ({
			where: () => ({
				returning: async () => {
					return []; // Simulate delete operation returning no rows
				},
			}),
		});

		try {
			server.drizzleClient.delete =
				fakeDelete as unknown as typeof server.drizzleClient.delete;

			const result = await mercuriusClient.mutate(DELETE_ACTION_ITEM_MUTATION, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: actionItemId,
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]).toEqual(
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unexpected" }),
				}),
			);
			expect(result.data).toEqual({ deleteActionItem: null });
		} finally {
			server.drizzleClient.delete = originalDelete;
		}
	});
});
