import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Organization } from "./Organization";

builder.queryField("organizationsConnection", (t) =>
  t.field({
    type: [Organization],
    resolve: async (_parent, _args, ctx) => {
      try {
        const organizations = await ctx.drizzleClient
          .select()
          .from(organizationsTable);

        if (!organizations || organizations.length === 0) {
          throw new TalawaGraphQLError({
            extensions: {
              code: "unauthorized_action",
              issues: [{ message: "No organizations found in the database." }],
            },
          });
        }

        return organizations;
      } catch (error) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "unexpected",
            issues: [
              {
                message:
                  "An unexpected error occurred while fetching organizations.",
                details:
                  error instanceof Error ? error.message : "Unknown error",
              },
            ],
          },
        });
      }
    },
  }),
);
