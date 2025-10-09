import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventVolunteerCreatedAtResolver } from "~/src/graphql/types/EventVolunteer/createdAt";
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
	updatedAt: new Date("2024-01-01T10:00:00Z"),
	updaterId: "updater-123",
	recurringEventInstanceId: null,
	isTemplate: false,
};

describe("EventVolunteerCreatedAtResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerCreatedAtResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerCreatedAtResolver(mockEventVolunteer, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("CreatedAt Field Resolution", () => {
		it("should return createdAt date when authenticated", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await EventVolunteerCreatedAtResolver(
				mockEventVolunteer,
				{},
				context,
			);

			expect(result).toEqual(mockEventVolunteer.createdAt);
			expect(result instanceof Date).toBe(true);
		});

		it("should return exact same date object from parent", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const result = await EventVolunteerCreatedAtResolver(
				mockEventVolunteer,
				{},
				context,
			);

			expect(result).toBe(mockEventVolunteer.createdAt);
		});

		it("should handle different createdAt values", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const differentCreatedAt = new Date("2023-12-25T15:30:00Z");
			const volunteerWithDifferentDate = {
				...mockEventVolunteer,
				createdAt: differentCreatedAt,
			};

			const result = await EventVolunteerCreatedAtResolver(
				volunteerWithDifferentDate,
				{},
				context,
			);

			expect(result).toEqual(differentCreatedAt);
			expect(result.getTime()).toBe(differentCreatedAt.getTime());
		});
	});

	describe("Edge Cases", () => {
		it("should handle very old dates", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const oldDate = new Date("1990-01-01T00:00:00Z");
			const oldVolunteer = {
				...mockEventVolunteer,
				createdAt: oldDate,
			};

			const result = await EventVolunteerCreatedAtResolver(
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
				createdAt: futureDate,
			};

			const result = await EventVolunteerCreatedAtResolver(
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
				createdAt: timezoneDate,
			};

			const result = await EventVolunteerCreatedAtResolver(
				volunteerWithTimezone,
				{},
				context,
			);

			expect(result).toEqual(timezoneDate);
			expect(result.getTimezoneOffset()).toBe(timezoneDate.getTimezoneOffset());
		});
	});

	describe("Performance", () => {
		it("should not make any database queries", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			await EventVolunteerCreatedAtResolver(mockEventVolunteer, {}, context);

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
