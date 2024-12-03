import { organizationMembershipRoleEnum } from "~/src/drizzle/enums/organizationMembershipRole";
import { builder } from "~/src/graphql/builder";

export const OrganizationMembershipRole = builder.enumType(
	"OrganizationMembershipRole",
	{
		description: "",
		values: organizationMembershipRoleEnum.enumValues,
	},
);
