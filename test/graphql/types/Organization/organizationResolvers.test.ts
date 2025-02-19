import type { FastifyInstance, FastifyReply, FastifyBaseLogger } from "fastify";
import type { MercuriusContext } from "mercurius";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Organization } from "~/src/graphql/types/Organization/Organization";
import { OrganizationUpdaterResolver } from "~/src/graphql/types/Organization/updater";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockLogger } from "../../../utilities/mockLogger";

type ResolverContext = GraphQLContext & MercuriusContext;

describe("organizationConnectionList Query", () => {
	// Mock context
	const mockContext: ResolverContext = {
		app: {} as FastifyInstance,
		reply: {} as FastifyReply,
		logger: createMockLogger() as FastifyBaseLogger,
		// Add other properties as required by GraphQLContext
		drizzleClient: {
			query: {
				organizationsTable: {
					findMany: vi.fn(),
				},
			},
		},
	};

	// Sample organization data
	const sampleOrganizations: Organization[] = [
		{ id: "1", name: "Org 1", description: "", createdAt: new Date(), addressLine1: null, addressLine2: null, avatarMimeType: null, city: null, country: null, email: null, facebook: null, instagram: null, linkedin: null, phoneNumber: null, postalCode: null, state: null, twitter: null, updatedAt: new Date(), updaterId: null, website: null, workPhoneNumber: null },
		{ id: "2", name: "Org 2", description: "", createdAt: new Date(), addressLine1: null, addressLine2: null, avatarMimeType: null, city: null, country: null, email: null, facebook: null, instagram: null, linkedin: null, phoneNumber: null, postalCode: null, state: null, twitter: null, updatedAt: new Date(), updaterId: null, website: null, workPhoneNumber: null },
		{ id: "3", name: "Org 3", description: "", createdAt: new Date(), addressLine1: null, addressLine2: null, avatarMimeType: null, city: null, country: null, email: null, facebook: null, instagram: null, linkedin: null, phoneNumber: null, postalCode: null, state: null, twitter: null, updatedAt: new Date(), updaterId: null, website: null, workPhoneNumber: null },
	];

	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks();
		(mockContext.drizzleClient.query.organizationsTable.findMany as jest.Mock).mockReset();
	});

	const executeQuery = async (query: string, variables = {}) => {
		return OrganizationUpdaterResolver({
			source: {},
			args: variables,
			context: mockContext,
			info: {} as any, // Replace with appropriate GraphQLResolveInfo if available
		});
	};

	it("should return organizations with default pagination values", async () => {
		// Arrange
		(mockContext.drizzleClient.query.organizationsTable.findMany as jest.Mock).mockResolvedValue(sampleOrganizations);

		const query = `
			query {
				organizationConnectionList {
					id
					name
				}
			}
		`;

		// Act
		const result = await executeQuery(query);

		// Assert
		expect(result.errors).toBeUndefined();
		expect(result.data?.organizationConnectionList).toEqual(sampleOrganizations);
		expect(mockContext.drizzleClient.query.organizationsTable.findMany).toHaveBeenCalledWith({
			limit: 10, // default value
			offset: 0, // default value
		});
	});

	it("should return organizations with custom pagination values", async () => {
		// Arrange
		(mockContext.drizzleClient.query.organizationsTable.findMany as jest.Mock).mockResolvedValue(sampleOrganizations);

		const query = `
			query($first: Int, $skip: Int) {
				organizationConnectionList(first: $first, skip: $skip) {
					id
					name
				}
			}
		`;

		// Act
		const result = await executeQuery(query, { first: 5, skip: 10 });

		// Assert
		expect(result.errors).toBeUndefined();
		expect(result.data?.organizationConnectionList).toEqual(sampleOrganizations);
		expect(mockContext.drizzleClient.query.organizationsTable.findMany).toHaveBeenCalledWith({
			limit: 5,
			offset: 10,
		});
	});

	it("should throw error when first argument is less than 1", async () => {
		// Arrange
		const query = `
			query {
				organizationConnectionList(first: 0) {
					id
					name
				}
			}
		`;

		// Act
		const result = await executeQuery(query);

		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toMatchObject({
			extensions: {
				code: "invalid_arguments",
			},
		});
		expect(mockContext.drizzleClient.query.organizationsTable.findMany).not.toHaveBeenCalled();
	});

	it("should throw error when first argument is greater than 100", async () => {
		// Arrange
		const query = `
			query {
				organizationConnectionList(first: 101) {
					id
					name
				}
			}
		`;

		// Act
		const result = await executeQuery(query);

		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toMatchObject({
			extensions: {
				code: "invalid_arguments",
			},
		});
		expect(mockContext.drizzleClient.query.organizationsTable.findMany).not.toHaveBeenCalled();
	});

	it("should throw error when skip argument is negative", async () => {
		// Arrange
		const query = `
			query {
				organizationConnectionList(skip: -1) {
					id
					name
				}
			}
		`;

		// Act
		const result = await executeQuery(query);

		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toMatchObject({
			extensions: {
				code: "invalid_arguments",
			},
		});
		expect(mockContext.drizzleClient.query.organizationsTable.findMany).not.toHaveBeenCalled();
	});

	it("should handle database errors gracefully", async () => {
		// Arrange
		const dbError = new Error("Database connection failed");
		(mockContext.drizzleClient.query.organizationsTable.findMany as jest.Mock).mockRejectedValue(dbError);

		const query =
::contentReference[oaicite:0]{index=0}
 
