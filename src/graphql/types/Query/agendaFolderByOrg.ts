import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { AgendaFolder } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/**
 * GraphQL Query Input Validation Schema (Zod)
 */

const queryAgendaFolderByOrganizationInputSchema = z.object({
	organizationId: z
		.string()
		.uuid({ message: "Invalid Organization ID format" }),
});

const QueryAgendaFolderByOrganizationInput = builder.inputType(
	"QueryAgendaFolderByOrganizationInput",
	{
		fields: (t) => ({
			organizationId: t.string({ required: true }),
		}),
	},
);

/**
 * GraphQL Query: Fetches all Agenda Folders by organizationId.
 */

export const agendaFolderByOrganization = builder.queryField(
	"agendaFolderByOrganization",
	(t) =>
		t.field({
			args: {
				input: t.arg({
					description:
						"Input parameters to fetch agenda folders by organizationId.",
					required: true,
					type: QueryAgendaFolderByOrganizationInput,
				}),
			},
			description:
				"Query field to fetch all agenda folders linked to a specific organization.",
			type: [AgendaFolder],
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
				} = queryAgendaFolderByOrganizationInputSchema.safeParse(args.input);

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

				const [currentUser, organizationExists, agendaFolder] =
					await Promise.all([
						ctx.drizzleClient.query.usersTable.findFirst({
							columns: { id: true },
							where: (fields, operators) =>
								operators.eq(fields.id, currentUserId),
						}),
						ctx.drizzleClient.query.organizationsTable.findFirst({
							columns: { id: true },
							where: (fields, operators) =>
								operators.eq(fields.id, parsedArgs.organizationId),
						}),
						ctx.drizzleClient.query.agendaFoldersTable.findMany({
							where: (fields, operators) =>
								operators.eq(fields.organizationId, parsedArgs.organizationId),
						}),
					]);

				if (!currentUser) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				if (!organizationExists) {
					throw new TalawaGraphQLError({
						message: "Organization not found.",
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "organizationId"] }],
						},
					});
				}

				return agendaFolder;
			},
		}),
);
