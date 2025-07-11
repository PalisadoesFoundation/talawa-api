import { frequencyEnum } from "~/src/drizzle/enums/frequency";
import { builder } from "~/src/graphql/builder";

export const Frequency = builder.enumType("Frequency", {
	description: "Possible variants of the frequency of a recurring event.",
	values: frequencyEnum.options,
});
