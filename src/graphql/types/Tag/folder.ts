import { TagFolder } from "~/src/graphql/types/TagFolder/TagFolder";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
import { Tag } from "./Tag";

Tag.implement({
	fields: (t) => ({
		folder: t.field({
			description: "Tag folder the tag is associated to.",
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
						message: "Only authenticated users can perform this action.",
					});
				}

				const currentUserId = ctx.currentClient.user.id;

				const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
					with: {
						organizationMembershipsWhereMember: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.organizationId, parent.organizationId),
						},
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				});

				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
						message: "Only authenticated users can perform this action.",
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
						message: "You are not authorized to perform this action.",
					});
				}

				if (parent.folderId === null) {
					return null;
				}

				const folderId = parent.folderId;

				const existingFolder =
					await ctx.drizzleClient.query.tagFoldersTable.findFirst({
						where: (fields, operators) => operators.eq(fields.id, folderId),
					});

				// Folder id existing but the associated tag folder not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingFolder === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a tag's folder id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "Something went wrong. Please try again later.",
					});
				}

				return existingFolder;
			},
			type: TagFolder,
		}),
	}),
});
