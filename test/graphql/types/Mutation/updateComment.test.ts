import { initGraphQLTada } from "gql.tada";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { COMMENT_BODY_MAX_LENGTH } from "~/src/drizzle/tables/comments";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import type { InvalidArgumentsExtensions } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createComment,
	Mutation_createOrganization,
	Mutation_createPost,
	Mutation_createUser,
	Mutation_deleteOrganization,
	Mutation_signUp,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

// Initialize gql for typed GraphQL documents
const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// Inline document node to avoid Codecov/patch failures on shared test artifacts
const Mutation_updateComment = gql(`
	mutation Mutation_updateComment($input: MutationUpdateCommentInput!) {
		updateComment(input: $input) {
			id
			body
		}
	}
`);

suite("Mutation field updateComment", () => {
	let adminToken: string;
	let orgId: string;
	let postId: string;
	let commentId: string;

	beforeAll(async () => {
		// Sign in to get admin token
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		if (signInResult.errors?.length) {
			throw new Error(`signIn failed: ${JSON.stringify(signInResult.errors)}`);
		}
		const token = signInResult.data?.signIn?.authenticationToken ?? null;
		assertToBeNonNullish(token);
		// Verify token is a non-empty string (not just non-nullish)
		if (typeof token !== "string" || token.trim() === "") {
			throw new Error("signIn returned empty or invalid authenticationToken");
		}
		adminToken = token;

		// Create a shared organization for tests
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { Authorization: `Bearer ${adminToken}` },
				variables: {
					input: {
						name: "Test Organization Alpha",
						description: "A test organization for update comment tests",
						countryCode: "jm",
						state: "St Andrew",
						city: "Kingston",
						postalCode: "12345",
						addressLine1: "123 Test Street",
					},
				},
			},
		);
		if (createOrgResult.errors?.length) {
			throw new Error(
				`createOrganization failed: ${JSON.stringify(createOrgResult.errors)}`,
			);
		}
		const createdOrgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(createdOrgId);
		orgId = createdOrgId;

		// Create a shared post for tests
		const postResult = await mercuriusClient.mutate(Mutation_createPost, {
			variables: {
				input: {
					caption: "Test post for update comment tests",
					organizationId: orgId,
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});
		if (postResult.errors?.length) {
			throw new Error(
				`createPost failed: ${JSON.stringify(postResult.errors)}`,
			);
		}
		const createdPostId = postResult.data?.createPost?.id;
		assertToBeNonNullish(createdPostId);
		postId = createdPostId;

		// Create a shared comment for tests
		const commentResult = await mercuriusClient.mutate(Mutation_createComment, {
			variables: {
				input: {
					postId,
					body: "Original body for update tests",
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});
		if (commentResult.errors?.length) {
			throw new Error(
				`createComment failed: ${JSON.stringify(commentResult.errors)}`,
			);
		}
		const createdCommentId = commentResult.data?.createComment?.id;
		assertToBeNonNullish(createdCommentId);
		commentId = createdCommentId;
	});

	// Cleanup created resources in reverse order
	afterAll(async () => {
		// Deleting the organization cascades to delete posts and comments
		if (orgId && adminToken) {
			const deleteOrgResult = await mercuriusClient.mutate(
				Mutation_deleteOrganization,
				{
					headers: { Authorization: `Bearer ${adminToken}` },
					variables: {
						input: { id: orgId },
					},
				},
			);
			if (deleteOrgResult.errors?.length) {
				throw new Error(
					`deleteOrganization cleanup failed: ${JSON.stringify(deleteOrgResult.errors)}`,
				);
			}
		}
	});

	test("should update comment and return escaped body", async () => {
		// Update comment with HTML
		const htmlBody = "<script>alert('xss')</script>";
		const updateResult = await mercuriusClient.mutate(Mutation_updateComment, {
			variables: {
				input: {
					id: commentId,
					body: htmlBody,
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});
		if (updateResult.errors?.length) {
			throw new Error(
				`updateComment failed: ${JSON.stringify(updateResult.errors)}`,
			);
		}

		const updatedComment = updateResult.data?.updateComment;
		assertToBeNonNullish(updatedComment);

		// The API returns the body via the resolver, which calls escapeHTML.
		// Verify the content is properly escaped using flexible assertions.
		const body = updatedComment.body;

		// Check that angle brackets are escaped
		expect(body).toContain("&lt;script&gt;");
		expect(body).toContain("&lt;/script&gt;");

		// Check that raw HTML is not present
		expect(body).not.toContain("<script>");
		expect(body).not.toContain("</script>");

		// Check that quotes are escaped (accepts both &#39; and &apos;)
		expect(body).toMatch(/&#39;|&apos;/);
	});

	test("should allow regular organization member to update their own comment", async () => {
		const { faker } = await import("@faker-js/faker");

		// Create a regular user and add them to the organization via signUp
		const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
			variables: {
				input: {
					emailAddress: faker.internet.email(),
					password: faker.internet.password(),
					name: faker.person.fullName(),
					selectedOrganization: orgId,
				},
			},
		});

		assertToBeNonNullish(signUpResult.data?.signUp);
		const memberToken = signUpResult.data.signUp.authenticationToken;
		assertToBeNonNullish(memberToken);

		// Create a comment as this member
		const commentResult = await mercuriusClient.mutate(Mutation_createComment, {
			headers: { Authorization: `Bearer ${memberToken}` },
			variables: {
				input: {
					postId: postId,
					body: "Member's original comment",
				},
			},
		});

		assertToBeNonNullish(commentResult.data?.createComment);
		const memberCommentId = commentResult.data.createComment.id;

		// Update their own comment (should succeed)
		const updateResult = await mercuriusClient.mutate(Mutation_updateComment, {
			headers: { Authorization: `Bearer ${memberToken}` },
			variables: {
				input: {
					id: memberCommentId,
					body: "Member's updated comment",
				},
			},
		});

		if (updateResult.errors?.length) {
			throw new Error(
				`updateComment failed: ${JSON.stringify(updateResult.errors)}`,
			);
		}

		const updatedComment = updateResult.data?.updateComment;
		assertToBeNonNullish(updatedComment);
		expect(updatedComment.id).toBe(memberCommentId);
		expect(updatedComment.body).toContain("updated comment");
	});

	test("should return error if comment body exceeds length limit", async () => {
		// Update comment with long body (exceeds COMMENT_BODY_MAX_LENGTH)
		const longBody = "a".repeat(COMMENT_BODY_MAX_LENGTH + 1);
		const updateResult = await mercuriusClient.mutate(Mutation_updateComment, {
			variables: {
				input: {
					id: commentId,
					body: longBody,
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});

		// Handle both { data: null, errors: [...] } and { data: { updateComment: null }, errors: [...] }
		expect(
			updateResult.data === null || updateResult.data?.updateComment === null,
		).toBe(true);

		// Ensure errors is a defined non-empty array
		expect(updateResult.errors).toBeDefined();
		expect(Array.isArray(updateResult.errors)).toBe(true);
		expect(updateResult.errors?.length).toBeGreaterThan(0);

		// Find the error with the expected extension code (robust to error ordering)
		const validationError = updateResult.errors?.find(
			(error) =>
				(error.extensions as { code?: string } | undefined)?.code ===
				"invalid_arguments",
		);
		assertToBeNonNullish(validationError);

		// Safely access extensions with proper type narrowing
		assertToBeNonNullish(validationError.extensions);
		const ext = validationError.extensions as InvalidArgumentsExtensions;

		// Ensure issues is a non-empty array
		expect(ext.issues).toBeDefined();
		expect(Array.isArray(ext.issues)).toBe(true);
		expect(ext.issues.length).toBeGreaterThan(0);

		const issueMessages = ext.issues.map((i) => i.message).join(" ");
		// Use simple assertions for message matching (avoid dynamic RegExp)
		expect(issueMessages).toContain("Too big");
		expect(issueMessages).toContain(String(COMMENT_BODY_MAX_LENGTH));
	});

	test("should trim before length validation", async () => {
		// Create a body that's valid after trimming but exceeds limit before trimming
		const expectedTrimmed = "a".repeat(COMMENT_BODY_MAX_LENGTH);
		const paddedBody = `   ${expectedTrimmed}   `;
		const updateResult = await mercuriusClient.mutate(Mutation_updateComment, {
			variables: {
				input: {
					id: commentId,
					body: paddedBody,
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});

		// Should succeed because trimming happens first
		if (updateResult.errors?.length) {
			throw new Error(
				`updateComment failed: ${JSON.stringify(updateResult.errors)}`,
			);
		}
		const updatedComment = updateResult.data?.updateComment;
		assertToBeNonNullish(updatedComment);
		assertToBeNonNullish(updatedComment.body);
		// Verify exact trimmed content is preserved (not truncated or altered)
		expect(updatedComment.body.length).toBe(COMMENT_BODY_MAX_LENGTH);
		expect(updatedComment.body).toBe(expectedTrimmed);
	});

	test("should return unauthenticated error when no auth token is provided", async () => {
		const updateResult = await mercuriusClient.mutate(Mutation_updateComment, {
			variables: {
				input: {
					id: commentId,
					body: "Updated body without auth",
				},
			},
		});

		expect(
			updateResult.data === null || updateResult.data?.updateComment === null,
		).toBe(true);
		expect(updateResult.errors).toBeDefined();
		expect(Array.isArray(updateResult.errors)).toBe(true);
		expect(updateResult.errors?.length).toBeGreaterThan(0);

		const authError = updateResult.errors?.find(
			(error) =>
				(error.extensions as { code?: string } | undefined)?.code ===
				"unauthenticated",
		);
		assertToBeNonNullish(authError);
		expect(authError.path).toEqual(["updateComment"]);
	});

	test("should return invalid_arguments error when comment ID is not a valid UUID", async () => {
		const updateResult = await mercuriusClient.mutate(Mutation_updateComment, {
			variables: {
				input: {
					id: "not-a-valid-uuid",
					body: "Updated body",
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});

		expect(
			updateResult.data === null || updateResult.data?.updateComment === null,
		).toBe(true);
		expect(updateResult.errors).toBeDefined();
		expect(Array.isArray(updateResult.errors)).toBe(true);
		expect(updateResult.errors?.length).toBeGreaterThan(0);

		// GraphQL can reject invalid IDs at either the type validation layer or resolver layer
		const hasValidationError = updateResult.errors?.some((error) => {
			const code = (error.extensions as { code?: string } | undefined)?.code;
			const message = error.message || "";
			return (
				code === "invalid_arguments" ||
				message.includes("got invalid value") ||
				message.includes("ID cannot represent") ||
				message.includes("Expected ID")
			);
		});
		expect(hasValidationError).toBe(true);
	});

	test("should return error when comment does not exist", async () => {
		const { faker } = await import("@faker-js/faker");
		const nonExistentCommentId = faker.string.uuid();

		const updateResult = await mercuriusClient.mutate(Mutation_updateComment, {
			variables: {
				input: {
					id: nonExistentCommentId,
					body: "Updated body",
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});

		expect(
			updateResult.data === null || updateResult.data?.updateComment === null,
		).toBe(true);
		expect(updateResult.errors).toBeDefined();
		expect(Array.isArray(updateResult.errors)).toBe(true);
		expect(updateResult.errors?.length).toBeGreaterThan(0);

		const notFoundError = updateResult.errors?.find(
			(error) =>
				(error.extensions as { code?: string } | undefined)?.code ===
				"arguments_associated_resources_not_found",
		);
		assertToBeNonNullish(notFoundError);
		expect(notFoundError.path).toEqual(["updateComment"]);
	});

	test("should return unauthorized error when regular user without org membership tries to update comment", async () => {
		const { faker } = await import("@faker-js/faker");

		// Create a regular user
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { Authorization: `Bearer ${adminToken}` },
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

		assertToBeNonNullish(createUserResult.data?.createUser);
		const userToken = createUserResult.data.createUser.authenticationToken;
		assertToBeNonNullish(userToken);

		// Try to update the comment with this user (who is not a member of the org)
		const updateResult = await mercuriusClient.mutate(Mutation_updateComment, {
			variables: {
				input: {
					id: commentId,
					body: "Unauthorized update attempt",
				},
			},
			headers: {
				Authorization: `Bearer ${userToken}`,
			},
		});

		expect(
			updateResult.data === null || updateResult.data?.updateComment === null,
		).toBe(true);
		expect(updateResult.errors).toBeDefined();
		expect(Array.isArray(updateResult.errors)).toBe(true);
		expect(updateResult.errors?.length).toBeGreaterThan(0);

		const unauthorizedError = updateResult.errors?.find(
			(error) =>
				(error.extensions as { code?: string } | undefined)?.code ===
				"unauthorized_action_on_arguments_associated_resources",
		);
		assertToBeNonNullish(unauthorizedError);
		expect(unauthorizedError.path).toEqual(["updateComment"]);
	});

	test("should return unauthorized error when org member tries to update another user's comment", async () => {
		const { faker } = await import("@faker-js/faker");

		// Create a regular user via signUp (automatically joins the org)
		const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
			variables: {
				input: {
					emailAddress: faker.internet.email(),
					password: faker.internet.password(),
					name: faker.person.fullName(),
					selectedOrganization: orgId,
				},
			},
		});

		assertToBeNonNullish(signUpResult.data?.signUp);
		const userToken = signUpResult.data.signUp.authenticationToken;
		assertToBeNonNullish(userToken);

		// Try to update admin's comment with this user's token (org member but not creator)
		const updateResult = await mercuriusClient.mutate(Mutation_updateComment, {
			variables: {
				input: {
					id: commentId,
					body: "Unauthorized update by org member",
				},
			},
			headers: {
				Authorization: `Bearer ${userToken}`,
			},
		});

		expect(
			updateResult.data === null || updateResult.data?.updateComment === null,
		).toBe(true);
		expect(updateResult.errors).toBeDefined();
		expect(Array.isArray(updateResult.errors)).toBe(true);
		expect(updateResult.errors?.length).toBeGreaterThan(0);

		const unauthorizedError = updateResult.errors?.find(
			(error) =>
				(error.extensions as { code?: string } | undefined)?.code ===
				"unauthorized_action_on_arguments_associated_resources",
		);
		assertToBeNonNullish(unauthorizedError);
		expect(unauthorizedError.path).toEqual(["updateComment"]);
	});

	test("should return unauthenticated error when authenticated user record is deleted", async () => {
		const { faker } = await import("@faker-js/faker");
		const { eq } = await import("drizzle-orm");
		const { usersTable } = await import("../../../../src/drizzle/tables/users");

		// Create a test user
		const testUserEmail = `deleteduser${faker.string.uuid()}@example.com`;
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { Authorization: `Bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: testUserEmail,
					password: "password123",
					role: "regular",
					name: "User To Delete",
					isEmailAddressVerified: true,
				},
			},
		});

		assertToBeNonNullish(createUserResult.data?.createUser);
		const userId = createUserResult.data.createUser.user?.id;
		assertToBeNonNullish(userId);

		// Sign in to get their token
		const userSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: testUserEmail,
					password: "password123",
				},
			},
		});
		const userToken = userSignIn.data?.signIn?.authenticationToken;
		assertToBeNonNullish(userToken);

		// Delete the user from database using server's drizzle client
		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, userId));

		// Try to update comment with deleted user's token
		const updateResult = await mercuriusClient.mutate(Mutation_updateComment, {
			headers: { Authorization: `Bearer ${userToken}` },
			variables: {
				input: {
					id: commentId,
					body: "Update with deleted user",
				},
			},
		});

		expect(
			updateResult.data === null || updateResult.data?.updateComment === null,
		).toBe(true);
		expect(updateResult.errors).toBeDefined();
		expect(Array.isArray(updateResult.errors)).toBe(true);
		expect(updateResult.errors?.length).toBeGreaterThan(0);

		const authError = updateResult.errors?.find(
			(error) =>
				(error.extensions as { code?: string } | undefined)?.code ===
				"unauthenticated",
		);
		assertToBeNonNullish(authError);
		expect(authError.path).toEqual(["updateComment"]);
	});

	test("should return unexpected error when database update operation fails", async () => {
		const { vi } = await import("vitest");

		// Create separate test data for this test
		const { faker } = await import("@faker-js/faker");
		const testOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { Authorization: `Bearer ${adminToken}` },
				variables: {
					input: {
						name: faker.company.name(),
						countryCode: "in",
					},
				},
			},
		);
		assertToBeNonNullish(testOrgResult.data?.createOrganization);
		const testOrgId = testOrgResult.data.createOrganization.id;

		const testPostResult = await mercuriusClient.mutate(Mutation_createPost, {
			headers: { Authorization: `Bearer ${adminToken}` },
			variables: {
				input: {
					organizationId: testOrgId,
					caption: faker.lorem.sentence(),
				},
			},
		});
		assertToBeNonNullish(testPostResult.data?.createPost);
		const testPostId = testPostResult.data.createPost.id;

		const testCommentResult = await mercuriusClient.mutate(
			Mutation_createComment,
			{
				headers: { Authorization: `Bearer ${adminToken}` },
				variables: {
					input: {
						postId: testPostId,
						body: faker.lorem.sentence(),
					},
				},
			},
		);
		assertToBeNonNullish(testCommentResult.data?.createComment);
		const testCommentId = testCommentResult.data.createComment.id;

		// Mock the update method to return empty array
		const originalUpdate = server.drizzleClient.update;
		server.drizzleClient.update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]),
				}),
			}),
		});

		try {
			const updateResult = await mercuriusClient.mutate(
				Mutation_updateComment,
				{
					headers: { Authorization: `Bearer ${adminToken}` },
					variables: {
						input: {
							id: testCommentId,
							body: "This should fail",
						},
					},
				},
			);

			expect(
				updateResult.data === null || updateResult.data?.updateComment === null,
			).toBe(true);
			expect(updateResult.errors).toBeDefined();
			expect(Array.isArray(updateResult.errors)).toBe(true);
			expect(updateResult.errors?.length).toBeGreaterThan(0);

			const unexpectedError = updateResult.errors?.find(
				(error) =>
					(error.extensions as { code?: string } | undefined)?.code ===
					"unexpected",
			);
			assertToBeNonNullish(unexpectedError);
			expect(unexpectedError.path).toEqual(["updateComment"]);
		} finally {
			// Restore original update method
			server.drizzleClient.update = originalUpdate;
		}
	});
});
