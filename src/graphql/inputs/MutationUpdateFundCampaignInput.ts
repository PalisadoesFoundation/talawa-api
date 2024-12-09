import { z } from "zod";
import { fundCampaignsTableInsertSchema } from "~/src/drizzle/tables/fundCampaigns";
import { builder } from "~/src/graphql/builder";
import { Iso4217CurrencyCode } from "~/src/graphql/enums/Iso4217CurrencyCode";

export const mutationUpdateFundCampaignInputSchema = z
	.object({
		currencyCode: fundCampaignsTableInsertSchema.shape.currencyCode.optional(),
		endAt: fundCampaignsTableInsertSchema.shape.endAt.optional(),
		goalAmount: fundCampaignsTableInsertSchema.shape.goalAmount.optional(),
		id: fundCampaignsTableInsertSchema.shape.id.unwrap(),
		name: fundCampaignsTableInsertSchema.shape.name.optional(),
		startAt: fundCampaignsTableInsertSchema.shape.startAt.optional(),
	})
	.superRefine(({ id, ...remainingArg }, ctx) => {
		if (!Object.values(remainingArg).some((value) => value !== undefined)) {
			ctx.addIssue({
				code: "custom",
				message: "At least one optional argument must be provided.",
			});
		}

		if (
			remainingArg.endAt !== undefined &&
			remainingArg.startAt !== undefined &&
			remainingArg.endAt.getTime() <= remainingArg.startAt.getTime()
		) {
			ctx.addIssue({
				code: "custom",
				message: `Must be greater than the value: ${remainingArg.startAt.toISOString()}.`,
				path: ["endAt"],
			});
		}
	});

export const MutationUpdateFundCampaignInput = builder
	.inputRef<z.infer<typeof mutationUpdateFundCampaignInputSchema>>(
		"MutationUpdateFundCampaignInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			currencyCode: t.field({
				description: "Currency code of the fund campaign.",
				type: Iso4217CurrencyCode,
			}),
			endAt: t.field({
				description: "Date time at the time the fund campaign ends at.",
				type: "DateTime",
			}),
			goalAmount: t.int({
				description:
					"Minimum amount of money that is set as the goal for the fund campaign.",
			}),
			id: t.id({
				description: "Global identifier of the associated fund campaign.",
				required: true,
			}),
			name: t.string({
				description: "Name of the fundCampaign.",
			}),
			startAt: t.field({
				description: "Date time at the time the fund campaign starts at.",
				type: "DateTime",
			}),
		}),
	});
