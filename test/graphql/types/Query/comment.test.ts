import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { expect, suite, test } from "vitest";
import { usersTable } from "~/src/drizzle/tables/users";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createComment,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_createUser,
	Query_comment,
	Query_signIn,
} from "../documentNodes";
import "~/src/graphql/schema";

// Helper function to get admin auth token
async function getAdminAuthToken(): Promise<string> {
	const adminSignInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);
	return adminSignInResult.data.signIn.authenticationToken;
}

// Helper function types
interface TestUser {
	authToken: string;
	userId: string;
	name: string | null;
}

// Helper functions

async function createRegularUser(): Promise<TestUser> {
	const adminAuthToken = await getAdminAuthToken();

	const userResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				emailAddress: `email${faker.string.uuid()}@test.com`,
				password: "password123",
				role: "regular",
				name: "Test User",
				isEmailAddressVerified: false,
			},
		},
	});

	assertToBeNonNullish(userResult.data?.createUser?.authenticationToken);
	assertToBeNonNullish(userResult.data?.createUser?.user?.id);

	return {
		authToken: userResult.data.createUser.authenticationToken,
		userId: userResult.data.createUser.user.id,
		name: userResult.data.createUser.user.name,
	};
}

// Setup helper: creates org -> post -> comment chain
async function createFullCommentChain(): Promise<{
	orgId: string;
	postId: string;
	commentId: string;
	commentBody: string;
}> {
	const adminAuthToken = await getAdminAuthToken();

	// Create organization
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: `Org ${faker.string.uuid()}`,
					description: "Test organization",
					countryCode: "us",
					state: "CA",
					city: "San Francisco",
					postalCode: "94101",
					addressLine1: "123 Test St",
				},
			},
		},
	);

	assertToBeNonNullish(createOrgResult.data?.createOrganization?.id);
	const orgId = createOrgResult.data.createOrganization.id;

	// Create post
	const createPostResult = await mercuriusClient.mutate(Mutation_createPost, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				caption: "Test post",
				organizationId: orgId,
			},
		},
	});

	assertToBeNonNullish(createPostResult.data?.createPost?.id);
	const postId = createPostResult.data.createPost.id;

	// Create comment
	const commentBody = `Test comment ${faker.string.uuid()}`;
	const createCommentResult = await mercuriusClient.mutate(
		Mutation_createComment,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					postId: postId,
					body: commentBody,
				},
			},
		},
	);

	assertToBeNonNullish(createCommentResult.data?.createComment?.id);
	const commentId = createCommentResult.data.createComment.id;

	return {
		orgId,
		postId,
		commentId,
		commentBody,
	};
}

async function addUserToOrg(userId: string, orgId: string): Promise<void> {
	const adminAuthToken = await getAdminAuthToken();

	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				memberId: userId,
				organizationId: orgId,
				role: "regular",
			},
		},
	});
}

suite("Query field comment", () => {
	suite("results in a graphql error", () => {
		test("with 'unauthenticated' extensions code if client is not authenticated", async () => {
			const commentResult = await mercuriusClient.query(Query_comment, {
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(commentResult.data.comment).toEqual(null);
			expect(commentResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["comment"],
					}),
				]),
			);
		});

		test("with 'unauthenticated' extensions code if authenticated user doesn't exist in database", async () => {
			const regularUserResult = await createRegularUser();

			// Delete user directly from database so their token becomes stale
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUserResult.userId));

			const commentResult = await mercuriusClient.query(Query_comment, {
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(commentResult.data.comment).toEqual(null);
			expect(commentResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["comment"],
					}),
				]),
			);
		});

		test("with 'invalid_arguments' extensions code if input.id is not a valid UUID", async () => {
			const adminAuthToken = await getAdminAuthToken();

			const commentResult = await mercuriusClient.query(Query_comment, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: "not-a-valid-uuid",
					},
				},
			});

			expect(commentResult.data.comment).toEqual(null);
			expect(commentResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidArgumentsExtensions>({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
									message: expect.any(String),
								}),
							]),
						}),
						message: expect.any(String),
						path: ["comment"],
					}),
				]),
			);
		});

		test("with 'arguments_associated_resources_not_found' extensions code if comment does not exist", async () => {
			const adminAuthToken = await getAdminAuthToken();

			const commentResult = await mercuriusClient.query(Query_comment, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(commentResult.data.comment).toEqual(null);
			expect(commentResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
								{
									code: "arguments_associated_resources_not_found",
									issues: [
										{
											argumentPath: ["input", "id"],
										},
									],
								},
							),
						message: expect.any(String),
						path: ["comment"],
					}),
				]),
			);
		});

		test("with 'unauthorized_action_on_arguments_associated_resources' if non-admin user is not a member of the organization", async () => {
			const regularUserResult = await createRegularUser();
			const { commentId } = await createFullCommentChain();

			const commentResult = await mercuriusClient.query(Query_comment, {
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						id: commentId,
					},
				},
			});

			expect(commentResult.data.comment).toEqual(null);
			expect(commentResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
								{
									code: "unauthorized_action_on_arguments_associated_resources",
									issues: [
										{
											argumentPath: ["input", "id"],
										},
									],
								},
							),
						message: expect.any(String),
						path: ["comment"],
					}),
				]),
			);
		});
	});

	test("returns comment data if user is an admin", async () => {
		const adminAuthToken = await getAdminAuthToken();
		const { commentId, commentBody, postId } = await createFullCommentChain();

		const commentResult = await mercuriusClient.query(Query_comment, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					id: commentId,
				},
			},
		});

		expect(commentResult.errors).toBeUndefined();
		const comment = commentResult.data.comment;
		expect(comment).toBeDefined();
		expect(comment?.id).toBe(commentId);
		expect(comment?.body).toBe(commentBody);
		expect(comment?.post?.id).toBe(postId);
	});

	test("returns comment data if user is organization member", async () => {
		const regularUserResult = await createRegularUser();
		const { commentId, commentBody, orgId } = await createFullCommentChain();

		await addUserToOrg(regularUserResult.userId, orgId);

		const commentResult = await mercuriusClient.query(Query_comment, {
			headers: {
				authorization: `bearer ${regularUserResult.authToken}`,
			},
			variables: {
				input: {
					id: commentId,
				},
			},
		});

		expect(commentResult.errors).toBeUndefined();
		const comment = commentResult.data.comment;
		expect(comment).toBeDefined();
		expect(comment?.id).toBe(commentId);
		expect(comment?.body).toBe(commentBody);
	});
});
