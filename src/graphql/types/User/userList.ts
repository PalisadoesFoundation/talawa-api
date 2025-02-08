import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const userListArgumentsSchema = z.object({
  first: z.number().min(1).max(100).default(10),
  skip: z.number().min(0).default(0),
});

builder.queryField("userList", (t) =>
  t.field({
    args: {
      first: t.arg({ type: "Int", required: false }),
      skip: t.arg({ type: "Int", required: false }),
    },
    type: [User],
    resolve: async (_parent, args, ctx) => {
      const { 
        data: parsedArgs, 
        error, 
        success,
      } = userListArgumentsSchema.safeParse(args);

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

      // Fetch users with pagination
      const users = await ctx.drizzleClient.query.usersTable.findMany({
        limit: first,
        offset: skip,
      });

      return users;
    },
  })
);
