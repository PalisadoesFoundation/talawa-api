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
	Query_actionItemsByOrganization,
	Query_signIn,
} from "../documentNodes";

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

suite("Query: actionItemsByOrganization", () => {
	let regularUser: { authToken: string; userId: string };
	let organizationId: string;
	let nonMemberUser: { authToken: string; userId: string };

	beforeEach(async () => {
		regularUser = await createUserAndGetToken();
		nonMemberUser = await createUserAndGetToken();
		organizationId = await createOrganizationAndGetId(globalAuth.authToken);
		await addMembership(organizationId, regularUser.userId, "regular");

		await server.drizzleClient
			.delete(actionsTable)
			.where(sql`${actionsTable.organizationId} = ${organizationId}`)
			.execute();
	});

	test("should return an unauthenticated error if not signed in", async () => {
		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				variables: {
					input: {
						organizationId,
					},
				},
			},
		);

		// When unauthenticated, the field should be null and we should have errors
		expect(result.data?.actionItemsByOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("should return an invalid_arguments error if input is missing organizationId", async () => {
		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {} as { organizationId: string }, // Type assertion for testing
				},
			},
		);

		// This should fail at GraphQL validation level before reaching our resolver
		expect(result.data).toBeNull();
		expect(result.errors?.[0]?.message ?? "").toContain(
			'Field "organizationId" of required type "String!" was not provided',
		);
	});

	test("should return an empty array if no action items exist", async () => {
		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						organizationId,
					},
				},
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.actionItemsByOrganization).toEqual([]);
	});

	test("should return all action items for the organization", async () => {
		const actionId1 = await createActionItem({
			organizationId,
			creatorId: globalAuth.userId,
			assigneeId: regularUser.userId,
			isCompleted: false,
		});
		const actionId2 = await createActionItem({
			organizationId,
			creatorId: globalAuth.userId,
			assigneeId: globalAuth.userId,
			isCompleted: true,
		});

		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						organizationId,
					},
				},
			},
		);

		// May have partial errors for unauthorized fields, but should still return data
		expect(result.data?.actionItemsByOrganization).toBeInstanceOf(Array);
		expect(result.data?.actionItemsByOrganization?.length).toBe(2);

		// Ensure result.data and actionItemsByOrganization are defined
		expect(result.data).toBeDefined();
		expect(result.data?.actionItemsByOrganization).toBeDefined();
		const items = result.data?.actionItemsByOrganization ?? [];
		const actionIds = items.map((item) => item.id);
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
				organization: expect.objectContaining({
					id: organizationId,
					name: expect.any(String),
				}),
			}),
		);
	});

	test("should throw unauthorized error if user is not a member of the organization", async () => {
		await createActionItem({
			organizationId,
			creatorId: globalAuth.userId,
			isCompleted: false,
		});

		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				headers: { authorization: `bearer ${nonMemberUser.authToken}` },
				variables: {
					input: {
						organizationId,
					},
				},
			},
		);

		expect(result.data?.actionItemsByOrganization).toBeNull();
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

	test("should throw unauthenticated error if user doesn't exist", async () => {
		const fakeToken = `fake_token_${faker.string.alphanumeric(32)}`;
		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				headers: { authorization: `bearer ${fakeToken}` },
				variables: {
					input: {
						organizationId,
					},
				},
			},
		);

		expect(result.data?.actionItemsByOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("should throw invalid_arguments error for invalid organization ID format", async () => {
		const result = await mercuriusClient.query(
			Query_actionItemsByOrganization,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						organizationId: "invalid-format",
					},
				},
			},
		);

		expect(result.data?.actionItemsByOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
				}),
			]),
		);
	});
});
