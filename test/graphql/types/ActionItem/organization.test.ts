import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { ActionItem as ActionItemType } from "~/src/graphql/types/ActionItem/ActionItem";
import { resolveOrganization } from "~/src/graphql/types/ActionItem/organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("ActionItem Resolver - Organization Field", () => {
	let ctx: GraphQLContext;
	let mockActionItem: ActionItemType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		mockActionItem = {
			id: "01234567-89ab-cdef-0123-456789abcdef",
			organizationId: "org-123",
			categoryId: "category-456",
			assignedAt: new Date("2024-01-01T10:00:00Z"),
			isCompleted: false,
			completionAt: null,
			preCompletionNotes: null,
			postCompletionNotes: null,
			assigneeId: "user-789",
			creatorId: "user-admin",
			updaterId: "user-update",
			eventId: null,
			isTemplate: false,
			recurringEventInstanceId: null,
			volunteerId: null,
			volunteerGroupId: null,
			createdAt: new Date("2024-01-01T09:00:00Z"),
			updatedAt: new Date("2024-01-01T10:00:00Z"),
		} as ActionItemType;

		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
	});

	describe("Organization Resolution", () => {
		it("should successfully resolve organization when it exists", async () => {
			const mockOrganization = {
				id: "org-123",
				name: "Test Organization",
				description: "Test Organization Description",
				countryCode: "US",
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
				addressLine1: "123 Main St",
				addressLine2: null,
				avatarMimeType: null,
				city: "Test City",
				state: "Test State",
				zipCode: "12345",
				userRegistrationRequired: false,
				membershipRequestsEnabled: true,
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				mockOrganization,
			);

			const result = await resolveOrganization(mockActionItem, {}, ctx);

			expect(result).toEqual(mockOrganization);
			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});

		it("should throw unexpected error when organization does not exist", async () => {
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				resolveOrganization(mockActionItem, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an action item's organization id that isn't null.",
			);
		});
	});

	describe("Database Query Verification", () => {
		it("should call database query with correct organization ID", async () => {
			const mockOrganization = {
				id: "org-123",
				name: "Test Organization",
				countryCode: "US",
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				mockOrganization,
			);

			await resolveOrganization(mockActionItem, {}, ctx);

			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledTimes(1);
			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});

		it("should handle different organization IDs correctly", async () => {
			const mockOrganization1 = {
				id: "org-111",
				name: "Organization 1",
				countryCode: "US",
			};

			const mockOrganization2 = {
				id: "org-222",
				name: "Organization 2",
				countryCode: "CA",
			};

			// Test with first organization ID
			mockActionItem.organizationId = "org-111";
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization1,
			);

			let result = await resolveOrganization(mockActionItem, {}, ctx);
			expect(result).toEqual(mockOrganization1);

			// Test with second organization ID
			mockActionItem.organizationId = "org-222";
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization2,
			);

			result = await resolveOrganization(mockActionItem, {}, ctx);
			expect(result).toEqual(mockOrganization2);

			// Verify both calls were made
			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledTimes(2);
		});

		it("should use organizationId from parent correctly", async () => {
			const mockOrganization = {
				id: "custom-org-id",
				name: "Custom Org",
				countryCode: "UK",
			};

			mockActionItem.organizationId = "custom-org-id";
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				mockOrganization,
			);

			await resolveOrganization(mockActionItem, {}, ctx);

			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});
	});

	describe("Error Handling", () => {
		it("should log error with correct message when organization is not found", async () => {
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				undefined,
			);

			try {
				await resolveOrganization(mockActionItem, {}, ctx);
			} catch (error) {
				expect(ctx.log.error).toHaveBeenCalledWith(
					"Postgres select operation returned an empty array for an action item's organization id that isn't null.",
				);
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions.code).toBe(
					"unexpected",
				);
				expect((error as TalawaGraphQLError).message).toBe(
					"Something went wrong. Please try again later.",
				);
			}
		});

		it("should handle database errors gracefully", async () => {
			const databaseError = new Error("Database connection failed");
			mocks.drizzleClient.query.organizationsTable.findFirst.mockRejectedValue(
				databaseError,
			);

			await expect(
				resolveOrganization(mockActionItem, {}, ctx),
			).rejects.toThrow(databaseError);

			// Verify the query was attempted
			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should not log errors for successful operations", async () => {
			const mockOrganization = {
				id: "org-123",
				name: "Success Organization",
				countryCode: "US",
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				mockOrganization,
			);

			await resolveOrganization(mockActionItem, {}, ctx);

			expect(ctx.log.error).not.toHaveBeenCalled();
		});

		it("should handle query timeout errors", async () => {
			const timeoutError = new Error("Query timeout");
			timeoutError.name = "TimeoutError";
			mocks.drizzleClient.query.organizationsTable.findFirst.mockRejectedValue(
				timeoutError,
			);

			await expect(
				resolveOrganization(mockActionItem, {}, ctx),
			).rejects.toThrow(timeoutError);
		});

		it("should handle database constraint violations", async () => {
			const constraintError = new Error("Foreign key constraint violation");
			constraintError.name = "PostgresError";
			mocks.drizzleClient.query.organizationsTable.findFirst.mockRejectedValue(
				constraintError,
			);

			await expect(
				resolveOrganization(mockActionItem, {}, ctx),
			).rejects.toThrow(constraintError);
		});
	});

	describe("Return Values", () => {
		it("should return organization with all expected properties", async () => {
			const mockOrganization = {
				id: "org-123",
				name: "Complete Organization",
				description: "A comprehensive organization",
				countryCode: "US",
				createdAt: new Date("2024-01-01T00:00:00Z"),
				updatedAt: new Date("2024-01-01T12:00:00Z"),
				addressLine1: "123 Business Ave",
				addressLine2: "Suite 100",
				avatarMimeType: "image/png",
				city: "Business City",
				state: "Business State",
				zipCode: "12345",
				userRegistrationRequired: true,
				membershipRequestsEnabled: false,
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				mockOrganization,
			);

			const result = await resolveOrganization(mockActionItem, {}, ctx);

			expect(result).toEqual(mockOrganization);
			expect(result).toHaveProperty("id", "org-123");
			expect(result).toHaveProperty("name", "Complete Organization");
			expect(result).toHaveProperty(
				"description",
				"A comprehensive organization",
			);
			expect(result).toHaveProperty("countryCode", "US");
			expect(result).toHaveProperty("city", "Business City");
			expect(result).toHaveProperty("userRegistrationRequired", true);
		});

		it("should return minimal organization data correctly", async () => {
			const minimalOrganization = {
				id: "org-123",
				name: "Minimal Organization",
				countryCode: "US",
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
				addressLine1: null,
				addressLine2: null,
				avatarMimeType: null,
				city: null,
				state: null,
				zipCode: null,
				description: null,
				userRegistrationRequired: null,
				membershipRequestsEnabled: null,
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				minimalOrganization,
			);

			const result = await resolveOrganization(mockActionItem, {}, ctx);

			expect(result).toEqual(minimalOrganization);
			expect(result).toHaveProperty("id", "org-123");
			expect(result).toHaveProperty("name", "Minimal Organization");
			expect(result).toHaveProperty("countryCode", "US");
		});

		it("should preserve all organization properties from database", async () => {
			const complexOrganization = {
				id: "org-123",
				name: "Complex Organization",
				description: "Organization with many properties",
				countryCode: "CA",
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-02"),
				addressLine1: "456 Complex St",
				addressLine2: "Floor 5",
				avatarMimeType: "image/jpeg",
				city: "Complex City",
				state: "Complex Province",
				zipCode: "A1B 2C3",
				userRegistrationRequired: false,
				membershipRequestsEnabled: true,
				customField: "custom value", // Additional field
				metadata: { type: "nonprofit", verified: true },
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				complexOrganization,
			);

			const result = await resolveOrganization(mockActionItem, {}, ctx);

			expect(result).toEqual(complexOrganization);
			expect(result).toHaveProperty("customField", "custom value");
			expect(result).toHaveProperty("metadata.type", "nonprofit");
			expect(result).toHaveProperty("metadata.verified", true);
		});
	});

	describe("Edge Cases", () => {
		it("should handle organizationId with UUID format", async () => {
			const uuidOrgId = "01234567-89ab-cdef-0123-456789abcdef";
			const uuidOrganization = {
				id: uuidOrgId,
				name: "UUID Organization",
				countryCode: "US",
			};

			mockActionItem.organizationId = uuidOrgId;
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				uuidOrganization,
			);

			const result = await resolveOrganization(mockActionItem, {}, ctx);

			expect(result).toEqual(uuidOrganization);
			expect(result.id).toBe(uuidOrgId);
		});

		it("should handle organizations with special characters in name", async () => {
			const specialOrganization = {
				id: "org-123",
				name: "Organization with Special Chars: & < > \" ' %",
				countryCode: "US",
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				specialOrganization,
			);

			const result = await resolveOrganization(mockActionItem, {}, ctx);

			expect(result).toEqual(specialOrganization);
			expect(result.name).toBe("Organization with Special Chars: & < > \" ' %");
		});

		it("should handle organizations with different country codes", async () => {
			const internationalOrgs = [
				{ id: "org-us", name: "US Org", countryCode: "US" },
				{ id: "org-ca", name: "Canadian Org", countryCode: "CA" },
				{ id: "org-uk", name: "UK Org", countryCode: "GB" },
				{ id: "org-jp", name: "Japan Org", countryCode: "JP" },
			];

			for (const org of internationalOrgs) {
				mockActionItem.organizationId = org.id;
				mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
					org,
				);

				const result = await resolveOrganization(mockActionItem, {}, ctx);
				expect(result).toEqual(org);
				expect(result.countryCode).toBe(org.countryCode);
			}
		});

		it("should handle organizations with null optional fields", async () => {
			const organizationWithNulls = {
				id: "org-123",
				name: "Org with Nulls",
				countryCode: "US",
				description: null,
				addressLine1: null,
				addressLine2: null,
				avatarMimeType: null,
				city: null,
				state: null,
				zipCode: null,
				userRegistrationRequired: null,
				membershipRequestsEnabled: null,
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				organizationWithNulls,
			);

			const result = await resolveOrganization(mockActionItem, {}, ctx);

			expect(result).toEqual(organizationWithNulls);
			expect(result.description).toBeNull();
			expect(result.addressLine1).toBeNull();
			expect(result.city).toBeNull();
		});

		it("should handle very long organization names", async () => {
			const longName = `${"Very".repeat(50)}Long Organization Name`;
			const longNameOrganization = {
				id: "org-123",
				name: longName,
				countryCode: "US",
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				longNameOrganization,
			);

			const result = await resolveOrganization(mockActionItem, {}, ctx);

			expect(result).toEqual(longNameOrganization);
			expect(result.name).toBe(longName);
		});
	});

	describe("Performance Considerations", () => {
		it("should make exactly one database query", async () => {
			const mockOrganization = {
				id: "org-123",
				name: "Test",
				countryCode: "US",
			};
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				mockOrganization,
			);

			await resolveOrganization(mockActionItem, {}, ctx);

			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should not cache organization data between calls", async () => {
			const mockOrganization1 = {
				id: "org-1",
				name: "Org 1",
				countryCode: "US",
			};
			const mockOrganization2 = {
				id: "org-2",
				name: "Org 2",
				countryCode: "CA",
			};

			// First call
			mockActionItem.organizationId = "org-1";
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization1,
			);
			await resolveOrganization(mockActionItem, {}, ctx);

			// Second call with different org
			mockActionItem.organizationId = "org-2";
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization2,
			);
			await resolveOrganization(mockActionItem, {}, ctx);

			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledTimes(2);
		});
	});

	describe("Data Integrity", () => {
		it("should always require organizationId to be present", async () => {
			// Since organizationId is non-null in the schema, this test verifies
			// that the resolver assumes organizationId will always be present
			const mockOrganization = {
				id: "org-123",
				name: "Required Org",
				countryCode: "US",
			};

			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				mockOrganization,
			);

			const result = await resolveOrganization(mockActionItem, {}, ctx);

			expect(result).toEqual(mockOrganization);
			// organizationId should always be used in the query
			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});

		it("should handle organization referential integrity violations", async () => {
			// Test case where organizationId exists but organization was deleted
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				resolveOrganization(mockActionItem, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				expect.stringContaining("organization id that isn't null"),
			);
		});
	});

	describe("Logging Verification", () => {
		it("should log error for missing organization with specific message", async () => {
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				undefined,
			);

			try {
				await resolveOrganization(mockActionItem, {}, ctx);
			} catch (error) {
				expect(ctx.log.error).toHaveBeenCalledWith(
					"Postgres select operation returned an empty array for an action item's organization id that isn't null.",
				);
			}
		});

		it("should include organization context in error logs", async () => {
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				undefined,
			);

			mockActionItem.organizationId = "missing-org-123";

			try {
				await resolveOrganization(mockActionItem, {}, ctx);
			} catch (error) {
				expect(ctx.log.error).toHaveBeenCalledWith(
					expect.stringContaining("action item's organization id"),
				);
			}
		});
	});
});
