import { initGraphQLTada } from "gql.tada";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import "~/src/graphql/types/Tag/assignees";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { tagAssignmentsTable } from "~/src/drizzle/tables/tagAssignments";
import { tagsTable } from "~/src/drizzle/tables/tags";
import { usersTable } from "~/src/drizzle/tables/users";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_signIn } from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Query_tag_assignees = gql(`
  query TagAssignees($id: String!, $after: String) {
    tag(input: { id: $id }) {
      id
      assignees(first: 10, after: $after) {
        edges {
          cursor
          node {
            id
            name
          }
        }
      }
    }
  }
`);

describe("GraphQL: Tag Assignees Ghost Cursor", () => {
	let adminToken = "";
	let tagId = "";
	let userId = "";
	let ghostUserId = "";
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
				name: `Test Org ${Date.now()}`,
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
				emailAddress: `user-${Date.now()}@test.com`,
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

		// Create a ghost user via DB
		const [ghostUser] = await server.drizzleClient
			.insert(usersTable)
			.values({
				emailAddress: `ghost-${Date.now()}@test.com`,
				name: "Ghost User",
				passwordHash: "hash123",
				role: "USER",
				isEmailAddressVerified: true,
			})
			.returning();

		if (!ghostUser) {
			throw new Error("Failed to create ghost user");
		}
		ghostUserId = ghostUser.id;

		// Create tag via DB
		const [tag] = await server.drizzleClient
			.insert(tagsTable)
			.values({
				name: `Test Tag ${Date.now()}`,
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

	it("should throw 'arguments_associated_resources_not_found' for ghost cursor", async () => {
		// Step 1: Get a valid cursor from the real assignment
		const validResult = await mercuriusClient.query(Query_tag_assignees, {
			variables: { id: tagId },
			headers: { authorization: `Bearer ${adminToken}` },
		});

		expect(validResult.errors).toBeUndefined();
		const validCursor = validResult.data?.tag?.assignees?.edges?.[0]?.cursor;

		if (!validCursor) {
			throw new Error("Failed to fetch initial valid cursor");
		}

		// Step 2: Decode the cursor to understand its structure
		const cursorData = JSON.parse(
			Buffer.from(validCursor, "base64url").toString("utf-8"),
		);

		// Step 3: Create a ghost cursor with the ghost user ID
		// The ghost user exists in the DB but is NOT assigned to this tag
		const ghostCursorData = {
			...cursorData,
			assigneeId: ghostUserId,
		};

		const ghostCursor = Buffer.from(JSON.stringify(ghostCursorData)).toString(
			"base64url",
		);

		// Step 4: Query with ghost cursor - should fail because the cursor
		// references an assignment that doesn't exist
		const ghostResult = await mercuriusClient.query(Query_tag_assignees, {
			variables: {
				id: tagId,
				after: ghostCursor,
			},
			headers: { authorization: `Bearer ${adminToken}` },
		});

		// Step 5: Verify the error matches the expected code
		expect(ghostResult.errors).toBeDefined();
		// Fixed: Used optional chaining instead of non-null assertion
		expect(ghostResult.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});
});
