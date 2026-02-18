import type { GraphQLContext } from "~/src/graphql/context";
import { notificationEventBus } from "~/src/graphql/types/Notification/EventBus/eventBus";

export type EventCreatedPayload = {
	eventId: string;
	eventName: string;
	organizationId: string;
	organizationName: string;
	startDate: string;
	creatorName: string;
};

export type SendEventInvitePayload = {
	inviteeEmail: string;
	inviteeName?: string;
	eventId?: string;
	eventName?: string;
	organizationId: string;
	inviterId: string;
	invitationToken: string;
	invitationUrl: string;
};

type QueuedNotification =
	| {
			type: "event.created";
			data: EventCreatedPayload;
	  }
	| {
			type: "send_event_invite";
			data: SendEventInvitePayload;
	  };

/**
 * Thin per-request notification service. By default it collects notifications in-memory
 * during the request and flushes them (delegates to the existing event bus) when
 * `flush()` is called. This preserves existing behavior while making it easy to
 * change the delivery strategy later (DB-backed queue, background worker, etc.).
 */
export class NotificationService {
	private queue: QueuedNotification[] = [];

	enqueueEventCreated(payload: EventCreatedPayload) {
		this.queue.push({ type: "event.created", data: payload });
	}

	enqueueSendEventInvite(payload: SendEventInvitePayload) {
		this.queue.push({ type: "send_event_invite", data: payload });
	}

	/**
	 * Flush queued notifications by delegating to the global event bus. Accepts the
	 * full GraphQL context since the event bus / notification engine require it.
	 */
	async flush(ctx: GraphQLContext): Promise<void> {
		if (this.queue.length === 0) return;

		const items = this.queue.splice(0, this.queue.length);
		for (const item of items) {
			if (item.type === "event.created") {
				void notificationEventBus.emitEventCreated(item.data, ctx);
			} else if (item.type === "send_event_invite") {
				void notificationEventBus.emitSendEventInvite(item.data, ctx);
			}
		}
	}

	/**
	 * Synchronous immediate emit (delegates directly). Useful when you want to
	 * bypass queuing.
	 */
	async emitEventCreatedImmediate(
		payload: EventCreatedPayload,
		ctx: GraphQLContext,
	) {
		return notificationEventBus.emitEventCreated(payload, ctx);
	}

	async emitSendEventInviteImmediate(
		payload: SendEventInvitePayload,
		ctx: GraphQLContext,
	) {
		return notificationEventBus.emitSendEventInvite(payload, ctx);
	}
}

export default NotificationService;
