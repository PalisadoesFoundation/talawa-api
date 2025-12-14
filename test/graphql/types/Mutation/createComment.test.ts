import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createComment,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_createUser,
	Query_signIn,
} from "../documentNodes";

afterEach(() => {
	vi.clearAllMocks();
});

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

async function createPost(organizationId: string): Promise<string> {
	const result = await mercuriusClient.mutate(Mutation_createPost, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				caption: `Test Post ${faker.string.uuid()}`,
				organizationId: organizationId,
			},
		},
	});
	const postId = result.data?.createPost?.id;
	assertToBeNonNullish(postId);
	return postId;
}

suite("Mutation field createComment", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated code", async () => {
			const result = await mercuriusClient.mutate(Mutation_createComment, {
				variables: {
					input: {
						body: "Test comment",
						postId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.createComment).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
					}),
				]),
			);
		});
	});

	suite("when the arguments are invalid", () => {
		test("should return an error with invalid_arguments code", async () => {
			const result = await mercuriusClient.mutate(Mutation_createComment, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						body: "",
						postId: "invalid-uuid",
					},
				},
			});
			expect(result.data?.createComment).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
					}),
				]),
			);
		});
	});

	suite("when the specified post does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found", async () => {
			const result = await mercuriusClient.mutate(Mutation_createComment, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						body: "Test comment",
						postId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.createComment).toBeNull();
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

	suite("when user is not authorized to comment on organization post", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources", async () => {
			const orgId = await createOrganizationAndGetId();
			const postId = await createPost(orgId);

			// Create new regular user
			const newUserEmail = `testuser${faker.string.uuid()}@example.com`;
			await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						emailAddress: newUserEmail,
						isEmailAddressVerified: true,
						name: "Non Member User",
						password: "password",
						role: "regular",
					},
				},
			});

			const nonMemberSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: newUserEmail,
						password: "password",
					},
				},
			});
			const nonMemberToken = nonMemberSignIn.data?.signIn?.authenticationToken;
			assertToBeNonNullish(nonMemberToken);

			const result = await mercuriusClient.mutate(Mutation_createComment, {
				headers: { authorization: `bearer ${nonMemberToken}` },
				variables: {
					input: {
						body: "Test comment",
						postId: postId,
					},
				},
			});

			expect(result.data?.createComment).toBeNull();
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

	suite("when the database insert operation fails", () => {
		let originalInsert: typeof server.drizzleClient.insert;

		beforeEach(() => {
			originalInsert = server.drizzleClient.insert;
			server.drizzleClient.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]),
				}),
			});
		});

		afterEach(() => {
			server.drizzleClient.insert = originalInsert;
		});

		test("should return an error with unexpected code", async () => {
			const orgId = await createOrganizationAndGetId();
			const postId = await createPost(orgId);

			const result = await mercuriusClient.mutate(Mutation_createComment, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						body: "Test comment",
						postId: postId,
					},
				},
			});

			expect(result.data?.createComment).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unexpected" }),
					}),
				]),
			);
		});
	});

	suite("when comment is created successfully by organization member", () => {
		test("should return a valid comment", async () => {
			const orgId = await createOrganizationAndGetId();

			// Create a user and make them a member
			const newUserEmail = `testuser${faker.string.uuid()}@example.com`;
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							emailAddress: newUserEmail,
							isEmailAddressVerified: true,
							name: "Member User",
							password: "password",
							role: "regular",
						},
					},
				},
			);
			const memberUserId = createUserResult.data?.createUser?.user?.id;
			assertToBeNonNullish(memberUserId);

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: memberUserId,
						role: "regular",
					},
				},
			});

			const memberSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: newUserEmail,
						password: "password",
					},
				},
			});
			const memberToken = memberSignIn.data?.signIn?.authenticationToken;
			assertToBeNonNullish(memberToken);

			const postId = await createPost(orgId);

			const result = await mercuriusClient.mutate(Mutation_createComment, {
				headers: { authorization: `bearer ${memberToken}` },
				variables: {
					input: {
						body: "Great post!",
						postId: postId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createComment).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					body: "Great post!",
				}),
			);
		});
	});

	suite("when comment is created successfully by administrator", () => {
		test("should return a valid comment", async () => {
			const orgId = await createOrganizationAndGetId();
			const postId = await createPost(orgId);

			const result = await mercuriusClient.mutate(Mutation_createComment, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						body: "Admin comment",
						postId: postId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createComment).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					body: "Admin comment",
				}),
			);
		});
	});
});
