import { z } from "zod";

/**
 * Possible variants of the status of the assignment of a user in an event's volunteer group.
 */
export const volunteerGroupAssignmentInviteStatusEnum = z.enum([
	"accepted",
	"declined",
	"no_response",
]);
