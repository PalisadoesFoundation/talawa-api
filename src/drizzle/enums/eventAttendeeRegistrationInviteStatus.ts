import { z } from "zod";

/**
 * Possible variants of the status of a user's registration as an attendee to an event.
 */
export const eventAttendeeRegistrationInviteStatusEnum = z.enum([
	"accepted",
	"declined",
	"no_response",
]);
