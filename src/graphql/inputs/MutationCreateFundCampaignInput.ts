import type { z } from "zod";
import { fundCampaignsTableInsertSchema } from "~/src/drizzle/tables/fundCampaigns";
import { builder } from "~/src/graphql/builder";
import { Iso4217CurrencyCode } from "~/src/graphql/enums/Iso4217CurrencyCode";

export const mutationCreateFundCampaignInputSchema =
	fundCampaignsTableInsertSchema
		.pick({
			currencyCode: true,
			endAt: true,
			fundId: true,
			goalAmount: true,
			name: true,
			startAt: true,
		})
		.superRefine((arg, ctx) => {
			if (arg.endAt <= arg.startAt) {
				ctx.addIssue({
					code: "custom",
					message: `Must be greater than the value: ${arg.startAt.toISOString()}`,
					path: ["endAt"],
				});
			}
		});

export const MutationCreateFundCampaignInput = builder
	.inputRef<z.infer<typeof mutationCreateFundCampaignInputSchema>>(
		"MutationCreateFundCampaignInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			currencyCode: t.field({
				description: "Currency code of the fund campaign.",
				required: true,
				type: Iso4217CurrencyCode,
			}),
			endAt: t.field({
				description: "Date time at the time the fund campaign ends at.",
				required: true,
				type: "DateTime",
			}),
			fundId: t.id({
				description: "Global identifier of the associated fund.",
				required: true,
			}),
			goalAmount: t.int({
				description:
					"Minimum amount of money that is set as the goal for the fund campaign.",
				required: true,
			}),
			name: t.string({
				description: "Name of the fund campaign.",
				required: true,
			}),
			startAt: t.field({
				description: "Date time at the time the fund campaign starts at.",
				required: true,
				type: "DateTime",
			}),
		}),
	});
