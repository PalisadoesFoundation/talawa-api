import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Advertisement as AdvertisementType } from "~/src/graphql/types/Advertisement/Advertisement";
import { resolveOrganization } from "~/src/graphql/types/Advertisement/organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Advertisement Resolver - Organization Field", () => {
	let ctx: GraphQLContext;
	let mockAdvertisement: AdvertisementType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(async () => {
		mockAdvertisement = {
			id: "ad-123",
			organizationId: "org-123",
			name: "Test Advertisement",
			description: "Test Description",
			type: "banner",
			startAt: new Date("2024-01-01T00:00:00Z"),
			endAt: new Date("2024-12-31T23:59:59Z"),
			creatorId: "user-123",
			updaterId: null,
			createdAt: new Date("2024-01-01T00:00:00Z"),
			updatedAt: new Date("2024-01-01T00:00:00Z"),
			attachments: [],
		};

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

			const result = await resolveOrganization(mockAdvertisement, {}, ctx);

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
				resolveOrganization(mockAdvertisement, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an advertisement's organization id that isn't null.",
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

			mocks.drizzleClient.query.organizationsTable.findFirst.mockImplementation(
				((config: { where?: unknown }) => {
					expect(config.where).toBeDefined();
					return Promise.resolve(mockOrganization);
				}) as unknown as typeof mocks.drizzleClient.query.organizationsTable.findFirst,
			);

			await resolveOrganization(mockAdvertisement, {}, ctx);

			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledTimes(1);
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
			mockAdvertisement.organizationId = "org-111";
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization1,
			);

			let result = await resolveOrganization(mockAdvertisement, {}, ctx);
			expect(result).toEqual(mockOrganization1);

			// Test with second organization ID
			mockAdvertisement.organizationId = "org-222";
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization2,
			);

			result = await resolveOrganization(mockAdvertisement, {}, ctx);
			expect(result).toEqual(mockOrganization2);

			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledTimes(2);
		});
	});

	describe("Error Handling", () => {
		it("should log error with correct message when organization is not found", async () => {
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				undefined,
			);
			expect.assertions(4);

			try {
				await resolveOrganization(mockAdvertisement, {}, ctx);
				expect.fail("Expect resolveOrganization to throw");
			} catch (error) {
				expect(ctx.log.error).toHaveBeenCalledWith(
					"Postgres select operation returned an empty array for an advertisement's organization id that isn't null.",
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
				resolveOrganization(mockAdvertisement, {}, ctx),
			).rejects.toThrow(databaseError);

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

			await resolveOrganization(mockAdvertisement, {}, ctx);

			expect(ctx.log.error).not.toHaveBeenCalled();
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

			const result = await resolveOrganization(mockAdvertisement, {}, ctx);

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

			const result = await resolveOrganization(mockAdvertisement, {}, ctx);

			expect(result).toEqual(minimalOrganization);
			expect(result).toHaveProperty("id", "org-123");
			expect(result).toHaveProperty("name", "Minimal Organization");
			expect(result).toHaveProperty("countryCode", "US");
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

			mockAdvertisement.organizationId = uuidOrgId;
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				uuidOrganization,
			);

			const result = await resolveOrganization(mockAdvertisement, {}, ctx);

			expect(result).toEqual(uuidOrganization);
			expect(result).toHaveProperty("id", uuidOrgId);
			expect(result).toHaveProperty("name", "UUID Organization");
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

			const result = await resolveOrganization(mockAdvertisement, {}, ctx);

			expect(result).toEqual(specialOrganization);
			expect(result).toHaveProperty("id", "org-123");
			expect(result).toHaveProperty(
				"name",
				"Organization with Special Chars: & < > \" ' %",
			);
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

			await resolveOrganization(mockAdvertisement, {}, ctx);

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

			mockAdvertisement.organizationId = "org-1";
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization1,
			);
			await resolveOrganization(mockAdvertisement, {}, ctx);

			mockAdvertisement.organizationId = "org-2";
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValueOnce(
				mockOrganization2,
			);
			await resolveOrganization(mockAdvertisement, {}, ctx);

			expect(
				mocks.drizzleClient.query.organizationsTable.findFirst,
			).toHaveBeenCalledTimes(2);
		});
	});

	describe("Data Integrity", () => {
		it("should handle organization referential integrity violations", async () => {
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				resolveOrganization(mockAdvertisement, {}, ctx),
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
				expect.assertions(1);
				await resolveOrganization(mockAdvertisement, {}, ctx);
				expect.fail("Expected error to be thrown");
			} catch (_error) {
				expect(ctx.log.error).toHaveBeenCalledWith(
					"Postgres select operation returned an empty array for an advertisement's organization id that isn't null.",
				);
			}
		});

		it("should include advertisement context in error logs", async () => {
			mocks.drizzleClient.query.organizationsTable.findFirst.mockResolvedValue(
				undefined,
			);

			mockAdvertisement.organizationId = "missing-org-123";

			try {
				expect.assertions(1);
				await resolveOrganization(mockAdvertisement, {}, ctx);
				expect.fail("Expected error to be thrown");
			} catch (_error) {
				expect(ctx.log.error).toHaveBeenCalledWith(
					expect.stringContaining("advertisement's organization id"),
				);
			}
		});
	});
});
