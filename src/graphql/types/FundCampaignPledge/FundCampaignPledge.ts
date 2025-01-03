import type { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import { builder } from "~/src/graphql/builder";

export type FundCampaignPledge = typeof fundCampaignPledgesTable.$inferSelect;

export const FundCampaignPledge =
	builder.objectRef<FundCampaignPledge>("FundCampaignPledge");

FundCampaignPledge.implement({
	description:
		"Fund campaign pledges are records of monetary pledges that users make to funds of organizations under a fund campaign.",
	fields: (t) => ({
		amount: t.exposeInt("amount", {
			description: "The amount of pledged money.",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the fund campaign pledge.",
			nullable: false,
		}),
		note: t.exposeString("note", {
			description: "Custom information about the fund campaign pledge.",
		}),
	}),
});
