import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { escapeHTML } from "~/src/utilities/sanitizer";

export const userNotificationSchema = z.object({
	id: z.string().uuid(),
	isRead: z.boolean(),
	readAt: z.date().nullable(),
	navigation: z.string().nullable(),
	renderedContent: z
		.object({
			title: z.string().optional(),
			body: z.string().optional(),
		})
		.passthrough(),
	createdAt: z.date(),
	eventType: z.string().min(1),
});

export type UserNotification = z.infer<typeof userNotificationSchema>;

export const Notification = builder.objectRef<UserNotification>("Notification");

Notification.implement({
	description: "Minimal notification data for user interfaces.",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Unique notification identifier.",
		}),
		isRead: t.exposeBoolean("isRead", {
			description: "Whether user has read this notification.",
		}),
		readAt: t.expose("readAt", {
			description: "When user read this notification.",
			type: "DateTime",
			nullable: true,
		}),
		navigation: t.exposeString("navigation", {
			description: "Route to navigate when notification is clicked.",
			nullable: true,
		}),
		title: t.string({
			description: "Notification title for display.",
			nullable: false,
			resolve: (parent) => {
				return escapeHTML(parent.renderedContent?.title || "Notification");
			},
		}),
		body: t.string({
			description: "Notification message body.",
			nullable: false,
			resolve: (parent) => {
				return escapeHTML(parent.renderedContent?.body || "");
			},
		}),
		createdAt: t.expose("createdAt", {
			description: "When notification was created.",
			type: "DateTime",
		}),
		eventType: t.exposeString("eventType", {
			description: "Type of event (for categorization).",
		}),
	}),
});
