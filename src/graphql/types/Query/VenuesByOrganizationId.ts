import { and, eq, ilike, sql } from "drizzle-orm";
import { venueAttachmentsTable, venuesTable } from "~/src/drizzle/schema";
import { builder } from "~/src/graphql/builder";
import { Venue } from "~/src/graphql/types/Venue/Venue";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { QueryVenuesByOrganizationInput } from "../../inputs/QueryVenueByOrganizationInput";
import { QueryVenuesByOrganizationInputSchema } from "../../inputs/QueryVenueByOrganizationInput";

builder.queryField("venuesByOrganizationId", (t) =>
  t.field({
    description: "Fetch all venues that belong to a given organization.",
    type: [Venue],
    args: {
      input: t.arg({
        type: QueryVenuesByOrganizationInput,
        required: true,
      }),
    },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.currentClient.isAuthenticated) {
        throw new TalawaGraphQLError({
          extensions: { code: "unauthenticated" },
        });
      }

      const {
        data: parsedArgs,
        success,
        error,
      } = QueryVenuesByOrganizationInputSchema.safeParse(args.input);

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

      const { organizationId, first, skip, orderBy, where } = parsedArgs;

      const conditions = [eq(venuesTable.organizationId, organizationId)];

      if (where?.name_contains) {
        conditions.push(ilike(venuesTable.name, `%${where.name_contains}%`));
      }

      if (where?.name_contains) {
        conditions.push(ilike(venuesTable.name, `${where.name_contains}%`));
      }

      if (where?.description_contains) {
        conditions.push(
          ilike(venuesTable.description, `%${where.description_contains}%`)
        );
      }

      if (where?.description_contains) {
        conditions.push(
          ilike(venuesTable.description, `${where.description_contains}%`)
        );
      }

      const orderByClause = orderBy?.field
        ? orderBy.direction === "DESC"
          ? sql`${venuesTable[orderBy.field as keyof typeof venuesTable]} DESC`
          : sql`${venuesTable[orderBy.field as keyof typeof venuesTable]} ASC`
        : null;

      const venues = await (orderByClause
        ? ctx.drizzleClient
          .select()
          .from(venuesTable)
          .where(and(...conditions))
          .limit(first ?? 100)
          .offset(skip ?? 0)
          .orderBy(orderByClause)
          .leftJoin(
            venueAttachmentsTable,
            eq(venuesTable.id, venueAttachmentsTable.venueId)
          )
        : ctx.drizzleClient
          .select()
          .from(venuesTable)
          .where(and(...conditions))
          .limit(first ?? 100)
          .offset(skip ?? 0)
          .leftJoin(
            venueAttachmentsTable,
            eq(venuesTable.id, venueAttachmentsTable.venueId)
          ));

      return venues.map((row) => ({
        ...row.venues,
        attachments: row.venue_attachments ? [row.venue_attachments] : [],
      }));
    },
  })
);
