import { MembershipRequestStatusValues } from "~/src/drizzle/enums/membershipRequestStatus";
import { builder } from "~/src/graphql/builder";

export const MembershipRequestStatusEnum = builder.enumType(
	"MembershipRequestStatus",
	{
		description: "Possible statuses of a membership request.",
		values: Object.fromEntries(
			MembershipRequestStatusValues.map((status) => [
				status,
				{ value: status },
			]),
		),
	},
);
