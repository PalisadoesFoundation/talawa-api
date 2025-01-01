import { organizationMembershipRoleEnum } from "~/src/drizzle/enums/organizationMembershipRole";
import { builder } from "~/src/graphql/builder";

export const OrganizationMembershipRole = builder.enumType(
	"OrganizationMembershipRole",
	{
		description:
			"Possible variants of the role assigned to a user within an organization.",
		values: organizationMembershipRoleEnum.options,
	},
);
