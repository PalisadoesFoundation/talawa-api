import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { commentsTable, postsTable } from "~/src/drizzle/schema";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Query_comment,
	Query_signIn,
} from "../documentNodes";

async function createTestOrganization(): Promise<string> {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	expect(signInResult.errors ?? []).toEqual([]);

	const adminToken = signInResult.data?.signIn?.authenticationToken;
	expect(adminToken).toBeDefined();

	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: {
				authorization: `bearer ${adminToken}`,
			},
			variables: {
				input: {
					name: `TestOrg-${Date.now()}`,
					countryCode: "us",
					isUserRegistrationRequired: true,
				},
			},
		},
	);

	expect(createOrgResult.errors ?? []).toEqual([]);

	const orgId = createOrgResult.data?.createOrganization?.id;
	expect(orgId).toBeDefined();

	return orgId as string;
}

suite("comment query", () => {
	test("returns unauthenticated errors when user is not logged in", async () => {
		const result = await mercuriusClient.query(Query_comment, {
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(result.data?.comment ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
					path: ["comment"],
				}),
			]),
		);
	});

	test("returns invalid_arguments for malformed id input", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.query(Query_comment, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					id: "",
				},
			},
		});

		expect(result.data?.comment ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					path: ["comment"],
				}),
			]),
		);
	});

	test("returns resource not found error when comment does not exist", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.query(Query_comment, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(result.data?.comment ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
					path: ["comment"],
				}),
			]),
		);
	});

	test("returns unauthorized error when user is not a member of the comment's organization", async () => {
		const creator = await createRegularUserUsingAdmin();
		const outsider = await createRegularUserUsingAdmin();

		const orgId = await createTestOrganization();
		const postId = faker.string.uuid();
		const commentId = faker.string.uuid();

		// Creator is a regular member of the org.
		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: creator.userId,
			organizationId: orgId,
			role: "regular",
		});

		await server.drizzleClient.insert(postsTable).values({
			id: postId,
			organizationId: orgId,
			caption: "Test post",
			body: "Test body",
			creatorId: creator.userId,
		});

		await server.drizzleClient.insert(commentsTable).values({
			id: commentId,
			postId,
			body: "Test comment",
			creatorId: creator.userId,
		});

		const result = await mercuriusClient.query(Query_comment, {
			headers: {
				authorization: `bearer ${outsider.authToken}`,
			},
			variables: {
				input: {
					id: commentId,
				},
			},
		});

		expect(result.data?.comment ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action_on_arguments_associated_resources",
					}),
					path: ["comment"],
				}),
			]),
		);
	});

	test("returns comment when user is a member of the comment's organization", async () => {
		const creator = await createRegularUserUsingAdmin();
		const member = await createRegularUserUsingAdmin();

		const orgId = await createTestOrganization();
		const postId = faker.string.uuid();
		const commentId = faker.string.uuid();

		await server.drizzleClient.insert(organizationMembershipsTable).values([
			{
				memberId: creator.userId,
				organizationId: orgId,
				role: "regular",
			},
			{
				memberId: member.userId,
				organizationId: orgId,
				role: "regular",
			},
		]);

		await server.drizzleClient.insert(postsTable).values({
			id: postId,
			organizationId: orgId,
			caption: "Test post",
			body: "Test body",
			creatorId: creator.userId,
		});

		await server.drizzleClient.insert(commentsTable).values({
			id: commentId,
			postId,
			body: "Member can read",
			creatorId: creator.userId,
		});

		const result = await mercuriusClient.query(Query_comment, {
			headers: {
				authorization: `bearer ${member.authToken}`,
			},
			variables: {
				input: {
					id: commentId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.comment?.id).toBe(commentId);
		expect(result.data?.comment?.body).toBe("Member can read");
	});
});
