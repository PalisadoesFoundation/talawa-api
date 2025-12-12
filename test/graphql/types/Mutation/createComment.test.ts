import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
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

suite("Mutation field createComment", () => {
	test("should create comment and return escaped body", async () => {
		// Create an organization
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminToken}` },
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
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Create a post
		const postResult = await mercuriusClient.mutate(Mutation_createPost, {
			variables: {
				input: {
					caption: faker.lorem.sentence(),
					organizationId: orgId,
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});
		const postId = postResult.data?.createPost?.id;
		assertToBeNonNullish(postId);

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
				Authorization: `Bearer ${adminToken}`,
			},
		});
		const createdComment = commentResult.data?.createComment;
		assertToBeNonNullish(createdComment);

		expect(createdComment.body).toBe(
			"&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
		);
	});

	test("should return error if comment body exceeds length limit", async () => {
		// Create an organization
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminToken}` },
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
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Create a post
		const postResult = await mercuriusClient.mutate(Mutation_createPost, {
			variables: {
				input: {
					caption: faker.lorem.sentence(),
					organizationId: orgId,
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});
		const postId = postResult.data?.createPost?.id;
		assertToBeNonNullish(postId);

		// Create comment with long body
		const longBody = "a".repeat(2001);
		const commentResult = await mercuriusClient.mutate(Mutation_createComment, {
			variables: {
				input: {
					postId,
					body: longBody,
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});

		expect(commentResult.data?.createComment).toBeNull();
		expect(commentResult.errors).toBeDefined();
		const issues = (
			commentResult.errors?.[0]
				?.extensions as unknown as InvalidArgumentsExtensions
		)?.issues;
		const issueMessages = issues?.map((i) => i.message).join(" ");
		expect(issueMessages).toContain(
			"Comment body must not exceed 2000 characters",
		);
	});
});
