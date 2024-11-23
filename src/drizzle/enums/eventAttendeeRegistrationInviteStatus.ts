import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants for status of a user's registration as an attendee to an event.
 */
export const eventAttendeeRegistrationInviteStatusEnum = pgEnum(
	"event_attendee_registration_invite_status",
	["accepted", "declined", "no_response"],
);
