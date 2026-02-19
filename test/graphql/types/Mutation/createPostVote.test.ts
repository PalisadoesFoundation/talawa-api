import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_createPostVote,
	Mutation_createUser,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);

suite("Mutation createPostVote", () => {
	//// 1. Unauthenticated
	suite("when the user is not authenticated", () => {
		test("should return unauthenticated error", async () => {
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

	//// 2. Invalid arguments
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

	//// 3. Post does not exist
	suite("when the specified post does not exist", () => {
		test("should return arguments_associated_resources_not_found error", async () => {
			const result = await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: { authorization: `bearer ${authToken}` },
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
							code: "arguments_associated_resources_not_found",
						}),
						path: ["createPostVote"],
					}),
				]),
			);
		});
	});

	//// 4. Duplicate voting
	suite("when the user has already voted on the post", () => {
		test("should return forbidden_action_on_arguments_associated_resources error", async () => {
			const org = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `org-${faker.string.uuid()}`,
						countryCode: "id",
						isUserRegistrationRequired: false,
					},
				},
			});
			assertToBeNonNullish(org.data?.createOrganization);

			const organizationId = org.data.createOrganization.id;

			const post = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: "Test post",
						organizationId,
					},
				},
			});
			assertToBeNonNullish(post.data?.createPost);
			const postId = post.data.createPost.id;
			const firstVote = await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						postId,
						type: "up_vote",
					},
				},
			});

			expect(firstVote.errors).toBeUndefined();
			expect(firstVote.data?.createPostVote).toBeDefined();

			const secondVote = await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						postId,
						type: "up_vote",
					},
				},
			});

			expect(secondVote.data?.createPostVote).toBeNull();
			expect(secondVote.errors).toEqual(
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

	//// 5. Administrator voting
	suite("when the user is an administrator", () => {
		test("should successfully create a vote as administrator", async () => {
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
			assertToBeNonNullish(orgResult.data?.createOrganization);

			const organizationId = orgResult.data.createOrganization.id;

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

			assertToBeNonNullish(postResult.data?.createPost);

			const postId = postResult.data.createPost.id;

			const voteResult = await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						postId,
						type: "up_vote",
					},
				},
			});

			expect(voteResult.errors).toBeUndefined();
			assertToBeNonNullish(voteResult.data?.createPostVote);
			expect(voteResult.data.createPostVote.id).toBeDefined();
		});
	});

	//// 6. Non-member unauthorized
	suite("when a regular user is not a member of the organization", () => {
		test("should return unauthorized_action_on_arguments_associated_resources error", async () => {
			const user = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						emailAddress: faker.internet.email(),
						password: faker.internet.password(),
						role: "regular",
						name: faker.person.fullName(),
						isEmailAddressVerified: true,
					},
				},
			});
			assertToBeNonNullish(user.data?.createUser);
			assertToBeNonNullish(user.data.createUser.authenticationToken);
			const userToken = user.data.createUser.authenticationToken;

			const org = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `org-${faker.string.uuid()}`,
						countryCode: "id",
						isUserRegistrationRequired: false,
					},
				},
			});
			assertToBeNonNullish(org.data?.createOrganization);
			const organizationId = org.data.createOrganization.id;
			const post = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: "Org post",
						organizationId,
					},
				},
			});
			assertToBeNonNullish(post.data?.createPost);
			const postId = post.data.createPost.id;
			const vote = await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						postId,
						type: "up_vote",
					},
				},
			});

			expect(vote.data?.createPostVote).toBeNull();
			expect(vote.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["createPostVote"],
					}),
				]),
			);
		});
	});

	//// 7. Regular member success
	suite("when a regular organization member votes", () => {
		test("should successfully create a vote", async () => {
			const user = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						emailAddress: faker.internet.email(),
						password: faker.internet.password(),
						role: "regular",
						name: faker.person.fullName(),
						isEmailAddressVerified: true,
					},
				},
			});
			assertToBeNonNullish(user.data?.createUser);
			assertToBeNonNullish(user.data.createUser.user);
			assertToBeNonNullish(user.data.createUser.authenticationToken);
			const userId = user.data.createUser.user.id;
			const userToken = user.data.createUser.authenticationToken;

			const org = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `org-${faker.string.uuid()}`,
						countryCode: "id",
						isUserRegistrationRequired: false,
					},
				},
			});
			assertToBeNonNullish(org.data?.createOrganization);
			const organizationId = org.data.createOrganization.id;

			const membership = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							organizationId,
							memberId: userId,
							role: "regular",
						},
					},
				},
			);

			expect(membership.errors).toBeUndefined();
			expect(membership.data?.createOrganizationMembership).toBeDefined();

			const post = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: "Member post",
						organizationId,
					},
				},
			});
			assertToBeNonNullish(post.data?.createPost);
			const postId = post.data.createPost.id;
			const vote = await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						postId,
						type: "up_vote",
					},
				},
			});

			expect(vote.errors).toBeUndefined();
			assertToBeNonNullish(vote.data?.createPostVote);
			expect(vote.data.createPostVote.id).toBeDefined();
		});
	});
});
