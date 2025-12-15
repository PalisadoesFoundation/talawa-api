import { z } from "zod";
import { organizationsTableInsertSchema } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import { SortOrder } from "~/src/graphql/enums/SortOrder";

export const queryOrganizationPostsInputSchema = z.object({
    organizationId: organizationsTableInsertSchema.shape.id.unwrap(),
    sortOrder: z.enum(["ASC", "DESC"]).optional(),
});

export const QueryOrganizationPostsInput = builder.inputType(
    "QueryOrganizationPostsInput",
    {
        description: "Input for querying posts of an organization.",
        fields: (t) => ({
            organizationId: t.id({
                description: "Global identifier of the organization.",
                required: true,
            }),
            sortOrder: t.string({
                description: 'Optional sort order: "ASC" or "DESC" (defaults to "DESC")',
                required: false,
            }),
        }),
    },
);
