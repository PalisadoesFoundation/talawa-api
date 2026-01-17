import { iso4217CurrencyCodeEnum } from "~/src/drizzle/enums/iso4217CurrencyCode";
import type { fundCampaignsTable } from "~/src/drizzle/tables/fundCampaigns";
import { builder } from "~/src/graphql/builder";
import { Iso4217CurrencyCode } from "~/src/graphql/enums/Iso4217CurrencyCode";

export type FundCampaign = typeof fundCampaignsTable.$inferSelect;

export const FundCampaign = builder.objectRef<FundCampaign>("FundCampaign");

FundCampaign.implement({
	description:
		"Fund campaigns are specific events created for the purpose of raising organization funds.",
	fields: (t) => ({
		currencyCode: t.field({
			description: "Currency code of the fund campaign.",
			resolve: (fundCampaign) =>
				iso4217CurrencyCodeEnum.parse(fundCampaign.currencyCode),
			type: Iso4217CurrencyCode,
		}),
		endAt: t.expose("endAt", {
			description: "Date time at the time the fund campaign ends at.",
			type: "DateTime",
		}),
		amountRaised: t.exposeInt("amountRaised", {
			description: "The amount of money raised so far for the fund campaign.",
		}),
		goalAmount: t.exposeInt("goalAmount", {
			description:
				"Minimum amount of money that is set as the goal for the fund campaign.",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the fund campaign.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the fund campaign.",
		}),
		startAt: t.expose("startAt", {
			description: "Date time at the time the fund campaign starts at.",
			type: "DateTime",
		}),
	}),
});
