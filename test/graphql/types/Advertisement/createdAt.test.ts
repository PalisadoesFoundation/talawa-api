import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

import type { GraphQLContext } from "../../../../src/graphql/context";
// Import the Advertisement and GraphQLContext types
import type { Advertisement } from "../../../../src/graphql/types/Advertisement/Advertisement";
// Import the resolver function
import { createdAtResolver as resolver } from "../../../../src/graphql/types/Advertisement/createdAt";

// Type definitions matching the resolver's expected types
// The resolver only uses id, organizationId, and createdAt from the parent
interface MockParent {
	id: string;
	organizationId: string;
	createdAt: Date;
}

// Partial mock context - only includes fields the resolver actually uses
interface MockContext {
	currentClient: {
		isAuthenticated: boolean;
		user?: {
			id: string;
		};
	};
	drizzleClient: {
		query: Record<string, unknown>;
	};
}

suite("Advertisement field createdAt - Unit Tests", () => {
	test("throws unauthenticated error when client is not authenticated", async () => {
		// Arrange
		const mockParent: MockParent = {
			id: faker.string.uuid(),
			organizationId: faker.string.uuid(),
			createdAt: new Date(),
		};

		const mockContext: MockContext = {
			currentClient: {
				isAuthenticated: false,
			},
			drizzleClient: {
				query: {},
			},
		};

		// Act & Assert - Check for the specific error class and code
		await expect(
			resolver(
				mockParent as Advertisement,
				{},
				mockContext as unknown as GraphQLContext,
			),
		).rejects.toThrow(TalawaGraphQLError);
		
		await expect(
			resolver(
				mockParent as Advertisement,
				{},
				mockContext as unknown as GraphQLContext,
			),
		).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	test("throws unauthenticated error when user does not exist in database", async () => {
		// Arrange
		const mockParent: MockParent = {
			id: faker.string.uuid(),
			organizationId: faker.string.uuid(),
			createdAt: new Date(),
		};

		const mockFindFirst = vi.fn().mockResolvedValue(undefined); // Simulate user not found
		const mockContext: MockContext = {
			currentClient: {
				isAuthenticated: true,
				user: {
					id: faker.string.uuid(),
				},
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: mockFindFirst,
					},
				},
			},
		};

		// Act & Assert - Check for the specific error class and code
		await expect(
			resolver(
				mockParent as Advertisement,
				{},
				mockContext as unknown as GraphQLContext,
			),
		).rejects.toThrow(TalawaGraphQLError);
		
		await expect(
			resolver(
				mockParent as Advertisement,
				{},
				mockContext as unknown as GraphQLContext,
			),
		).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
		expect(mockFindFirst).toHaveBeenCalledOnce();
	});

	test("returns createdAt when user is system administrator", async () => {
		// Arrange
		const mockCreatedAt = new Date("2025-01-01T00:00:00.000Z");
		const mockParent: MockParent = {
			id: faker.string.uuid(),
			organizationId: faker.string.uuid(),
			createdAt: mockCreatedAt,
		};

		const mockFindFirst = vi.fn().mockResolvedValue({
			role: "administrator", // System admin role
			organizationMembershipsWhereMember: [], // Doesn't matter for sys admin
		});

		const mockContext: MockContext = {
			currentClient: {
				isAuthenticated: true,
				user: {
					id: faker.string.uuid(),
				},
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: mockFindFirst,
					},
				},
			},
		};

		// Act
		const result = await resolver(
			mockParent as Advertisement,
			{},
			mockContext as unknown as GraphQLContext,
		);

		// Assert
		expect(result).toBe(mockCreatedAt);
		expect(result).toBeInstanceOf(Date);
		expect(mockFindFirst).toHaveBeenCalledOnce();
	});

	test("returns createdAt when user is organization administrator", async () => {
		// Arrange
		const mockCreatedAt = new Date("2025-01-15T12:30:00.000Z");
		const orgId = faker.string.uuid();
		const mockParent: MockParent = {
			id: faker.string.uuid(),
			organizationId: orgId,
			createdAt: mockCreatedAt,
		};

		const mockFindFirst = vi.fn().mockResolvedValue({
			role: "regular", // User role itself might be regular
			organizationMembershipsWhereMember: [
				{
					role: "administrator", // But they are admin in this specific org
					organizationId: orgId,
				},
			],
		});

		const mockContext: MockContext = {
			currentClient: {
				isAuthenticated: true,
				user: {
					id: faker.string.uuid(),
				},
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: mockFindFirst,
					},
				},
			},
		};

		// Act
		const result = await resolver(
			mockParent as Advertisement,
			{},
			mockContext as unknown as GraphQLContext,
		);

		// Assert
		expect(result).toBe(mockCreatedAt);
		expect(result).toBeInstanceOf(Date);
		expect(mockFindFirst).toHaveBeenCalledOnce();
		expect(mockFindFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				with: expect.objectContaining({
					organizationMembershipsWhereMember: expect.objectContaining({
						where: expect.any(Function),
					}),
				}),
			}),
		);
	});

	test("throws unauthorized_action when user is not organization member", async () => {
		// Arrange
		const mockParent: MockParent = {
			id: faker.string.uuid(),
			organizationId: faker.string.uuid(),
			createdAt: new Date(),
		};

		const mockFindFirst = vi.fn().mockResolvedValue({
			role: "regular", // Not a system admin
			organizationMembershipsWhereMember: [], // No membership found for this org
		});

		const mockContext: MockContext = {
			currentClient: {
				isAuthenticated: true,
				user: {
					id: faker.string.uuid(),
				},
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: mockFindFirst,
					},
				},
			},
		};

		// Act & Assert - Check for the specific error class and code
		await expect(
			resolver(
				mockParent as Advertisement,
				{},
				mockContext as unknown as GraphQLContext,
			),
		).rejects.toThrow(TalawaGraphQLError);
		
		await expect(
			resolver(
				mockParent as Advertisement,
				{},
				mockContext as unknown as GraphQLContext,
			),
		).rejects.toMatchObject({
			extensions: { code: "unauthorized_action" },
		});
		expect(mockFindFirst).toHaveBeenCalledOnce();
	});

	test("throws unauthorized_action when user is regular organization member (not admin)", async () => {
		// Arrange
		const mockParent: MockParent = {
			id: faker.string.uuid(),
			organizationId: faker.string.uuid(),
			createdAt: new Date(),
		};

		const mockFindFirst = vi.fn().mockResolvedValue({
			role: "regular", // Not a system admin
			organizationMembershipsWhereMember: [
				{
					role: "regular", // Regular member, not admin in this org
				},
			],
		});

		const mockContext: MockContext = {
			currentClient: {
				isAuthenticated: true,
				user: {
					id: faker.string.uuid(),
				},
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: mockFindFirst,
					},
				},
			},
		};

		// Act & Assert - Check for the specific error class and code
		await expect(
			resolver(
				mockParent as Advertisement,
				{},
				mockContext as unknown as GraphQLContext,
			),
		).rejects.toThrow(TalawaGraphQLError);
		
		await expect(
			resolver(
				mockParent as Advertisement,
				{},
				mockContext as unknown as GraphQLContext,
			),
		).rejects.toMatchObject({
			extensions: { code: "unauthorized_action" },
		});
		expect(mockFindFirst).toHaveBeenCalledOnce();
	});

	test("returns DateTime value with correct type and precision", async () => {
		// Arrange
		const mockCreatedAt = new Date("2025-03-20T08:45:30.123Z");
		const mockParent: MockParent = {
			id: faker.string.uuid(),
			organizationId: faker.string.uuid(),
			createdAt: mockCreatedAt,
		};

		const mockFindFirst = vi.fn().mockResolvedValue({
			role: "administrator", // System admin is authorized
			organizationMembershipsWhereMember: [],
		});

		const mockContext: MockContext = {
			currentClient: {
				isAuthenticated: true,
				user: {
					id: faker.string.uuid(),
				},
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: mockFindFirst,
					},
				},
			},
		};

		// Act
		const result = await resolver(
			mockParent as Advertisement,
			{},
			mockContext as unknown as GraphQLContext,
		);

		// Assert
		expect(result).toBeInstanceOf(Date);
		expect(result).toBe(mockCreatedAt);
		expect(result.toISOString()).toBe("2025-03-20T08:45:30.123Z");
		expect(result.getTime()).toBe(mockCreatedAt.getTime());
		expect(mockFindFirst).toHaveBeenCalledOnce(); // Ensure DB was checked
	});

	test("resolver correctly passes through parent.createdAt reference", async () => {
		// Arrange
		const mockCreatedAt = new Date("2025-06-15T14:20:00.000Z");
		const mockParent: MockParent = {
			id: faker.string.uuid(),
			organizationId: faker.string.uuid(),
			createdAt: mockCreatedAt,
		};

		const mockFindFirst = vi.fn().mockResolvedValue({
			role: "administrator", // System admin is authorized
			organizationMembershipsWhereMember: [],
		});

		const mockContext: MockContext = {
			currentClient: {
				isAuthenticated: true,
				user: {
					id: faker.string.uuid(),
				},
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: mockFindFirst,
					},
				},
			},
		};

		// Act
		const result = await resolver(
			mockParent as Advertisement,
			{},
			mockContext as unknown as GraphQLContext,
		);

		// Assert - should be the exact same date object reference
		expect(result).toBe(mockParent.createdAt);
		expect(Object.is(result, mockParent.createdAt)).toBe(true);
		expect(mockFindFirst).toHaveBeenCalledOnce(); // Ensure DB was checked
	});
});
