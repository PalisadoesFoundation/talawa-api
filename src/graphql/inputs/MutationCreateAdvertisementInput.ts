import type { z } from "zod";
import { advertisementsTableInsertSchema } from "~/src/drizzle/tables/advertisements";
import { builder } from "~/src/graphql/builder";
import { AdvertisementType } from "~/src/graphql/enums/AdvertisementType";
import {
	CreateAdvertisementAttachmentInput,
	createAdvertisementAttachmentInputSchema,
} from "./CreateAdvertisementAttachmentInput";

export const mutationCreateAdvertisementInputSchema =
	advertisementsTableInsertSchema
		.pick({
			description: true,
			endAt: true,
			name: true,
			organizationId: true,
			startAt: true,
			type: true,
		})
		.extend({
			attachments: createAdvertisementAttachmentInputSchema
				.array()
				.min(1)
				.max(20)
				.optional(),
		})
		.superRefine((arg, ctx) => {
			if (arg.endAt.getTime() <= arg.startAt.getTime()) {
				ctx.addIssue({
					code: "custom",
					message: `Must be greater than the value: ${arg.endAt}`,
					path: ["endAt"],
				});
			}
		});

export const MutationCreateAdvertisementInput = builder
	.inputRef<z.infer<typeof mutationCreateAdvertisementInputSchema>>(
		"MutationCreateAdvertisementInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			attachments: t.field({
				description: "Attachments of the advertisement.",
				type: t.listRef(CreateAdvertisementAttachmentInput),
			}),
			description: t.string({
				description: "Custom information about the advertisement.",
			}),
			endAt: t.field({
				description: "Date time at which the advertised event ends.",
				required: true,
				type: "DateTime",
			}),
			name: t.string({
				description: "Name of the advertisement.",
				required: true,
			}),
			organizationId: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
			startAt: t.field({
				description: "Date time at which the advertised event starts.",
				required: true,
				type: "DateTime",
			}),
			type: t.field({
				description: "Type of the advertisement.",
				required: true,
				type: AdvertisementType,
			}),
		}),
	});
