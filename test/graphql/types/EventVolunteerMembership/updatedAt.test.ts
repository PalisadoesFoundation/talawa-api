import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VolunteerMembershipUpdatedAtResolver } from "~/src/graphql/types/EventVolunteerMembership/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock parent VolunteerMembership
const mockVolunteerMembership = {
	id: "membership-123",
	volunteerId: "volunteer-123",
	groupId: "group-123" as string | null,
	eventId: "event-123",
	status: "accepted" as "accepted" | "invited" | "requested" | "rejected",
	createdBy: "creator-123" as string | null,
	updatedBy: "updater-123" as string | null,
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: new Date("2024-01-01T12:00:00Z") as Date | null,
};

const mockVolunteerMembershipWithNullUpdatedAt = {
	...mockVolunteerMembership,
	updatedAt: null,
};

describe("VolunteerMembershipUpdatedAtResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				VolunteerMembershipUpdatedAtResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipUpdatedAtResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("UpdatedAt Retrieval", () => {
		it("should return updatedAt date when authenticated and updatedAt exists", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipUpdatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).toEqual(mockVolunteerMembership.updatedAt);
			expect(result).toBeInstanceOf(Date);
		});

		it("should return null when updatedAt is null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipUpdatedAtResolver(
				mockVolunteerMembershipWithNullUpdatedAt,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should return the exact same date object from parent when it exists", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipUpdatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).toBe(mockVolunteerMembership.updatedAt);
		});

		it("should handle different dates correctly", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const differentDate = new Date("2023-08-20T16:45:30Z");
			const membershipWithDifferentDate = {
				...mockVolunteerMembership,
				updatedAt: differentDate as Date | null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				membershipWithDifferentDate,
				{},
				context,
			);

			expect(result).toEqual(differentDate);
			expect(result?.getFullYear()).toBe(2023);
			expect(result?.getMonth()).toBe(7); // August is month 7 (0-indexed)
			expect(result?.getDate()).toBe(20);
		});
	});

	describe("Nullable Handling", () => {
		it("should handle null updatedAt gracefully", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipUpdatedAtResolver(
				mockVolunteerMembershipWithNullUpdatedAt,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should correctly differentiate between null and valid date", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			// Test with null
			const resultNull = await VolunteerMembershipUpdatedAtResolver(
				mockVolunteerMembershipWithNullUpdatedAt,
				{},
				context,
			);

			// Test with valid date
			const resultDate = await VolunteerMembershipUpdatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(resultNull).toBeNull();
			expect(resultDate).toBeInstanceOf(Date);
			expect(resultDate).not.toBeNull();
		});
	});

	describe("Date Format Handling", () => {
		it("should handle recent dates", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const recentDate = new Date("2024-12-15T14:30:45Z");
			const membershipWithRecentDate = {
				...mockVolunteerMembership,
				updatedAt: recentDate as Date | null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				membershipWithRecentDate,
				{},
				context,
			);

			expect(result).toEqual(recentDate);
			expect(result?.getFullYear()).toBe(2024);
			expect(result?.getMonth()).toBe(11); // December is month 11
		});

		it("should handle older dates", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const oldDate = new Date("2019-02-28T08:15:00Z");
			const membershipWithOldDate = {
				...mockVolunteerMembership,
				updatedAt: oldDate as Date | null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				membershipWithOldDate,
				{},
				context,
			);

			expect(result).toEqual(oldDate);
			expect(result?.getFullYear()).toBe(2019);
			expect(result?.getMonth()).toBe(1); // February is month 1
		});

		it("should preserve timezone information", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const utcDate = new Date("2024-01-01T15:30:00.000Z");
			const membershipWithUTCDate = {
				...mockVolunteerMembership,
				updatedAt: utcDate as Date | null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				membershipWithUTCDate,
				{},
				context,
			);

			expect(result).toEqual(utcDate);
			expect(result?.toISOString()).toBe("2024-01-01T15:30:00.000Z");
		});

		it("should handle dates with milliseconds", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const dateWithMilliseconds = new Date("2024-01-01T12:00:00.456Z");
			const membershipWithMilliseconds = {
				...mockVolunteerMembership,
				updatedAt: dateWithMilliseconds as Date | null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				membershipWithMilliseconds,
				{},
				context,
			);

			expect(result).toEqual(dateWithMilliseconds);
			expect(result?.getMilliseconds()).toBe(456);
		});
	});

	describe("Edge Cases", () => {
		it("should handle date at epoch (1970)", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const epochDate = new Date(0);
			const membershipWithEpochDate = {
				...mockVolunteerMembership,
				updatedAt: epochDate as Date | null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				membershipWithEpochDate,
				{},
				context,
			);

			expect(result).toEqual(epochDate);
			expect(result?.getTime()).toBe(0);
		});

		it("should handle future dates", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const futureDate = new Date("2030-06-15T18:45:30Z");
			const membershipWithFutureDate = {
				...mockVolunteerMembership,
				updatedAt: futureDate as Date | null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				membershipWithFutureDate,
				{},
				context,
			);

			expect(result).toEqual(futureDate);
			expect(result?.getFullYear()).toBe(2030);
		});

		it("should handle dates with different time zones", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			// Create date in different timezone but stored as UTC
			const timezoneDate = new Date("2024-01-01T18:30:00Z"); // This would be midnight IST next day
			const membershipWithTimezoneDate = {
				...mockVolunteerMembership,
				updatedAt: timezoneDate as Date | null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				membershipWithTimezoneDate,
				{},
				context,
			);

			expect(result).toEqual(timezoneDate);
			expect(result?.getUTCHours()).toBe(18);
			expect(result?.getUTCMinutes()).toBe(30);
		});

		it("should handle updatedAt being later than createdAt", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const createdAt = new Date("2024-01-01T10:00:00Z");
			const updatedAt = new Date("2024-01-01T15:30:00Z");
			const membershipWithLaterUpdate = {
				...mockVolunteerMembership,
				createdAt,
				updatedAt: updatedAt as Date | null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				membershipWithLaterUpdate,
				{},
				context,
			);

			expect(result).toEqual(updatedAt);
			expect(result?.getTime()).toBeGreaterThan(createdAt.getTime());
		});
	});

	describe("Data Integrity", () => {
		it("should not modify the original date object", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const originalDate = new Date("2024-01-01T12:00:00Z");
			const originalTime = originalDate.getTime();
			const membershipWithOriginalDate = {
				...mockVolunteerMembership,
				updatedAt: originalDate as Date | null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				membershipWithOriginalDate,
				{},
				context,
			);

			// Verify the result is correct
			expect(result).toEqual(originalDate);
			// Verify the original date wasn't modified
			expect(originalDate.getTime()).toBe(originalTime);
		});

		it("should return date object that can be serialized when not null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipUpdatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).toBeInstanceOf(Date);
			expect(typeof result?.toISOString()).toBe("string");
			expect(typeof result?.getTime()).toBe("number");
		});

		it("should handle null without throwing errors", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipUpdatedAtResolver(
				mockVolunteerMembershipWithNullUpdatedAt,
				{},
				context,
			);

			expect(result).toBeNull();
			expect(() => JSON.stringify(result)).not.toThrow();
		});
	});

	describe("Performance", () => {
		it("should return date/null immediately without database calls", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipUpdatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).toEqual(mockVolunteerMembership.updatedAt);
			// Verify no database calls were made
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
			expect(mocks.drizzleClient.select).not.toHaveBeenCalled();
		});

		it("should handle multiple calls efficiently", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result1 = await VolunteerMembershipUpdatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			const result2 = await VolunteerMembershipUpdatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result1).toEqual(mockVolunteerMembership.updatedAt);
			expect(result2).toEqual(mockVolunteerMembership.updatedAt);
			expect(result1).toBe(result2); // Same reference
		});
	});

	describe("Type Safety", () => {
		it("should return Date object or null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipUpdatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			// Should be a Date instance
			expect(result).toBeInstanceOf(Date);
			expect(typeof result?.getTime).toBe("function");
			expect(typeof result?.toISOString).toBe("function");
		});

		it("should return null for null input", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipUpdatedAtResolver(
				mockVolunteerMembershipWithNullUpdatedAt,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should handle valid Date objects from parent", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const validDate = new Date("2024-07-20T09:15:30Z");
			const membershipWithValidDate = {
				...mockVolunteerMembership,
				updatedAt: validDate as Date | null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				membershipWithValidDate,
				{},
				context,
			);

			expect(result).toBeInstanceOf(Date);
			expect(result?.toISOString()).toBe("2024-07-20T09:15:30.000Z");
		});
	});

	describe("Real-world Scenarios", () => {
		it("should handle membership that was never updated (null updatedAt)", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const neverUpdatedMembership = {
				...mockVolunteerMembership,
				updatedAt: null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				neverUpdatedMembership,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should handle membership that was updated recently", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const recentlyUpdated = new Date(Date.now() - 60000); // 1 minute ago
			const recentlyUpdatedMembership = {
				...mockVolunteerMembership,
				updatedAt: recentlyUpdated as Date | null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				recentlyUpdatedMembership,
				{},
				context,
			);

			expect(result).toEqual(recentlyUpdated);
			expect(result).toBeInstanceOf(Date);
		});

		it("should handle membership updated multiple times", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const multipleUpdatesDate = new Date("2024-01-15T14:20:30Z");
			const multipleUpdatesMembership = {
				...mockVolunteerMembership,
				createdAt: new Date("2024-01-01T10:00:00Z"),
				updatedAt: multipleUpdatesDate as Date | null,
			};

			const result = await VolunteerMembershipUpdatedAtResolver(
				multipleUpdatesMembership,
				{},
				context,
			);

			expect(result).toEqual(multipleUpdatesDate);
			expect(result?.getTime()).toBeGreaterThan(
				multipleUpdatesMembership.createdAt.getTime(),
			);
		});
	});
});
