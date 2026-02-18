import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveOrganization } from "~/src/graphql/types/Venue/organization";
import type { Venue as VenueType } from "~/src/graphql/types/Venue/Venue";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Venue Resolver - Organization Field", () => {
	let ctx: GraphQLContext;
	let mockVenue: VenueType;

	beforeEach(() => {
		mockVenue = {
			id: "venue-123",
			organizationId: "org-123",
			name: "Test Venue",
			description: "Test Venue Description",
			capacity: 100,
			creatorId: "user-admin",
			updaterId: null,
			createdAt: new Date("2024-01-01T09:00:00Z"),
			updatedAt: new Date("2024-01-01T10:00:00Z"),
			attachments: null,
		};

		const { context } = createMockGraphQLContext(true, "user-123");
		ctx = context;
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
				postalCode: "12345",
				creatorId: "user-admin",
				updaterId: null,
			};

			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(mockOrganization);

			const result = await resolveOrganization(mockVenue, {}, ctx);

			expect(result).toEqual(mockOrganization);
			expect(ctx.dataloaders.organization.load).toHaveBeenCalledWith("org-123");
		});

		it("should throw unexpected error when organization does not exist", async () => {
			ctx.dataloaders.organization.load = vi.fn().mockResolvedValue(null);

			await expect(resolveOrganization(mockVenue, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				{ venueId: mockVenue.id, organizationId: mockVenue.organizationId },
				"DataLoader returned null for a venue's organization id that isn't null.",
			);
		});
	});

	describe("DataLoader Query Verification", () => {
		it("should call DataLoader with correct organization ID", async () => {
			const mockOrganization = {
				id: "org-123",
				name: "Test Organization",
				countryCode: "US",
			};

			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(mockOrganization);

			await resolveOrganization(mockVenue, {}, ctx);

			expect(ctx.dataloaders.organization.load).toHaveBeenCalledTimes(1);
			expect(ctx.dataloaders.organization.load).toHaveBeenCalledWith("org-123");
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
			mockVenue.organizationId = "org-111";
			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(mockOrganization1);

			let result = await resolveOrganization(mockVenue, {}, ctx);
			expect(result).toEqual(mockOrganization1);

			// Test with second organization ID
			mockVenue.organizationId = "org-222";
			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(mockOrganization2);

			result = await resolveOrganization(mockVenue, {}, ctx);
			expect(result).toEqual(mockOrganization2);
		});

		it("should use organizationId from parent correctly", async () => {
			const mockOrganization = {
				id: "custom-org-id",
				name: "Custom Org",
				countryCode: "UK",
			};

			mockVenue.organizationId = "custom-org-id";
			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(mockOrganization);

			await resolveOrganization(mockVenue, {}, ctx);

			expect(ctx.dataloaders.organization.load).toHaveBeenCalledWith(
				"custom-org-id",
			);
		});
	});

	describe("Error Handling", () => {
		it("should log error with correct message when organization is not found", async () => {
			ctx.dataloaders.organization.load = vi.fn().mockResolvedValue(null);

			try {
				await resolveOrganization(mockVenue, {}, ctx);
			} catch (error) {
				expect(ctx.log.error).toHaveBeenCalledWith(
					{ venueId: mockVenue.id, organizationId: mockVenue.organizationId },
					"DataLoader returned null for a venue's organization id that isn't null.",
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

		it("should handle DataLoader errors gracefully", async () => {
			const databaseError = new Error("Database connection failed");
			ctx.dataloaders.organization.load = vi
				.fn()
				.mockRejectedValue(databaseError);

			await expect(resolveOrganization(mockVenue, {}, ctx)).rejects.toThrow(
				databaseError,
			);
		});

		it("should not log errors for successful operations", async () => {
			const mockOrganization = {
				id: "org-123",
				name: "Success Organization",
				countryCode: "US",
			};

			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(mockOrganization);

			await resolveOrganization(mockVenue, {}, ctx);

			expect(ctx.log.error).not.toHaveBeenCalled();
		});

		it("should handle query timeout errors", async () => {
			const timeoutError = new Error("Query timeout");
			timeoutError.name = "TimeoutError";
			ctx.dataloaders.organization.load = vi
				.fn()
				.mockRejectedValue(timeoutError);

			await expect(resolveOrganization(mockVenue, {}, ctx)).rejects.toThrow(
				timeoutError,
			);
		});

		it("should handle database constraint violations", async () => {
			const constraintError = new Error("Foreign key constraint violation");
			constraintError.name = "PostgresError";
			ctx.dataloaders.organization.load = vi
				.fn()
				.mockRejectedValue(constraintError);

			await expect(resolveOrganization(mockVenue, {}, ctx)).rejects.toThrow(
				constraintError,
			);
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
				postalCode: "12345",
				creatorId: "user-admin",
				updaterId: null,
			};

			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(mockOrganization);

			const result = await resolveOrganization(mockVenue, {}, ctx);

			expect(result).toEqual(mockOrganization);
			expect(result).toHaveProperty("id", "org-123");
			expect(result).toHaveProperty("name", "Complete Organization");
			expect(result).toHaveProperty(
				"description",
				"A comprehensive organization",
			);
			expect(result).toHaveProperty("countryCode", "US");
			expect(result).toHaveProperty("city", "Business City");
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
				postalCode: null,
				description: null,
				creatorId: "user-admin",
				updaterId: null,
			};

			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(minimalOrganization);

			const result = await resolveOrganization(mockVenue, {}, ctx);

			expect(result).toEqual(minimalOrganization);
			expect(result).toHaveProperty("id", "org-123");
			expect(result).toHaveProperty("name", "Minimal Organization");
			expect(result).toHaveProperty("countryCode", "US");
		});
	});

	describe("Edge Cases", () => {
		it("should handle organizationId with UUID format", async () => {
			const uuidOrgId = "01234567-89ab-4def-a123-456789abcdef";
			const uuidOrganization = {
				id: uuidOrgId,
				name: "UUID Organization",
				countryCode: "US",
			};

			mockVenue.organizationId = uuidOrgId;
			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(uuidOrganization);

			const result = await resolveOrganization(mockVenue, {}, ctx);

			expect(result).toEqual(uuidOrganization);
			expect(result.id).toBe(uuidOrgId);
		});

		it("should handle organizations with special characters in name", async () => {
			const specialOrganization = {
				id: "org-123",
				name: "Organization with Special Chars: & < > \" ' %",
				countryCode: "US",
			};

			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(specialOrganization);

			const result = await resolveOrganization(mockVenue, {}, ctx);

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
				mockVenue.organizationId = org.id;
				ctx.dataloaders.organization.load = vi.fn().mockResolvedValue(org);

				const result = await resolveOrganization(mockVenue, {}, ctx);
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
				postalCode: null,
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
				creatorId: "user-admin",
				updaterId: null,
			};

			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(organizationWithNulls);

			const result = await resolveOrganization(mockVenue, {}, ctx);

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

			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(longNameOrganization);

			const result = await resolveOrganization(mockVenue, {}, ctx);

			expect(result).toEqual(longNameOrganization);
			expect(result.name).toBe(longName);
		});
	});

	describe("Performance Considerations", () => {
		it("should make exactly one DataLoader call", async () => {
			const mockOrganization = {
				id: "org-123",
				name: "Test",
				countryCode: "US",
			};
			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(mockOrganization);

			await resolveOrganization(mockVenue, {}, ctx);

			expect(ctx.dataloaders.organization.load).toHaveBeenCalledTimes(1);
		});

		it("should use DataLoader for batching", async () => {
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
			mockVenue.organizationId = "org-1";
			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(mockOrganization1);
			await resolveOrganization(mockVenue, {}, ctx);

			// Second call with different org
			mockVenue.organizationId = "org-2";
			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(mockOrganization2);
			await resolveOrganization(mockVenue, {}, ctx);

			// Each call uses DataLoader
			expect(ctx.dataloaders.organization.load).toHaveBeenCalledWith("org-2");
		});
	});

	describe("Data Integrity", () => {
		it("should always require organizationId to be present", async () => {
			const mockOrganization = {
				id: "org-123",
				name: "Required Org",
				countryCode: "US",
			};

			ctx.dataloaders.organization.load = vi
				.fn()
				.mockResolvedValue(mockOrganization);

			const result = await resolveOrganization(mockVenue, {}, ctx);

			expect(result).toEqual(mockOrganization);
			expect(ctx.dataloaders.organization.load).toHaveBeenCalledWith("org-123");
		});

		it("should handle organization referential integrity violations", async () => {
			ctx.dataloaders.organization.load = vi.fn().mockResolvedValue(null);

			await expect(resolveOrganization(mockVenue, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				expect.objectContaining({
					venueId: mockVenue.id,
					organizationId: mockVenue.organizationId,
				}),
				expect.stringContaining("venue's organization id"),
			);
		});
	});

	describe("Logging Verification", () => {
		it("should log error for missing organization with specific message", async () => {
			ctx.dataloaders.organization.load = vi.fn().mockResolvedValue(null);

			try {
				await resolveOrganization(mockVenue, {}, ctx);
			} catch (_error) {
				expect(ctx.log.error).toHaveBeenCalledWith(
					expect.objectContaining({
						venueId: mockVenue.id,
						organizationId: mockVenue.organizationId,
					}),
					expect.stringContaining("DataLoader returned null"),
				);
			}
		});

		it("should include venue context in error logs", async () => {
			ctx.dataloaders.organization.load = vi.fn().mockResolvedValue(null);

			mockVenue.organizationId = "missing-org-123";

			try {
				await resolveOrganization(mockVenue, {}, ctx);
			} catch (_error) {
				expect(ctx.log.error).toHaveBeenCalledWith(
					expect.objectContaining({
						venueId: mockVenue.id,
						organizationId: "missing-org-123",
					}),
					expect.stringContaining("venue's organization id"),
				);
			}
		});
	});
});
