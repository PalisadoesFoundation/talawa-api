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
} from "../documentNodes";

// Helper to add membership to organization
async function addMembership(
	organizationId: string,
	memberId: string,
	role: "administrator" | "regular",
	authToken: string,
) {
	const result = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId,
					memberId,
					role,
				},
			},
		},
	);
	assertToBeNonNullish(result.data?.createOrganizationMembership?.id);
}

// Helper to create an organization with a unique name and return its id.
async function createOrganizationAndGetId(authToken: string): Promise<string> {
	const uniqueName = `Test Org ${faker.string.uuid()}`;
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: uniqueName,
			},
		},
	});
	if (!result.data?.createOrganization?.id) {
		console.error("createOrganization failed:", result.errors);
	}
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

// Helper to create an action item category
async function createActionItemCategory(
	authToken: string,
	organizationId: string,
	adminUserId: string,
): Promise<string> {
	// Make sure admin is a member of the organization first
	await addMembership(organizationId, adminUserId, "administrator", authToken);

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

	if (!result.data?.createActionItemCategory?.id) {
		console.error("createActionItemCategory failed:", result.errors);
		throw new Error("Failed to create action item category");
	}

	return result.data.createActionItemCategory.id;
}

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
const adminUserId = signInResult.data.signIn.user.id;
assertToBeNonNullish(adminUserId);

suite("Mutation field createActionItem", () => {
	// 1. Unauthenticated: user not logged in.
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated code", async () => {
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				variables: {
					input: {
						categoryId: faker.string.uuid(),
						assigneeId: faker.string.uuid(),
						organizationId: faker.string.uuid(),
						preCompletionNotes: "Test note",
						assignedAt: "2025-04-01T00:00:00Z",
					},
				},
			});
			expect(result.data?.createActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createActionItem"],
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
						assigneeId: faker.string.uuid(),
						organizationId: faker.string.uuid(), // non-existent organization
						preCompletionNotes: "Test note",
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
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "organizationId"],
								}),
							]),
						}),
						path: ["createActionItem"],
					}),
				]),
			);
		});
	});

	// 3. User is not part of the organization.
	suite("when the user is not part of the organization", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources for organization", async () => {
			const orgId = await createOrganizationAndGetId(authToken);
			// Note: We intentionally do not add a membership for the current user.
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						categoryId: faker.string.uuid(),
						assigneeId: faker.string.uuid(),
						organizationId: orgId,
						preCompletionNotes: "Test note",
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
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "organizationId"],
								}),
							]),
						}),
						path: ["createActionItem"],
					}),
				]),
			);
		});
	});

	// 4. Category does not exist.
	suite("when the specified category does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found for category", async () => {
			const orgId = await createOrganizationAndGetId(authToken);
			await addMembership(orgId, adminUserId, "administrator", authToken);
			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						categoryId: faker.string.uuid(), // non-existent category
						assigneeId: faker.string.uuid(), // dummy value
						organizationId: orgId,
						preCompletionNotes: "Test note",
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
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "categoryId"],
								}),
							]),
						}),
						path: ["createActionItem"],
					}),
				]),
			);
		});
	});

	// 5. Assignee does not exist.
	suite("when the specified assignee does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found for assignee", async () => {
			const orgId = await createOrganizationAndGetId(authToken);

			// Create a valid category first
			const categoryId = await createActionItemCategory(
				authToken,
				orgId,
				adminUserId,
			);

			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						categoryId: categoryId,
						assigneeId: faker.string.uuid(), // non-existent assignee
						organizationId: orgId,
						preCompletionNotes: "Test note",
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
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "assigneeId"],
								}),
							]),
						}),
						path: ["createActionItem"],
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
				// Create a new non-admin user.
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
				// Assert user is non-null.
				assertToBeNonNullish(createUserResult.data.createUser.user);
				const nonAdminToken =
					createUserResult.data.createUser.authenticationToken;
				const nonAdminUserId = createUserResult.data.createUser.user.id;
				assertToBeNonNullish(nonAdminToken);
				assertToBeNonNullish(nonAdminUserId);

				const orgId = await createOrganizationAndGetId(authToken);
				// Add membership for the non-admin user with "regular" role.
				await addMembership(orgId, nonAdminUserId, "regular", authToken);

				// Create a valid category as admin
				const categoryId = await createActionItemCategory(
					authToken,
					orgId,
					adminUserId,
				);

				const result = await mercuriusClient.mutate(Mutation_createActionItem, {
					headers: { authorization: `bearer ${nonAdminToken}` },
					variables: {
						input: {
							categoryId: categoryId,
							assigneeId: nonAdminUserId,
							organizationId: orgId,
							preCompletionNotes: "Test note",
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
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "organizationId"],
										message: expect.any(String),
									}),
								]),
							}),
							path: ["createActionItem"],
						}),
					]),
				);
			});
		},
	);

	// 7. Successful creation.
	suite("when action item is created successfully", () => {
		test("should return a valid action item", async () => {
			const orgId = await createOrganizationAndGetId(authToken);

			// Create an assignee user.
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

			// Create a valid category
			const categoryId = await createActionItemCategory(
				authToken,
				orgId,
				adminUserId,
			);

			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						categoryId: categoryId,
						assigneeId: assigneeId,
						organizationId: orgId,
						preCompletionNotes: "Successful creation note",
						assignedAt: "2025-04-01T00:00:00Z",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createActionItem).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					isCompleted: false,
					assignedAt: expect.any(String),
					completionAt: null,
					preCompletionNotes: "Successful creation note",
					postCompletionNotes: null,
				}),
			);
		});
	});

	// 8. Test for optional assignedAt field default behavior
	suite("when assignedAt is not provided", () => {
		test("should use current timestamp as default", async () => {
			const orgId = await createOrganizationAndGetId(authToken);

			// Create an assignee user.
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

			// Create a valid category
			const categoryId = await createActionItemCategory(
				authToken,
				orgId,
				adminUserId,
			);

			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						categoryId: categoryId,
						assigneeId: assigneeId,
						organizationId: orgId,
						preCompletionNotes: "Test without assignedAt",
						// omit assignedAt to test default behavior
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createActionItem).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					isCompleted: false,
					assignedAt: expect.any(String),
					completionAt: null,
					preCompletionNotes: "Test without assignedAt",
					postCompletionNotes: null,
				}),
			);
		});
	});
});
