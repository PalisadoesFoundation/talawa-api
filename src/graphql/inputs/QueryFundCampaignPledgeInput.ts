import { z } from "zod";
import { fundCampaignPledgesTableInsertSchema } from "~/src/drizzle/tables/fundCampaignPledges";
import { builder } from "~/src/graphql/builder";

export const queryFundCampaignPledgeInputSchema = z.object({
	id: fundCampaignPledgesTableInsertSchema.shape.id.unwrap(),
});

export const QueryFundCampaignPledgeInput = builder
	.inputRef<z.infer<typeof queryFundCampaignPledgeInputSchema>>(
		"QueryFundCampaignPledgeInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the fund campaign pledge.",
				required: true,
			}),
		}),
	});

export const QueryPledgeWhereInput = builder.inputRef("QueryPledgeWhereInput").implement({
	description: "Filter criteria for Pledges",
	fields: (t) => ({
		firstName_contains: t.string({
			description: "Filter pledges by the name of the creator",
			required: false,
		}),
		name_contains: t.string({
			description: "Filter pledges by the name of the campaign",
			required: false,
		}),
	}),
});

export const QueryPledgeOrderByInput = builder.enumType("QueryPledgeOrderByInput", {
	values: ["amount_ASC", "amount_DESC", "endDate_ASC", "endDate_DESC"] as const,
	description:
		"Sorting criteria, e.g., 'amount_ASC', 'amount_DESC', 'endDate_ASC', 'endDate_DESC'",
});
