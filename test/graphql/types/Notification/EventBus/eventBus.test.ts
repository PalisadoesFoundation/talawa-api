import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
		bus = new NotificationEventBus();

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
				error,
				"Failed to send post notification:",
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
				NotificationChannelType.EMAIL,
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
				error,
				"Failed to send membership acceptance notification:",
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
					targetType: NotificationTargetType.ORGANIZATION_ADMIN,
					targetIds: ["org-456"],
				},
				NotificationChannelType.IN_APP,
			);

			// And also email to organization admins
			expect(createNotificationSpy).toHaveBeenCalledWith(
				"join_request_submitted",
				{
					userName: "Bob Johnson",
					organizationName: "Test Organization",
					organizationId: "org-456",
					requestId: "request-123",
				},
				{
					targetType: NotificationTargetType.ORGANIZATION_ADMIN,
					targetIds: ["org-456"],
				},
				NotificationChannelType.EMAIL,
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
				error,
				"Failed to send post notification:",
			);
			expect(errorSpy).toHaveBeenCalledWith(
				error,
				"Failed to send membership acceptance notification:",
			);
		});
	});

	describe("emitFundCreated error handling", () => {
		it("should log error when fund notification fails (lines 333-334)", async () => {
			const error = new Error("Fund notification failed");
			createNotificationSpy.mockRejectedValueOnce(error);

			const data = {
				fundId: "fund-error-123",
				fundName: "Error Fund",
				organizationId: "org-456",
				organizationName: "Test Organization",
				creatorName: "Fund Manager",
			};

			await bus.emitFundCreated(data, mockCtx);
			await waitForSetImmediate();

			expect(errorSpy).toHaveBeenCalledWith(
				error,
				"Failed to send fund creation notification:",
			);
		});
	});

	describe("emitFundCampaignCreated error handling", () => {
		it("should log error when fund campaign notification fails (lines 378-382)", async () => {
			const error = new Error("Fund campaign notification failed");
			createNotificationSpy.mockRejectedValueOnce(error);

			const data = {
				campaignId: "campaign-error-123",
				campaignName: "Error Campaign",
				fundName: "Environmental Fund",
				organizationId: "org-456",
				organizationName: "Test Organization",
				creatorName: "Campaign Manager",
				goalAmount: "10000",
				currencyCode: "USD",
			};

			await bus.emitFundCampaignCreated(data, mockCtx);
			await waitForSetImmediate();

			expect(errorSpy).toHaveBeenCalledWith(
				error,
				"Failed to send fund campaign creation notification:",
			);
		});
	});

	describe("emitFundCampaignPledgeCreated error handling", () => {
		it("should log error when fund campaign pledge notification fails (lines 424-428)", async () => {
			const error = new Error("Fund campaign pledge notification failed");
			createNotificationSpy.mockRejectedValueOnce(error);

			const data = {
				pledgeId: "pledge-error-123",
				campaignName: "Error Campaign",
				organizationId: "org-456",
				organizationName: "Test Organization",
				pledgerName: "Error Donor",
				amount: "500",
				currencyCode: "USD",
			};

			await bus.emitFundCampaignPledgeCreated(data, mockCtx);
			await waitForSetImmediate();

			expect(errorSpy).toHaveBeenCalledWith(
				error,
				"Failed to send fund campaign pledge notification:",
			);
		});
	});

	describe("emitMembershipRequestRejected", () => {
		it("should emit 'membership_request.rejected' event with correct data", async () => {
			const data = {
				userId: "user-123",
				userName: "John Doe",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			const eventListener = vi.fn();
			bus.on("membership_request.rejected", eventListener);

			await bus.emitMembershipRequestRejected(data, mockCtx);

			expect(eventListener).toHaveBeenCalledWith(data);
		});

		it("should call NotificationEngine.createNotification with correct parameters", async () => {
			const data = {
				userId: "user-123",
				userName: "John Doe",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			await bus.emitMembershipRequestRejected(data, mockCtx);
			await waitForSetImmediate();

			expect(createNotificationSpy).toHaveBeenCalledWith(
				"membership_request_rejected",
				{
					userName: "John Doe",
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

		it("should log success message", async () => {
			const data = {
				userId: "user-123",
				userName: "John Doe",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			await bus.emitMembershipRequestRejected(data, mockCtx);
			await waitForSetImmediate();

			expect(infoSpy).toHaveBeenCalledWith(
				"Membership request rejection notification sent to user user-123 for organization org-456",
			);
		});

		it("should log error when notification creation fails", async () => {
			const error = new Error("Database connection failed");
			createNotificationSpy.mockRejectedValueOnce(error);

			const data = {
				userId: "user-123",
				userName: "John Doe",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			await bus.emitMembershipRequestRejected(data, mockCtx);
			await waitForSetImmediate();

			expect(errorSpy).toHaveBeenCalledWith(
				error,
				"Failed to send membership request rejection notification:",
			);
		});
	});
	describe("emitSendEventInvite", () => {
		let createDirectEmailNotificationSpy: MockInstance;

		beforeEach(() => {
			createDirectEmailNotificationSpy = vi
				.spyOn(NotificationEngine.prototype, "createDirectEmailNotification")
				.mockResolvedValue("mock-email-notification-id");
		});

		it("should emit 'send_event_invite' event with correct data", async () => {
			const data = {
				inviteeEmail: "invitee@example.com",
				inviteeName: "Jane Smith",
				eventId: "event-123",
				eventName: "Annual Conference",
				organizationId: "org-456",
				inviterId: "user-789",
				invitationToken: "token-abc123",
				invitationUrl: "https://example.com/invite/token-abc123",
			};

			const eventListener = vi.fn();
			bus.on("send_event_invite", eventListener);

			await bus.emitSendEventInvite(data, mockCtx);

			expect(eventListener).toHaveBeenCalledWith(data);
		});

		it("should call NotificationEngine.createDirectEmailNotification with correct parameters", async () => {
			const data = {
				inviteeEmail: "invitee@example.com",
				inviteeName: "Jane Smith",
				eventId: "event-123",
				eventName: "Annual Conference",
				organizationId: "org-456",
				inviterId: "user-789",
				invitationToken: "token-abc123",
				invitationUrl: "https://example.com/invite/token-abc123",
			};

			await bus.emitSendEventInvite(data, mockCtx);
			await waitForSetImmediate();

			expect(createDirectEmailNotificationSpy).toHaveBeenCalledWith(
				"send_event_invite",
				{
					inviteeName: "Jane Smith",
					eventName: "Annual Conference",
					invitationUrl: "https://example.com/invite/token-abc123",
					invitationToken: "token-abc123",
				},
				"invitee@example.com",
				NotificationChannelType.EMAIL,
			);
		});

		it("should handle missing optional fields gracefully", async () => {
			const data = {
				inviteeEmail: "invitee@example.com",
				organizationId: "org-456",
				inviterId: "user-789",
				invitationToken: "token-abc123",
				invitationUrl: "https://example.com/invite/token-abc123",
			};

			await bus.emitSendEventInvite(data, mockCtx);
			await waitForSetImmediate();

			expect(createDirectEmailNotificationSpy).toHaveBeenCalledWith(
				"send_event_invite",
				{
					inviteeName: "",
					eventName: "an event",
					invitationUrl: "https://example.com/invite/token-abc123",
					invitationToken: "token-abc123",
				},
				"invitee@example.com",
				NotificationChannelType.EMAIL,
			);
		});

		it("should log success message with correct data", async () => {
			const data = {
				inviteeEmail: "invitee@example.com",
				inviteeName: "Jane Smith",
				eventId: "event-123",
				eventName: "Annual Conference",
				organizationId: "org-456",
				inviterId: "user-789",
				invitationToken: "token-abc123",
				invitationUrl: "https://example.com/invite/token-abc123",
			};

			await bus.emitSendEventInvite(data, mockCtx);
			await waitForSetImmediate();

			expect(infoSpy).toHaveBeenCalledWith(
				{
					inviteeEmail: "invitee@example.com",
					inviterId: "user-789",
					eventId: "event-123",
				},
				"Send event invite notification created",
			);
		});

		it("should log success message with missing eventId", async () => {
			const data = {
				inviteeEmail: "invitee@example.com",
				inviteeName: "Jane Smith",
				eventName: "Annual Conference",
				organizationId: "org-456",
				inviterId: "user-789",
				invitationToken: "token-abc123",
				invitationUrl: "https://example.com/invite/token-abc123",
			};

			await bus.emitSendEventInvite(data, mockCtx);
			await waitForSetImmediate();

			expect(infoSpy).toHaveBeenCalledWith(
				{
					inviteeEmail: "invitee@example.com",
					inviterId: "user-789",
					eventId: undefined,
				},
				"Send event invite notification created",
			);
		});

		it("should log error when email notification creation fails", async () => {
			const error = new Error("Email service unavailable");
			createDirectEmailNotificationSpy.mockRejectedValueOnce(error);
			const data = {
				inviteeEmail: "invitee@example.com",
				inviteeName: "Jane Smith",
				eventId: "event-123",
				eventName: "Annual Conference",
				organizationId: "org-456",
				inviterId: "user-789",
				invitationToken: "token-abc123",
				invitationUrl: "https://example.com/invite/token-abc123",
			};

			await bus.emitSendEventInvite(data, mockCtx);
			await waitForSetImmediate();

			expect(errorSpy).toHaveBeenCalledWith(
				error,
				"Failed to send event invite notification:",
			);
		});
	});

	describe("additional error handling coverage", () => {
		it("should handle all event methods gracefully when notifications fail", async () => {
			const commonError = new Error("Notification service down");
			createNotificationSpy.mockRejectedValue(commonError);

			const eventData = {
				eventId: "event-error",
				eventName: "Error Event",
				organizationId: "org-456",
				organizationName: "Test Organization",
				startDate: "2025-08-15T10:00:00Z",
				creatorName: "Event Creator",
			};

			const joinRequestData = {
				requestId: "request-error",
				userId: "user-error",
				userName: "Error User",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			const memberData = {
				userId: "member-error",
				userName: "Error Member",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			const blockData = {
				userId: "blocked-error",
				userName: "Blocked User",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			// Execute all event emitters
			await Promise.all([
				bus.emitEventCreated(eventData, mockCtx),
				bus.emitJoinRequestSubmitted(joinRequestData, mockCtx),
				bus.emitNewMemberJoined(memberData, mockCtx),
				bus.emitUserBlocked(blockData, mockCtx),
			]);

			await waitForSetImmediate();

			// All should log errors appropriately
			expect(errorSpy).toHaveBeenCalledWith(
				commonError,
				"Failed to send event creation notification:",
			);
			expect(errorSpy).toHaveBeenCalledWith(
				commonError,
				"Failed to send join request notification:",
			);
			expect(errorSpy).toHaveBeenCalledWith(
				commonError,
				"Failed to send new member notification:",
			);
			expect(errorSpy).toHaveBeenCalledWith(
				commonError,
				"Failed to send user blocked notification:",
			);
		});

		it("should handle emitMembershipRequestRejected and emitSendEventInvite failures", async () => {
			const commonError = new Error("Notification service down");
			createNotificationSpy.mockRejectedValue(commonError);

			// Mock createDirectEmailNotification to also fail
			const createDirectEmailNotificationSpy = vi
				.spyOn(NotificationEngine.prototype, "createDirectEmailNotification")
				.mockRejectedValue(commonError);

			const rejectionData = {
				userId: "user-reject",
				userName: "Rejected User",
				organizationId: "org-456",
				organizationName: "Test Organization",
			};

			const inviteData = {
				inviteeEmail: "invitee@example.com",
				inviteeName: "Invitee Name",
				eventId: "event-123",
				eventName: "Test Event",
				organizationId: "org-456",
				inviterId: "user-789",
				invitationToken: "token-abc123",
				invitationUrl: "https://example.com/invite/token-abc123",
			};

			// Execute both methods
			await Promise.all([
				bus.emitMembershipRequestRejected(rejectionData, mockCtx),
				bus.emitSendEventInvite(inviteData, mockCtx),
			]);

			await waitForSetImmediate();

			// Both should log errors appropriately
			expect(errorSpy).toHaveBeenCalledWith(
				commonError,
				"Failed to send membership request rejection notification:",
			);
			expect(errorSpy).toHaveBeenCalledWith(
				commonError,
				"Failed to send event invite notification:",
			);

			createDirectEmailNotificationSpy.mockRestore();
		});
	});
});
