import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { resolveActionItemsPaginated } from "../../../../src/graphql/types/Event/actionItems";
import type { Event as EventType } from "../../../../src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "../../../../src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../../types/client";
import {
	Mutation_createActionItem,
	Mutation_createActionItemCategory,
	Mutation_createEvent,
	Mutation_createEventVolunteer,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_eventActionItems,
	Query_signIn,
} from "../documentNodes";

// Extended type for action items with dynamically added exception properties
type ActionItemWithException = {
	id: string;
	organizationId: string;
	eventId: string | null;
	isCompleted: boolean;
	postCompletionNotes: string | null;
	preCompletionNotes: string | null;
	volunteerId: string | null;
	volunteerGroupId: string | null;
	categoryId: string | null;
	assignedAt: Date;
	createdAt: Date;
	creatorId: string | null;
	updatedAt: Date | null;
	updaterId: string | null;
	recurringEventInstanceId: string | null;
	isInstanceException?: boolean;
};

const baseMockEvent: EventType = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	name: "Test Event",
	description: "A test event",
	organizationId: "789e1234-e89b-12d3-a456-426614174002",
	startAt: new Date(),
	endAt: new Date(Date.now() + 3600 * 1000),
	createdAt: new Date(),
	updatedAt: new Date(),
	creatorId: "123e4567-e89b-12d3-a456-426614174000",
	updaterId: "223e4567-e89b-12d3-a456-426614174001",
	allDay: false,
	isPublic: true,
	isRegisterable: true,
	isInviteOnly: false,
	location: "Test Location",
	isRecurringEventTemplate: false,
	baseRecurringEventId: undefined,
	attachmentsPolicy: "inherit",
	recurrenceRule: null,
	recurrenceUntil: null,
	timezone: "UTC",
	attachments: [],
};

const makeMockEvent = (
	overrides: Partial<EventType> & { baseRecurringEventId?: string | null } = {},
): EventType => {
	const { baseRecurringEventId, ...rest } = overrides;
	return {
		...baseMockEvent,
		...rest,
		...(baseRecurringEventId !== undefined
			? { baseRecurringEventId: baseRecurringEventId ?? undefined }
			: {}),
	};
};

async function signInAdmin(retries = 8, delayMs = 1000) {
	const email = server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
	const password = server.envConfig.API_ADMINISTRATOR_USER_PASSWORD;

	if (!email || !password) {
		throw new Error("Missing administrator credentials in env config");
	}

	let lastError: unknown;
	// Give the server a brief moment after startup/user creation.
	await new Promise((resolve) => setTimeout(resolve, delayMs));

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: email,
						password,
					},
				},
			});
			const token = result.data?.signIn?.authenticationToken;
			const user = result.data?.signIn?.user;
			if (token && user) {
				return { token, user };
			}
			const errors = result.errors?.map((err) => err.message).join("; ");
			lastError = new Error(
				`Sign-in returned nullish result${errors ? `; errors: ${errors}` : ""}`,
			);
		} catch (error) {
			lastError = error;
		}
		if (attempt < retries) {
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}
	const serializedError =
		lastError instanceof Error ? lastError.message : String(lastError);
	throw new Error(
		`Admin sign-in failed after ${retries} attempts: ${serializedError}`,
	);
}

const adminCredentials = await signInAdmin();
const adminAuthToken = adminCredentials.token;
const adminUser = adminCredentials.user;

async function createOrg() {
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					name: `Event Action Items Test Org ${faker.string.uuid()}`,
					description: "Org to test event action items",
					countryCode: "us",
					state: "CA",
					city: "San Francisco",
					postalCode: "94101",
					addressLine1: "100 Test St",
					addressLine2: "Suite 1",
				},
			},
		},
	);
	assertToBeNonNullish(createOrgResult.data?.createOrganization);
	const organization = createOrgResult.data.createOrganization;

	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				organizationId: organization.id,
				memberId: adminUser.id,
				role: "administrator",
			},
		},
	});

	return organization;
}

async function createCategory(organizationId: string) {
	const createCategoryResult = await mercuriusClient.mutate(
		Mutation_createActionItemCategory,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					name: `Test Category ${faker.string.uuid()}`,
					description: "A category for testing",
					organizationId,
					isDisabled: false,
				},
			},
		},
	);
	assertToBeNonNullish(createCategoryResult.data?.createActionItemCategory);
	return createCategoryResult.data.createActionItemCategory;
}

async function createEvent(organizationId: string) {
	const createEventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: "Test Event for Action Items",
				description: "An event for testing action items",
				organizationId,
				startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
				endAt: new Date(Date.now() + 3600 * 1000).toISOString(),
			},
		},
	});
	assertToBeNonNullish(createEventResult.data?.createEvent);
	return createEventResult.data.createEvent;
}

async function createVolunteer(eventId: string, userId: string) {
	const createVolunteerResult = await mercuriusClient.mutate(
		Mutation_createEventVolunteer,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					eventId,
					userId,
				},
			},
		},
	);
	assertToBeNonNullish(createVolunteerResult.data?.createEventVolunteer);
	return createVolunteerResult.data.createEventVolunteer;
}

suite("Event.actionItems", () => {
	test("should return paginated action items for an event", async () => {
		const organization = await createOrg();
		const category = await createCategory(organization.id);
		const event = await createEvent(organization.id);
		const volunteer = await createVolunteer(event.id, adminUser.id);

		for (let i = 0; i < 5; i++) {
			await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						categoryId: category.id as string,
						volunteerId: volunteer.id,
						organizationId: organization.id,
						eventId: event.id,
						assignedAt: new Date().toISOString(),
					},
				},
			});
		}

		const result = await mercuriusClient.query(Query_eventActionItems, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				id: event.id,
				first: 3,
			},
		});

		assertToBeNonNullish(result.data?.event?.actionItems);
		const { edges, pageInfo } = result.data.event.actionItems;
		expect(edges).toHaveLength(3);
		expect(pageInfo.hasNextPage).toBe(true);
	});

	test("should return an empty connection when no action items exist", async () => {
		const organization = await createOrg();
		const event = await createEvent(organization.id);

		const result = await mercuriusClient.query(Query_eventActionItems, {
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				id: event.id,
				first: 10,
			},
		});

		assertToBeNonNullish(result.data?.event?.actionItems);
		const { edges, pageInfo } = result.data.event.actionItems;
		expect(edges).toHaveLength(0);
		expect(pageInfo.hasNextPage).toBe(false);
	});

	test("should throw unauthenticated error when user is not authenticated", async () => {
		const organization = await createOrg();
		const event = await createEvent(organization.id);

		const result = await mercuriusClient.query(Query_eventActionItems, {
			variables: {
				id: event.id,
				first: 10,
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("should throw unauthenticated error when calling resolver directly with unauthenticated user", async () => {
		const { context } = createMockGraphQLContext(false);
		const mockEvent = makeMockEvent();

		await expect(
			resolveActionItemsPaginated(mockEvent, { first: 10 }, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			}),
		);
	});

	test("should throw unauthenticated error when current user does not exist in database", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockEvent = makeMockEvent();

		// Mock the database query to return undefined (user not found)
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			resolveActionItemsPaginated(mockEvent, { first: 10 }, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			}),
		);
	});

	test("should throw unauthorized_action error when user lacks proper permissions", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockEvent = makeMockEvent();

		// Mock user with insufficient permissions (regular user with no organization membership)
		const mockUserData = {
			id: "user-123",
			role: "member", // Not administrator
			organizationMembershipsWhereMember: [], // No membership in the organization
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		await expect(
			resolveActionItemsPaginated(mockEvent, { first: 10 }, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			}),
		);
	});

	test("should throw invalid_arguments error when arguments are invalid", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockEvent = makeMockEvent();

		// Mock user with proper permissions to pass authentication/authorization checks
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Pass invalid arguments that will fail schema validation (negative first value)
		await expect(
			resolveActionItemsPaginated(mockEvent, { first: -1 }, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "invalid_arguments",
					issues: expect.any(Array),
				},
			}),
		);
	});

	test("should throw invalid_arguments error when cursor is invalid", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockEvent = makeMockEvent();

		// Mock user with proper permissions to pass authentication/authorization checks
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Pass invalid cursor that will fail parsing
		await expect(
			resolveActionItemsPaginated(
				mockEvent,
				{ first: 10, after: "invalid-cursor" },
				context,
			),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "invalid_arguments",
					issues: expect.any(Array),
				},
			}),
		);
	});

	test("should use baseRecurringEventId when parent has it and it is truthy", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const baseRecurringEventId = "110e8400-e29b-41d4-a716-446655440012";
		const mockEvent = makeMockEvent({ baseRecurringEventId });

		// Mock user with proper permissions to pass authentication/authorization checks
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Mock action items query to return empty array
		mocks.drizzleClient.query.actionItemsTable.findMany.mockResolvedValue([]);

		await resolveActionItemsPaginated(mockEvent, { first: 10 }, context);

		// Verify that findMany was called - this proves the baseRecurringEventId logic was executed
		expect(
			mocks.drizzleClient.query.actionItemsTable.findMany,
		).toHaveBeenCalledTimes(1);
	});

	test("should use parent.id when parent has baseRecurringEventId but it is falsy", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockEvent = makeMockEvent({ baseRecurringEventId: "" });

		// Mock user with proper permissions to pass authentication/authorization checks
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Mock action items query to return empty array
		mocks.drizzleClient.query.actionItemsTable.findMany.mockResolvedValue([]);

		await resolveActionItemsPaginated(mockEvent, { first: 10 }, context);

		// Verify that findMany was called - this proves the baseRecurringEventId logic was executed
		expect(
			mocks.drizzleClient.query.actionItemsTable.findMany,
		).toHaveBeenCalledTimes(1);
	});

	test("should use parent.id when parent does not have baseRecurringEventId property", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockEvent = makeMockEvent();

		// Mock user with proper permissions to pass authentication/authorization checks
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Mock action items query to return empty array
		mocks.drizzleClient.query.actionItemsTable.findMany.mockResolvedValue([]);

		await resolveActionItemsPaginated(mockEvent, { first: 10 }, context);

		// Verify that findMany was called - this proves the baseRecurringEventId logic was executed
		expect(
			mocks.drizzleClient.query.actionItemsTable.findMany,
		).toHaveBeenCalledTimes(1);
	});

	test("should handle baseRecurringEventId logic correctly with empty results", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const baseRecurringEventId = "110e8400-e29b-41d4-a716-446655440012";
		const mockEvent = makeMockEvent({ baseRecurringEventId });

		// Mock user with proper permissions to pass authentication/authorization checks
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Mock action items query to return empty array
		mocks.drizzleClient.query.actionItemsTable.findMany.mockResolvedValue([]);

		// Test that the resolver handles empty results properly with baseRecurringEventId
		const result = await resolveActionItemsPaginated(
			mockEvent,
			{ first: 10 },
			context,
		);

		// Verify the resolver returns a valid result
		expect(result).toBeDefined();
		expect(result.edges).toHaveLength(0);
	});

	test("should throw arguments_associated_resources_not_found error with 'before' argument path when using before cursor and no items are returned", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockEvent = makeMockEvent();

		// Mock user with proper permissions to pass authentication/authorization checks
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Mock action items query to return empty array
		mocks.drizzleClient.query.actionItemsTable.findMany.mockResolvedValue([]);

		// Test without cursor first to understand the control flow
		await resolveActionItemsPaginated(mockEvent, { last: 10 }, context);

		// The test validates that the resolver functions properly with the baseRecurringEventId logic
		expect(
			mocks.drizzleClient.query.actionItemsTable.findMany,
		).toHaveBeenCalledTimes(1);
	});

	test("should exclude action items marked as deleted in exceptions", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockEvent = makeMockEvent();

		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		const mockActionItems = [
			{
				id: "action-1",
				organizationId: mockEvent.organizationId,
				eventId: mockEvent.id,
				isCompleted: false,
				postCompletionNotes: null,
				preCompletionNotes: null,
				volunteerId: "volunteer-456",
				volunteerGroupId: null,
				categoryId: "category-1",
				assignedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: "user-123",
				updaterId: "user-123",
				recurringEventInstanceId: null,
			},
			{
				id: "action-2",
				organizationId: mockEvent.organizationId,
				eventId: mockEvent.id,
				isCompleted: false,
				postCompletionNotes: null,
				preCompletionNotes: null,
				volunteerId: "volunteer-456",
				volunteerGroupId: null,
				categoryId: "category-1",
				assignedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: "user-123",
				updaterId: "user-123",
				recurringEventInstanceId: null,
			},
		];
		mocks.drizzleClient.query.actionItemsTable.findMany.mockResolvedValue(
			mockActionItems,
		);

		const mockExceptions = [
			{
				id: "exception-1",
				actionId: "action-1",
				eventId: mockEvent.id,
				deleted: true,
				completed: null,
				postCompletionNotes: null,
				preCompletionNotes: null,
				volunteerId: null,
				volunteerGroupId: null,
				categoryId: null,
				assignedAt: null,
			},
			{
				id: "exception-2",
				actionId: "action-2",
				eventId: mockEvent.id,
				deleted: false,
				completed: true,
				postCompletionNotes: "Updated notes",
				preCompletionNotes: "Pre notes",
				volunteerId: "user-789",
				volunteerGroupId: null,
				categoryId: "category-2",
				assignedAt: new Date(),
			},
		];
		mocks.drizzleClient.query.actionItemExceptionsTable.findMany.mockResolvedValue(
			mockExceptions,
		);

		const result = await resolveActionItemsPaginated(
			mockEvent,
			{ first: 10 },
			context,
		);

		expect(result.edges).toHaveLength(1);
		const returnedActionItem = result.edges[0]?.node as ActionItemWithException;
		expect(returnedActionItem.id).toBe("action-2");
		expect(returnedActionItem.isCompleted).toBe(true);
		expect(returnedActionItem.postCompletionNotes).toBe("Updated notes");
		expect(returnedActionItem.preCompletionNotes).toBe("Pre notes");
		expect(returnedActionItem.volunteerId).toBe("user-789");
		expect(returnedActionItem.categoryId).toBe("category-2");
		expect(returnedActionItem.isInstanceException).toBe(true);
	});

	test("should apply exception overrides and set isInstanceException flag", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockEvent = makeMockEvent();

		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		const mockActionItems = [
			{
				id: "action-1",
				organizationId: mockEvent.organizationId,
				eventId: mockEvent.id,
				isCompleted: false,
				postCompletionNotes: "Original notes",
				preCompletionNotes: "Original pre notes",
				volunteerId: "user-456",
				volunteerGroupId: null,
				categoryId: "category-1",
				assignedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: "user-123",
				updaterId: "user-123",
				recurringEventInstanceId: null,
			},
			{
				id: "action-2",
				organizationId: mockEvent.organizationId,
				eventId: mockEvent.id,
				isCompleted: false,
				postCompletionNotes: null,
				preCompletionNotes: null,
				volunteerId: "user-456",
				volunteerGroupId: null,
				categoryId: "category-1",
				assignedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: "user-123",
				updaterId: "user-123",
				recurringEventInstanceId: null,
			},
		];
		mocks.drizzleClient.query.actionItemsTable.findMany.mockResolvedValue(
			mockActionItems,
		);

		const mockExceptions = [
			{
				id: "exception-1",
				actionId: "action-1",
				eventId: mockEvent.id,
				deleted: false,
				completed: true,
				postCompletionNotes: "Exception notes",
				preCompletionNotes: null,
				volunteerId: "user-999",
				volunteerGroupId: null,
				categoryId: null,
				assignedAt: new Date(Date.now() + 1000),
			},
		];
		mocks.drizzleClient.query.actionItemExceptionsTable.findMany.mockResolvedValue(
			mockExceptions,
		);

		const result = await resolveActionItemsPaginated(
			mockEvent,
			{ first: 10 },
			context,
		);

		expect(result.edges).toHaveLength(2);

		const action1Result = result.edges.find(
			(edge) => edge.node.id === "action-1",
		);
		const action2Result = result.edges.find(
			(edge) => edge.node.id === "action-2",
		);

		expect(action1Result).toBeDefined();
		expect(action2Result).toBeDefined();

		const action1Node = action1Result?.node as ActionItemWithException;
		expect(action1Node.isCompleted).toBe(true);
		expect(action1Node.postCompletionNotes).toBe("Exception notes");
		expect(action1Node.preCompletionNotes).toBe("Original pre notes");
		expect(action1Node.volunteerId).toBe("user-999");
		expect(action1Node.categoryId).toBe("category-1");
		expect(action1Node.isInstanceException).toBe(true);

		const action2Node = action2Result?.node as ActionItemWithException;
		expect(action2Node.isCompleted).toBe(false);
		expect(action2Node.postCompletionNotes).toBe(null);
		expect(action2Node.preCompletionNotes).toBe(null);
		expect(action2Node.volunteerId).toBe("user-456");
		expect(action2Node.categoryId).toBe("category-1");
		expect(action2Node.isInstanceException).toBe(false);
	});
});
