import { type SQL, and, asc, desc, eq, exists, gt, lt } from "drizzle-orm";
import type { z } from "zod";
import {
	venuesTable,
	venuesTableInsertSchema,
} from "~/src/drizzle/tables/venues";
import { Venue } from "~/src/graphql/types/Venue/Venue";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { Organization } from "./Organization";

const venuesArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
	.transform(transformDefaultGraphQLConnectionArguments)
	.transform((arg, ctx) => {
		let cursor: z.infer<typeof cursorSchema> | undefined = undefined;

		try {
			if (arg.cursor !== undefined) {
				cursor = cursorSchema.parse(
					JSON.parse(Buffer.from(arg.cursor, "base64url").toString("utf-8")),
				);
			}
		} catch (error) {
			ctx.addIssue({
				code: "custom",
				message: "Not a valid cursor.",
				path: [arg.isInversed ? "before" : "after"],
			});
		}

		return {
			cursor,
			isInversed: arg.isInversed,
			limit: arg.limit,
		};
	});

const cursorSchema = venuesTableInsertSchema.pick({
	name: true,
});

Organization.implement({
	fields: (t) => ({
		venues: t.connection(
			{
				description:
					"GraphQL connection to traverse through the venues belonging to the organization.",
				resolve: async (parent, args, ctx) => {
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
					} = venuesArgumentsSchema.safeParse(args);

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

					const currentUser =
						await ctx.drizzleClient.query.usersTable.findFirst({
							columns: {
								role: true,
							},
							with: {
								organizationMembershipsWhereMember: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.organizationId, parent.id),
								},
							},
							where: (fields, operators) =>
								operators.eq(fields.id, currentUserId),
						});

					if (currentUser === undefined) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthenticated",
							},
						});
					}

					const currentUserOrganizationMembership =
						currentUser.organizationMembershipsWhereMember[0];

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

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [desc(venuesTable.name)]
						: [asc(venuesTable.name)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(venuesTable)
										.where(
											and(
												eq(venuesTable.name, cursor.name),
												eq(venuesTable.organizationId, parent.id),
											),
										),
								),
								eq(venuesTable.organizationId, parent.id),
								lt(venuesTable.name, cursor.name),
							);
						} else {
							where = eq(venuesTable.organizationId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(venuesTable)
										.where(
											and(
												eq(venuesTable.name, cursor.name),
												eq(venuesTable.organizationId, parent.id),
											),
										),
								),
								eq(venuesTable.organizationId, parent.id),
								gt(venuesTable.name, cursor.name),
							);
						} else {
							where = eq(venuesTable.organizationId, parent.id);
						}
					}

					const venues = await ctx.drizzleClient.query.venuesTable.findMany({
						limit,
						orderBy,
						with: {
							attachmentsWhereVenue: true,
						},
						where,
					});

					if (cursor !== undefined && venues.length === 0) {
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

					return transformToDefaultGraphQLConnection({
						createCursor: (venue) =>
							Buffer.from(
								JSON.stringify({
									name: venue.name,
								}),
							).toString("base64url"),
						createNode: ({ attachmentsWhereVenue, ...venue }) =>
							Object.assign(venue, {
								attachments: attachmentsWhereVenue,
							}),
						parsedArgs,
						rawNodes: venues,
					});
				},
				type: Venue,
			},
			{
				description: "",
			},
			{
				description: "",
			},
		),
	}),
});
