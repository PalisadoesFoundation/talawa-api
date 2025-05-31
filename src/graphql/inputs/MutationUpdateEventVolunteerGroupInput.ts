import { z } from "zod";
import { volunteerGroupsTableInsertSchema } from "~/src/drizzle/tables/volunteerGroups";
import { builder } from "~/src/graphql/builder";
import { isNotNullish } from "~/src/utilities/isNotNullish";

export const mutationUpdateEventVolunteerGroupInputSchema = z
	.object({
		id: volunteerGroupsTableInsertSchema.shape.id.unwrap(),
		leaderId: volunteerGroupsTableInsertSchema.shape.leaderId.optional(),
		maxVolunteerCount:
			volunteerGroupsTableInsertSchema.shape.maxVolunteerCount.optional(),
		name: volunteerGroupsTableInsertSchema.shape.name.optional(),
	})
	.superRefine(({ id, ...remainingArg }, ctx) => {
		if (!Object.values(remainingArg).some((value) => value !== undefined)) {
			ctx.addIssue({
				code: "custom",
				message: "At least one optional argument must be provided.",
			});
		}

		if (
			isNotNullish(remainingArg.maxVolunteerCount) &&
			remainingArg.maxVolunteerCount < 0
		) {
			ctx.addIssue({
				code: "custom",
				message: `Max Volunteer Count must be greater than 0.`,
				path: ["maxVolunteerCount"],
			});
		}
	});

export const MutationUpdateEvenVolunteerGrouptInput = builder
	.inputRef<z.infer<typeof mutationUpdateEventVolunteerGroupInputSchema>>(
		"MutationUpdateEventVolunteerGroupInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the group.",
				required: true,
			}),
			name: t.string({
				description: "Name of the Group.",
			}),
			leaderId: t.id({
				description:
					"Global identifier of the user that is assigned leader of the group.",
			}),
			maxVolunteerCount: t.int({
				description: "Max volunteers count",
				required: true,
			}),
		}),
	});
