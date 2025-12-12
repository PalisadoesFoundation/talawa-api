import { faker } from "@faker-js/faker";
import { beforeAll, expect, suite, test } from "vitest";
import type { InvalidArgumentsExtensions } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createComment,
	Mutation_createOrganization,
	Mutation_createPost,
	Query_signIn,
} from "../documentNodes";

suite("Mutation field createComment", () => {
	let adminToken: string;
	let orgId: string;
	let postId: string;

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
		const token = signInResult.data?.signIn?.authenticationToken ?? null;
		assertToBeNonNullish(token);
		adminToken = token;

		// Create a shared organization for tests
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${adminToken}` },
				variables: {
					input: {
						name: faker.company.name(),
						description: faker.lorem.sentence(),
						countryCode: "jm",
						state: "St. Andrew",
						city: "Kingston",
						postalCode: "12345",
						addressLine1: faker.location.streetAddress(),
					},
				},
			},
		);
		const createdOrgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(createdOrgId);
		orgId = createdOrgId;

		// Create a shared post for tests
		const postResult = await mercuriusClient.mutate(Mutation_createPost, {
			variables: {
				input: {
					caption: faker.lorem.sentence(),
					organizationId: orgId,
				},
			},
			headers: {
				authorization: `Bearer ${adminToken}`,
			},
		});
		const createdPostId = postResult.data?.createPost?.id;
		assertToBeNonNullish(createdPostId);
		postId = createdPostId;
	});

	test("should create comment and return escaped body", async () => {
		// Create a comment with HTML
		const htmlBody = "<script>alert('xss')</script>";
		const commentResult = await mercuriusClient.mutate(Mutation_createComment, {
			variables: {
				input: {
					postId,
					body: htmlBody,
				},
			},
			headers: {
				authorization: `Bearer ${adminToken}`,
			},
		});
		const createdComment = commentResult.data?.createComment;
		assertToBeNonNullish(createdComment);

		expect(createdComment.body).toBe(
			"&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
		);
	});

	test("should return error if comment body exceeds length limit", async () => {
		// Create comment with long body
		const longBody = "a".repeat(2049);
		const commentResult = await mercuriusClient.mutate(Mutation_createComment, {
			variables: {
				input: {
					postId,
					body: longBody,
				},
			},
			headers: {
				authorization: `Bearer ${adminToken}`,
			},
		});

		expect(commentResult.data?.createComment).toBeNull();
		expect(commentResult.errors).toBeDefined();

		// Find the error with the expected extension code (robust to error ordering)
		const validationError = commentResult.errors?.find(
			(error) =>
				(error.extensions as { code?: string } | undefined)?.code ===
				"invalid_arguments",
		);
		expect(validationError).toBeDefined();

		const issues = (
			validationError?.extensions as unknown as InvalidArgumentsExtensions
		)?.issues;
		expect(issues).toBeDefined();

		const issueMessages = issues?.map((i) => i.message).join(" ");
		expect(issueMessages).toContain(
			"String must contain at most 2048 character(s)",
		);
	});
});
