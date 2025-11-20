import { TagFolder } from "~/src/graphql/types/TagFolder/TagFolder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { Tag } from "./Tag";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Tag as TagType } from "./Tag";

export const resolveFolder = async (
	parent: TagType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
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

	if (parent.folderId === null) {
		return null;
	}

	const folderId = parent.folderId;

	const existingFolder =
		await ctx.drizzleClient.query.tagFoldersTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, folderId),
		});

	if (existingFolder === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for a tag's folder id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingFolder;
};

Tag.implement({
	fields: (t) => ({
		folder: t.field({
			description: "Tag folder the tag is contained within.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveFolder,
			type: TagFolder,
		}),
	}),
});
