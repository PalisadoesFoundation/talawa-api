import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";

import type { InferSelectModel } from "drizzle-orm";

import type { z } from "zod";

import {
  agendaItemsTable,
  agendaItemsTableInsertSchema,
} from "~/src/drizzle/tables/agendaItems";

import { AgendaItem } from "~/src/graphql/types/AgendaItem/AgendaItem";

import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

import {
  type DefaultGraphQLConnection,
  defaultGraphQLConnectionArgumentsSchema,
  transformDefaultGraphQLConnectionArguments,
  transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";

import envConfig from "~/src/utilities/graphqLimits";

import type { ParsedDefaultGraphQLConnectionArguments } from "~/src/utilities/defaultGraphQLConnection";

import type { GraphQLContext } from "~/src/graphql/context";

import { AgendaFolder } from "./AgendaFolder";

/**

* Zod schema for the AgendaFolder.items connection arguments.

*

* It builds on the default connection args (after, before, first, last) and:

* - Normalizes them into a ParsedDefaultGraphQLConnectionArguments object

* - Decodes & validates a base64url JSON cursor of shape { id: string; name: string }

* - Exposes the final structure used in the resolver: { cursor?, isInversed, limit }

*/

const itemsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema

  .transform(transformDefaultGraphQLConnectionArguments)

  .transform(
    (arg: ParsedDefaultGraphQLConnectionArguments, ctx: z.RefinementCtx) => {
      const cursor = decodeCursorOrAddIssue(arg.cursor, ctx, arg.isInversed);

      return {
        cursor,

        isInversed: arg.isInversed,

        limit: arg.limit,
      };
    }
  );

const cursorSchema = agendaItemsTableInsertSchema

  .pick({
    name: true,
  })

  .extend({
    id: agendaItemsTableInsertSchema.shape.id.unwrap(),
  });

/**

* Resolver for AgendaFolder.items connection.

*

* Fetches agenda items that belong to the provided agenda folder using a stable, two-key

* ordering (name, id) to support cursor-based pagination in both directions.

*

* - Accepts standard connection arguments (after/before, first/last)

* - Decodes and validates base64url JSON cursors of shape { id: string; name: string }

* - Returns a Relay-style connection with edges, cursors, and pageInfo

*

* Note on error semantics:

* To keep behavior consistent with other connection resolvers in this codebase, when a

* cursor is provided but no rows are returned, this resolver throws an

* `arguments_associated_resources_not_found` error. If a future change is desired to

* distinguish between a "non-existent cursor" vs. "valid cursor but no further items",

* that distinction should be implemented consistently across all connection resolvers.

*/

export const resolveItems = async (
  parent: { id: string },

  args: z.input<typeof defaultGraphQLConnectionArgumentsSchema>,

  ctx: GraphQLContext
): Promise<
  DefaultGraphQLConnection<InferSelectModel<typeof agendaItemsTable>>
> => {
  /**
	
	* Stable ordering:
	
	* - Always sort by name then id. The secondary sort by id ensures a deterministic
	
	*   order even when multiple items share the same name.
	
	*/

  const {
    data: parsedArgs,

    error,

    success,
  } = itemsArgumentsSchema.safeParse(args);

  if (!success) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "invalid_arguments",

        issues: error.issues.map((issue: z.ZodIssue) => ({
          argumentPath: issue.path,

          message: issue.message,
        })),
      },
    });
  }

  const { cursor, isInversed, limit } = parsedArgs;

  const orderBy = isInversed
    ? [desc(agendaItemsTable.name), desc(agendaItemsTable.id)]
    : [asc(agendaItemsTable.name), asc(agendaItemsTable.id)];

  let where: SQL | undefined;

  if (isInversed) {
    if (cursor !== undefined) {
      where = and(
        exists(
          ctx.drizzleClient

            .select()

            .from(agendaItemsTable)

            .where(
              and(
                eq(agendaItemsTable.folderId, parent.id),

                eq(agendaItemsTable.id, cursor.id),

                eq(agendaItemsTable.name, cursor.name)
              )
            )
        ),

        eq(agendaItemsTable.folderId, parent.id),

        or(
          and(
            eq(agendaItemsTable.name, cursor.name),

            lt(agendaItemsTable.id, cursor.id)
          ),

          lt(agendaItemsTable.name, cursor.name)
        )
      );
    } else {
      where = eq(agendaItemsTable.folderId, parent.id);
    }
  } else {
    if (cursor !== undefined) {
      where = and(
        exists(
          ctx.drizzleClient

            .select()

            .from(agendaItemsTable)

            .where(
              and(
                eq(agendaItemsTable.folderId, parent.id),

                eq(agendaItemsTable.id, cursor.id),

                eq(agendaItemsTable.name, cursor.name)
              )
            )
        ),

        eq(agendaItemsTable.folderId, parent.id),

        or(
          and(
            eq(agendaItemsTable.name, cursor.name),

            gt(agendaItemsTable.id, cursor.id)
          ),

          gt(agendaItemsTable.name, cursor.name)
        )
      );
    } else {
      where = eq(agendaItemsTable.folderId, parent.id);
    }
  }

  const agendaItems = await ctx.drizzleClient.query.agendaItemsTable.findMany({
    limit,

    orderBy,

    where,
  });

  // NOTE: For consistency with other connection resolvers in the codebase (e.g., childFolders),

  // we surface an error when a cursor is provided but no rows are found. This typically signals

  // either an invalid/non-existent cursor target or a mismatch with the current parent context.

  // If we ever choose to distinguish between "cursor not found" and "no items after/before cursor",

  // we should align that change across all connection resolvers.

  if (cursor !== undefined && agendaItems.length === 0) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "arguments_associated_resources_not_found",

        issues: [
          {
            argumentPath: [isInversed ? "before" : "after"],
          },
        ],
      },
    });
  }

  type AgendaItemRow = InferSelectModel<typeof agendaItemsTable>;

  return transformToDefaultGraphQLConnection<AgendaItemRow, AgendaItemRow>({
    createCursor: (agendaItem: AgendaItemRow) =>
      Buffer.from(
        JSON.stringify({
          id: agendaItem.id,

          name: agendaItem.name,
        })
      ).toString("base64url"),

    createNode: (agendaItem: AgendaItemRow) => agendaItem,

    parsedArgs,

    rawNodes: agendaItems,
  });
};

/**

* Helper to decode and validate a base64url-encoded JSON cursor.

*

* On parse/validation failure, it adds a Zod issue for the appropriate argument path

* ("after" for forward traversal, "before" for inverse traversal) and returns undefined.

*/

function decodeCursorOrAddIssue(
  encoded: string | undefined,

  ctx: z.RefinementCtx,

  isInversed: boolean
): z.infer<typeof cursorSchema> | undefined {
  if (encoded === undefined) return undefined;

  try {
    const decoded = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    );

    return cursorSchema.parse(decoded);
  } catch {
    ctx.addIssue({
      code: "custom",

      message: "Not a valid cursor.",

      path: [isInversed ? "before" : "after"],
    });

    return undefined;
  }
}

AgendaFolder.implement({
  fields: (t) => ({
    items: t.connection(
      {
        description:
          "GraphQL connection to traverse through the agenda items contained within the agenda folder.",

        complexity: (
          args: z.input<typeof defaultGraphQLConnectionArgumentsSchema>
        ) => {
          return {
            field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,

            multiplier: args.first || args.last || 1,
          };
        },

        resolve: resolveItems,

        type: AgendaItem,
      },

      {
        edgesField: {
          complexity: {
            field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,

            multiplier: 1,
          },
        },

        description: "",
      },

      {
        nodeField: {
          complexity: {
            field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,

            multiplier: 1,
          },
        },

        description: "",
      }
    ),
  }),
});
