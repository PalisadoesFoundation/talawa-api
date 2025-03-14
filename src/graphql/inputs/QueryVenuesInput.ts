import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const queryVenuesInputSchema = z.object({
  name_contains: z.string().optional(),
  description_contains: z.string().optional(),
});

export const QueryVenuesInput = builder
  .inputRef<z.infer<typeof queryVenuesInputSchema>>("QueryVenuesInput")
  .implement({
    description: "Where argument of the Organization.venues query",
    fields: (t) => ({
      name_contains: t.string({
        required: false,
        description: "Filter venues by name containing  this value",
      }),
      description_contains: t.string({
        required: false,
        description: "Filter venues by description containing this value",
      }),
    }),
  });
