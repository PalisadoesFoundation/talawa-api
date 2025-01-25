import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { AgendaFolder } from "./AgendaFolder";

AgendaFolder.implement({
  fields: (t) => ({
    creator: t.field({
      description: "User who created the agenda folder.",
      resolve: async (parent, _args, ctx) => {
        if (!ctx.currentClient.isAuthenticated) {
          throw new TalawaGraphQLError({
            extensions: {
              code: "unauthenticated",
            },
          });
        }

        const currentUserId = ctx.currentClient.user.id;

        const [currentUser, existingEvent] = await Promise.all([
          ctx.drizzleClient.query.usersTable.findFirst({
            where: (fields, operators) =>
              operators.eq(fields.id, currentUserId),
          }),
          ctx.drizzleClient.query.eventsTable.findFirst({
            columns: {
              startAt: true,
            },
            where: (fields, operators) =>
              operators.eq(fields.id, parent.eventId),
            with: {
              organization: {
                columns: {
                  countryCode: true,
                },
                with: {
                  membershipsWhereOrganization: {
                    columns: {
                      role: true,
                    },
                    where: (fields, operators) =>
                      operators.eq(fields.memberId, currentUserId),
                  },
                },
              },
            },
          }),
        ]);

        if (currentUser === undefined) {
          throw new TalawaGraphQLError({
            extensions: {
              code: "unauthenticated",
            },
          });
        }

        // Event id existing but the associated event not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
        if (existingEvent === undefined) {
          ctx.log.error(
            "Postgres select operation returned an empty array for an agenda folder's event id that isn't null.",
          );

          throw new TalawaGraphQLError({
            extensions: {
              code: "unexpected",
            },
          });
        }

        const currentUserOrganizationMembership =
          existingEvent.organization.membershipsWhereOrganization[0];

        if (
          currentUser.role !== "administrator" &&
          (currentUserOrganizationMembership === undefined ||
            currentUserOrganizationMembership.role !== "administrator")
        ) {
          throw new TalawaGraphQLError({
            extensions: {
              code: "unauthorized_action",
            },
          });
        }

        if (parent.creatorId === null) {
          return null;
        }

        if (parent.creatorId === currentUserId) {
          return currentUser;
        }

        const creatorId = parent.creatorId;

        const existingUser = await ctx.drizzleClient.query.usersTable.findFirst(
          {
            where: (fields, operators) => operators.eq(fields.id, creatorId),
          },
        );

        // Creator id existing but the associated user not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
        if (existingUser === undefined) {
          ctx.log.error(
            "Postgres select operation returned an empty array for an agenda folder's creator id that isn't null.",
          );

          throw new TalawaGraphQLError({
            extensions: {
              code: "unexpected",
            },
          });
        }

        return existingUser;
      },
      type: User,
    }),
  }),
});
