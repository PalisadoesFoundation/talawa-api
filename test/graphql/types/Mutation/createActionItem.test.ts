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
						assigneeId: faker.string.uuid(),
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
						assigneeId: faker.string.uuid(),
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
						assigneeId: faker.string.uuid(), // dummy value
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
						assigneeId: faker.string.uuid(), // non-existent assignee
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

				const result = await mercuriusClient.mutate(Mutation_createActionItem, {
					headers: { authorization: `bearer ${nonAdminToken}` },
					variables: {
						input: {
							categoryId: categoryId,
							assigneeId: nonAdminUserId,
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
			const assigneeId = createUserResult.data.createUser.user.id;
			assertToBeNonNullish(assigneeId);

			const categoryId = await createActionItemCategory(orgId);

			const result = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						categoryId: categoryId,
						assigneeId: assigneeId,
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
});
