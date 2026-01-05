import { faker } from "@faker-js/faker";
import {
	afterEach,
	beforeAll,
	beforeEach,
	expect,
	suite,
	test,
	vi,
} from "vitest";
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
				startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
				endAt: new Date(Date.now() + 3600000).toISOString(),
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

suite("Mutation field createActionItem", () => {
	// 1. Unauthenticated: user not logged in.
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated code", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				variables: {
					input: {
						categoryId: faker.string.uuid(),
						volunteerId: faker.string.uuid(),
						organizationId: faker.string.uuid(),
						assignedAt: "2025-04-01T00:00:00Z",
					},
				},
			});
			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
					}),
				]),
			);
		});
	});

	// 2. Organization does not exist.
	suite("when the specified organization does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found for organization", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						categoryId: faker.string.uuid(),
						volunteerId: faker.string.uuid(),
						organizationId: faker.string.uuid(), // non-existent organization
						assignedAt: "2025-04-01T00:00:00Z",
					},
				},
			});
			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				]),
			);
		});
	});

	// 3. User is not part of the organization.
	suite("when the user is not part of the organization", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources for organization", async () => {
			const orgId = await createOrganizationAndGetId();
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						categoryId: faker.string.uuid(),
						volunteerId: faker.string.uuid(),
						organizationId: orgId,
						assignedAt: "2025-04-01T00:00:00Z",
					},
				},
			});
			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
					}),
				]),
			);
		});
	});

	// 4. Category does not exist.
	suite("when the specified category does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found for category", async () => {
			const orgId = await createOrganizationAndGetId();
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: adminUser.id,
						role: "administrator",
					},
				},
			});
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						categoryId: faker.string.uuid(), // non-existent category
						volunteerId: faker.string.uuid(), // dummy value
						organizationId: orgId,
						assignedAt: "2025-04-01T00:00:00Z",
					},
				},
			});
			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				]),
			);
		});
	});

	// 5. Assignee does not exist.
	suite("when the specified assignee does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found for assignee", async () => {
			const orgId = await createOrganizationAndGetId();
			const categoryId = await createActionItemCategory(orgId);

			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						categoryId: categoryId,
						volunteerId: faker.string.uuid(), // non-existent volunteer
						organizationId: orgId,
						assignedAt: "2025-04-01T00:00:00Z",
					},
				},
			});
			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				]),
			);
		});
	});

	// 6. Current user is not an administrator.
	suite(
		"when the current user is not an administrator of the organization",
		() => {
			test("should return an error with forbidden_action_on_arguments_associated_resources", async () => {
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								emailAddress: `nonadmin${faker.string.ulid()}@example.com`,
								isEmailAddressVerified: false,
								name: "Non-Admin User",
								password: "password",
								role: "regular",
							},
						},
					},
				);
				assertToBeNonNullish(createUserResult.data?.createUser);
				assertToBeNonNullish(createUserResult.data.createUser.user);
				const nonAdminToken =
					createUserResult.data.createUser.authenticationToken;
				const nonAdminUserId = createUserResult.data.createUser.user.id;
				assertToBeNonNullish(nonAdminToken);
				assertToBeNonNullish(nonAdminUserId);

				const orgId = await createOrganizationAndGetId();
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							organizationId: orgId,
							memberId: nonAdminUserId,
							role: "regular",
						},
					},
				});

				const categoryId = await createActionItemCategory(orgId);
				const { volunteerId } = await createEventAndVolunteer(
					orgId,
					nonAdminUserId,
				);

				const result = await mercuriusClient.mutate(Mutation_createActionItem, {
					headers: { authorization: `bearer ${nonAdminToken}` },
					variables: {
						input: {
							categoryId: categoryId,
							volunteerId: volunteerId,
							organizationId: orgId,
							assignedAt: "2025-04-01T00:00:00Z",
						},
					},
				});
				expect(result.data?.createActionItem).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "forbidden_action_on_arguments_associated_resources",
							}),
						}),
					]),
				);
			});
		},
	);

	// 7. Successful creation.
	suite("when action item is created successfully", () => {
		test("should return a valid action item", async () => {
			const orgId = await createOrganizationAndGetId();
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
			const assigneeUserId = createUserResult.data.createUser.user.id;
			assertToBeNonNullish(assigneeUserId);

			const categoryId = await createActionItemCategory(orgId);
			const { volunteerId } = await createEventAndVolunteer(
				orgId,
				assigneeUserId,
			);

			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						categoryId: categoryId,
						volunteerId: volunteerId,
						organizationId: orgId,
						assignedAt: "2025-04-01T00:00:00Z",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createActionItem).toEqual(
				expect.objectContaining({
					id: expect.any(String),
				}),
			);
		});
	});

	// 8. Database insert operation fails.
	suite("when the database insert operation fails", () => {
		let originalInsert: typeof server.drizzleClient.insert;
		let orgId: string;
		let categoryId: string;
		let volunteerId: string;

		// Create test data BEFORE any mocking happens
		beforeAll(async () => {
			orgId = await createOrganizationAndGetId();
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
			const assigneeUserId = createUserResult.data.createUser.user.id;
			assertToBeNonNullish(assigneeUserId);

			categoryId = await createActionItemCategory(orgId);
			const eventAndVolunteer = await createEventAndVolunteer(
				orgId,
				assigneeUserId,
			);
			volunteerId = eventAndVolunteer.volunteerId;
		});

		beforeEach(() => {
			// Now mock ONLY for the actual action item creation
			originalInsert = server.drizzleClient.insert;
			server.drizzleClient.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]),
				}),
			});
		});

		afterEach(() => {
			server.drizzleClient.insert = originalInsert;
		});

		test("should return an error with unexpected code and correct message", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						categoryId: categoryId,
						volunteerId: volunteerId,
						organizationId: orgId,
						assignedAt: "2025-04-01T00:00:00Z",
					},
				},
			});

			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unexpected" }),
						message: "Action item creation failed",
					}),
				]),
			);
		});
	});
});
