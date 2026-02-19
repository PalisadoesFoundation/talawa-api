import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { resolveActionItemCategories } from "../../../../src/graphql/types/Organization/actionItemCategories";
import { TalawaGraphQLError } from "../../../../src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../../types/client";
import {
	Mutation_createActionItemCategory,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_currentUser,
	Query_organizationActionItemCategories,
} from "../documentNodes";

const { accessToken: adminAuthToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(adminAuthToken);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${adminAuthToken}` },
});
const adminUser = currentUserResult.data?.currentUser;
assertToBeNonNullish(adminUser);
const adminUserId: string = adminUser.id;

async function createOrg() {
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					name: `Org Action Item Categories Test Org ${faker.string.uuid()}`,
					description: "Org to test action item categories",
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
				memberId: adminUserId,
				role: "administrator",
			},
		},
	});

	return organization;
}

suite("Organization.actionItemCategories", () => {
	test("should return paginated action item categories for an organization", async () => {
		const organization = await createOrg();

		for (let i = 0; i < 5; i++) {
			await mercuriusClient.mutate(Mutation_createActionItemCategory, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: `Test Category ${i} ${faker.string.uuid()}`,
						description: "A category for testing",
						organizationId: organization.id,
						isDisabled: false,
					},
				},
			});
		}

		const result = await mercuriusClient.query(
			Query_organizationActionItemCategories,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					id: organization.id,
					first: 3,
				},
			},
		);

		assertToBeNonNullish(result.data?.organization?.actionItemCategories);
		const { edges, pageInfo } = result.data.organization.actionItemCategories;
		expect(edges).toHaveLength(3);
		expect(pageInfo.hasNextPage).toBe(true);
	});

	test("should return an empty connection when no categories exist", async () => {
		const organization = await createOrg();

		const result = await mercuriusClient.query(
			Query_organizationActionItemCategories,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					id: organization.id,
					first: 10,
				},
			},
		);

		assertToBeNonNullish(result.data?.organization?.actionItemCategories);
		const { edges, pageInfo } = result.data.organization.actionItemCategories;
		expect(edges).toHaveLength(0);
		expect(pageInfo.hasNextPage).toBe(false);
	});

	test("should throw unauthenticated error when user is not authenticated", async () => {
		const organization = await createOrg();

		const result = await mercuriusClient.query(
			Query_organizationActionItemCategories,
			{
				variables: {
					id: organization.id,
					first: 10,
				},
			},
		);

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("should throw unauthenticated error when user does not exist in database", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockOrganization = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Test Organization",
			description: "A test organization",
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			postalCode: null,
			state: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "creator-123",
			updaterId: "updater-123",
			isPublic: true,
			userRegistrationRequired: false,
			membershipRequestsAllowed: true,
			visibleInSearch: true,
		};

		// Mock the database query to return undefined (user not found)
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			resolveActionItemCategories(mockOrganization, { first: 10 }, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			}),
		);
	});

	test("should throw unauthorized_action error when user is not a global admin", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockOrganization = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Test Organization",
			description: "A test organization",
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			postalCode: null,
			state: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "creator-123",
			updaterId: "updater-123",
			isPublic: true,
			userRegistrationRequired: false,
			membershipRequestsAllowed: true,
			visibleInSearch: true,
		};

		// Mock user with regular role and no organization membership
		const mockUserData = {
			id: "user-123",
			role: "member", // Not administrator
			organizationMembershipsWhereMember: [], // No membership in the organization
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		await expect(
			resolveActionItemCategories(mockOrganization, { first: 10 }, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			}),
		);
	});

	test("should throw unauthorized_action error when user is not an organization admin", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockOrganization = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Test Organization",
			description: "A test organization",
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			postalCode: null,
			state: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "creator-123",
			updaterId: "updater-123",
			isPublic: true,
			userRegistrationRequired: false,
			membershipRequestsAllowed: true,
			visibleInSearch: true,
		};

		// Mock user with regular role and regular organization membership
		const mockUserData = {
			id: "user-123",
			role: "member", // Not administrator
			organizationMembershipsWhereMember: [
				{
					role: "regular", // Not administrator
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		await expect(
			resolveActionItemCategories(mockOrganization, { first: 10 }, context),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			}),
		);
	});

	test("should allow access when user is a global administrator", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockOrganization = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Test Organization",
			description: "A test organization",
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			postalCode: null,
			state: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "creator-123",
			updaterId: "updater-123",
			isPublic: true,
			userRegistrationRequired: false,
			membershipRequestsAllowed: true,
			visibleInSearch: true,
		};

		// Mock user with global administrator role
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Mock action item categories query to return empty array
		mocks.drizzleClient.query.actionItemCategoriesTable.findMany.mockResolvedValue(
			[],
		);

		const result = await resolveActionItemCategories(
			mockOrganization,
			{ first: 10 },
			context,
		);

		// Verify the resolver allows access for global admins
		expect(result).toBeDefined();
		expect(result.edges).toHaveLength(0);
	});

	test("should allow access when user is an organization administrator", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockOrganization = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Test Organization",
			description: "A test organization",
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			postalCode: null,
			state: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "creator-123",
			updaterId: "updater-123",
			isPublic: true,
			userRegistrationRequired: false,
			membershipRequestsAllowed: true,
			visibleInSearch: true,
		};

		// Mock user with organization administrator role
		const mockUserData = {
			id: "user-123",
			role: "member", // Not global admin
			organizationMembershipsWhereMember: [
				{
					role: "administrator", // Organization admin
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Mock action item categories query to return empty array
		mocks.drizzleClient.query.actionItemCategoriesTable.findMany.mockResolvedValue(
			[],
		);

		const result = await resolveActionItemCategories(
			mockOrganization,
			{ first: 10 },
			context,
		);

		// Verify the resolver allows access for organization admins
		expect(result).toBeDefined();
		expect(result.edges).toHaveLength(0);
	});

	test("should handle valid cursor parsing in argument schema", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockOrganization = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Test Organization",
			description: "A test organization",
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			postalCode: null,
			state: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "creator-123",
			updaterId: "updater-123",
			isPublic: true,
			userRegistrationRequired: false,
			membershipRequestsAllowed: true,
			visibleInSearch: true,
		};

		// Mock user with proper permissions to pass authentication/authorization checks
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Mock action item categories query to return one result (to avoid empty cursor error)
		mocks.drizzleClient.query.actionItemCategoriesTable.findMany.mockResolvedValue(
			[
				{
					id: "cat-123",
					name: "Existing Category",
					description: "A test category",
					organizationId: mockOrganization.id,
					isDisabled: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					creatorId: "creator-123",
					updaterId: "updater-123",
				},
			],
		);

		// Create a valid cursor using base64url encoding
		const validCursorData = {
			name: "Test Category",
		};
		const validCursor = Buffer.from(JSON.stringify(validCursorData)).toString(
			"base64url",
		);

		await resolveActionItemCategories(
			mockOrganization,
			{
				first: 10,
				after: validCursor,
			},
			context,
		);

		// Verify that findMany was called with parsed cursor data
		expect(
			mocks.drizzleClient.query.actionItemCategoriesTable.findMany,
		).toHaveBeenCalled();
	});

	test("should throw invalid_arguments error when cursor is malformed", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockOrganization = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Test Organization",
			description: "A test organization",
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			postalCode: null,
			state: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "creator-123",
			updaterId: "updater-123",
			isPublic: true,
			userRegistrationRequired: false,
			membershipRequestsAllowed: true,
			visibleInSearch: true,
		};

		// Mock user with proper permissions to pass authentication/authorization checks
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		await expect(
			resolveActionItemCategories(
				mockOrganization,
				{
					first: 10,
					after: "invalid-cursor-data",
				},
				context,
			),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						expect.objectContaining({
							message: "Not a valid cursor.",
							argumentPath: ["after"],
						}),
					]),
				},
			}),
		);
	});

	test("should throw invalid_arguments error when cursor contains invalid JSON", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockOrganization = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Test Organization",
			description: "A test organization",
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			postalCode: null,
			state: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "creator-123",
			updaterId: "updater-123",
			isPublic: true,
			userRegistrationRequired: false,
			membershipRequestsAllowed: true,
			visibleInSearch: true,
		};

		// Mock user with proper permissions to pass authentication/authorization checks
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Create a cursor with invalid JSON (valid base64url but invalid JSON)
		const invalidCursor =
			Buffer.from("invalid json data").toString("base64url");

		await expect(
			resolveActionItemCategories(
				mockOrganization,
				{
					first: 10,
					after: invalidCursor,
				},
				context,
			),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						expect.objectContaining({
							message: "Not a valid cursor.",
							argumentPath: ["after"],
						}),
					]),
				},
			}),
		);
	});

	test("should throw arguments_associated_resources_not_found error when cursor is provided but no items are returned", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockOrganization = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Test Organization",
			description: "A test organization",
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			postalCode: null,
			state: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "creator-123",
			updaterId: "updater-123",
			isPublic: true,
			userRegistrationRequired: false,
			membershipRequestsAllowed: true,
			visibleInSearch: true,
		};

		// Mock user with proper permissions to pass authentication/authorization checks
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Mock database to return empty results (simulating no action item categories found)
		mocks.drizzleClient.query.actionItemCategoriesTable.findMany.mockResolvedValue(
			[],
		);

		// Create a valid cursor using base64url encoding
		const validCursorData = {
			name: "Some Category",
		};
		const validCursor = Buffer.from(JSON.stringify(validCursorData)).toString(
			"base64url",
		);

		await expect(
			resolveActionItemCategories(
				mockOrganization,
				{
					first: 10,
					after: validCursor,
				},
				context,
			),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: [
						{
							argumentPath: ["after"], // isInversed=false, so "after"
						},
					],
				},
			}),
		);
	});

	test("should throw arguments_associated_resources_not_found error with 'before' argument path when using before cursor and no items are returned", async () => {
		const { context, mocks } = createMockGraphQLContext(true, "user-123");
		const mockOrganization = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Test Organization",
			description: "A test organization",
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			postalCode: null,
			state: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			creatorId: "creator-123",
			updaterId: "updater-123",
			isPublic: true,
			userRegistrationRequired: false,
			membershipRequestsAllowed: true,
			visibleInSearch: true,
		};

		// Mock user with proper permissions to pass authentication/authorization checks
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Mock database to return empty results (simulating no action item categories found)
		mocks.drizzleClient.query.actionItemCategoriesTable.findMany.mockResolvedValue(
			[],
		);

		// Create a valid cursor using base64url encoding
		const validCursorData = {
			name: "Some Category",
		};
		const validCursor = Buffer.from(JSON.stringify(validCursorData)).toString(
			"base64url",
		);

		await expect(
			resolveActionItemCategories(
				mockOrganization,
				{
					last: 10, // Use 'last' to trigger isInversed=true
					before: validCursor,
				},
				context,
			),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: [
						{
							argumentPath: ["before"], // isInversed=true, so "before"
						},
					],
				},
			}),
		);
	});
});
