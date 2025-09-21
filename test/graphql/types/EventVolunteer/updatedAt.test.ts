import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventVolunteerUpdatedAtResolver } from "~/src/graphql/types/EventVolunteer/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock parent EventVolunteer
const mockEventVolunteer = {
	id: "volunteer-123",
	userId: "user-123",
	eventId: "event-123",
	creatorId: "creator-123",
	hasAccepted: true,
	isPublic: true,
	hoursVolunteered: "5.50",
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: new Date("2024-01-01T12:00:00Z"),
	updaterId: "updater-123",
};

const mockEventVolunteerWithNullUpdatedAt = {
	...mockEventVolunteer,
	updatedAt: null,
};

describe("EventVolunteerUpdatedAtResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerUpdatedAtResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerUpdatedAtResolver(mockEventVolunteer, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("UpdatedAt Field Resolution", () => {
		it("should return updatedAt date when authenticated", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await EventVolunteerUpdatedAtResolver(
				mockEventVolunteer,
				{},
				context,
			);

			expect(result).toEqual(mockEventVolunteer.updatedAt);
			expect(result instanceof Date).toBe(true);
		});

		it("should return null when updatedAt is null", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await EventVolunteerUpdatedAtResolver(
				mockEventVolunteerWithNullUpdatedAt,
				{},
				context,
			);

			expect(result).toBeNull();
		});

		it("should return exact same date object from parent", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await EventVolunteerUpdatedAtResolver(
				mockEventVolunteer,
				{},
				context,
			);

			expect(result).toBe(mockEventVolunteer.updatedAt);
		});

		it("should handle different updatedAt values", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const differentUpdatedAt = new Date("2023-12-25T15:30:00Z");
			const volunteerWithDifferentDate = {
				...mockEventVolunteer,
				updatedAt: differentUpdatedAt,
			};

			const result = await EventVolunteerUpdatedAtResolver(
				volunteerWithDifferentDate,
				{},
				context,
			);

			expect(result).toEqual(differentUpdatedAt);
			expect(result?.getTime()).toBe(differentUpdatedAt.getTime());
		});
	});

	describe("Edge Cases", () => {
		it("should handle very old dates", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const oldDate = new Date("1990-01-01T00:00:00Z");
			const oldVolunteer = {
				...mockEventVolunteer,
				updatedAt: oldDate,
			};

			const result = await EventVolunteerUpdatedAtResolver(
				oldVolunteer,
				{},
				context,
			);

			expect(result).toEqual(oldDate);
		});

		it("should handle future dates", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const futureDate = new Date("2030-12-31T23:59:59Z");
			const futureVolunteer = {
				...mockEventVolunteer,
				updatedAt: futureDate,
			};

			const result = await EventVolunteerUpdatedAtResolver(
				futureVolunteer,
				{},
				context,
			);

			expect(result).toEqual(futureDate);
		});

		it("should maintain date timezone information", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const timezoneDate = new Date("2024-01-01T10:00:00+05:30");
			const volunteerWithTimezone = {
				...mockEventVolunteer,
				updatedAt: timezoneDate,
			};

			const result = await EventVolunteerUpdatedAtResolver(
				volunteerWithTimezone,
				{},
				context,
			);

			expect(result).toEqual(timezoneDate);
			expect(result?.getTimezoneOffset()).toBe(
				timezoneDate.getTimezoneOffset(),
			);
		});

		it("should handle undefined updatedAt", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const volunteerWithUndefined = {
				...mockEventVolunteer,
				updatedAt: undefined as unknown as Date | null,
			};

			const result = await EventVolunteerUpdatedAtResolver(
				volunteerWithUndefined,
				{},
				context,
			);

			expect(result).toBeUndefined();
		});
	});

	describe("Performance", () => {
		it("should not make any database queries", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			await EventVolunteerUpdatedAtResolver(mockEventVolunteer, {}, context);

			// Verify no database queries are made since it's just returning parent field
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
			expect(
				mocks.drizzleClient.query.eventsTable.findFirst,
			).not.toHaveBeenCalled();
			expect(
				mocks.drizzleClient.query.eventVolunteersTable.findFirst,
			).not.toHaveBeenCalled();
		});
	});
});
