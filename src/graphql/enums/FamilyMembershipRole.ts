import { familyMembershipRoleEnum } from "~/src/drizzle/enums/familyMembershipRole";
import { builder } from "~/src/graphql/builder";

export const FamilyMembershipRole = builder.enumType("FamilyMembershipRole", {
	description:
		"Possible variants of the role assigned to a user within an family.",
	values: familyMembershipRoleEnum.options,
});
