import type { RecurrenceRuleResolvers } from "../../types/generatedGraphQLTypes";
import { organization } from "./organization";
import { baseRecurringEvent } from "./baseRecurringEvent";

export const RecurrenceRule: RecurrenceRuleResolvers = {
  organization,
  baseRecurringEvent,
};
