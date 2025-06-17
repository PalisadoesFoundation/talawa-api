import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteActionItemCategoryInputSchema = z.object({
  id: z.string().uuid(),
});

export const MutationDeleteActionItemCategoryInput = builder
  .inputRef<z.infer<typeof mutationDeleteActionItemCategoryInputSchema>>(
    "MutationDeleteActionItemCategoryInput"
  )
  .implement({
    description: "Input for deleting an action item category.",
    fields: (t) => ({
      id: t.id({
        description: "ID of the action item category to delete.",
        required: true,
      }),
    }),
  });
