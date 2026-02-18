// check-sanitization-disable: metadata field returns JSON.stringify of system data
import { builder } from "~/src/graphql/builder";
import { escapeHTML } from "~/src/utilities/sanitizer";

/**
 * GraphQL object type representing an event invitation.
 */
export const EventInvitation = builder.objectRef<{
	id: string;
	eventId: string | null;
	recurringEventInstanceId: string | null;
	invitedBy: string;
	userId: string | null;
	inviteeEmail: string;
	inviteeName: string | null;
	invitationToken: string;
	status: string;
	expiresAt: Date;
	respondedAt: Date | null;
	metadata: unknown;
	createdAt: Date;
	updatedAt: Date | null;
}>("EventInvitation");

EventInvitation.implement({
	description: "An invitation to an event sent to an email address.",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Unique identifier of the invitation.",
		}),
		eventId: t.exposeString("eventId", {
			description: "ID of the associated event (if applicable).",
			nullable: true,
		}),
		recurringEventInstanceId: t.exposeString("recurringEventInstanceId", {
			description:
				"ID of the associated recurring event instance (if applicable).",
			nullable: true,
		}),
		invitedBy: t.exposeString("invitedBy", {
			description: "ID of the user who sent the invitation.",
		}),
		userId: t.exposeString("userId", {
			description:
				"ID of the user who was invited (if they are a registered user).",
			nullable: true,
		}),
		inviteeEmail: t.exposeString("inviteeEmail", {
			description: "Email address of the invitee.",
		}),
		inviteeName: t.exposeString("inviteeName", {
			description: "Name of the invitee.",
			nullable: true,
		}),
		invitationToken: t.exposeString("invitationToken", {
			description: "Unique token used to accept the invitation.",
		}),
		status: t.exposeString("status", {
			description:
				"Current status of the invitation (pending, accepted, declined, expired, cancelled).",
		}),
		expiresAt: t.field({
			description: "Date and time when the invitation expires.",
			resolve: (parent) => parent.expiresAt,
			type: "DateTime",
		}),
		respondedAt: t.field({
			description:
				"Date and time when the invitation was responded to (accepted or declined).",
			nullable: true,
			resolve: (parent) => parent.respondedAt,
			type: "DateTime",
		}),
		metadata: t.string({
			description:
				"Additional metadata associated with the invitation (JSON string).",
			nullable: true,
			resolve: (parent) =>
				parent.metadata ? escapeHTML(JSON.stringify(parent.metadata)) : null,
		}),
		createdAt: t.field({
			description: "Date and time when the invitation was created.",
			resolve: (parent) => parent.createdAt,
			type: "DateTime",
		}),
		updatedAt: t.field({
			description: "Date and time when the invitation was last updated.",
			resolve: (parent) => parent.updatedAt,
			type: "DateTime",
		}),
	}),
});
