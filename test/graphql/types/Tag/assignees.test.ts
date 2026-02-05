import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "~/src/graphql/types/Tag/assignees";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { tagAssignmentsTable } from "~/src/drizzle/tables/tagAssignments";
import { tagsTable } from "~/src/drizzle/tables/tags";
import { usersTable } from "~/src/drizzle/tables/users";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_signIn, Query_tag_assignees } from "../documentNodes";

describe("GraphQL: Tag Assignees Ghost Cursor", () => {
	let adminToken = "";
	let tagId = "";
	let userId = "";
	let orgId = "";
	let adminUserId = "";

	beforeAll(async () => {
		// Sign in as admin to get token
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		if (!signInResult.data?.signIn?.authenticationToken) {
			throw new Error("Failed to get authentication token");
		}
		adminToken = signInResult.data.signIn.authenticationToken;

		// Get admin user ID
		const adminUserResult =
			await server.drizzleClient.query.usersTable.findFirst({
				where: (users, { eq }) =>
					eq(
						users.emailAddress,
						server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					),
				columns: { id: true },
			});

		if (!adminUserResult) {
			throw new Error("Failed to find admin user");
		}
		adminUserId = adminUserResult.id;

		// Create organization via DB
		const [org] = await server.drizzleClient
			.insert(organizationsTable)
			.values({
				name: `Test Org ${faker.string.uuid()}`,
				description: "Test org for ghost cursor test",
			})
			.returning();

		if (!org) {
			throw new Error("Failed to create organization");
		}
		orgId = org.id;

		// Create a regular user via DB
		const [user] = await server.drizzleClient
			.insert(usersTable)
			.values({
				emailAddress: `user-${faker.string.uuid()}@test.com`,
				name: "Test User",
				passwordHash: "hash123",
				role: "USER",
				isEmailAddressVerified: true,
			})
			.returning();

		if (!user) {
			throw new Error("Failed to create user");
		}
		userId = user.id;

		// Add user to org
		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: userId,
			organizationId: orgId,
			role: "ADMIN",
		});

		// Create tag via DB
		const [tag] = await server.drizzleClient
			.insert(tagsTable)
			.values({
				name: `Test Tag ${faker.string.uuid()}`,
				organizationId: orgId,
			})
			.returning();

		if (!tag) {
			throw new Error("Failed to create tag");
		}
		tagId = tag.id;

		// Assign regular user to tag (NOT the ghost user)
		await server.drizzleClient.insert(tagAssignmentsTable).values({
			tagId: tagId,
			assigneeId: userId,
			creatorId: adminUserId,
		});
	});

	afterAll(async () => {
		// Cleanup is handled by test database reset
	});

	it("should throw 'arguments_associated_resources_not_found' for stale cursor", async () => {
		// Step 1: Get a valid cursor from the real assignment
		const validResult = await mercuriusClient.query(Query_tag_assignees, {
			variables: { id: tagId },
			headers: { authorization: `bearer ${adminToken}` },
		});

		expect(validResult.errors).toBeUndefined();
		const validCursor = validResult.data?.tag?.assignees?.edges?.[0]?.cursor;

		if (!validCursor) {
			throw new Error("Failed to fetch initial valid cursor");
		}

		// Step 2: Delete the assignment to make the cursor stale
		// This removes the underlying data that the cursor references
		await server.drizzleClient
			.delete(tagAssignmentsTable)
			.where(
				and(
					eq(tagAssignmentsTable.tagId, tagId),
					eq(tagAssignmentsTable.assigneeId, userId),
				),
			);

		// Step 3: Query with the now-stale cursor - should fail because the cursor
		// references an assignment that no longer exists
		const staleResult = await mercuriusClient.query(Query_tag_assignees, {
			variables: {
				id: tagId,
				after: validCursor,
			},
			headers: { authorization: `bearer ${adminToken}` },
		});

		// Step 4: Verify the error matches the expected code
		expect(staleResult.errors).toEqual(
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
