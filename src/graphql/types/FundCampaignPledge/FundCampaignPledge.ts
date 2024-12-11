import type { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import { builder } from "~/src/graphql/builder";
import { Iso4217CurrencyCode } from "~/src/graphql/enums/Iso4217CurrencyCode";

export type FundCampaignPledge = typeof fundCampaignPledgesTable.$inferSelect;

export const FundCampaignPledge =
	builder.objectRef<FundCampaignPledge>("FundCampaignPledge");

FundCampaignPledge.implement({
	description: "",
	fields: (t) => ({
		amount: t.exposeInt("amount", {
			description: "The amount of pledged money.",
		}),
		currencyCode: t.expose("currencyCode", {
			description: "Currency code of the fund campaign pledge.",
			type: Iso4217CurrencyCode,
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
