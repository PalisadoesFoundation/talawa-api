import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import {
	afterEach,
	beforeAll,
	beforeEach,
	expect,
	suite,
	test,
	vi,
} from "vitest";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { usersTable } from "../../../../src/drizzle/tables/users";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createComment,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_createUser,
	Mutation_deleteComment,
} from "../documentNodes";

suite("Mutation deleteComment", () => {
	let adminToken: string;

	beforeAll(async () => {
		const { accessToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(accessToken);
		adminToken = accessToken;
	});
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

			/* ---------- regular user: createUser + org membership + REST signin ---------- */
			const memberEmail = faker.internet.email();
			const memberPassword = faker.internet.password();
			const createUserRes = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						emailAddress: memberEmail,
						password: memberPassword,
						name: faker.person.fullName(),
						role: "regular",
						isEmailAddressVerified: false,
					},
				},
			});
			const memberId = createUserRes.data?.createUser?.user?.id;
			assertToBeNonNullish(memberId);
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { organizationId, memberId, role: "regular" },
				},
			});
			const signInRes = await server.inject({
				method: "POST",
				url: "/auth/signin",
				payload: { email: memberEmail, password: memberPassword },
			});
			expect(signInRes.statusCode).toBe(200);
			const userToken = signInRes.cookies.find(
				(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
			)?.value;
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
	suite("when authenticated user record is deleted", () => {
		test("should return unauthenticated error", async () => {
			// Create a test user
			const testUserEmail = `deleteduser${faker.string.uuid()}@example.com`;
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							emailAddress: testUserEmail,
							password: "password",
							role: "regular",
							name: "User To Delete",
							isEmailAddressVerified: true,
						},
					},
				},
			);

			assertToBeNonNullish(createUserResult.data?.createUser);
			const userId = createUserResult.data.createUser.user?.id;
			assertToBeNonNullish(userId);

			// Sign in as test user via REST to get their token
			const signInResponse = await server.inject({
				method: "POST",
				url: "/auth/signin",
				payload: { email: testUserEmail, password: "password" },
			});
			if (signInResponse.statusCode !== 200) {
				throw new Error(
					`Failed to sign in test user: ${signInResponse.statusCode} ${signInResponse.body}`,
				);
			}
			const accessCookie = signInResponse.cookies.find(
				(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
			);
			assertToBeNonNullish(accessCookie?.value);
			const userToken = accessCookie.value;

			// Create comment before deleting user
			const org = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { name: faker.company.name(), countryCode: "in" },
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
					input: { postId, body: faker.lorem.sentence() },
				},
			});
			assertToBeNonNullish(comment.data?.createComment);
			const commentId = comment.data.createComment.id;

			// Delete the user from database
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			// Try to delete comment with deleted user's token
			const result = await mercuriusClient.mutate(Mutation_deleteComment, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { input: { id: commentId } },
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
	suite("when the database delete operation fails", () => {
		let originalDelete: typeof server.drizzleClient.delete;
		let commentId: string;

		beforeAll(async () => {
			// Create test data BEFORE mocking (use unique name to avoid collisions)
			const org = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: `Test org ${faker.string.uuid()}`,
						countryCode: "in",
					},
				},
			});
			assertToBeNonNullish(
				org.data?.createOrganization,
				`createOrganization failed: ${JSON.stringify(org.errors ?? null)}`,
			);
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
			assertToBeNonNullish(
				post.data?.createPost,
				`createPost failed: ${JSON.stringify(post.errors ?? null)}`,
			);
			const postId = post.data.createPost.id;

			const comment = await mercuriusClient.mutate(Mutation_createComment, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { postId, body: faker.lorem.sentence() },
				},
			});
			assertToBeNonNullish(
				comment.data?.createComment,
				`createComment failed: ${JSON.stringify(comment.errors ?? null)}`,
			);
			commentId = comment.data.createComment.id;
		});

		beforeEach(() => {
			// Mock delete to return empty array
			originalDelete = server.drizzleClient.delete;
			server.drizzleClient.delete = vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]),
				}),
			});
		});

		afterEach(() => {
			server.drizzleClient.delete = originalDelete;
		});

		test("should return unexpected error", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteComment, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: commentId } },
			});

			expect(result.data?.deleteComment).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unexpected",
						}),
						path: ["deleteComment"],
					}),
				]),
			);
		});
	});
});
