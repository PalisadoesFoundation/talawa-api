import { eq } from "drizzle-orm";
import { z } from "zod";
import { agendaCategoriesTable } from "~/src/drizzle/schema";
import { builder } from "~/src/graphql/builder";
import {
    MutationDeleteAgendaCategoryInput,
    mutationDeleteAgendaCategoryInputSchema,
} from "~/src/graphql/inputs/MutationDeleteAgendaCategoryInput";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { AgendaCategory } from "../AgendaCategories/AgendaCategories";
const mutationDeleteAgendaCategoryArgumentsSchema = z.object({
    input: mutationDeleteAgendaCategoryInputSchema,
});

builder.mutationField("deleteAgendaCategory", (t) =>
    t.field({
        args: {
            input: t.arg({
                description: "",
                required: true,
                type: MutationDeleteAgendaCategoryInput,
            }),
        },
        complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
        description: "Mutation field to delete an agenda category.",
        resolve: async (_parent, args, ctx) => {
            if (!ctx.currentClient.isAuthenticated) {
                throw new TalawaGraphQLError({
                    extensions: {
                        code: "unauthenticated",
                    },
                });
            }

            const {
                data: parsedArgs,
                error,
                success,
            } = mutationDeleteAgendaCategoryArgumentsSchema.safeParse(args);

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

            const currentUserId = ctx.currentClient.user.id;

            const [currentUser] = await Promise.all([
                ctx.drizzleClient.query.usersTable.findFirst({
                    columns: {
                        role: true,
                    },
                    where: (fields, operators) => operators.eq(fields.id, currentUserId),
                }),
                ctx.drizzleClient.query.agendaCategoriesTable.findFirst({
                    with: {
                        event: {
                            columns: {
                                startAt: true,
                            },
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
                                },
                            },
                    where: (fields, operators) =>
                        operators.eq(fields.id, parsedArgs.input.id),
                }),
            ]);

            if (currentUser === undefined) {
                throw new TalawaGraphQLError({
                    extensions: {
                        code: "unauthenticated",
                    },
                });
            }

            const [deletedAgendaCategory] = await ctx.drizzleClient
                .delete(agendaCategoriesTable)
                .where(eq(agendaCategoriesTable.id, parsedArgs.input.id))
                .returning();

            // Deleted agenda folder not being returned means that either it was deleted or its `id` column was changed by external entities before this delete operation could take place.
            if (deletedAgendaCategory === undefined) {
                throw new TalawaGraphQLError({
                    extensions: {
                        code: "unexpected",
                    },
                });
            }

            return deletedAgendaCategory;
        },
        type: AgendaCategory,
    }),
);
