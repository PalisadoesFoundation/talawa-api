import type { z } from "zod";
import { advertisementsTableInsertSchema } from "~/src/drizzle/tables/advertisements";
import { builder } from "~/src/graphql/builder";
import { AdvertisementType } from "~/src/graphql/enums/AdvertisementType";
import { isNotNullish } from "~/src/utilities/isNotNullish";

export const mutationUpdateAdvertisementInputSchema =
	advertisementsTableInsertSchema
		.pick({
			description: true,
		})
		.extend({
			endAt: advertisementsTableInsertSchema.shape.endAt.optional(),
			id: advertisementsTableInsertSchema.shape.id.unwrap(),
			name: advertisementsTableInsertSchema.shape.name.optional(),
			startAt: advertisementsTableInsertSchema.shape.startAt.optional(),
			type: advertisementsTableInsertSchema.shape.type.optional(),
		})
		.superRefine(({ id, ...remainingArg }, ctx) => {
			if (!Object.values(remainingArg).some((value) => value !== undefined)) {
				ctx.addIssue({
					code: "custom",
					message: "At least one optional argument must be provided.",
				});
			}

			if (
				isNotNullish(remainingArg.endAt) &&
				isNotNullish(remainingArg.startAt) &&
				remainingArg.endAt <= remainingArg.startAt
			) {
				ctx.addIssue({
					code: "custom",
					message: `Must be greater than the value: ${remainingArg.startAt.toISOString()}.`,
					path: ["endAt"],
				});
			}
		});

export const MutationUpdateAdvertisementInput = builder
	.inputRef<z.infer<typeof mutationUpdateAdvertisementInputSchema>>(
		"MutationUpdateAdvertisementInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			description: t.string({
				description: "Custom information about the advertisement.",
			}),
			endAt: t.field({
				description: "Date time at which the advertised event ends.",
				type: "DateTime",
			}),
			id: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
			name: t.string({
				description: "Name of the advertisement.",
			}),
			startAt: t.field({
				description: "Date time at which the advertised event starts.",
				type: "DateTime",
			}),
			type: t.field({
				description: "Type of the advertisement.",
				type: AdvertisementType,
			}),
		}),
	});
