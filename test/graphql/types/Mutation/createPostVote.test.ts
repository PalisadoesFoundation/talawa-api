import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createPost,
	Mutation_createPostVote,
	Query_signIn,
} from "../documentNodes";

// ---- sign in once ----
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

suite("Mutation createPostVote", () => {
	//// 1. Unauthenticated: should throw unauthenticated error.
	suite("when the user is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_createPostVote, {
				variables: {
					input: {
						postId: faker.string.uuid(),
						type: "up_vote",
					},
				},
			});
			expect(result.data?.createPostVote).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						path: ["createPostVote"],
					}),
				]),
			);
		});
	});
	//// 2. Authenticated but invalid arguments: should throw invalid_arguments error.
	suite("when invalid arguments are provided", () => {
		test("should return invalid_arguments error", async () => {
			const result = await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						postId: "",
						type: "up_vote",
					},
				},
			});

			expect(result.data?.createPostVote).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						path: ["createPostVote"],
					}),
				]),
			);
		});
	});

	//// 3. Authenticated but post does not exist: should throw arguments_associated_resources_not_found error.
	suite("when the specified post does not exist", () => {
		test("should return arguments_associated_resources_not_found error", async () => {
			const result = await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						postId: faker.string.uuid(), // valid but not in DB
						type: "up_vote",
					},
				},
			});

			expect(result.data?.createPostVote).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["createPostVote"],
					}),
				]),
			);
		});
	});

	//// 4. Authenticated and valid arguments but user has already voted on the post: should throw forbidden_action_on_arguments_associated_resources error.
	suite("when the user has already voted on the post", () => {
		test("should return forbidden_action_on_arguments_associated_resources error", async () => {
			const orgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `org-${faker.string.uuid()}`,
							countryCode: "id",
							isUserRegistrationRequired: false,
						},
					},
				},
			);

			expect(orgResult.errors).toBeUndefined();
			expect(orgResult.data?.createOrganization).toBeDefined();

			expect(orgResult.errors).toBeUndefined();

if (!orgResult.data?.createOrganization) {
  throw new Error("Expected organization to be created");
}

const organizationId = orgResult.data.createOrganization.id

			//Create post
			const postResult = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: "Test post",
						organizationId,
					},
				},
			});

			expect(postResult.data?.createPost).toBeDefined();
			if (!postResult.data?.createPost) {
  throw new Error("Expected post to be created");
}

const postId = postResult.data.createPost.id;


			//First vote (valid)
			const firstVote = await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						postId,
						type: "up_vote",
					},
				},
			});

			expect(firstVote.data?.createPostVote).toBeDefined();

			//Second vote (should fail)
			const result = await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						postId,
						type: "up_vote",
					},
				},
			});

			expect(result.data?.createPostVote).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
						}),
						path: ["createPostVote"],
					}),
				]),
			);
		});
	});

	/// 5. Authenticated and valid arguments: should create post vote successfully.
	suite("when the user is an administrator", () => {
		test("should allow voting without organization membership", async () => {
			//Create organization
			const orgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `admin-org-${faker.string.uuid()}`,
							countryCode: "id",
							isUserRegistrationRequired: false,
						},
					},
				},
			);

			expect(orgResult.errors).toBeUndefined();
			expect(orgResult.data?.createOrganization).toBeDefined();
		if (!orgResult.data?.createOrganization) {
  throw new Error("Expected organization to be created");
}

const organizationId = orgResult.data.createOrganization.id;


			//Create post
			const postResult = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: "Admin post",
						organizationId,
					},
				},
			});

			expect(postResult.errors).toBeUndefined();
			expect(postResult.data?.createPost).toBeDefined();
			if (!postResult.data?.createPost) {
  throw new Error("Expected post to be created");
}

const postId = postResult.data.createPost.id;


			//Admin votes
			const voteResult = await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						postId,
						type: "up_vote",
					},
				},
			});

			//Assert success
			expect(voteResult.errors).toBeUndefined();
			expect(voteResult.data?.createPostVote).toBeDefined();
		if (!voteResult.data?.createPostVote) {
  throw new Error("Expected post vote to be created");
}

expect(voteResult.data.createPostVote.id).toBe(postId);

		});
	});
});