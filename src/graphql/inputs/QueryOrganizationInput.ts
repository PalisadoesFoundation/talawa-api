import { z } from "zod";
import { organizationsTableInsertSchema } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import { OrganizationMembershipRole } from "../enums/OrganizationMembershipRole";

export const queryOrganizationInputSchema = z.object({
	id: organizationsTableInsertSchema.shape.id
		.unwrap()
		.nullable()
		.optional()
		.transform((val) => {
			if (val == null) throw new Error("id is required");
			return val;
		}),
});

export const QueryOrganizationInput = builder
	.inputRef<z.infer<typeof queryOrganizationInputSchema>>(
		"QueryOrganizationInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the organization.",
				required: true,
			}),
		}),
	});

export const MembersRoleWhereInput = builder.inputType(
	"MembersRoleWhereInput",
	{
		description: "Filter criteria for member roles",
		fields: (t) => ({
			equal: t.field({
				type: OrganizationMembershipRole,
				description: "Role equals this value",
				required: false,
			}),
			notEqual: t.field({
				type: OrganizationMembershipRole,
				description: "Role does not equal this value",
				required: false,
			}),
		}),
	},
);

export const MembersWhereInput = builder
	.inputRef("MembersWhereInput")
	.implement({
		description: "Filter criteria for organization members",
		fields: (t) => ({
			role: t.field({
				type: MembersRoleWhereInput,
				description: "Filter members by role",
				required: false,
			}),
			// Add other filter fields here
		}),
	});
