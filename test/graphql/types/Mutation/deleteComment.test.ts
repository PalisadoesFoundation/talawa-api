import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createComment,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_createUser,
	Mutation_deleteComment,
	Mutation_signUp,
	Query_signIn,
} from "../documentNodes";

/* ---------- sign in once (administrator) ---------- */

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});

assertToBeNonNullish(signInResult.data?.signIn);
const adminToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(adminToken);

/* -------------------------------------------------- */

suite("Mutation deleteComment", () => {
	//// 1. Unauthenticated
	suite("when the user is not authenticated", () => {
		test("should return unauthenticated error", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteComment, {
				variables: {
					input: { id: faker.string.uuid() },
				},
			});

			expect(result.data?.deleteComment).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						path: ["deleteComment"],
					}),
				]),
			);
		});
	});

	//// 2. Invalid arguments
	suite("when invalid arguments are provided", () => {
		test("should return invalid_arguments error", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteComment, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { id: "not-a-valid-uuid" },
				},
			});

			expect(result.data?.deleteComment).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						path: ["deleteComment"],
					}),
				]),
			);
		});
	});

	//// 3. Comment not found
	suite("when the comment does not exist", () => {
		test("should return arguments_associated_resources_not_found error", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteComment, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { id: faker.string.uuid() },
				},
			});

			expect(result.data?.deleteComment).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["deleteComment"],
					}),
				]),
			);
		});
	});

	//// 4. Unauthorized user
	suite("when the user is not admin, org admin, or creator", () => {
		test("should return unauthorized_action_on_arguments_associated_resources", async () => {
			const user = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${adminToken}` },
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
			const userToken = user.data.createUser.authenticationToken;
			assertToBeNonNullish(userToken);

			const org = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: faker.company.name(),
						countryCode: "in",
					},
				},
			});

			assertToBeNonNullish(org.data?.createOrganization);
			const organizationId = org.data.createOrganization.id;

			const post = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId,
						caption: faker.lorem.sentence(),
						body: faker.lorem.paragraph(),
					},
				},
			});

			assertToBeNonNullish(post.data?.createPost);
			const postId = post.data.createPost.id;

			const comment = await mercuriusClient.mutate(Mutation_createComment, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						postId,
						body: faker.lorem.sentence(),
					},
				},
			});

			assertToBeNonNullish(comment.data?.createComment);
			const commentId = comment.data.createComment.id;

			const result = await mercuriusClient.mutate(Mutation_deleteComment, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: { id: commentId },
				},
			});

			expect(result.data?.deleteComment).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["deleteComment"],
					}),
				]),
			);
		});
	});

	//// 5. Creator deletes own comment
	suite("when the creator deletes their own comment", () => {
		test("should successfully delete the comment", async () => {
			const org = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: faker.company.name(),
						countryCode: "in",
					},
				},
			});

			assertToBeNonNullish(org.data?.createOrganization);
			const organizationId = org.data.createOrganization.id;

			const post = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId,
						caption: faker.lorem.sentence(),
						body: faker.lorem.paragraph(),
					},
				},
			});

			assertToBeNonNullish(post.data?.createPost);
			const postId = post.data.createPost.id;

			const comment = await mercuriusClient.mutate(Mutation_createComment, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						postId,
						body: faker.lorem.sentence(),
					},
				},
			});

			assertToBeNonNullish(comment.data?.createComment);
			const commentId = comment.data.createComment.id;

			const result = await mercuriusClient.mutate(Mutation_deleteComment, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { id: commentId },
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.deleteComment);
			expect(result.data.deleteComment.id).toBe(commentId);
		});
	});

	//// 6. Organization administrator deletes comment
	suite("when the user is an organization administrator", () => {
		test("should successfully delete the comment", async () => {
			const user = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${adminToken}` },
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
			const userId = user.data.createUser.user.id;
			const userToken = user.data.createUser.authenticationToken;

			const org = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: faker.company.name(),
						countryCode: "in",
					},
				},
			});

			assertToBeNonNullish(org.data?.createOrganization);
			const organizationId = org.data.createOrganization.id;

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId,
						memberId: userId,
						role: "administrator",
					},
				},
			});

			const post = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId,
						caption: faker.lorem.sentence(),
						body: faker.lorem.paragraph(),
					},
				},
			});

			assertToBeNonNullish(post.data?.createPost);
			const postId = post.data.createPost.id;

			const comment = await mercuriusClient.mutate(Mutation_createComment, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						postId,
						body: faker.lorem.sentence(),
					},
				},
			});

			assertToBeNonNullish(comment.data?.createComment);
			const commentId = comment.data.createComment.id;

			const result = await mercuriusClient.mutate(Mutation_deleteComment, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: { id: commentId },
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.deleteComment);
			expect(result.data.deleteComment.id).toBe(commentId);
		});
	});

	//// 7. System administrator deletes another user's comment
	//// 7. System administrator deletes someone else's comment
	suite("when a system administrator deletes someone else's comment", () => {
		test("should successfully delete the comment", async () => {
			/* ---------- admin creates organization ---------- */
			const org = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: faker.company.name(),
						countryCode: "in",
						isUserRegistrationRequired: false,
					},
				},
			});

			expect(org.errors).toBeUndefined();
			assertToBeNonNullish(org.data?.createOrganization);
			const organizationId = org.data.createOrganization.id;

			/* ---------- regular user signs up ---------- */
			const signUp = await mercuriusClient.mutate(Mutation_signUp, {
				variables: {
					input: {
						emailAddress: faker.internet.email(),
						password: faker.internet.password(),
						name: faker.person.fullName(),
						selectedOrganization: organizationId, // ✅ REQUIRED
					},
				},
			});

			expect(signUp.errors).toBeUndefined();
			assertToBeNonNullish(signUp.data?.signUp);

			const userToken = signUp.data.signUp.authenticationToken;
			assertToBeNonNullish(userToken);

			/* ---------- admin creates post ---------- */
			const post = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId,
						caption: faker.lorem.sentence(),
						body: faker.lorem.paragraph(),
					},
				},
			});

			expect(post.errors).toBeUndefined();
			assertToBeNonNullish(post.data?.createPost);
			const postId = post.data.createPost.id;

			/* ---------- regular user creates comment ---------- */
			const comment = await mercuriusClient.mutate(Mutation_createComment, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						postId,
						body: faker.lorem.sentence(),
					},
				},
			});

			expect(comment.errors).toBeUndefined();
			assertToBeNonNullish(comment.data?.createComment);
			const commentId = comment.data.createComment.id;

			/* ---------- SYSTEM ADMIN deletes comment ---------- */
			const result = await mercuriusClient.mutate(Mutation_deleteComment, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { id: commentId },
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.deleteComment);
			expect(result.data.deleteComment.id).toBe(commentId);
		});
	});
});
