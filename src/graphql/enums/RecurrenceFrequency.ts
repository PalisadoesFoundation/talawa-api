import { frequencyEnum } from "~/src/drizzle/enums/recurrenceFrequency";
import { builder } from "~/src/graphql/builder";

export const Frequency = builder.enumType("Frequency", {
	description: "Possible variants of the frequency of a recurring event.",
	values: frequencyEnum.options,
});
