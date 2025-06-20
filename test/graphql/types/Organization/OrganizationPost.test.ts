import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_deleteUser,
	Query_organizationPosts,
	Query_signIn,
} from "../documentNodes";

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});

const adminToken = signInResult.data?.signIn?.authenticationToken ?? null;
assertToBeNonNullish(adminToken);

async function createOrganizationWithPosts(
	authToken: string,
	postCount = 3,
	withPinnedPost = false,
) {
	// Create organization
	const orgName = `Test Org ${faker.string.uuid()}`;
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: orgName,
					description: "Test organization for post queries",
					countryCode: "us",
				},
			},
		},
	);

	const orgId = createOrgResult.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);

	const postIds = [];
	for (let i = 0; i < postCount; i++) {
		const isPinned = withPinnedPost && i === 0;
		const caption: string = `Test post ${i + 1} for organization ${orgId}`;

		const createPostResult = await mercuriusClient.mutate(Mutation_createPost, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					caption,
					organizationId: orgId,
					isPinned,
					attachments: [
						{
							mimetype: "IMAGE_PNG" as const,
							objectName: `test-object-${i}`,
							name: `test-image-${i}.png`,
							fileHash: `test-hash-${i}`,
						},
					],
				},
			},
		});
		const postId: string = createPostResult.data?.createPost?.id ?? "";
		assertToBeNonNullish(postId);
		postIds.push(postId);
	}

	return { orgId, postIds };
}

suite("Organization.Orgposts field", () => {
	suite("when user is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const { orgId } = await createOrganizationWithPosts(adminToken);

			const result = await mercuriusClient.query(Query_organizationPosts, {
				variables: {
					orgId,
					first: 10,
				},
			});

			expect(result.data?.organization?.Orgposts ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: expect.arrayContaining(["organization", "Orgposts"]),
					}),
				]),
			);
		});
	});

	suite("when user is not a member of the organization", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources", async () => {
			const { orgId } = await createOrganizationWithPosts(adminToken);

			// Create regular user
			const { authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserToken);

			const result = await mercuriusClient.query(Query_organizationPosts, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					orgId,
					first: 10,
				},
			});

			expect(result.data?.organization?.Orgposts ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: expect.arrayContaining(["organization", "Orgposts"]),
					}),
				]),
			);
		});
	});

	suite("when user is an administrator", () => {
		test("should return organization posts even if not a member", async () => {
			const { orgId } = await createOrganizationWithPosts(adminToken);

			const result = await mercuriusClient.query(Query_organizationPosts, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					orgId,
					first: 10,
				},
			});

			expect(result.data?.organization?.id).toBe(orgId);

			const posts = result.data?.organization?.Orgposts;
			assertToBeNonNullish(posts);
			expect(posts).toHaveLength(3);
			expect(posts[0]?.attachments).toHaveLength(1);
			expect(posts[0]?.creator).toBeDefined();
		});
	});

	suite("when user is a member of the organization", () => {
		test("should return organization posts", async () => {
			const { orgId } = await createOrganizationWithPosts(adminToken);

			const { authToken: regularUserToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserToken);
			assertToBeNonNullish(userId);

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId,
						role: "regular",
					},
				},
			});

			const result = await mercuriusClient.query(Query_organizationPosts, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					orgId,
					first: 10,
				},
			});

			expect(result.data?.organization?.id).toBe(orgId);
			expect(result.data?.organization?.Orgposts).toHaveLength(3);
		});
	});

	suite("when filtering by caption_contains", () => {
		test("should return only posts with matching captions", async () => {
			const { orgId } = await createOrganizationWithPosts(adminToken);

			const uniqueCaption = "UNIQUE_SEARCH_STRING";
			await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						caption: uniqueCaption,
						organizationId: orgId,
						attachments: [
							{
								mimetype: "IMAGE_PNG",
								objectName: "test-object-name-77",
								name: "test-image.png-77",
								fileHash: "test-file-hash-77",
							},
						],
					},
				},
			});
			const result = await mercuriusClient.query(Query_organizationPosts, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					orgId,
					first: 10,
					where: {
						caption_contains: "UNIQUE_SEARCH",
					},
				},
			});

			expect(result.data?.organization?.Orgposts).toHaveLength(1);

			const posts = result.data?.organization?.Orgposts;
			assertToBeNonNullish(posts);
			expect(posts[0]?.caption).toBe(uniqueCaption);
		});
	});

	suite("when filtering by creatorId", () => {
		test("should return only posts created by specified user", async () => {
			const { orgId } = await createOrganizationWithPosts(adminToken);

			// Create regular user
			const { authToken: regularUserToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserToken);
			assertToBeNonNullish(userId);

			// Add the user to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId,
						role: "regular",
					},
				},
			});

			// Create post as regular user
			const userPostCaption = "Post by regular user";
			await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					input: {
						caption: userPostCaption,
						organizationId: orgId,
						attachments: [
							{
								mimetype: "IMAGE_PNG",
								objectName: "test-object-name-79",
								name: "test-image.png-79",
								fileHash: "test-file-hash-79",
							},
						],
					},
				},
			});

			// Filter by regular user's ID
			const result = await mercuriusClient.query(Query_organizationPosts, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					orgId,
					first: 10,
					where: {
						creatorId: userId,
					},
				},
			});

			expect(result.data?.organization?.Orgposts).toHaveLength(1);

			const posts = result.data?.organization?.Orgposts;
			assertToBeNonNullish(posts);
			const post = posts[0];
			assertToBeNonNullish(post);
			expect(post.caption).toBe(userPostCaption);
			expect(post.creator?.id).toBe(userId);
		});
	});

	suite("when filtering by isPinned", () => {
		test("should return only pinned posts when isPinned is true", async () => {
			const { orgId } = await createOrganizationWithPosts(adminToken, 3, true);

			const result = await mercuriusClient.query(Query_organizationPosts, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					orgId,
					first: 10,
					where: {
						isPinned: true,
					},
				},
			});

			expect(result.data?.organization?.Orgposts).toHaveLength(2);

			const posts = result.data?.organization?.Orgposts;
			assertToBeNonNullish(posts);
		});

		test("should return only unpinned posts when isPinned is false", async () => {
			const { orgId } = await createOrganizationWithPosts(adminToken, 3, true);

			const result = await mercuriusClient.query(Query_organizationPosts, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					orgId,
					first: 10,
					where: {
						isPinned: false,
					},
				},
			});

			expect(result.data?.organization?.Orgposts).toHaveLength(2);
			const posts = result.data?.organization?.Orgposts;
			assertToBeNonNullish(posts);
			for (const post of posts) {
				expect(post.pinnedAt).toBeNull();
			}
		});
	});

	suite("when the authenticated user no longer exists in the database", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const { orgId } = await createOrganizationWithPosts(adminToken);

			const { authToken: userToDeleteToken, userId: userToDeleteId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToDeleteToken);
			assertToBeNonNullish(userToDeleteId);

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userToDeleteId,
						role: "regular",
					},
				},
			});

			const preDeleteResult = await mercuriusClient.query(
				Query_organizationPosts,
				{
					headers: { authorization: `bearer ${userToDeleteToken}` },
					variables: {
						orgId,
						first: 10,
					},
				},
			);
			expect(preDeleteResult.data?.organization?.Orgposts).toHaveLength(3);

			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: userToDeleteId,
					},
				},
			});

			const postDeleteResult = await mercuriusClient.query(
				Query_organizationPosts,
				{
					headers: { authorization: `bearer ${userToDeleteToken}` },
					variables: {
						orgId,
						first: 10,
					},
				},
			);

			expect(postDeleteResult.data?.organization?.Orgposts ?? null).toBeNull();
			expect(postDeleteResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						path: expect.arrayContaining(["organization", "Orgposts"]),
					}),
				]),
			);
		});
	});

	suite("when testing pagination", () => {
		test("should respect skip and first parameters", async () => {
			const { orgId } = await createOrganizationWithPosts(adminToken, 5);

			const firstBatch = await mercuriusClient.query(Query_organizationPosts, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					orgId,
					first: 2,
					skip: 0,
				},
			});

			expect(firstBatch.data?.organization?.Orgposts).toHaveLength(2);

			const secondBatch = await mercuriusClient.query(Query_organizationPosts, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					orgId,
					first: 2,
					skip: 2,
				},
			});

			expect(secondBatch.data?.organization?.Orgposts).toHaveLength(2);

			const firstIds =
				firstBatch.data?.organization?.Orgposts?.map((p) => p.id) || [];
			const secondIds =
				secondBatch.data?.organization?.Orgposts?.map((p) => p.id) || [];

			expect(firstIds).not.toEqual(secondIds);
			expect(firstIds).not.toContain(secondIds[0]);
			expect(firstIds).not.toContain(secondIds[1]);
		});
	});

	suite("when providing invalid arguments", () => {
		test("should return an error with invalid_arguments extensions code", async () => {
			const { orgId } = await createOrganizationWithPosts(adminToken);

			const result = await mercuriusClient.query(Query_organizationPosts, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					orgId,
					skip: -1,
					first: 10,
				},
			});

			expect(result.data?.organization?.Orgposts ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.any(Array),
								}),
							]),
						}),
						path: expect.arrayContaining(["organization", "Orgposts"]),
					}),
				]),
			);
		});
	});

	suite("when checking transformation of attachments", () => {
		test("should correctly transform attachmentsWherePost to attachments", async () => {
			const { orgId } = await createOrganizationWithPosts(adminToken, 1);

			const result = await mercuriusClient.query(Query_organizationPosts, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					orgId,
					first: 1,
				},
			});

			const posts = result.data?.organization?.Orgposts;
			assertToBeNonNullish(posts);
			const post = posts[0];
			assertToBeNonNullish(post);
			const attachments = post.attachments;
			assertToBeNonNullish(attachments);
			expect(attachments).toHaveLength(1);
			expect(attachments[0]).toMatchObject({
				id: expect.any(String),
				mimeType: expect.stringMatching(
					/^(image\/(png|jpeg|avif|webp)|video\/(mp4|webm))$/,
				),
				name: expect.stringMatching(/^test-image-\d+\.png$/),
				objectName: expect.stringMatching(/^test-object-\d+$/),
				fileHash: expect.stringMatching(/^test-hash-\d+$/),
			});
		});
	});
});
