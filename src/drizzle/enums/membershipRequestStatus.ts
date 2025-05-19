import { builder } from "~/src/graphql/builder";

export const MembershipRequestStatusEnum = builder.enumType(
	"DrizzleMembershipRequestStatus",
	{
		values: ["pending", "approved", "rejected"] as const,
		description: "Possible statuses for a membership request.",
	},
);

// Export enum values separately for Drizzle compatibility
export const MembershipRequestStatusValues = [
	"pending",
	"approved",
	"rejected",
] as const;
