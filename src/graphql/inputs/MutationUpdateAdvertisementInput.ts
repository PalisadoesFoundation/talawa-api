import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { advertisementsTableInsertSchema } from "~/src/drizzle/tables/advertisements";
import { builder } from "~/src/graphql/builder";
import { AdvertisementType } from "~/src/graphql/enums/AdvertisementType";
import { isNotNullish } from "~/src/utilities/isNotNullish";

export const mutationUpdateAdvertisementInputSchema =
	advertisementsTableInsertSchema
		.partial()
		.extend({
			endAt: advertisementsTableInsertSchema.shape.endAt.optional(),
			name: advertisementsTableInsertSchema.shape.name.optional(),
			startAt: advertisementsTableInsertSchema.shape.startAt.optional(),
			type: advertisementsTableInsertSchema.shape.type.optional(),
			id: advertisementsTableInsertSchema.shape.id.unwrap(),
			attachments: z
				.custom<Promise<FileUpload>>()
				.array()
				.min(1)
				.max(20)
				.optional(),
		})
		.superRefine(({ attachments, ...remainingArgs }, ctx) => {
			if (Array.isArray(attachments) && attachments.length === 0) {
				attachments = undefined;
			}
			if (
				!Object.values(remainingArgs).some((value) => value !== undefined) &&
				attachments === undefined
			) {
				ctx.addIssue({
					code: "custom",
					message: "At least one optional argument must be provided.",
				});
			}

			if (
				isNotNullish(remainingArgs.endAt) &&
				isNotNullish(remainingArgs.startAt) &&
				remainingArgs.endAt <= remainingArgs.startAt
			) {
				ctx.addIssue({
					code: "custom",
					message: ` Must be greater than the value: ${remainingArgs.startAt.toISOString()}.`,
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
			attachments: t.field({
				description: "Attachments of the advertisement.",
				type: t.listRef("Upload"),
			}),
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
