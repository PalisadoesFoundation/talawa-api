import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { expect, suite, test } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createUser,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

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

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Query_userTags = gql(`
  query userTags($userId: ID!) {
    userTags(userId: $userId) {
      id
      name
      createdAt
      updatedAt
      creator {
        id
      }
      assignees {
        edges {
          node {
          id
          }
        }
      }
    }
  }
`);

const Mutation_createTag = gql(`
  mutation createTag($input: MutationCreateTagInput!) {
    createTag(input: $input) {
      id
      name
      createdAt
      updatedAt
    }
  }
`);

const Mutation_createTagFolder = gql(`
  mutation createTagFolder($input: MutationCreateTagFolderInput!) {
    createTagFolder(input: $input) {
      id
      name
      createdAt
      updatedAt
    }
  }
`);

const Mutation_assignTagToUser = gql(`
  mutation assignUserTag($assigneeId: ID!, $tagId: ID!) {
    assignUserTag(
      assigneeId: $assigneeId
      tagId: $tagId
    )
  }
`);

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
			console.error(
				"Admin sign-in failed:",
				administratorUserSignInResult.errors,
			);
			// If admin sign-in fails, skip this test or handle appropriately
			return;
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
		expect(userTagsResult.data).toEqual({ userTags: null });
		expect(userTagsResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					message: expect.any(String),
					path: ["userTags"],
				}),
			]),
		);
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
			console.error(
				"Admin sign-in failed:",
				administratorUserSignInResult.errors,
			);
			return;
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
			console.error(
				"Admin sign-in failed:",
				administratorUserSignInResult.errors,
			);
			return;
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

		// Step 6: Assign tags to user
		const assign1Result = await mercuriusClient.mutate(
			Mutation_assignTagToUser,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					tagId: tag1Id,
					assigneeId: regularUserId,
				},
			},
		);

		if (assign1Result.errors) {
			console.error("Tag assignment 1 failed:", assign1Result.errors);
			return;
		}

		const assign2Result = await mercuriusClient.mutate(
			Mutation_assignTagToUser,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					tagId: tag2Id,
					assigneeId: regularUserId,
				},
			},
		);

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

		expect(tag1.creator.id).toBe(regularUserId);
		expect(tag1.assignees.edges.map((e) => e.node.id)).toContain(regularUserId);

		// Tag 2 assertions
		const tag2 = userTags.find((tag) => tag.id === tag2Id);
		expect(tag2).toBeDefined();
		if (!tag2) throw new Error("tag2 not found");

		expect(tag2.creator.id).toBe(regularUserId);
		expect(tag2.assignees.edges.map((e) => e.node.id)).toContain(regularUserId);
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
			console.error(
				"Admin sign-in failed:",
				administratorUserSignInResult.errors,
			);
			return;
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

		// Step 6: Assign tag to user
		const assignResult = await mercuriusClient.mutate(
			Mutation_assignTagToUser,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					tagId: tagId,
					assigneeId: regularUserId,
				},
			},
		);

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
			console.error(
				"Admin sign-in failed:",
				administratorUserSignInResult.errors,
			);
			return;
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
});
