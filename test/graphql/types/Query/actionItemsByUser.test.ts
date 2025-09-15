import { faker } from "@faker-js/faker";
import { beforeAll, beforeEach, expect, suite, test } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { mercuriusClient } from "../client";
import {
	Mutation_createActionItem,
	Mutation_createActionItemCategory,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteUser,
	Query_actionItemsByUser,
	Query_signIn,
} from "../documentNodes";

const SUITE_TIMEOUT = 30_000;

let globalAuth: { authToken: string; userId: string };

async function globalSignInAndGetToken() {
	const result = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ?? "",
				password: process.env.API_ADMINISTRATOR_USER_PASSWORD ?? "",
			},
		},
	});
	assertToBeNonNullish(result.data?.signIn);
	const authToken = result.data.signIn.authenticationToken;
	assertToBeNonNullish(authToken);
	const userId = result.data.signIn.user?.id;
	assertToBeNonNullish(userId);
	return { authToken, userId };
}

async function createUserAndGetToken(userDetails = {}) {
	const defaultUser = {
		name: faker.person.fullName(),
		emailAddress: faker.internet.email(),
		password: faker.internet.password({ length: 12 }),
		role: "regular" as const,
		isEmailAddressVerified: false,
	};
	const input = { ...defaultUser, ...userDetails };
	const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: { input },
	});
	const authToken = createUserResult.data?.createUser?.authenticationToken;
	assertToBeNonNullish(authToken);
	const userId = createUserResult.data?.createUser?.user?.id;
	assertToBeNonNullish(userId);
	return { authToken, userId };
}

async function createOrganizationAndGetId(authToken: string): Promise<string> {
	const uniqueName = `Test Org ${faker.string.uuid()}`;
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: uniqueName,
				description: "Organization for testing",
				countryCode: "us",
			},
		},
	});
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

async function addMembership(
	organizationId: string,
	memberId: string,
	role: "administrator" | "regular",
) {
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: {
			input: {
				organizationId,
				memberId,
				role,
			},
		},
	});
}

async function createActionItemCategory(
	organizationId: string,
): Promise<string> {
	const result = await mercuriusClient.mutate(
		Mutation_createActionItemCategory,
		{
			headers: { authorization: `bearer ${globalAuth.authToken}` },
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

beforeAll(async () => {
	globalAuth = await globalSignInAndGetToken();
});

suite("Query: actionItemsByUser", () => {
	let regularUser: { authToken: string; userId: string };
	let organizationId: string;
	let nonMemberUser: { authToken: string; userId: string };
	let categoryId: string;

	beforeEach(async () => {
		regularUser = await createUserAndGetToken();
		nonMemberUser = await createUserAndGetToken();
		organizationId = await createOrganizationAndGetId(globalAuth.authToken);
		await addMembership(organizationId, regularUser.userId, "regular");
		await addMembership(organizationId, globalAuth.userId, "administrator");
		categoryId = await createActionItemCategory(organizationId);
	});

	test("should return an unauthenticated error if not signed in", async () => {
		const result = await mercuriusClient.query(Query_actionItemsByUser, {
			variables: {
				input: {
					userId: regularUser.userId,
				},
			},
		});

		expect(result.data?.actionItemsByUser).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test(
		"should return an empty array if no action items exist for the user",
		async () => {
			const result = await mercuriusClient.query(Query_actionItemsByUser, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						userId: regularUser.userId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.actionItemsByUser).toEqual([]);
		},
		SUITE_TIMEOUT,
	);

	test("should return all action items assigned to the user", async () => {
		await mercuriusClient.mutate(Mutation_createActionItem, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					organizationId,
					assigneeId: regularUser.userId,
					categoryId,
				},
			},
		});
		await mercuriusClient.mutate(Mutation_createActionItem, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					organizationId,
					assigneeId: regularUser.userId,
					categoryId,
				},
			},
		});

		const result = await mercuriusClient.query(Query_actionItemsByUser, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: {
				input: {
					userId: regularUser.userId,
				},
			},
		});

		expect(result.data?.actionItemsByUser).toBeInstanceOf(Array);
		expect(result.data?.actionItemsByUser?.length).toBe(2);
	});

	test(
		"should throw unauthorized error if regular user tries to view another user's action items",
		async () => {
			const result = await mercuriusClient.query(Query_actionItemsByUser, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						userId: nonMemberUser.userId,
					},
				},
			});

			expect(result.data?.actionItemsByUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
					}),
				]),
			);
		},
		SUITE_TIMEOUT,
	);

	test("should throw invalid_arguments error when input validation fails", async () => {
		const result = await mercuriusClient.query(Query_actionItemsByUser, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: {
				input: {
					userId: "invalid-uuid", // Invalid UUID format
				},
			},
		});

		expect(result.data?.actionItemsByUser).toBeNull();
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
		expect(result.errors?.[0]?.extensions?.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					message: expect.stringContaining("Invalid"),
				}),
			]),
		);
	});

	test("should throw unauthenticated error when currentUser is undefined", async () => {
		// Create a test user
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${globalAuth.authToken}`,
			},
			variables: {
				input: {
					emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
					isEmailAddressVerified: false,
					name: "Test User",
					password: "password",
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(createUserResult.data.createUser?.authenticationToken);
		assertToBeNonNullish(createUserResult.data.createUser.user?.id);

		// Delete the user to simulate the scenario where currentUser lookup fails
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: {
				authorization: `bearer ${globalAuth.authToken}`,
			},
			variables: {
				input: {
					id: createUserResult.data.createUser.user.id,
				},
			},
		});

		// Try to use the authentication token of the deleted user
		const result = await mercuriusClient.query(Query_actionItemsByUser, {
			headers: {
				authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
			},
			variables: {
				input: {
					userId: regularUser.userId,
				},
			},
		});

		expect(result.data?.actionItemsByUser).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["actionItemsByUser"],
				}),
			]),
		);
	});

	test("should throw arguments_associated_resources_not_found error when target user does not exist", async () => {
		const result = await mercuriusClient.query(Query_actionItemsByUser, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: {
				input: {
					userId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID but non-existent user
				},
			},
		});

		expect(result.data?.actionItemsByUser).toBeNull();
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
		expect(result.errors?.[0]?.extensions?.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					argumentPath: ["input", "userId"],
				}),
			]),
		);
		expect(result.errors?.[0]?.message).toBe(
			"The specified user does not exist.",
		);
	});

	test("should filter action items by organization when organizationId is provided", async () => {
		// Create another organization
		const otherOrgId = await createOrganizationAndGetId(globalAuth.authToken);
		await addMembership(otherOrgId, regularUser.userId, "regular");
		await addMembership(otherOrgId, globalAuth.userId, "administrator");
		const otherCategoryId = await createActionItemCategory(otherOrgId);

		// Create action items in both organizations
		await mercuriusClient.mutate(Mutation_createActionItem, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					organizationId,
					assigneeId: regularUser.userId,
					categoryId,
				},
			},
		});

		await mercuriusClient.mutate(Mutation_createActionItem, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					organizationId: otherOrgId,
					assigneeId: regularUser.userId,
					categoryId: otherCategoryId,
				},
			},
		});

		// Query without organization filter - should return all items
		const resultAll = await mercuriusClient.query(Query_actionItemsByUser, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: {
				input: {
					userId: regularUser.userId,
				},
			},
		});

		expect(resultAll.data?.actionItemsByUser).toHaveLength(2);

		// Query with organization filter - should return only items from that organization
		const resultFiltered = await mercuriusClient.query(
			Query_actionItemsByUser,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						userId: regularUser.userId,
						organizationId,
					},
				},
			},
		);

		expect(resultFiltered.data?.actionItemsByUser).toHaveLength(1);
		expect(resultFiltered.data?.actionItemsByUser?.[0]?.organization?.id).toBe(
			organizationId,
		);
	});
});
