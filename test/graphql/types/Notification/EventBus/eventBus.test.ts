import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { NotificationEventBus } from "~/src/graphql/types/Notification/EventBus/eventBus";
import {
	NotificationChannelType,
	NotificationEngine,
	NotificationTargetType,
} from "~/src/graphql/types/Notification/Notification_engine";

// Unit tests for NotificationEventBus
describe("NotificationEventBus", () => {
	let bus: NotificationEventBus;
	let mockCtx: GraphQLContext;
	let createNotificationSpy: MockInstance;
	let infoSpy: MockInstance;
	let errorSpy: MockInstance;

	beforeEach(() => {
		// Create fresh bus instance for each test
		bus = new NotificationEventBus();

		// Create mock GraphQL context
		mockCtx = {
			log: {
				info: vi.fn(),
				error: vi.fn(),
			},
			currentClient: {
				isAuthenticated: true,
				user: { id: "sender-user-id" },
			},
			drizzleClient: {},
		} as unknown as GraphQLContext;

		createNotificationSpy = vi
			.spyOn(NotificationEngine.prototype, "createNotification")
			.mockResolvedValue("mock-notification-id");

		infoSpy = vi.spyOn(mockCtx.log, "info");
		errorSpy = vi.spyOn(mockCtx.log, "error");
	});

	afterEach(() => {
		// Clean up spies and remove all listeners
		vi.restoreAllMocks();
		bus.removeAllListeners();
	});

	function waitForSetImmediate(): Promise<void> {
		return new Promise((resolve) => setImmediate(resolve));
	}

	describe("emitPostCreated", () => {
		it("should emit 'post.created' event with correct data", async () => {
			const data = {
				postId: "post-123",
				organizationId: "org-456",
				authorName: "John Doe",
				organizationName: "Test Organization",
				postCaption: "Test post caption",
			};

			const eventListener = vi.fn();
			bus.on("post.created", eventListener);

			await bus.emitPostCreated(data, mockCtx);

			expect(eventListener).toHaveBeenCalledWith(data);
		});

		it("should call NotificationEngine.createNotification with correct parameters", async () => {
			const data = {
				postId: "post-123",
				organizationId: "org-456",
				authorName: "John Doe",
				organizationName: "Test Organization",
				postCaption: "Test post caption",
			};

			await bus.emitPostCreated(data, mockCtx);
			await waitForSetImmediate();

			expect(createNotificationSpy).toHaveBeenCalledWith(
				"post_created",
				{
					authorName: "John Doe",
					organizationName: "Test Organization",
					postCaption: "Test post caption",
					postId: "post-123",
					postUrl: "/post/post-123",
				},
				{
					targetType: NotificationTargetType.ORGANIZATION,
					targetIds: ["org-456"],
				},
				NotificationChannelType.IN_APP,
			);
		});

		it("should log success message", async () => {
			const data = {
				postId: "post-123",
				organizationId: "org-456",
				authorName: "John Doe",
				organizationName: "Test Organization",
				postCaption: "Test post caption",
			};

			await bus.emitPostCreated(data, mockCtx);
			await waitForSetImmediate();

			expect(infoSpy).toHaveBeenCalledWith(
				"Notification sent for post post-123",
			);
		});

		it("should log error when notification creation fails", async () => {
			const error = new Error("Database connection failed");
			createNotificationSpy.mockRejectedValueOnce(error);

			const data = {
				postId: "post-123",
				organizationId: "org-456",
				authorName: "John Doe",
				organizationName: "Test Organization",
				postCaption: "Test post caption",
			};

			await bus.emitPostCreated(data, mockCtx);
			await waitForSetImmediate();

			expect(errorSpy).toHaveBeenCalledWith(
				"Failed to send post notification:",
				error,
			);
		});
	});

	describe("emitMembershipRequestAccepted", () => {
		it("should emit correct event and call notification engine", async () => {
			const data = {
				userId: "user-123",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			const eventListener = vi.fn();
			bus.on("membership_request.accepted", eventListener);

			await bus.emitMembershipRequestAccepted(data, mockCtx);
			await waitForSetImmediate();

			expect(eventListener).toHaveBeenCalledWith(data);
			expect(createNotificationSpy).toHaveBeenCalledWith(
				"membership_request_accepted",
				{
					organizationName: "Test Organization",
					organizationId: "org-456",
				},
				{
					targetType: NotificationTargetType.USER,
					targetIds: ["user-123"],
				},
				NotificationChannelType.IN_APP,
			);
		});

		it("should log error when notification fails", async () => {
			const error = new Error("Template not found");
			createNotificationSpy.mockRejectedValueOnce(error);

			const data = {
				userId: "user-123",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			await bus.emitMembershipRequestAccepted(data, mockCtx);
			await waitForSetImmediate();

			expect(errorSpy).toHaveBeenCalledWith(
				"Failed to send membership acceptance notification:",
				error,
			);
		});
	});

	describe("emitEventCreated", () => {
		it("should emit correct event and call notification engine", async () => {
			const data = {
				eventId: "event-123",
				eventName: "Annual Conference",
				organizationId: "org-456",
				organizationName: "Test Organization",
				startDate: "2025-08-15T10:00:00Z",
				creatorName: "Jane Smith",
			};

			const eventListener = vi.fn();
			bus.on("event.created", eventListener);

			await bus.emitEventCreated(data, mockCtx);
			await waitForSetImmediate();

			expect(eventListener).toHaveBeenCalledWith(data);
			expect(createNotificationSpy).toHaveBeenCalledWith(
				"event_created",
				{
					eventName: "Annual Conference",
					organizationName: "Test Organization",
					startDate: "2025-08-15T10:00:00Z",
					eventId: "event-123",
					creatorName: "Jane Smith",
				},
				{
					targetType: NotificationTargetType.ORGANIZATION,
					targetIds: ["org-456"],
				},
				NotificationChannelType.IN_APP,
			);
		});
	});

	describe("emitJoinRequestSubmitted", () => {
		it("should emit correct event and call notification engine", async () => {
			const data = {
				requestId: "request-123",
				userId: "user-789",
				userName: "Bob Johnson",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			const eventListener = vi.fn();
			bus.on("join_request.submitted", eventListener);

			await bus.emitJoinRequestSubmitted(data, mockCtx);
			await waitForSetImmediate();

			expect(eventListener).toHaveBeenCalledWith(data);
			expect(createNotificationSpy).toHaveBeenCalledWith(
				"join_request_submitted",
				{
					userName: "Bob Johnson",
					organizationName: "Test Organization",
					organizationId: "org-456",
					requestId: "request-123",
				},
				{
					targetType: NotificationTargetType.ORGANIZATION,
					targetIds: ["org-456"],
				},
				NotificationChannelType.IN_APP,
			);
		});
	});

	describe("emitNewMemberJoined", () => {
		it("should emit correct event and call notification engine", async () => {
			const data = {
				userId: "user-789",
				userName: "Alice Cooper",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			const eventListener = vi.fn();
			bus.on("member.joined", eventListener);

			await bus.emitNewMemberJoined(data, mockCtx);
			await waitForSetImmediate();

			expect(eventListener).toHaveBeenCalledWith(data);
			expect(createNotificationSpy).toHaveBeenCalledWith(
				"new_member_joined",
				{
					userName: "Alice Cooper",
					organizationName: "Test Organization",
					organizationId: "org-456",
				},
				{
					targetType: NotificationTargetType.ORGANIZATION,
					targetIds: ["org-456"],
				},
				NotificationChannelType.IN_APP,
			);
		});
	});

	describe("emitUserBlocked", () => {
		it("should emit correct event and call notification engine", async () => {
			const data = {
				userId: "user-blocked",
				userName: "Blocked User",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			const eventListener = vi.fn();
			bus.on("user.blocked", eventListener);

			await bus.emitUserBlocked(data, mockCtx);
			await waitForSetImmediate();

			expect(eventListener).toHaveBeenCalledWith(data);
			expect(createNotificationSpy).toHaveBeenCalledWith(
				"user_blocked",
				{
					userName: "Blocked User",
					organizationName: "Test Organization",
					organizationId: "org-456",
				},
				{
					targetType: NotificationTargetType.USER,
					targetIds: ["user-blocked"],
				},
				NotificationChannelType.IN_APP,
			);
		});
	});

	describe("emitFundCreated", () => {
		it("should emit correct event and call notification engine", async () => {
			const data = {
				fundId: "fund-123",
				fundName: "Emergency Fund",
				organizationId: "org-456",
				organizationName: "Test Organization",
				creatorName: "Fund Manager",
			};

			const eventListener = vi.fn();
			bus.on("fund.created", eventListener);

			await bus.emitFundCreated(data, mockCtx);
			await waitForSetImmediate();

			expect(eventListener).toHaveBeenCalledWith(data);
			expect(createNotificationSpy).toHaveBeenCalledWith(
				"fund_created",
				{
					fundName: "Emergency Fund",
					organizationName: "Test Organization",
					organizationId: "org-456",
					creatorName: "Fund Manager",
				},
				{
					targetType: NotificationTargetType.ORGANIZATION,
					targetIds: ["org-456"],
				},
				NotificationChannelType.IN_APP,
			);
		});
	});

	describe("emitFundCampaignCreated", () => {
		it("should emit correct event and call notification engine", async () => {
			const data = {
				campaignId: "campaign-123",
				campaignName: "Save the Trees",
				fundName: "Environmental Fund",
				organizationId: "org-456",
				organizationName: "Test Organization",
				creatorName: "Campaign Manager",
				goalAmount: "10000",
				currencyCode: "USD",
			};

			const eventListener = vi.fn();
			bus.on("fund_campaign.created", eventListener);

			await bus.emitFundCampaignCreated(data, mockCtx);
			await waitForSetImmediate();

			expect(eventListener).toHaveBeenCalledWith(data);
			expect(createNotificationSpy).toHaveBeenCalledWith(
				"fund_campaign_created",
				{
					campaignName: "Save the Trees",
					fundName: "Environmental Fund",
					organizationName: "Test Organization",
					organizationId: "org-456",
					creatorName: "Campaign Manager",
					goalAmount: "10000",
					currencyCode: "USD",
				},
				{
					targetType: NotificationTargetType.ORGANIZATION,
					targetIds: ["org-456"],
				},
				NotificationChannelType.IN_APP,
			);
		});
	});

	describe("emitFundCampaignPledgeCreated", () => {
		it("should emit correct event and call notification engine", async () => {
			const data = {
				pledgeId: "pledge-123",
				campaignName: "Save the Trees",
				organizationId: "org-456",
				organizationName: "Test Organization",
				pledgerName: "Generous Donor",
				amount: "500",
				currencyCode: "USD",
			};

			const eventListener = vi.fn();
			bus.on("fund_campaign_pledge.created", eventListener);

			await bus.emitFundCampaignPledgeCreated(data, mockCtx);
			await waitForSetImmediate();

			expect(eventListener).toHaveBeenCalledWith(data);
			expect(createNotificationSpy).toHaveBeenCalledWith(
				"fund_campaign_pledge_created",
				{
					campaignName: "Save the Trees",
					organizationName: "Test Organization",
					organizationId: "org-456",
					pledgerName: "Generous Donor",
					amount: "500",
					currencyCode: "USD",
				},
				{
					targetType: NotificationTargetType.ORGANIZATION,
					targetIds: ["org-456"],
				},
				NotificationChannelType.IN_APP,
			);
		});
	});

	describe("error handling", () => {
		it("should handle all notification creation failures gracefully", async () => {
			const error = new Error("Notification service unavailable");
			createNotificationSpy.mockRejectedValue(error);

			const postData = {
				postId: "post-123",
				organizationId: "org-456",
				authorName: "John Doe",
				organizationName: "Test Organization",
				postCaption: "Test post",
			};

			const memberData = {
				userId: "user-123",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			await Promise.all([
				bus.emitPostCreated(postData, mockCtx),
				bus.emitMembershipRequestAccepted(memberData, mockCtx),
			]);

			await waitForSetImmediate();

			expect(errorSpy).toHaveBeenCalledTimes(2);
			expect(errorSpy).toHaveBeenCalledWith(
				"Failed to send post notification:",
				error,
			);
			expect(errorSpy).toHaveBeenCalledWith(
				"Failed to send membership acceptance notification:",
				error,
			);
		});
	});
});
