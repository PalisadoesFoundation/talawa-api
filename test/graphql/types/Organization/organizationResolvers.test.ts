import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Organization } from "~/src/graphql/types/Organization/Organization";
import { OrganizationUpdaterResolver } from "~/src/graphql/types/Organization/updater";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockLogger } from "../../../utilities/mockLogger";

// Mock data
const mockOrganization: Organization = {
	id: "org-1",
	name: "Test Organization",
	description: "A test organization",
	// Add other necessary fields
};

const mockUser: User = {
	id: "user-1",
	name: "Test User",
	email: "testuser@example.com",
	// Add other necessary fields
};

// Mock context
const mockContext: GraphQLContext = {
	drizzleClient: {
		query: {
			organizationsTable: {
				findFirst: vi.fn(),
			},
		},
		mutation: {
			organizationsTable: {
				update: vi.fn(),
			},
		},
	},
	currentUser: mockUser,
	logger: createMockLogger() as FastifyBaseLogger,
	// Add other necessary context fields
};

describe("OrganizationUpdaterResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should update an organization successfully", async () => {
		// Arrange
		const updateInput = {
			id: "org-1",
			name: "Updated Organization Name",
		};

		mockContext.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			mockOrganization
		);
		mockContext.drizzleClient.mutation.organizationsTable.update.mockResolvedValue(
			{ ...mockOrganization, ...updateInput }
		);

		// Act
		const result = await OrganizationUpdaterResolver.Mutation.updateOrganization(
			{},
			{ input: updateInput },
			mockContext
		);

		// Assert
		expect(result).toEqual({ ...mockOrganization, ...updateInput });
		expect(
			mockContext.drizzleClient.query.organizationsTable.findFirst
		).toHaveBeenCalledWith({ where: { id: updateInput.id } });
		expect(
			mockContext.drizzleClient.mutation.organizationsTable.update
		).toHaveBeenCalledWith({
			where: { id: updateInput.id },
			data: updateInput,
		});
	});

	it("should throw an error if the organization does not exist", async () => {
		// Arrange
		const updateInput = {
			id: "non-existent-org",
			name: "Updated Organization Name",
		};

		mockContext.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
			null
		);

		// Act & Assert
		await expect(
			OrganizationUpdaterResolver.Mutation.updateOrganization(
				{},
				{ input: updateInput },
				mockContext
			)
		).rejects.toThrow(TalawaGraphQLError);
		expect(
			mockContext.drizzleClient.query.organizationsTable.findFirst
		).toHaveBeenCalledWith({ where: { id: updateInput.id } });
		expect(
			mockContext.drizzleClient.mutation.organizationsTable.update
		).not.toHaveBeenCalled();
	});
});
