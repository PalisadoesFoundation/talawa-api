import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of status of assignment of a user an event's volunteer group.
 */
export const volunteerGroupAssignmentInviteStatusEnum = pgEnum(
	"volunteer_group_assignment_invite_status",
	["accepted", "declined", "no_response"],
);
