import type { fundsTable } from "~/src/drizzle/tables/funds";
import { builder } from "~/src/graphql/builder";

export type Fund = typeof fundsTable.$inferSelect;

export const Fund = builder.objectRef<Fund>("Fund");

Fund.implement({
	description:
		"Funds are sums of money possessed by organizations for specific purposes pertaning to them.",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Global identifier of the fund.",
			nullable: false,
		}),
		isTaxDeductible: t.exposeBoolean("isTaxDeductible", {
			description: "Boolean to tell if the fund is tax deductible.",
		}),
		name: t.exposeString("name", {
			description: "Name of the fund.",
		}),
	}),
});
