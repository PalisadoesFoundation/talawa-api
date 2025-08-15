import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { builder } from "~/src/graphql/builder";

// Define RecurrenceRuleFrequency enum
const RecurrenceRuleFrequency = builder.enumType("RecurrenceRuleFrequency", {
	values: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const,
});

// Define RecurrenceRule object
export const RecurrenceRule =
	builder.objectRef<typeof recurrenceRulesTable.$inferSelect>("RecurrenceRule");

RecurrenceRule.implement({
	fields: (t) => ({
		id: t.exposeID("id"),
		frequency: t.field({
			type: RecurrenceRuleFrequency,
			resolve: (rule) => rule.frequency,
		}),
		interval: t.exposeInt("interval"),
		recurrenceStartDate: t.field({
			type: "DateTime",
			resolve: (rule) => rule.recurrenceStartDate,
		}),
		recurrenceEndDate: t.field({
			type: "DateTime",
			nullable: true,
			resolve: (rule) => rule.recurrenceEndDate,
		}),
		count: t.exposeInt("count", { nullable: true }),
		byDay: t.stringList({
			nullable: true,
			resolve: (rule) => rule.byDay,
		}),
		byMonth: t.intList({
			nullable: true,
			resolve: (rule) => rule.byMonth,
		}),
		byMonthDay: t.intList({
			nullable: true,
			resolve: (rule) => rule.byMonthDay,
		}),
	}),
});
