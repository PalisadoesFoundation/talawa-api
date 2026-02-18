import { z } from "zod";
import { advertisementsTableInsertSchema } from "~/src/drizzle/tables/advertisements";
import { builder } from "~/src/graphql/builder";
import { AdvertisementType } from "~/src/graphql/enums/AdvertisementType";
import { isNotNullish } from "~/src/utilities/isNotNullish";

export const mutationUpdateAdvertisementInputSchema =
	advertisementsTableInsertSchema
		.pick({})
		.extend({
			description: z.string().trim().min(1).max(2048).nullable().optional(),
			endAt: advertisementsTableInsertSchema.shape.endAt.nullable().optional(),
			id: advertisementsTableInsertSchema.shape.id.unwrap(),
			name: z.string().trim().min(1).max(256).nullable().optional(),
			startAt: advertisementsTableInsertSchema.shape.startAt
				.nullable()
				.optional(),
			type: advertisementsTableInsertSchema.shape.type.nullable().optional(),
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
				required: false,
			}),
			endAt: t.field({
				description: "Date time at which the advertised event ends.",
				required: false,
				type: "DateTime",
			}),
			id: t.id({
				description: "ID of the advertisement to update.",
				required: true,
			}),
			name: t.string({
				description: "Name of the advertisement.",
				required: false,
			}),
			startAt: t.field({
				description: "Date time at which the advertised event starts.",
				required: false,
				type: "DateTime",
			}),
			type: t.field({
				description: "Type of the advertisement.",
				required: false,
				type: AdvertisementType,
			}),
		}),
	});
