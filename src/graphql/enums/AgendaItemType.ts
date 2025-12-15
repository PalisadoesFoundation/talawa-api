import { agendaItemTypeEnum } from "~/src/drizzle/enums/agendaItemType";
import { builder } from "~/src/graphql/builder";

export const AgendaItemType = builder.enumType("AgendaItemType", {
	description: "Possible variants of the type of an agenda item.",
	values: agendaItemTypeEnum.options,
});
