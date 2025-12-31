import type { z } from "zod";
import { agendaFoldersTableInsertSchema } from "~/src/drizzle/tables/agendaFolders";
import { builder } from "~/src/graphql/builder";

export const MutationUpdateAgendaFolderSequenceInputSchema = agendaFoldersTableInsertSchema
    .pick({
        sequence: true
    })
    .extend({
        id: agendaFoldersTableInsertSchema.shape.id.unwrap(),
    })
    .refine(
        ({ id, ...remainingArg }) =>
            Object.values(remainingArg).some((value) => value !== undefined),
        {
            message: "At least one optional argument must be provided.",
        },
    );

export const MutationUpdateAgendaFolderSequenceInput = builder
    .inputRef<z.infer<typeof MutationUpdateAgendaFolderSequenceInputSchema>>(
        "MutationUpdateAgendaFolderSequenceInput",
    )
    .implement({
        description: "",
        fields: (t) => ({
            id: t.id({
                description: "Global identifier of the agenda folder.",
                required: true,
            }),
            sequence: t.int({
                description: "Sequence of agenda folder.",
                required: true,
            })
        }),
    });
