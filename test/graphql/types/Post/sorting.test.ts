import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { initGraphQLTada } from "gql.tada";
import {
	organizationsTable,
	postAttachmentsTable,
	postsTable,
	usersTable,
} from "src/drizzle/schema";
import { beforeEach, expect, suite, test } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_signIn } from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Query_postsByOrganization = gql(`
  query Query_postsByOrganization($input: GetPostsByOrgInput!) {
    postsByOrganization(input: $input) {
      id
      caption
      createdAt
      attachments {
        id
        name
        mimeType
      }
    }
  }
`);

suite("Query field postsByOrganization - sorting", () => {
	let adminUserId: string;

	beforeEach(async () => {
		const [existingAdmin] = await server.drizzleClient
			.select({ id: usersTable.id })
			.from(usersTable)
			.where(
				eq(
					usersTable.emailAddress,
					server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				),
			)
			.limit(1);
		if (existingAdmin) {
			adminUserId = existingAdmin.id;
			return;
		}
		const [newAdmin] = await server.drizzleClient
			.insert(usersTable)
			.values({
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				passwordHash: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				role: "administrator",
				name: server.envConfig.API_ADMINISTRATOR_USER_NAME,
				isEmailAddressVerified: true,
			})
			.onConflictDoNothing()
			.returning({ id: usersTable.id });
		if (!newAdmin) throw new Error("Failed to create admin user");
		adminUserId = newAdmin.id;
	});

	const getAuthToken = async () => {
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		if (!signInResult.data?.signIn?.authenticationToken) {
			throw new Error(
				"Failed to get authentication token: Sign-in operation failed",
			);
		}
		return signInResult.data.signIn?.authenticationToken;
	};

	const createTestOrganization = async () => {
		const [organizationRow] = await server.drizzleClient
			.insert(organizationsTable)
			.values({
				name: `Test Org ${faker.string.uuid()}`,
				countryCode: "us",
			})
			.returning({ id: organizationsTable.id });

		if (!organizationRow?.id) throw new Error("Failed to create organization");
		return organizationRow.id;
	};

	const createTestPost = async (
		organizationId: string,
		creatorId: string,
		createdAt?: Date,
	) => {
		const values: {
			caption: string;
			creatorId: string;
			organizationId: string;
			createdAt?: Date;
		} = {
			caption: faker.lorem.paragraph(),
			creatorId,
			organizationId,
		};

		if (createdAt) {
			values.createdAt = createdAt;
		}

		const [postRow] = await server.drizzleClient
			.insert(postsTable)
			.values(values)
			.returning({ id: postsTable.id, createdAt: postsTable.createdAt });

		if (!postRow?.id) throw new Error("Failed to create post");
		return postRow;
	};

	const createTestAttachment = async (postId: string) => {
		const [attachmentRow] = await server.drizzleClient
			.insert(postAttachmentsTable)
			.values({
				postId,
				name: `attachment-${faker.string.uuid()}.jpg`,
				mimeType: "image/jpeg",
				fileHash: faker.string.uuid(),
				objectName: `obj-${faker.string.uuid()}`,
			})
			.returning({ id: postAttachmentsTable.id });

		if (!attachmentRow?.id) throw new Error("Failed to create attachment");
		return attachmentRow.id;
	};

	test("should throw unauthenticated error when user is not authenticated", async () => {
		const organizationId = await createTestOrganization();

		const result = await mercuriusClient.query(Query_postsByOrganization, {
			variables: {
				input: {
					organizationId,
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors).toHaveLength(1);
		const error = result.errors?.[0] as unknown as TalawaGraphQLFormattedError;
		expect(error?.extensions?.code).toBe("unauthenticated");
	});

	test("should return posts in ascending order when sortOrder is ASC", async () => {
		const authToken = await getAuthToken();
		const organizationId = await createTestOrganization();

		// Create posts with specific timestamps (3 days apart)
		const now = Date.now();
		const post1 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now - 86400000 * 2), // 2 days ago
		);
		const post2 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now - 86400000 * 1), // 1 day ago
		);
		const post3 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now), // now
		);

		const result = await mercuriusClient.query(Query_postsByOrganization, {
			headers: {
				authorization: `Bearer ${authToken}`,
			},
			variables: {
				input: {
					organizationId,
					sortOrder: "ASC",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.postsByOrganization).toBeDefined();
		expect(result.data?.postsByOrganization).toHaveLength(3);

		// Verify ascending order (oldest first)
		const posts = result.data?.postsByOrganization;
		expect(posts).toBeDefined();
		expect(posts?.[0]?.id).toBe(post1.id);
		expect(posts?.[1]?.id).toBe(post2.id);
		expect(posts?.[2]?.id).toBe(post3.id);

		// Verify timestamps are in ascending order
		const timestamp1 = new Date(posts?.[0]?.createdAt ?? 0).getTime();
		const timestamp2 = new Date(posts?.[1]?.createdAt ?? 0).getTime();
		const timestamp3 = new Date(posts?.[2]?.createdAt ?? 0).getTime();
		expect(timestamp1).toBeLessThan(timestamp2);
		expect(timestamp2).toBeLessThan(timestamp3);
	});

	test("should return posts in descending order when sortOrder is DESC", async () => {
		const authToken = await getAuthToken();
		const organizationId = await createTestOrganization();

		// Create posts with specific timestamps
		const now = Date.now();
		const post1 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now - 86400000 * 2), // 2 days ago
		);
		const post2 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now - 86400000 * 1), // 1 day ago
		);
		const post3 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now), // now
		);

		const result = await mercuriusClient.query(Query_postsByOrganization, {
			headers: {
				authorization: `Bearer ${authToken}`,
			},
			variables: {
				input: {
					organizationId,
					sortOrder: "DESC",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.postsByOrganization).toBeDefined();
		expect(result.data?.postsByOrganization).toHaveLength(3);

		// Verify descending order (newest first)
		const posts = result.data?.postsByOrganization;
		expect(posts).toBeDefined();
		expect(posts?.[0]?.id).toBe(post3.id);
		expect(posts?.[1]?.id).toBe(post2.id);
		expect(posts?.[2]?.id).toBe(post1.id);

		// Verify timestamps are in descending order
		const timestamp1 = new Date(posts?.[0]?.createdAt ?? 0).getTime();
		const timestamp2 = new Date(posts?.[1]?.createdAt ?? 0).getTime();
		const timestamp3 = new Date(posts?.[2]?.createdAt ?? 0).getTime();
		expect(timestamp1).toBeGreaterThan(timestamp2);
		expect(timestamp2).toBeGreaterThan(timestamp3);
	});

	test("should default to descending order when sortOrder is undefined", async () => {
		const authToken = await getAuthToken();
		const organizationId = await createTestOrganization();

		// Create posts with specific timestamps
		const now = Date.now();
		const post1 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now - 86400000 * 2),
		);
		const post2 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now - 86400000 * 1),
		);
		const post3 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now),
		);

		const result = await mercuriusClient.query(Query_postsByOrganization, {
			headers: {
				authorization: `Bearer ${authToken}`,
			},
			variables: {
				input: {
					organizationId,
					// sortOrder is intentionally omitted
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.postsByOrganization).toBeDefined();

		// Should be in descending order (newest first) by default
		const posts = result.data?.postsByOrganization;
		expect(posts).toBeDefined();
		if (!posts) throw new Error("Posts should be defined");
		expect(posts[0]?.id).toBe(post3.id);
		expect(posts[1]?.id).toBe(post2.id);
		expect(posts[2]?.id).toBe(post1.id);
	});

	test("should default to descending order when sortOrder is null", async () => {
		const authToken = await getAuthToken();
		const organizationId = await createTestOrganization();

		const now = Date.now();
		const post1 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now - 86400000 * 2),
		);
		const post2 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now - 86400000 * 1),
		);
		const post3 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now),
		);

		const result = await mercuriusClient.query(Query_postsByOrganization, {
			headers: {
				authorization: `Bearer ${authToken}`,
			},
			variables: {
				input: {
					organizationId,
					sortOrder: null,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.postsByOrganization).toBeDefined();

		// Should be in descending order by default
		const posts = result.data?.postsByOrganization;
		expect(posts).toBeDefined();
		if (!posts) throw new Error("Posts should be defined");
		expect(posts[0]?.id).toBe(post3.id);
		expect(posts[1]?.id).toBe(post2.id);
		expect(posts[2]?.id).toBe(post1.id);
	});

	test("should default to descending order for invalid sortOrder values", async () => {
		const authToken = await getAuthToken();
		const organizationId = await createTestOrganization();

		const now = Date.now();
		const post1 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now - 86400000 * 2),
		);
		const post2 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now - 86400000 * 1),
		);
		const post3 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now),
		);

		const result = await mercuriusClient.query(Query_postsByOrganization, {
			headers: {
				authorization: `Bearer ${authToken}`,
			},
			variables: {
				input: {
					organizationId,
					sortOrder: "INVALID",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.postsByOrganization).toBeDefined();

		// Should still work and default to descending order
		const posts = result.data?.postsByOrganization;
		expect(posts).toBeDefined();
		if (!posts) throw new Error("Posts should be defined");
		expect(posts[0]?.id).toBe(post3.id);
		expect(posts[1]?.id).toBe(post2.id);
		expect(posts[2]?.id).toBe(post1.id);
	});

	test("should default to descending order for empty string sortOrder", async () => {
		const authToken = await getAuthToken();
		const organizationId = await createTestOrganization();

		const now = Date.now();
		const post1 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now - 86400000 * 2),
		);
		const post2 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now - 86400000 * 1),
		);
		const post3 = await createTestPost(
			organizationId,
			adminUserId,
			new Date(now),
		);

		const result = await mercuriusClient.query(Query_postsByOrganization, {
			headers: {
				authorization: `Bearer ${authToken}`,
			},
			variables: {
				input: {
					organizationId,
					sortOrder: "",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.postsByOrganization).toBeDefined();

		// Should default to descending order
		const posts = result.data?.postsByOrganization;
		expect(posts).toBeDefined();
		if (!posts) throw new Error("Posts should be defined");
		expect(posts[0]?.id).toBe(post3.id);
		expect(posts[1]?.id).toBe(post2.id);
		expect(posts[2]?.id).toBe(post1.id);
	});

	test("should return empty array for organization with no posts", async () => {
		const authToken = await getAuthToken();
		const organizationId = await createTestOrganization();

		const result = await mercuriusClient.query(Query_postsByOrganization, {
			headers: {
				authorization: `Bearer ${authToken}`,
			},
			variables: {
				input: {
					organizationId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.postsByOrganization).toBeDefined();
		expect(result.data?.postsByOrganization).toEqual([]);
	});

	test("should return posts without attachments when posts have no attachments", async () => {
		const authToken = await getAuthToken();
		const organizationId = await createTestOrganization();

		await createTestPost(organizationId, adminUserId);
		await createTestPost(organizationId, adminUserId);

		const result = await mercuriusClient.query(Query_postsByOrganization, {
			headers: {
				authorization: `Bearer ${authToken}`,
			},
			variables: {
				input: {
					organizationId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.postsByOrganization).toBeDefined();
		expect(result.data?.postsByOrganization).toHaveLength(2);

		// All posts should have empty attachment arrays
		const posts = result.data?.postsByOrganization;
		expect(posts).toBeDefined();
		if (!posts) throw new Error("Posts should be defined");
		expect(posts[0]?.attachments).toEqual([]);
		expect(posts[1]?.attachments).toEqual([]);
	});

	test("should correctly associate attachments with their posts", async () => {
		const authToken = await getAuthToken();
		const organizationId = await createTestOrganization();

		// Create posts
		const post1 = await createTestPost(organizationId, adminUserId);
		const post2 = await createTestPost(organizationId, adminUserId);
		const post3 = await createTestPost(organizationId, adminUserId);

		// Add attachments to specific posts
		const attachment1ForPost1 = await createTestAttachment(post1.id);
		const attachment2ForPost1 = await createTestAttachment(post1.id);
		const attachment1ForPost3 = await createTestAttachment(post3.id);
		// post2 has no attachments

		const result = await mercuriusClient.query(Query_postsByOrganization, {
			headers: {
				authorization: `Bearer ${authToken}`,
			},
			variables: {
				input: {
					organizationId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.postsByOrganization).toBeDefined();
		expect(result.data?.postsByOrganization).toHaveLength(3);

		const posts = result.data?.postsByOrganization;
		expect(posts).toBeDefined();
		if (!posts) throw new Error("Posts should be defined");

		// Find each post by id
		const resultPost1 = posts.find((p) => p?.id === post1.id);
		const resultPost2 = posts.find((p) => p?.id === post2.id);
		const resultPost3 = posts.find((p) => p?.id === post3.id);

		// Verify post1 has 2 attachments
		expect(resultPost1?.attachments).toHaveLength(2);
		const post1AttachmentIds = resultPost1?.attachments?.map((a) => a?.id);
		expect(post1AttachmentIds).toContain(attachment1ForPost1);
		expect(post1AttachmentIds).toContain(attachment2ForPost1);

		// Verify post2 has no attachments
		expect(resultPost2?.attachments).toEqual([]);

		// Verify post3 has 1 attachment
		expect(resultPost3?.attachments).toHaveLength(1);
		expect(resultPost3?.attachments?.[0]?.id).toBe(attachment1ForPost3);
	});

	test("should handle mixed scenario with multiple posts and attachments", async () => {
		const authToken = await getAuthToken();
		const organizationId = await createTestOrganization();

		// Create posts with varying attachment counts
		const post1 = await createTestPost(organizationId, adminUserId); // 3 attachments
		const post2 = await createTestPost(organizationId, adminUserId); // 0 attachments
		const post3 = await createTestPost(organizationId, adminUserId); // 1 attachment
		const post4 = await createTestPost(organizationId, adminUserId); // 2 attachments

		// Add attachments
		await createTestAttachment(post1.id);
		await createTestAttachment(post1.id);
		await createTestAttachment(post1.id);

		await createTestAttachment(post3.id);

		await createTestAttachment(post4.id);
		await createTestAttachment(post4.id);

		const result = await mercuriusClient.query(Query_postsByOrganization, {
			headers: {
				authorization: `Bearer ${authToken}`,
			},
			variables: {
				input: {
					organizationId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.postsByOrganization).toBeDefined();
		expect(result.data?.postsByOrganization).toHaveLength(4);

		const posts = result.data?.postsByOrganization;
		expect(posts).toBeDefined();
		if (!posts) throw new Error("Posts should be defined");

		// Verify attachment counts
		const resultPost1 = posts.find((p) => p?.id === post1.id);
		const resultPost2 = posts.find((p) => p?.id === post2.id);
		const resultPost3 = posts.find((p) => p?.id === post3.id);
		const resultPost4 = posts.find((p) => p?.id === post4.id);

		expect(resultPost1?.attachments).toHaveLength(3);
		expect(resultPost2?.attachments).toHaveLength(0);
		expect(resultPost3?.attachments).toHaveLength(1);
		expect(resultPost4?.attachments).toHaveLength(2);
	});

	test("should work correctly with concurrent queries for different organizations", async () => {
		const authToken = await getAuthToken();

		// Create two separate organizations
		const org1Id = await createTestOrganization();
		const org2Id = await createTestOrganization();

		// Create posts for org1
		const org1Post1 = await createTestPost(org1Id, adminUserId);
		const org1Post2 = await createTestPost(org1Id, adminUserId);

		// Create posts for org2
		const org2Post1 = await createTestPost(org2Id, adminUserId);
		const org2Post2 = await createTestPost(org2Id, adminUserId);
		const org2Post3 = await createTestPost(org2Id, adminUserId);

		// Query both organizations concurrently
		const [result1, result2] = await Promise.all([
			mercuriusClient.query(Query_postsByOrganization, {
				headers: {
					authorization: `Bearer ${authToken}`,
				},
				variables: {
					input: {
						organizationId: org1Id,
					},
				},
			}),
			mercuriusClient.query(Query_postsByOrganization, {
				headers: {
					authorization: `Bearer ${authToken}`,
				},
				variables: {
					input: {
						organizationId: org2Id,
					},
				},
			}),
		]);

		// Verify org1 results
		expect(result1.errors).toBeUndefined();
		expect(result1.data?.postsByOrganization).toHaveLength(2);
		const org1Posts = result1.data?.postsByOrganization;
		expect(org1Posts).toBeDefined();
		const org1PostIds = org1Posts?.map((p) => p?.id);
		expect(org1PostIds).toContain(org1Post1.id);
		expect(org1PostIds).toContain(org1Post2.id);
		expect(org1PostIds).not.toContain(org2Post1.id);

		// Verify org2 results
		expect(result2.errors).toBeUndefined();
		expect(result2.data?.postsByOrganization).toHaveLength(3);
		const org2Posts = result2.data?.postsByOrganization;
		expect(org2Posts).toBeDefined();
		const org2PostIds = org2Posts?.map((p) => p?.id);
		expect(org2PostIds).toContain(org2Post1.id);
		expect(org2PostIds).toContain(org2Post2.id);
		expect(org2PostIds).toContain(org2Post3.id);
		expect(org2PostIds).not.toContain(org1Post1.id);
	});

	test("should return posts with all requested fields populated", async () => {
		const authToken = await getAuthToken();
		const organizationId = await createTestOrganization();

		const post = await createTestPost(organizationId, adminUserId);
		const attachmentId = await createTestAttachment(post.id);

		const result = await mercuriusClient.query(Query_postsByOrganization, {
			headers: {
				authorization: `Bearer ${authToken}`,
			},
			variables: {
				input: {
					organizationId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.postsByOrganization).toBeDefined();
		expect(result.data?.postsByOrganization).toHaveLength(1);

		const returnedPost = result.data?.postsByOrganization?.[0];
		expect(returnedPost).toBeDefined();

		// Verify all fields are populated
		expect(returnedPost?.id).toBeDefined();
		expect(returnedPost?.caption).toBeDefined();
		expect(returnedPost?.createdAt).toBeDefined();
		expect(returnedPost?.attachments).toBeDefined();
		expect(returnedPost?.attachments).toHaveLength(1);

		const attachment = returnedPost?.attachments?.[0];
		expect(attachment?.id).toBe(attachmentId);
		expect(attachment?.name).toBeDefined();
		expect(attachment?.mimeType).toBe("image/jpeg");
	});

	test("should handle posts with identical timestamps", async () => {
		const authToken = await getAuthToken();
		const organizationId = await createTestOrganization();

		// Create posts with the same timestamp
		const sameTime = new Date();
		const post1 = await createTestPost(organizationId, adminUserId, sameTime);
		const post2 = await createTestPost(organizationId, adminUserId, sameTime);
		const post3 = await createTestPost(organizationId, adminUserId, sameTime);

		const result = await mercuriusClient.query(Query_postsByOrganization, {
			headers: {
				authorization: `Bearer ${authToken}`,
			},
			variables: {
				input: {
					organizationId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.postsByOrganization).toBeDefined();
		expect(result.data?.postsByOrganization).toHaveLength(3);

		// Should return all posts even with identical timestamps
		const posts = result.data?.postsByOrganization;
		expect(posts).toBeDefined();
		const postIds = posts?.map((p) => p?.id);
		expect(postIds).toContain(post1.id);
		expect(postIds).toContain(post2.id);
		expect(postIds).toContain(post3.id);
	});
});
