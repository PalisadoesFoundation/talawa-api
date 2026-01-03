import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VolunteerMembershipCreatedAtResolver } from "~/src/graphql/types/EventVolunteerMembership/createdAt";
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

describe("VolunteerMembershipCreatedAtResolver", () => {
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
				VolunteerMembershipCreatedAtResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipCreatedAtResolver(
					mockVolunteerMembership,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("CreatedAt Retrieval", () => {
		it("should return createdAt date when authenticated", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipCreatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).toEqual(mockVolunteerMembership.createdAt);
			expect(result).toBeInstanceOf(Date);
		});

		it("should return the exact same date object from parent", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipCreatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).toBe(mockVolunteerMembership.createdAt);
		});

		it("should handle different dates correctly", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const differentDate = new Date("2023-06-15T14:30:00Z");
			const membershipWithDifferentDate = {
				...mockVolunteerMembership,
				createdAt: differentDate,
			};

			const result = await VolunteerMembershipCreatedAtResolver(
				membershipWithDifferentDate,
				{},
				context,
			);

			expect(result).toEqual(differentDate);
			expect(result.getFullYear()).toBe(2023);
			expect(result.getMonth()).toBe(5); // June is month 5 (0-indexed)
			expect(result.getDate()).toBe(15);
		});
	});

	describe("Date Format Handling", () => {
		it("should handle recent dates", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const recentDate = new Date("2024-12-01T09:15:30Z");
			const membershipWithRecentDate = {
				...mockVolunteerMembership,
				createdAt: recentDate,
			};

			const result = await VolunteerMembershipCreatedAtResolver(
				membershipWithRecentDate,
				{},
				context,
			);

			expect(result).toEqual(recentDate);
			expect(result.getFullYear()).toBe(2024);
			expect(result.getMonth()).toBe(11); // December is month 11
		});

		it("should handle older dates", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const oldDate = new Date("2020-03-10T16:45:00Z");
			const membershipWithOldDate = {
				...mockVolunteerMembership,
				createdAt: oldDate,
			};

			const result = await VolunteerMembershipCreatedAtResolver(
				membershipWithOldDate,
				{},
				context,
			);

			expect(result).toEqual(oldDate);
			expect(result.getFullYear()).toBe(2020);
			expect(result.getMonth()).toBe(2); // March is month 2
		});

		it("should preserve timezone information", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const utcDate = new Date("2024-01-01T10:00:00.000Z");
			const membershipWithUTCDate = {
				...mockVolunteerMembership,
				createdAt: utcDate,
			};

			const result = await VolunteerMembershipCreatedAtResolver(
				membershipWithUTCDate,
				{},
				context,
			);

			expect(result).toEqual(utcDate);
			expect(result.toISOString()).toBe("2024-01-01T10:00:00.000Z");
		});

		it("should handle dates with milliseconds", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const dateWithMilliseconds = new Date("2024-01-01T10:00:00.123Z");
			const membershipWithMilliseconds = {
				...mockVolunteerMembership,
				createdAt: dateWithMilliseconds,
			};

			const result = await VolunteerMembershipCreatedAtResolver(
				membershipWithMilliseconds,
				{},
				context,
			);

			expect(result).toEqual(dateWithMilliseconds);
			expect(result.getMilliseconds()).toBe(123);
		});
	});

	describe("Edge Cases", () => {
		it("should handle date at epoch (1970)", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const epochDate = new Date(0);
			const membershipWithEpochDate = {
				...mockVolunteerMembership,
				createdAt: epochDate,
			};

			const result = await VolunteerMembershipCreatedAtResolver(
				membershipWithEpochDate,
				{},
				context,
			);

			expect(result).toEqual(epochDate);
			expect(result.getTime()).toBe(0);
		});

		it("should handle future dates", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const futureDate = new Date("2030-06-15T12:00:00Z"); // Use a mid-year date to avoid timezone issues
			const membershipWithFutureDate = {
				...mockVolunteerMembership,
				createdAt: futureDate,
			};

			const result = await VolunteerMembershipCreatedAtResolver(
				membershipWithFutureDate,
				{},
				context,
			);

			expect(result).toEqual(futureDate);
			expect(result.getFullYear()).toBe(2030);
		});

		it("should handle dates with different time zones", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			// Create date in different timezone but stored as UTC
			const timezoneDate = new Date("2024-01-01T05:30:00Z"); // This would be 11:00 AM IST
			const membershipWithTimezoneDate = {
				...mockVolunteerMembership,
				createdAt: timezoneDate,
			};

			const result = await VolunteerMembershipCreatedAtResolver(
				membershipWithTimezoneDate,
				{},
				context,
			);

			expect(result).toEqual(timezoneDate);
			expect(result.getUTCHours()).toBe(5);
			expect(result.getUTCMinutes()).toBe(30);
		});
	});

	describe("Data Integrity", () => {
		it("should not modify the original date object", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const originalDate = new Date("2024-01-01T10:00:00Z");
			const originalTime = originalDate.getTime();
			const membershipWithOriginalDate = {
				...mockVolunteerMembership,
				createdAt: originalDate,
			};

			const result = await VolunteerMembershipCreatedAtResolver(
				membershipWithOriginalDate,
				{},
				context,
			);

			// Verify the result is correct
			expect(result).toEqual(originalDate);
			// Verify the original date wasn't modified
			expect(originalDate.getTime()).toBe(originalTime);
		});

		it("should return date object that can be serialized", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipCreatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).toBeInstanceOf(Date);
			expect(typeof result.toISOString()).toBe("string");
			expect(typeof result.getTime()).toBe("number");
		});
	});

	describe("Performance", () => {
		it("should return date immediately without database calls", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipCreatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).toEqual(mockVolunteerMembership.createdAt);
			// Verify no database calls were made
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
			expect(mocks.drizzleClient.select).not.toHaveBeenCalled();
		});

		it("should handle multiple calls efficiently", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result1 = await VolunteerMembershipCreatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			const result2 = await VolunteerMembershipCreatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result1).toEqual(mockVolunteerMembership.createdAt);
			expect(result2).toEqual(mockVolunteerMembership.createdAt);
			expect(result1).toBe(result2); // Same reference
		});
	});

	describe("Type Safety", () => {
		it("should always return a Date object", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await VolunteerMembershipCreatedAtResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).toBeInstanceOf(Date);
			expect(typeof result.getTime).toBe("function");
			expect(typeof result.toISOString).toBe("function");
		});

		it("should handle valid Date objects from parent", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const validDate = new Date("2024-05-15T12:30:45Z");
			const membershipWithValidDate = {
				...mockVolunteerMembership,
				createdAt: validDate,
			};

			const result = await VolunteerMembershipCreatedAtResolver(
				membershipWithValidDate,
				{},
				context,
			);

			expect(result).toBeInstanceOf(Date);
			expect(result.toISOString()).toBe("2024-05-15T12:30:45.000Z");
		});
	});
});
