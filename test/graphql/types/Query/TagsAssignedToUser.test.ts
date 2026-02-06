import { faker } from "@faker-js/faker";
import { inArray } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";
import {
	organizationsTable,
	tagAssignmentsTable,
	tagFoldersTable,
	tagsTable,
	usersTable,
} from "~/src/drizzle/schema";
import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_assignUserTag,
	Mutation_createOrganization,
	Mutation_createTag,
	Mutation_createTagFolder,
	Mutation_createUser,
	Query_signIn,
	Query_userTags,
} from "../documentNodes";

const createdResources = {
	organizationIds: [] as string[],
	userIds: [] as string[],
	folderIds: [] as string[],
	tagIds: [] as string[],
	assignmentIds: [] as string[],
};

type UserTag = {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	creator: {
		id: string;
	};
	assignees: {
		edges: {
			node: {
				id: string;
			};
		}[];
	};
};

afterEach(async () => {
	// Clean DB in reverse dependency order
	await server.drizzleClient
		.delete(tagAssignmentsTable)
		.where(inArray(tagAssignmentsTable.assigneeId, createdResources.userIds));

	await server.drizzleClient
		.delete(tagsTable)
		.where(inArray(tagsTable.id, createdResources.tagIds));

	await server.drizzleClient
		.delete(tagFoldersTable)
		.where(inArray(tagFoldersTable.id, createdResources.folderIds));

	await server.drizzleClient
		.delete(usersTable)
		.where(inArray(usersTable.id, createdResources.userIds));

	await server.drizzleClient
		.delete(organizationsTable)
		.where(inArray(organizationsTable.id, createdResources.organizationIds));

	// Reset tracking
	createdResources.organizationIds.length = 0;
	createdResources.userIds.length = 0;
	createdResources.folderIds.length = 0;
	createdResources.tagIds.length = 0;

	vi.clearAllMocks();
});

suite("Query field userTags", () => {
	test("results in a graphql error with 'invalid_arguments' if an invalid userId is provided", async () => {
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		// Check if sign-in was successful
		if (
			administratorUserSignInResult.errors ||
			!administratorUserSignInResult.data?.signIn?.authenticationToken
		) {
			throw new Error(
				`Admin sign-in failed: ${JSON.stringify(administratorUserSignInResult.errors)}`,
			);
		}

		const authToken =
			administratorUserSignInResult.data.signIn.authenticationToken;

		const userTagsResult = await mercuriusClient.query(Query_userTags, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				userId: "invalid-id", // Not a valid UUID
			},
		});

		// The GraphQL spec says that when there are errors, the data field should be null
		expect(
			userTagsResult.data === null ||
				JSON.stringify(userTagsResult.data) ===
					JSON.stringify({ userTags: null }),
		).toBe(true);
		expect(
			userTagsResult.errors?.some(
				(error) =>
					error.extensions?.code === "invalid_arguments" ||
					/got invalid value|ID cannot represent|Expected ID/i.test(
						error.message,
					),
			),
		).toBe(true);
	});

	test("results in an empty array when user has no tags assigned", async () => {
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		if (
			administratorUserSignInResult.errors ||
			!administratorUserSignInResult.data?.signIn?.authenticationToken
		) {
			throw new Error(
				`Admin sign-in failed: ${JSON.stringify(administratorUserSignInResult.errors)}`,
			);
		}

		const adminToken =
			administratorUserSignInResult.data.signIn.authenticationToken;

		// Create a regular user
		const regularUserResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						emailAddress: `${faker.string.uuid()}@test.com`,
						password: "password123",
						name: "Regular User",
						role: "regular",
						isEmailAddressVerified: true,
					},
				},
			},
		);

		if (
			regularUserResult.errors ||
			!regularUserResult.data?.createUser?.user?.id
		) {
			console.error("Regular user creation failed:", regularUserResult.errors);
			return;
		}

		const regularUserId = regularUserResult.data.createUser.user.id;
		createdResources.userIds.push(regularUserId);

		// Query tags for user with no tags
		const userTagsResult = await mercuriusClient.query(Query_userTags, {
			headers: {
				authorization: `bearer ${adminToken}`,
			},
			variables: {
				userId: regularUserId,
			},
		});

		expect(userTagsResult.errors).toBeUndefined();
		expect(userTagsResult.data?.userTags).toEqual([]);
	});

	test("results in an empty 'errors' field and the expected tags for a user with assigned tags", async () => {
		// Step 1: Admin Sign-in
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		if (
			administratorUserSignInResult.errors ||
			!administratorUserSignInResult.data?.signIn?.authenticationToken
		) {
			throw new Error(
				`Admin sign-in failed: ${JSON.stringify(administratorUserSignInResult.errors)}`,
			);
		}

		const authToken =
			administratorUserSignInResult.data.signIn.authenticationToken;

		// Step 2: Create Organization
		const organizationResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						addressLine1: "123 Test St",
						city: "New York",
						countryCode: "us",
						description: "Test Description",
					},
				},
			},
		);

		if (
			organizationResult.errors ||
			!organizationResult.data?.createOrganization?.id
		) {
			console.error("Organization creation failed:", organizationResult.errors);
			return;
		}

		const organizationId = organizationResult.data.createOrganization.id;
		createdResources.organizationIds.push(organizationId);

		// Step 3: Create a regular user
		const regularUserResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						emailAddress: `${faker.string.uuid()}@test.com`,
						password: "password123",
						name: "Regular User",
						role: "regular",
						isEmailAddressVerified: true,
					},
				},
			},
		);

		if (
			regularUserResult.errors ||
			!regularUserResult.data?.createUser?.user?.id
		) {
			console.error("Regular user creation failed:", regularUserResult.errors);
			return;
		}

		const regularUserId = regularUserResult.data.createUser.user.id;
		createdResources.userIds.push(regularUserId);

		// Step 4: Create Tag Folder
		const tagFolderResult = await mercuriusClient.mutate(
			Mutation_createTagFolder,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						name: "Test Tag Folder",
						organizationId: organizationId,
					},
				},
			},
		);

		if (tagFolderResult.errors || !tagFolderResult.data?.createTagFolder?.id) {
			console.error("Tag folder creation failed:", tagFolderResult.errors);
			return;
		}

		const tagFolderId = tagFolderResult.data.createTagFolder.id;
		createdResources.folderIds.push(tagFolderId);

		// Step 5: Create Tags
		const tag1Result = await mercuriusClient.mutate(Mutation_createTag, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					name: "Test Tag 1",
					organizationId: organizationId,
					folderId: tagFolderId,
				},
			},
		});

		if (tag1Result.errors || !tag1Result.data?.createTag?.id) {
			console.error("Tag 1 creation failed:", tag1Result.errors);
			return;
		}

		const tag1Id = tag1Result.data.createTag.id;
		createdResources.tagIds.push(tag1Id);

		const tag2Result = await mercuriusClient.mutate(Mutation_createTag, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					name: "Test Tag 2",
					organizationId: organizationId,
					folderId: tagFolderId,
				},
			},
		});

		if (tag2Result.errors || !tag2Result.data?.createTag?.id) {
			console.error("Tag 2 creation failed:", tag2Result.errors);
			return;
		}

		const tag2Id = tag2Result.data.createTag.id;
		createdResources.tagIds.push(tag2Id);

		// Step 6: Assign tags to user
		const assign1Result = await mercuriusClient.mutate(Mutation_assignUserTag, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				tagId: tag1Id,
				assigneeId: regularUserId,
			},
		});

		if (assign1Result.errors) {
			console.error("Tag assignment 1 failed:", assign1Result.errors);
			return;
		}

		const assign2Result = await mercuriusClient.mutate(Mutation_assignUserTag, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				tagId: tag2Id,
				assigneeId: regularUserId,
			},
		});

		if (assign2Result.errors) {
			console.error("Tag assignment 2 failed:", assign2Result.errors);
			return;
		}

		// Step 7: Query user tags
		const userTagsResult = await mercuriusClient.query(Query_userTags, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				userId: regularUserId,
			},
		});

		expect(userTagsResult.errors).toBeUndefined();

		const userTags = userTagsResult.data?.userTags as UserTag[];
		expect(userTags).toHaveLength(2);

		// Tag 1 assertions
		const tag1 = userTags.find((tag) => tag.id === tag1Id);
		expect(tag1).toBeDefined();
		if (!tag1) throw new Error("tag1 not found");

		expect(tag1.assignees.edges.map((e) => e.node.id)).toContain(regularUserId);

		// Tag 2 assertions
		const tag2 = userTags.find((tag) => tag.id === tag2Id);
		expect(tag2).toBeDefined();
		if (!tag2) throw new Error("tag2 not found");

		expect(tag2.assignees.edges.map((e) => e.node.id)).toContain(regularUserId);

		// Capture admin ID after sign-in
		const adminUserId = administratorUserSignInResult.data.signIn.user?.id;

		// In assertions:
		expect(tag1.creator.id).toBe(adminUserId); // Tags created by admin
		expect(tag2.creator.id).toBe(adminUserId);
	});

	test("regular user can query their own tags", async () => {
		// Step 1: Admin Sign-in
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		if (
			administratorUserSignInResult.errors ||
			!administratorUserSignInResult.data?.signIn?.authenticationToken
		) {
			throw new Error(
				`Admin sign-in failed: ${JSON.stringify(administratorUserSignInResult.errors)}`,
			);
		}

		const adminToken =
			administratorUserSignInResult.data.signIn.authenticationToken;

		// Step 2: Create Organization
		const organizationResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						addressLine1: "123 Test St",
						city: "New York",
						countryCode: "us",
						description: "Test Description",
					},
				},
			},
		);

		if (
			organizationResult.errors ||
			!organizationResult.data?.createOrganization?.id
		) {
			console.error("Organization creation failed:", organizationResult.errors);
			return;
		}

		const organizationId = organizationResult.data.createOrganization.id;
		createdResources.organizationIds.push(organizationId);

		// Step 3: Create Regular User
		const regularUserResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						emailAddress: `${faker.string.uuid()}@test.com`,
						password: "password123",
						name: "Regular User",
						role: "regular",
						isEmailAddressVerified: true,
					},
				},
			},
		);

		if (regularUserResult.errors || !regularUserResult.data?.createUser) {
			console.error("Regular user creation failed:", regularUserResult.errors);
			return;
		}

		const regularUserId = regularUserResult.data.createUser.user?.id;
		const regularUserToken =
			regularUserResult.data.createUser.authenticationToken;

		if (!regularUserId || !regularUserToken) {
			console.error("Regular user ID or token missing");
			return;
		}
		createdResources.userIds.push(regularUserId);

		// Step 4: Create Tag Folder
		const tagFolderResult = await mercuriusClient.mutate(
			Mutation_createTagFolder,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						name: "Test Tag Folder",
						organizationId: organizationId,
					},
				},
			},
		);

		if (tagFolderResult.errors || !tagFolderResult.data?.createTagFolder?.id) {
			console.error("Tag folder creation failed:", tagFolderResult.errors);
			return;
		}

		const tagFolderId = tagFolderResult.data.createTagFolder.id;
		createdResources.folderIds.push(tagFolderId);

		// Step 5: Create Tag
		const tagResult = await mercuriusClient.mutate(Mutation_createTag, {
			headers: {
				authorization: `bearer ${adminToken}`,
			},
			variables: {
				input: {
					name: "Test Tag",
					organizationId: organizationId,
					folderId: tagFolderId,
				},
			},
		});

		if (tagResult.errors || !tagResult.data?.createTag?.id) {
			console.error("Tag creation failed:", tagResult.errors);
			return;
		}

		const tagId = tagResult.data.createTag.id;
		createdResources.tagIds.push(tagId);

		// Step 6: Assign tag to user
		const assignResult = await mercuriusClient.mutate(Mutation_assignUserTag, {
			headers: {
				authorization: `bearer ${adminToken}`,
			},
			variables: {
				tagId: tagId,
				assigneeId: regularUserId,
			},
		});

		if (assignResult.errors) {
			console.error("Tag assignment failed:", assignResult.errors);
			return;
		}

		// Step 7: Regular user queries their own tags
		const userTagsResult = await mercuriusClient.query(Query_userTags, {
			headers: {
				authorization: `bearer ${regularUserToken}`,
			},
			variables: {
				userId: regularUserId,
			},
		});

		expect(userTagsResult.errors).toBeUndefined();
		expect(userTagsResult.data?.userTags).toHaveLength(1);
		expect(userTagsResult.data?.userTags).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: tagId,
					name: "Test Tag",
				}),
			]),
		);
	});

	test("results in empty array when querying tags for a non-existent user", async () => {
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		if (
			administratorUserSignInResult.errors ||
			!administratorUserSignInResult.data?.signIn?.authenticationToken
		) {
			throw new Error(
				`Admin sign-in failed: ${JSON.stringify(administratorUserSignInResult.errors)}`,
			);
		}

		const adminToken =
			administratorUserSignInResult.data.signIn.authenticationToken;

		const nonExistentUserId = faker.string.uuid();

		const userTagsResult = await mercuriusClient.query(Query_userTags, {
			headers: {
				authorization: `bearer ${adminToken}`,
			},
			variables: {
				userId: nonExistentUserId,
			},
		});

		expect(userTagsResult.errors).toBeUndefined();
		expect(userTagsResult.data?.userTags).toEqual([]);
	});

	test("results in error when regular user queries another user's tags", async () => {
		// Step 1: Admin sign-in
		const adminSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		if (adminSignIn.errors || !adminSignIn.data?.signIn?.authenticationToken) {
			console.error("Admin sign-in failed:", adminSignIn.errors);
			return;
		}

		const adminToken = adminSignIn.data.signIn.authenticationToken;

		// Step 2: Create organization
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						addressLine1: "123 Test St",
						city: "New York",
						countryCode: "us",
						description: "Test Description",
					},
				},
			},
		);

		if (orgResult.errors || !orgResult.data?.createOrganization?.id) {
			console.error("Organization creation failed:", orgResult.errors);
			return;
		}

		const organizationId = orgResult.data.createOrganization.id;
		createdResources.organizationIds.push(organizationId);

		// Step 3: Create user A
		const userAResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					password: "password123",
					name: "User A",
					role: "regular",
					isEmailAddressVerified: true,
				},
			},
		});

		// Step 4: Create user B
		const userBResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					password: "password123",
					name: "User B",
					role: "regular",
					isEmailAddressVerified: true,
				},
			},
		});

		if (
			userAResult.errors ||
			userBResult.errors ||
			!userAResult.data?.createUser?.user?.id ||
			!userAResult.data?.createUser?.authenticationToken ||
			!userBResult.data?.createUser?.user?.id
		) {
			console.error("User creation failed", {
				userA: userAResult.errors,
				userB: userBResult.errors,
			});
			return;
		}
		const userAToken = userAResult.data.createUser.authenticationToken;
		const userBId = userBResult.data.createUser.user.id;

		// Step 5: Create tag folder
		const folderResult = await mercuriusClient.mutate(
			Mutation_createTagFolder,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: "Test Tag Folder",
						organizationId,
					},
				},
			},
		);

		if (folderResult.errors || !folderResult.data?.createTagFolder?.id) {
			console.error("Tag folder creation failed:", folderResult.errors);
			return;
		}

		const folderId = folderResult.data.createTagFolder.id;

		// Step 6: Create tag
		const tagResult = await mercuriusClient.mutate(Mutation_createTag, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: "User B Tag",
					organizationId,
					folderId,
				},
			},
		});

		if (tagResult.errors || !tagResult.data?.createTag?.id) {
			console.error("Tag creation failed:", tagResult.errors);
			return;
		}

		const tagId = tagResult.data.createTag.id;
		createdResources.tagIds.push(tagId);

		// Step 7: Assign tag to user B
		await mercuriusClient.mutate(Mutation_assignUserTag, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				tagId,
				assigneeId: userBId,
			},
		});

		// Step 8: User A queries User B's tags
		const result = await mercuriusClient.query(Query_userTags, {
			headers: {
				authorization: `bearer ${userAToken}`,
			},
			variables: {
				userId: userBId,
			},
		});

		// Assert per resolver contract: auth error OR empty result
		// Assert authorization error
		expect(result.data?.userTags).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action_on_arguments_associated_resources",
					}),
					message: expect.any(String),
					path: ["userTags"],
				}),
			]),
		);
	});

	test("results in error when unauthenticated user queries tags", async () => {
		const result = await mercuriusClient.query(Query_userTags, {
			variables: {
				userId: faker.string.uuid(),
			},
		});

		expect(result.data).toEqual({ userTags: null });
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["userTags"],
				}),
			]),
		);
	});
});
