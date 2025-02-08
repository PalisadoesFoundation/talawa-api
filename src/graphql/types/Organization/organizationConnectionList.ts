import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const organizationConnectionListArgumentsSchema = z.object({
  first: z.number().min(1).max(100).default(10),
  skip: z.number().min(0).default(0),
});

builder.queryField("organizationConnectionList", (t) =>
  t.field({
    args: {
      first: t.arg({ type: "Int", required: false }),
      skip: t.arg({ type: "Int", required: false }),
    },
    type: [Organization],
    resolve: async (_parent, args, ctx) => {
      const {
        data: parsedArgs,
        error,
        success,
      } = organizationConnectionListArgumentsSchema.safeParse(args);

      if (!success) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "invalid_arguments",
            issues: error.issues.map((issue) => ({
              argumentPath: issue.path,
              message: issue.message,
            })),
          },
        });
      }

      const { first, skip } = parsedArgs;

      // Fetch organizations with pagination
      const organizations =
        await ctx.drizzleClient.query.organizationsTable.findMany({
          limit: first,
          offset: skip,
        });

      return organizations;
    },
  }),
);
