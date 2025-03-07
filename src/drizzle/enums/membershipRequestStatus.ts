import { z } from "zod";

/**
 * Possible statuses of a membership request.
 */
export const membershipRequestStatusEnum = z.enum([
	"pending",
	"approved",
	"rejected",
]);

export const membershipRequestStatusEnumValues =
	membershipRequestStatusEnum.options;
