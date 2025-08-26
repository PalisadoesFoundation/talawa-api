import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, expect, suite, test } from "vitest";
import { actionsTable } from "~/src/drizzle/tables/actions";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_signIn,
} from "../documentNodes";

const SUITE_TIMEOUT = 30_000;

// Define the document node for actionItemsByUser query
const Query_actionItemsByUser = `
  query ActionItemsByUser($input: QueryActionItemsByUserInput!) {
    actionItemsByUser(input: $input) {
      id
      preCompletionNotes
      isCompleted
      assignedAt
      completionAt
      postCompletionNotes
      category {
        id
        name
      }
      assignee {
        id
        name
      }
      creator {
        id
        name
      }
      organization {
        id
        name
      }
      event {
        id
        name
      }
      updater {
        id
        name
      }
      createdAt
    }
  }
`;

let globalAuth: { authToken: string; userId: string };

async function globalSignInAndGetToken() {
	const result = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ?? "",
				password: process.env.API_ADMINISTRATOR_USER_PASSWORD ?? "",
			},
		},
	});
	assertToBeNonNullish(result.data?.signIn);
	const authToken = result.data.signIn.authenticationToken;
	assertToBeNonNullish(authToken);
	const userId = result.data.signIn.user?.id;
	assertToBeNonNullish(userId);
	return { authToken, userId };
}

async function createUserAndGetToken(userDetails = {}) {
	const defaultUser = {
		name: faker.person.fullName(),
		emailAddress: faker.internet.email(),
		password: faker.internet.password({ length: 12 }),
		role: "regular" as const,
		isEmailAddressVerified: false,
		workPhoneNumber: null,
		state: null,
		postalCode: null,
		naturalLanguageCode: "en" as const,
		addressLine1: null,
		addressLine2: null,
	};
	const input = { ...defaultUser, ...userDetails };
	const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: { input },
	});
	const authToken = createUserResult.data?.createUser?.authenticationToken;
	assertToBeNonNullish(authToken);
	const userId = createUserResult.data?.createUser?.user?.id;
	assertToBeNonNullish(userId);
	return { authToken, userId };
}

async function createOrganizationAndGetId(authToken: string): Promise<string> {
	const uniqueName = `Test Org ${faker.string.uuid()}`;
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: uniqueName,
				description: "Organization for testing",
				countryCode: "us",
				state: "CA",
				city: "San Francisco",
				postalCode: "94101",
				addressLine1: "123 Market St",
				addressLine2: "Suite 100",
			},
		},
	});
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

async function addMembership(
	organizationId: string,
	memberId: string,
	role: "administrator" | "regular",
) {
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: {
			input: {
				organizationId,
				memberId,
				role,
			},
		},
	});
}

async function createActionItem({
	organizationId,
	creatorId,
	assigneeId = null,
	eventId = null,
	categoryId = null,
	isCompleted = false,
	preCompletionNotes = "Test action item",
	assignedAt = new Date().toISOString(),
}: {
	organizationId: string;
	creatorId: string;
	assigneeId?: string | null;
	eventId?: string | null;
	categoryId?: string | null;
	isCompleted?: boolean;
	preCompletionNotes?: string;
	assignedAt?: string;
}) {
	const actionId = faker.string.uuid();
	await server.drizzleClient
		.insert(actionsTable)
		.values({
			id: actionId,
			preCompletionNotes,
			isCompleted,
			assignedAt: new Date(assignedAt),
			completionAt: isCompleted ? new Date() : null, // Only set completionAt if completed
			categoryId,
			assigneeId,
			creatorId,
			organizationId,
			updaterId: creatorId,
			updatedAt: new Date(),
			eventId,
			postCompletionNotes: null,
		})
		.execute();
	return actionId;
}

beforeAll(async () => {
	globalAuth = await globalSignInAndGetToken();
});

suite("Query: actionItemsByUser", () => {
	let regularUser: { authToken: string; userId: string };
	let organizationId: string;
	let nonMemberUser: { authToken: string; userId: string };
	let orgAdminUser: { authToken: string; userId: string };

	beforeEach(async () => {
		regularUser = await createUserAndGetToken();
		nonMemberUser = await createUserAndGetToken();
		orgAdminUser = await createUserAndGetToken();
		organizationId = await createOrganizationAndGetId(globalAuth.authToken);

		// Add memberships
		await addMembership(organizationId, regularUser.userId, "regular");
		await addMembership(organizationId, orgAdminUser.userId, "administrator");

		// Clean up any existing action items in test organization
		await server.drizzleClient
			.delete(actionsTable)
			.where(sql`${actionsTable.organizationId} = ${organizationId}`)
			.execute();
	});

	test(
		"should return an unauthenticated error if not signed in",
		async () => {
			const result = await mercuriusClient.query(Query_actionItemsByUser, {
				variables: {
					input: {
						userId: regularUser.userId,
					},
				},
			});

			// When unauthenticated, the field should be null and we should have errors
			expect(result.data?.actionItemsByUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
					}),
				]),
			);
		},
		SUITE_TIMEOUT,
	);

	test(
		"should return an invalid_arguments error if input is missing userId",
		async () => {
			const result = await mercuriusClient.query(Query_actionItemsByUser, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {} as { userId: string }, // Type assertion for testing
				},
			});

			// This should fail at GraphQL validation level before reaching our resolver
			expect(result.data).toBeNull();
			expect(result.errors?.[0]?.message ?? "").toContain(
				'Field "userId" of required type "String!" was not provided',
			);
		},
		SUITE_TIMEOUT,
	);

	test(
		"should return an empty array if no action items exist for the user",
		async () => {
			const result = await mercuriusClient.query(Query_actionItemsByUser, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						userId: regularUser.userId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.actionItemsByUser).toEqual([]);
		},
		SUITE_TIMEOUT,
	);

	test(
		"should return all action items assigned to the user",
		async () => {
			// Create action items assigned to the regular user
			const actionId1 = await createActionItem({
				organizationId,
				creatorId: globalAuth.userId,
				assigneeId: regularUser.userId,
				isCompleted: false,
			});
			const actionId2 = await createActionItem({
				organizationId,
				creatorId: globalAuth.userId,
				assigneeId: regularUser.userId,
				isCompleted: true,
			});

			// Create an action item assigned to someone else (should not be returned)
			await createActionItem({
				organizationId,
				creatorId: globalAuth.userId,
				assigneeId: globalAuth.userId,
				isCompleted: false,
			});

			const result = await mercuriusClient.query(Query_actionItemsByUser, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						userId: regularUser.userId,
					},
				},
			});

			// May have partial errors for unauthorized fields, but should still return data
			expect(result.data?.actionItemsByUser).toBeInstanceOf(Array);
			expect(result.data?.actionItemsByUser?.length).toBe(2);

			// Ensure result.data and actionItemsByUser are defined
			expect(result.data).toBeDefined();
			expect(result.data?.actionItemsByUser).toBeDefined();
			const items = result.data?.actionItemsByUser ?? [];
			interface ActionItem {
				id: string;
				preCompletionNotes: string;
				isCompleted: boolean;
				assignedAt: string;
				completionAt: string | null;
				postCompletionNotes: string | null;
				category?: { id: string; name: string } | null;
				assignee: { id: string; name: string };
				creator: { id: string; name: string };
				organization: { id: string; name: string };
				event?: { id: string; name: string } | null;
				updater: { id: string; name: string };
				createdAt: string;
			}

			const actionIds: string[] = items.map((item: ActionItem) => item.id);
			expect(actionIds).toContain(actionId1);
			expect(actionIds).toContain(actionId2);

			// Verify the structure includes relationship objects instead of raw IDs
			const firstItem = items[0];
			expect(firstItem).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					isCompleted: expect.any(Boolean),
					assignedAt: expect.any(String),
					preCompletionNotes: expect.any(String),
					// Should have relationship objects, not raw IDs
					assignee: expect.objectContaining({
						id: regularUser.userId,
						name: expect.any(String),
					}),
					organization: expect.objectContaining({
						id: organizationId,
						name: expect.any(String),
					}),
				}),
			);
		},
		SUITE_TIMEOUT,
	);

	test(
		"should allow admins to view action items for any user",
		async () => {
			// Create action items assigned to the regular user
			const actionId1 = await createActionItem({
				organizationId,
				creatorId: globalAuth.userId,
				assigneeId: regularUser.userId,
				isCompleted: false,
			});

			// Admin should be able to see regular user's action items
			const result = await mercuriusClient.query(Query_actionItemsByUser, {
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						userId: regularUser.userId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.actionItemsByUser).toBeInstanceOf(Array);
			expect(result.data?.actionItemsByUser?.length).toBe(1);

			const items = result.data?.actionItemsByUser ?? [];
			expect(items[0].id).toBe(actionId1);
		},
		SUITE_TIMEOUT,
	);

	test(
		"should allow organization admins to view action items for users in their org",
		async () => {
			// Create action items assigned to the regular user
			const actionId1 = await createActionItem({
				organizationId,
				creatorId: globalAuth.userId,
				assigneeId: regularUser.userId,
				isCompleted: false,
			});

			// Org admin should be able to see regular user's action items with organizationId filter
			const result = await mercuriusClient.query(Query_actionItemsByUser, {
				headers: { authorization: `bearer ${orgAdminUser.authToken}` },
				variables: {
					input: {
						userId: regularUser.userId,
						organizationId: organizationId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.actionItemsByUser).toBeInstanceOf(Array);
			expect(result.data?.actionItemsByUser?.length).toBe(1);

			const items = result.data?.actionItemsByUser ?? [];
			expect(items[0].id).toBe(actionId1);
		},
		SUITE_TIMEOUT,
	);

	test(
		"should throw unauthorized error if regular user tries to view another user's action items",
		async () => {
			// Create action items assigned to a different user
			await createActionItem({
				organizationId,
				creatorId: globalAuth.userId,
				assigneeId: nonMemberUser.userId,
				isCompleted: false,
			});

			// Regular user should not be able to see other user's action items
			const result = await mercuriusClient.query(Query_actionItemsByUser, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						userId: nonMemberUser.userId,
						organizationId: organizationId,
					},
				},
			});

			expect(result.data?.actionItemsByUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
					}),
				]),
			);
		},
		SUITE_TIMEOUT,
	);

	test(
		"should throw unauthorized error if org admin tries to view user's items without org filter",
		async () => {
			// Create action items assigned to the regular user
			await createActionItem({
				organizationId,
				creatorId: globalAuth.userId,
				assigneeId: regularUser.userId,
				isCompleted: false,
			});

			// Org admin must provide organizationId when viewing other users' items
			const result = await mercuriusClient.query(Query_actionItemsByUser, {
				headers: { authorization: `bearer ${orgAdminUser.authToken}` },
				variables: {
					input: {
						userId: regularUser.userId,
						// No organizationId provided
					},
				},
			});

			expect(result.data?.actionItemsByUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
					}),
				]),
			);
		},
		SUITE_TIMEOUT,
	);

	test(
		"should filter action items by organization when organizationId is provided",
		async () => {
			// Create a second organization
			const secondOrgId = await createOrganizationAndGetId(
				globalAuth.authToken,
			);
			await addMembership(secondOrgId, regularUser.userId, "regular");

			// Create action items in both organizations
			const actionId1 = await createActionItem({
				organizationId,
				creatorId: globalAuth.userId,
				assigneeId: regularUser.userId,
				isCompleted: false,
			});

			const actionId2 = await createActionItem({
				organizationId: secondOrgId,
				creatorId: globalAuth.userId,
				assigneeId: regularUser.userId,
				isCompleted: false,
			});

			// Query with first organization filter
			const result1 = await mercuriusClient.query(Query_actionItemsByUser, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						userId: regularUser.userId,
						organizationId: organizationId,
					},
				},
			});

			expect(result1.data?.actionItemsByUser).toBeInstanceOf(Array);
			expect(result1.data?.actionItemsByUser?.length).toBe(1);
			expect(result1.data?.actionItemsByUser[0].id).toBe(actionId1);

			// Query with second organization filter
			const result2 = await mercuriusClient.query(Query_actionItemsByUser, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						userId: regularUser.userId,
						organizationId: secondOrgId,
					},
				},
			});

			expect(result2.data?.actionItemsByUser).toBeInstanceOf(Array);
			expect(result2.data?.actionItemsByUser?.length).toBe(1);
			expect(result2.data?.actionItemsByUser[0].id).toBe(actionId2);
		},
		SUITE_TIMEOUT,
	);

	test(
		"should throw error for non-existent user",
		async () => {
			const nonExistentUserId = faker.string.uuid();

			const result = await mercuriusClient.query(Query_actionItemsByUser, {
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						userId: nonExistentUserId,
					},
				},
			});

			expect(result.data?.actionItemsByUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				]),
			);
		},
		SUITE_TIMEOUT,
	);
});
